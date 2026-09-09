import { useEffect, useState } from 'react'
import { checkApiHealth, API_ORIGIN } from '@/lib/api'

type Health = 'checking' | 'ok' | 'ng'

/**
 * Phase 0 の仮ホーム。API 疎通と PWA の動作確認だけを行う。
 * Phase 1 でタイムライン（今日）画面に置き換える。
 */
export default function Home() {
  const [health, setHealth] = useState<Health>('checking')

  useEffect(() => {
    checkApiHealth().then((ok) => setHealth(ok ? 'ok' : 'ng'))
  }, [])

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex items-end gap-1" aria-hidden>
        <span className="h-16 w-4 rounded bg-work" />
        <span className="h-10 w-4 rounded bg-life" />
        <span className="h-6 w-4 rounded bg-rest" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Hello, WinDays</h1>
      <p className="text-slate-600">
        仕事もレジャーも1本のタイムラインで記録し、
        <br />
        時間の使い方とバランスを可視化する行動管理アプリ。
      </p>
      <dl className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-500">API</dt>
          <dd className="font-mono">{API_ORIGIN || '(未設定)'}</dd>
        </div>
        <div className="mt-2 flex justify-between">
          <dt className="text-slate-500">疎通</dt>
          <dd>
            {health === 'checking' && <span className="text-slate-400">確認中…</span>}
            {health === 'ok' && <span className="font-medium text-work">OK</span>}
            {health === 'ng' && <span className="font-medium text-red-600">NG</span>}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-slate-400">Phase 0 — 準備中</p>
    </main>
  )
}
