/* WinDays Web Push（Workbox の Service Worker に importScripts で読み込まれる）。
 * 通知はサーバー（days:auto-track）から届く確認カード。タップすると /app を開き、
 * 通知の操作ボタン（Android）は ?run=<id>&act=<action>（確認カード）または ?seg=<id>&act=stop&n=<通知id>（止め忘れ）でアプリ側に実行させる。 */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'WinDays', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'WinDays'
  const options = {
    body: data.body || '',
    tag: data.tag || 'windays',
    renotify: true,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: data.url || '/app',
      run_id: data.data && data.data.run_id,
      segment_id: data.data && data.data.segment_id,
      notification_id: data.data && data.data.notification_id,
      kind: data.data && data.data.kind,
    },
    actions: Array.isArray(data.actions) ? data.actions.slice(0, 2) : [],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const d = event.notification.data || {}
  let url = d.url || '/app'
  if (event.action === 'keep') return // 止め忘れ通知の「続ける」: 何もしない（次の再通知まで記録は続く）
  if (event.action && d.run_id) {
    url = `/app?run=${encodeURIComponent(d.run_id)}&act=${encodeURIComponent(event.action)}`
  } else if (event.action === 'stop' && d.segment_id) {
    url = `/app?seg=${encodeURIComponent(d.segment_id)}&act=stop${d.notification_id ? `&n=${encodeURIComponent(d.notification_id)}` : ''}`
  }
  const target = new URL(url, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) {
          c.focus()
          if ('navigate' in c) return c.navigate(target)
          return c.postMessage({ type: 'windays:navigate', url: target })
        }
      }
      return self.clients.openWindow(target)
    }),
  )
})
