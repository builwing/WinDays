import axios from 'axios'

/** API のオリジン（例: https://api.days.winroad.org）。`/api/v1` はここに付ける。 */
export const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN ?? '').replace(/\/$/, '')
export const API_BASE = `${API_ORIGIN}/api/v1`

const TOKEN_KEY = 'windays.token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* private mode など */
  }
}

/** WinTask と共通の `/api/v1` を Bearer トークンで呼ぶクライアント。 */
export const api = axios.create({
  baseURL: API_BASE,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** 401 時にセッションを破棄するためのフック（stores/auth が登録） */
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const url: string = error?.config?.url ?? ''
    if (status === 401 && !url.endsWith('/login') && !url.endsWith('/register')) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

/** API のエラー本文からユーザー向けメッセージを取り出す。 */
export function errorMessage(error: unknown, fallback = '通信に失敗しました。'): string {
  const e = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
  const data = e?.response?.data
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (first?.[0]) return first[0]
  }
  return data?.message || fallback
}

export function isPlanLimit(error: unknown): boolean {
  const e = error as { response?: { status?: number; data?: { error?: string } } }
  return e?.response?.status === 402 && e.response.data?.error === 'plan_limit'
}

/**
 * API 疎通確認。`/up` は CORS 対象外（WinTask の cors.paths は api/* のみ）で
 * ブラウザからは読めないため、CORS 対象の `/api/v1/me` を未認証で叩き、
 * 401（到達している）または 200 を疎通 OK とみなす。
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await axios.get(`${API_BASE}/me`, {
      timeout: 5000,
      headers: { Accept: 'application/json' },
      validateStatus: (status) => status === 200 || status === 401,
    })
    return res.status === 200 || res.status === 401
  } catch {
    return false
  }
}
