/**
 * GA4 は Cookie 同意後にのみ読み込む。測定 ID が未設定なら何もしない。
 */
const CONSENT_KEY = 'windays.consent.analytics'
const ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export type Consent = 'granted' | 'denied' | null

export function gaEnabled(): boolean {
  return Boolean(ID)
}

export function getConsent(): Consent {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function setConsent(c: Exclude<Consent, null>): void {
  try {
    localStorage.setItem(CONSENT_KEY, c)
  } catch {
    /* ignore */
  }
  if (c === 'granted') loadGa()
}

let loaded = false
export function loadGa(): void {
  if (!ID || loaded || typeof document === 'undefined') return
  loaded = true
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${ID}`
  document.head.appendChild(s)
  const w = window as unknown as { dataLayer: unknown[]; gtag?: (...args: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  w.gtag = function gtag(...args: unknown[]) {
    w.dataLayer.push(args)
  }
  w.gtag('js', new Date())
  w.gtag('config', ID, { anonymize_ip: true })
}

export function gaEvent(name: string, params?: Record<string, unknown>): void {
  const w = window as unknown as { gtag?: (...args: unknown[]) => void }
  if (loaded && w.gtag) w.gtag('event', name, params ?? {})
}

/** 起動時: 既に同意済みなら読み込む */
export function initGa(): void {
  if (getConsent() === 'granted') loadGa()
}
