#!/usr/bin/env bash
#
# WinDays Web（days.winroad.org）の公開。要 root:
#   sudo bash deploy/days-domain.sh
#
# 前提: *.winroad.org はワイルドカード A で本 VPS を指している（DNS 変更不要）。
#       先に `bash deploy/web-reflect.sh` で /var/www/WinDays/web/build を作っておく。
# 動作: 証明書が無ければ ACME(webroot) で取得 → SSL vhost を有効化 → nginx reload → 疎通確認。
#
set -euo pipefail
DOMAIN=days.winroad.org
ROOT=/var/www/WinDays/web/build
CONF=/var/www/WinDays/deploy/nginx/${DOMAIN}.conf
EMAIL=wingnakada@gmail.com
log(){ echo -e "\n\033[1;32m==> $*\033[0m"; }
if [ "$(id -u)" -ne 0 ]; then echo "root で実行してください: sudo bash $0"; exit 1; fi

if [ ! -f "$ROOT/index.html" ]; then echo "ビルドが見つかりません: $ROOT/index.html（先に bash deploy/web-reflect.sh）"; exit 1; fi

log "1. DNS 確認（A レコード）"
getent hosts "$DOMAIN" || { echo "  名前解決できません。DNS を確認してください。"; exit 1; }

log "2. 証明書の取得（無ければ）"
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "  証明書あり: $DOMAIN（スキップ）"
else
  cat > "/etc/nginx/sites-available/${DOMAIN}.acme" <<EOC
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    root ${ROOT};
    location ^~ /.well-known/acme-challenge/ { allow all; }
    location / { return 404; }
}
EOC
  ln -sf "/etc/nginx/sites-available/${DOMAIN}.acme" "/etc/nginx/sites-enabled/${DOMAIN}.acme"
  nginx -t && systemctl reload nginx
  certbot certonly --webroot -w "$ROOT" -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"
  rm -f "/etc/nginx/sites-enabled/${DOMAIN}.acme" "/etc/nginx/sites-available/${DOMAIN}.acme"
fi

log "3. 本番 SSL vhost を有効化"
cp "$CONF" "/etc/nginx/sites-available/${DOMAIN}"
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
nginx -t && systemctl reload nginx

log "4. 疎通確認"
sleep 1
echo "https (200期待)            : $(curl -s -o /dev/null -w '%{http_code}' https://${DOMAIN}/)"
echo "SPA fallback (200期待)     : $(curl -s -o /dev/null -w '%{http_code}' https://${DOMAIN}/email-verified)"
echo "manifest (200期待)         : $(curl -s -o /dev/null -w '%{http_code}' https://${DOMAIN}/manifest.webmanifest)"
echo "http (301期待)             : $(curl -s -o /dev/null -w '%{http_code}' http://${DOMAIN}/)"
log "完了。https://${DOMAIN}/ を開いて「Hello, WinDays」と API 疎通 OK を確認してください。"
