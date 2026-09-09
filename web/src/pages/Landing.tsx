import { useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { funnel } from '@/api/days'
import { useAuth } from '@/stores/auth'

const VISIT_KEY = 'windays.visited'

/** 未ログインのトップ（LP）。検索流入向けに機能説明を静的に置く。 */
export default function Landing() {
  const token = useAuth((s) => s.token)
  const [params] = useSearchParams()

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(VISIT_KEY)) {
        sessionStorage.setItem(VISIT_KEY, '1')
        funnel('lp.visit', { ref: document.referrer ? new URL(document.referrer).hostname : null })
      }
    } catch {
      /* ignore */
    }
  }, [])

  if (token) return <Navigate to="/app" replace />

  return (
    <main className="mx-auto max-w-2xl px-6 pb-16">
      {params.get('deleted') && (
        <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700" role="status">アカウントを削除しました。ご利用ありがとうございました。</p>
      )}
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="flex items-end gap-0.5" aria-hidden>
            <span className="h-5 w-1.5 rounded-sm bg-work" />
            <span className="h-3.5 w-1.5 rounded-sm bg-life" />
            <span className="h-2 w-1.5 rounded-sm bg-rest" />
          </span>
          WinDays
        </div>
        <Link to="/login" className="text-sm text-slate-600 underline">ログイン</Link>
      </header>

      <section className="py-8">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          仕事もレジャーも、
          <br />
          1本のタイムラインに。
        </h1>
        <p className="mt-4 text-slate-600">
          WinDays は、1日の時間の使い方を記録して、仕事とプライベートのバランスを可視化する無料の行動管理アプリです。
          ワンタップで「今から仕事」、寝る前にまとめて帯入力。週ごとの比率で、働き方と休み方を見直せます。
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link to="/register" className="rounded-md bg-work px-5 py-3 text-center font-medium text-white">無料で始める</Link>
          <Link to="/login" className="rounded-md border border-slate-300 px-5 py-3 text-center font-medium text-slate-700">ログイン</Link>
        </div>
        <p className="mt-2 text-xs text-slate-500">登録無料・クレジットカード不要・スマホのホーム画面に追加して使えます</p>
      </section>

      <section className="grid gap-4 py-6 sm:grid-cols-3">
        {[
          { t: 'ワンタップ計測', d: '「今から会議」「移動」とタップするだけ。切り替えると前の記録は自動で終了します。' },
          { t: 'あとから帯入力', d: '寝る前に 1 日分をまとめて。空白の時間帯を埋めるだけで、記録が完成します。' },
          { t: 'バランスの可視化', d: '仕事・プライベート・休息の比率を日と週で表示。働きすぎも休みすぎも一目で分かります。' },
        ].map((f) => (
          <div key={f.t} className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">{f.t}</h2>
            <p className="mt-1 text-sm text-slate-600">{f.d}</p>
          </div>
        ))}
      </section>

      <section className="py-6">
        <h2 className="text-xl font-bold">こんな方に</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
          <li>フリーランスやリモートワークで、1 日の作業時間の内訳を把握したい</li>
          <li>週末の釣りや登山、旅行など、レジャーの記録も同じ場所に残したい</li>
          <li>仕事とプライベートの比率を見直して、働き方を調整したい</li>
        </ul>
      </section>

      <section className="py-6">
        <h2 className="text-xl font-bold">チームで使うなら WinTask</h2>
        <p className="mt-2 text-slate-600">
          WinDays のアカウントは、グループ向けタスク管理アプリ <a href="https://win-task.winroad.org/" className="underline">WinTask</a> と共通です。
          記録をタスクにしたり、チームで日報を共有したくなったら、同じアカウントでそのまま使えます。
        </p>
      </section>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <a href="https://win-task.winroad.org/terms.html" className="underline">利用規約</a>
          <a href="https://win-task.winroad.org/privacy.html" className="underline">プライバシーポリシー</a>
          <span>運営: 株式会社ウィンロード</span>
        </div>
      </footer>
    </main>
  )
}
