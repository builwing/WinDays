/** ショートカット起動（/quick）の保留。未ログインで開かれたら保存し、ログイン後に同じ操作を実行する。 */
const KEY = 'windays.pending_quick'

export function savePendingQuick(search: string): void {
  try {
    sessionStorage.setItem(KEY, search)
  } catch {
    /* ignore */
  }
}

/** ログイン後の遷移先。保留があれば /quick?…、無ければ /app。 */
export function afterLoginPath(): string {
  try {
    const s = sessionStorage.getItem(KEY)
    if (s) {
      sessionStorage.removeItem(KEY)
      return `/quick${s.startsWith('?') ? s : `?${s}`}`
    }
  } catch {
    /* ignore */
  }
  return '/app'
}
