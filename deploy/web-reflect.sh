#!/usr/bin/env bash
#
# WinDays Web のビルドと配信ディレクトリへの反映（sudo 不要・nginx reload 不要）:
#   bash deploy/web-reflect.sh
#
# 動作: web/ で npm ci → npm run build（dist/）→ web/build へ rsync（--delete）。
#       nginx は web/build を配信し、index.html / sw.js は no-cache なので反映は即時。
#
set -euo pipefail
WEB=/var/www/WinDays/web
log(){ echo -e "\n\033[1;32m==> $*\033[0m"; }

log "1. 依存の同期（package-lock.json どおり）"
npm --prefix "$WEB" ci --no-audit --no-fund

log "2. 型チェック＋ビルド"
npm --prefix "$WEB" run build

log "3. web/build へ反映"
mkdir -p "$WEB/build"
rsync -a --delete "$WEB/dist/" "$WEB/build/"
echo "反映先: $WEB/build（$(find "$WEB/build" -type f | wc -l) files）"
log "完了。"
