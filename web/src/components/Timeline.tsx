import { useEffect, useRef } from 'react'
import type { Memo, Segment } from '@/api/types'
import { DAY_MINUTES, formatClock, minutesIntoDay, snapMinutes, toDateKey } from '@/lib/time'

const PX_PER_MIN = 0.8 // 1 時間 = 48px
const HEIGHT = DAY_MINUTES * PX_PER_MIN

interface Props {
  dayKey: string
  segments: Segment[]
  running: Segment | null
  onSelect: (segment: Segment) => void
  onCreateAt: (minutes: number) => void
  memos?: Memo[]
  onSelectMemo?: (memo: Memo) => void
}

/**
 * 1 日の縦タイムライン。セグメントを帯で表示し、空白タップで新規入力、帯タップで編集。
 * ドラッグ編集は Phase 2。日跨ぎは API の clip_start/clip_end で当日分だけ描く。
 */
export default function Timeline({ dayKey, segments, running, onSelect, onCreateAt, memos = [], onSelectMemo }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const isToday = dayKey === toDateKey(new Date())

  // 初回は現在時刻（今日）か 8:00 付近までスクロール
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const target = isToday ? minutesIntoDay(new Date().toISOString(), dayKey) - 180 : 7 * 60
    el.scrollTop = Math.max(0, target * PX_PER_MIN)
  }, [dayKey, isToday])

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top // rect はスクロール済み位置を反映している
    onCreateAt(snapMinutes(y / PX_PER_MIN, 15))
  }

  const nowMin = isToday ? minutesIntoDay(new Date().toISOString(), dayKey) : null
  const runningStart = running ? minutesIntoDay(running.started_at, dayKey) : null
  const showRunning = running && nowMin !== null && new Date(running.started_at).getTime() < new Date(dayKey + 'T23:59:59').getTime()

  return (
    <div ref={ref} className="relative overflow-y-auto" style={{ height: 'calc(100dvh - 260px)' }} aria-label={`${dayKey} のタイムライン`}>
      <div className="relative ml-12 mr-3" style={{ height: HEIGHT }} onClick={handleBackgroundClick} role="presentation">
        {/* 時刻の目盛り */}
        {Array.from({ length: 25 }, (_, h) => (
          <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-slate-200" style={{ top: h * 60 * PX_PER_MIN }}>
            <span className="absolute -left-12 -top-2.5 w-10 text-right font-mono text-[11px] text-slate-400">{String(h).padStart(2, '0')}:00</span>
          </div>
        ))}

        {/* 確定済み */}
        {segments.map((s) => {
          const start = minutesIntoDay(s.clip_start ?? s.started_at, dayKey)
          const end = minutesIntoDay(s.clip_end ?? s.ended_at ?? s.started_at, dayKey)
          const h = Math.max(6, (end - start) * PX_PER_MIN - 2)
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s)}
              className="absolute inset-x-0 overflow-hidden rounded-md px-2 text-left text-xs text-white shadow-sm"
              style={{ top: start * PX_PER_MIN + 1, height: h, backgroundColor: s.category?.color ?? '#94a3b8' }}
              aria-label={`${s.category?.name} ${formatClock(s.started_at)}〜${s.ended_at ? formatClock(s.ended_at) : ''}`}
            >
              {h >= 18 && (
                <span className="block truncate leading-[18px]">
                  <span className="font-semibold">{s.category?.name}</span>
                  {h >= 30 && (
                    <span className="ml-1 opacity-90">
                      {formatClock(s.started_at)}〜{s.ended_at ? formatClock(s.ended_at) : ''}
                    </span>
                  )}
                  {s.note && h >= 30 && <span className="ml-1 opacity-80">{s.note}</span>}
                </span>
              )}
            </button>
          )
        })}

        {/* 進行中（今まで） */}
        {showRunning && runningStart !== null && nowMin !== null && (
          <div
            className="pointer-events-none absolute inset-x-0 rounded-md border-2 border-dashed px-2 text-xs"
            style={{
              top: runningStart * PX_PER_MIN + 1,
              height: Math.max(6, (nowMin - runningStart) * PX_PER_MIN - 2),
              borderColor: running.category?.color,
              color: running.category?.color,
              backgroundColor: `${running.category?.color}22`,
            }}
          >
            <span className="font-semibold leading-[18px]">{running.category?.name}（記録中）</span>
          </div>
        )}

        {/* メモの目印（右端）。タップで編集 */}
        {memos.map((m) => {
          const at = minutesIntoDay(m.noted_at, dayKey)
          return (
            <button
              key={`memo-${m.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelectMemo?.(m)
              }}
              className="absolute -right-2 z-[1] flex h-5 w-5 items-center justify-center rounded-full bg-life text-white shadow"
              style={{ top: at * PX_PER_MIN - 10 }}
              aria-label={`メモ ${formatClock(m.noted_at)}: ${m.body.slice(0, 20)}`}
              title={m.body}
            >
              <span className="text-[10px] leading-none">✎</span>
            </button>
          )
        })}

        {/* 現在時刻 */}
        {nowMin !== null && (
          <div className="pointer-events-none absolute inset-x-0 border-t-2 border-red-500" style={{ top: nowMin * PX_PER_MIN }}>
            <span className="absolute -left-12 -top-2 w-10 text-right font-mono text-[11px] font-bold text-red-500">
              {formatClock(new Date().toISOString())}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
