# CLAUDE.md

このファイルは、本リポジトリで作業する際の Claude Code 向けガイダンスを提供する。

## 応答言語（重要）

ユーザーへの応答とコミットメッセージは日本語で書く。コード、識別子、パス、コマンド、env 変数名などの技術的成果物は英語のまま。

## ユーザーへ渡すコマンドの方針（重要）

ユーザーは VPS に SSH 接続して作業しており、クリップボードも GUI も無い。繰り返す手順は `deploy/○○.sh` にまとめ、`bash deploy/○○.sh` の一語で渡す。単発コマンドは 1 行にまとめる。`sudo` が必要な操作（nginx・証明書・systemd・WinTask の本番反映）はユーザーが実行する（Claude は実行しない）。

## プロジェクト概要

WinDays は、仕事もレジャーも 1 本のタイムラインで記録し、時間の使い方とワークライフバランスを可視化する**個人向け行動管理 PWA**（基本無料）。**WinTask の集客用フロントアプリ**であり、アカウントとバックエンドは WinTask と共通。

- `web/` — React 18 + Vite + TypeScript + Tailwind 3 + vite-plugin-pwa。WinTask `web/`（PC 版）と同系統。`@/` は `src/` へのエイリアス。
- `deploy/` — `web-reflect.sh`（ビルド → `web/build` 反映・sudo 不要）、`days-domain.sh`（証明書＋nginx vhost・要 sudo）、`nginx/days.winroad.org.conf`。
- `docs/` — `要件定義書.md`（全体仕様・決定事項）、`メール設定手順.md`、`開発ステータス.md`（再開ガイド）。

## バックエンドは WinTask リポジトリ側

API は WinTask の Laravel（`/var/www/WinTask/backend`、`/api/v1`）に相乗りする。**バックエンドの変更は WinTask リポジトリで行う**。

- 本番ディレクトリ `/var/www/WinTask` で直接ビルド・検証しない。`git -C /var/www/WinTask worktree add /var/www/WinTask-days <branch>` のように worktree を切る（`/var/www/WinTask-rf` は別作業中の worktree。触らない）。`.env` をコピーし、`vendor` は既存 worktree からコピー後に `composer install`。終わったら worktree を除去し、コピーした `.env` を削除する。
- テスト: `php artisan test`（sqlite in-memory）。Phase 0 時点で 327 件。
- 本番反映は WinTask 側の `sudo bash deploy/windays-*.sh`（ff-merge → migrate → cache → reload）。ユーザーが実行する。
- WinDays 固有の API は `/api/v1/days/*`、テーブルは `days_` プレフィックス（WinTask の `activity_logs` などと衝突させない）。1 日サマリは WinTask の `diary_entries` をそのまま使う。

## 本番構成

- フロント: `https://days.winroad.org`（nginx → `/var/www/WinDays/web/build`）
- API: `https://api.days.winroad.org`（`api.task.winroad.org` と同じ Laravel のエイリアス vhost）
- DNS: `*.winroad.org` はワイルドカード A で VPS（160.251.215.3）に解決するため、新サブドメインの DNS 追加は不要
- メール: VPS の Postfix（`MAIL_MAILER=sendmail`、From `no-reply@winroad.org`。SPF/DKIM/DMARC 設定済み）。Xserver SMTP は VPS の IP が遮断されているため使わない
- 認証: WinTask の Sanctum Bearer トークン。登録は `POST /register` に `client: 'days'` を付ける（認証メールの戻り先が `days.winroad.org/email-verified` になる）。サブドメイン間の遷移は `POST /auth/handoff` → 遷移先で `POST /auth/handoff/exchange`

## コマンド（`cd web`）

- `npm install` → `npm run dev`（Vite :5174。`.env.development` は `http://127.0.0.1:8000` の `php artisan serve` を想定）
- `npm run build`（`tsc -b && vite build` → `dist/`）、`npm run lint`（型チェックのみ）
- 本番反映: `bash deploy/web-reflect.sh`（`dist/` → `web/build`。nginx reload 不要）

## 設計上の約束

- 記録（入力）は全プランで無制限。無料の制限は振り返り（遡り期間・習慣数など）側に置く。上限値は WinTask `PlanService::personalCatalog()` の `days_*`。
- バックグラウンド GPS と SNS 的な公開・共有機能は入れない（要件定義書 §13）。
- GA4 は Cookie 同意後にのみ読み込む。
