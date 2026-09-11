import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'push-sw.js'],
      manifest: {
        name: 'WinDays − 行動ログ・時間の使い方記録',
        short_name: 'WinDays',
        description: '仕事もレジャーも1本のタイムラインで記録し、時間の使い方とバランスを可視化する行動管理アプリ',
        lang: 'ja',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#0d9488',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // ホーム画面アイコンの長押しメニュー（Android / PC Chrome）。固定 URL なので枠へのカテゴリ割り当ては設定で行う
        shortcuts: [
          { name: '記録を終了', short_name: '終了', url: '/quick?stop=1', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'クイック 1 を開始', short_name: 'クイック 1', url: '/quick?slot=1', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'クイック 2 を開始', short_name: 'クイック 2', url: '/quick?slot=2', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'クイック 3 を開始', short_name: 'クイック 3', url: '/quick?slot=3', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'メモを書く', short_name: 'メモ', url: '/quick?memo=1', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
        ],
      },
      workbox: {
        // API はキャッシュしない（常にネットワーク）。アプリシェルのみプリキャッシュ。
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Web Push の受信と通知タップの処理（public/push-sw.js）
        importScripts: ['push-sw.js'],
      },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5174 },
  build: { outDir: 'dist', sourcemap: false },
})
