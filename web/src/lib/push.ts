/**
 * Web Push の購読（ブラウザ側）。iOS は 16.4 以降でホーム画面に追加した PWA のみ対応。
 * 通知が来なくても自動記録はサーバー側で正しく進む（通知は「変更の入口」）。
 */
export type PushStatus = 'unsupported' | 'ios-not-installed' | 'denied' | 'subscribed' | 'unsubscribed'

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function isIOS(): boolean {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function registration(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.ready
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  try {
    return await (await registration()).pushManager.getSubscription()
  } catch {
    return null
  }
}

export async function pushStatus(): Promise<PushStatus> {
  if (!pushSupported()) return isIOS() && !isStandalone() ? 'ios-not-installed' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return (await currentSubscription()) ? 'subscribed' : 'unsubscribed'
}

/** 許可を求めて購読する。戻り値はサーバーへ送る JSON。 */
export async function subscribePush(publicKey: string): Promise<PushSubscriptionJSON> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('通知が許可されませんでした。')
  const reg = await registration()
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) }))
  return sub.toJSON()
}

export async function unsubscribePush(): Promise<string | null> {
  const sub = await currentSubscription()
  if (!sub) return null
  const endpoint = sub.endpoint
  await sub.unsubscribe()
  return endpoint
}
