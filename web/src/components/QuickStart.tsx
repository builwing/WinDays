import { useEffect, useState } from 'react'
import { Square } from 'lucide-react'
import type { Category, Segment } from '@/api/types'
import { formatClock, formatMinutes } from '@/lib/time'

interface Props {
  categories: Category[]
  running: Segment | null
  onStart: (categoryId: number) => void
  onStop: () => void
  busy?: boolean
  /** 止め忘れ通知の閾値（時間）。0 なら表示しない */
  overrunHours?: number
}

/** ワンタップ計測バー。進行中があれば経過時間と終了ボタン、カテゴリのチップで切替。 */
export default function QuickStart({ categories, running, onStart, onStop, busy, overrunHours = 0 }: Props) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [running])

  const elapsed = running ? (now - new Date(running.started_at).getTime()) / 60000 : 0
  // 予定内の自動記録（plan_id あり）は予定の終了で確認が出るので、ここで超過を出すのはワンタップ計測だけ
  const overrun = running && !running.plan_id && overrunHours > 0 && elapsed >= overrunHours * 60

  return (
    <section className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur" aria-label="今の記録">
      {running ? (
        <div className="mb-2 flex items-center justify-between rounded-lg px-3 py-2 text-white" style={{ backgroundColor: running.category?.color }}>
          <div>
            <div className="text-xs opacity-90">{formatClock(running.started_at)} から</div>
            <div className="text-lg font-bold leading-tight">
              {running.category?.name} <span className="text-sm font-normal">{formatMinutes(Math.max(0, elapsed))}</span>
            </div>
            {overrun && <div className="mt-0.5 text-xs font-medium">{overrunHours} 時間を超えています。終わっていれば終了を（時刻はあとから直せます）</div>}
          </div>
          <button
            type="button"
            onClick={onStop}
            disabled={busy}
            className="flex items-center gap-1 rounded-md bg-white/20 px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            <Square size={16} fill="currentColor" aria-hidden /> 終了
          </button>
        </div>
      ) : (
        <div className="mb-2 text-xs text-slate-500">タップで記録を開始</div>
      )}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {categories.map((c) => {
          const active = running?.category_id === c.id
          return (
            <button
              key={c.id}
              type="button"
              disabled={busy || active}
              onClick={() => onStart(c.id)}
              className="shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium disabled:opacity-60"
              style={active ? { backgroundColor: c.color, borderColor: c.color, color: '#fff' } : { borderColor: c.color, color: c.color }}
            >
              {c.name}
            </button>
          )
        })}
      </div>
    </section>
  )
}
