import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import * as days from '@/api/days'
import { errorMessage } from '@/lib/api'
import { savePendingQuick } from '@/lib/quick'
import { useAuth } from '@/stores/auth'
import { useMemoSheet } from '@/stores/memoSheet'

/**
 * ショートカット起動の受け口。ホーム画面アイコンの長押しメニュー（PWA shortcuts）や URL から
 * /quick?slot=1〜3（クイック枠で開始）・?start=<カテゴリ id か名前>・?stop=1（終了）・?memo=1（メモを開く）。
 * 実行したら「今日」へ遷移してトーストを出す。未ログインなら保留してログイン後に実行する。
 */
export default function Quick() {
  const token = useAuth((s) => s.token)
  const [params] = useSearchParams()
  const nav = useNavigate()
  const openMemo = useMemoSheet((s) => s.openNew)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  const search = params.toString()

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    const stop = params.get('stop')
    const slot = params.get('slot')
    const start = params.get('start')
    const memo = params.get('memo')

    if (memo) {
      openMemo()
      nav('/app', { replace: true })
      return
    }
    const body = stop ? { stop: true } : slot ? { slot: Number(slot) } : start ? { start } : null
    if (!body) {
      nav('/app', { replace: true })
      return
    }
    days
      .quickSegment(body)
      .then((r) => {
        days.funnel('quick.run', { action: r.action, via: slot ? 'slot' : stop ? 'stop' : 'start' })
        nav('/app', { replace: true, state: { toast: r.message } })
      })
      .catch((e) => setError(errorMessage(e)))
  }, [token, params, nav, openMemo])

  if (!token) {
    savePendingQuick(search)
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-white p-4 text-sm text-red-700" role="alert">
          <p>{error}</p>
          <button type="button" className="mt-2 underline" onClick={() => nav('/app', { replace: true })}>
            今日を開く
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500" aria-live="polite">実行しています…</p>
      )}
    </div>
  )
}
