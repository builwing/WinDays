import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as days from '@/api/days'
import type { Adherence, PlanLimitError, Variance } from '@/api/types'
import { isPlanLimit } from '@/lib/api'
import { formatMinutes, shiftDateKey, toDateKey } from '@/lib/time'
import { DomainDonut, WeekBars, WeekTable } from '@/components/charts'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

/** 予定どおり率の大きい数字。予定が無ければ案内。 */
function AdherenceSummary({ a, dayRate, days }: { a: Adherence; dayRate: number | null | undefined; days: { date: string; adherence_rate: number | null }[] }) {
  if (a.plans === 0) {
    return <p className="mt-2 text-sm text-slate-500">この週にカテゴリ付きの予定がありません。予定にカテゴリを付けると、予定どおり率と予実差分が出ます。</p>
  }
  const changed = a.runs.changed + a.runs.skipped
  return (
    <>
      <div className="mt-2 flex items-end gap-3">
        <span className="text-3xl font-bold tabular-nums">{a.rate === null ? '–' : `${Math.round(a.rate * 100)}%`}</span>
        <span className="pb-1 text-xs text-slate-500">
          予定 {formatMinutes(a.planned_minutes)} のうち {formatMinutes(a.matched_minutes)} が予定どおり
          {dayRate !== undefined && dayRate !== null && <span className="ml-2">（この日 {Math.round(dayRate * 100)}%）</span>}
        </span>
      </div>
      <ol className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px]" aria-label="曜日ごとの予定どおり率">
        {days.map((d) => (
          <li key={d.date}>
            <div className="h-1.5 rounded bg-slate-100">
              {d.adherence_rate !== null && <div className="h-1.5 rounded bg-work" style={{ width: `${Math.round(d.adherence_rate * 100)}%` }} />}
            </div>
            <span className="text-slate-500">{WEEKDAYS[new Date(`${d.date}T00:00:00`).getDay()]}</span>
            <span className="block tabular-nums text-slate-700">{d.adherence_rate === null ? '–' : `${Math.round(d.adherence_rate * 100)}`}</span>
          </li>
        ))}
      </ol>
      {a.runs.untouched + changed > 0 && (
        <p className="mt-2 text-xs text-slate-500">
          自動記録 {a.runs.untouched + changed} 件のうち、放置で確定 {a.runs.untouched}・変更あり {a.runs.changed}・スキップ {a.runs.skipped}
        </p>
      )}
    </>
  )
}

/** カテゴリ別の予実差分。週は 1 日平均も添える。 */
function VarianceList({ rows, perDay }: { rows: Variance[]; perDay: boolean }) {
  if (rows.length === 0) return null
  return (
    <ul className="mt-2 divide-y divide-slate-100">
      {rows.map((v) => {
        const avg = perDay && v.plan_days > 0 ? Math.round(v.diff_minutes / v.plan_days) : v.diff_minutes
        const sign = avg > 0 ? '+' : avg < 0 ? '−' : '±'
        const tone = Math.abs(avg) < 15 ? 'text-slate-500' : avg > 0 ? 'text-amber-700' : 'text-indigo-700'
        return (
          <li key={v.category_id} className="flex items-center gap-2 py-1.5 text-sm">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: v.color }} aria-hidden />
            <span className="flex-1 text-slate-700">{v.name}</span>
            <span className="text-xs text-slate-400">
              予定 {formatMinutes(v.planned_minutes)} → 実績 {formatMinutes(v.actual_minutes)}
            </span>
            <span className={`w-20 text-right text-sm font-semibold tabular-nums ${tone}`}>
              {sign}
              {formatMinutes(Math.abs(avg))}
              {perDay && <span className="text-[10px] font-normal">/日</span>}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** ふりかえり: 週の領域比率と日の内訳。free は直近 4 週まで（402 でアップグレード案内）。 */
export default function Dashboard() {
  const [dayKey, setDayKey] = useState(toDateKey(new Date()))
  const [showTable, setShowTable] = useState(false)

  useEffect(() => {
    days.funnel('dashboard.view')
  }, [])

  const week = useQuery({ queryKey: ['dashboard', 'week', dayKey], queryFn: () => days.getWeekDashboard(dayKey), retry: false })
  const day = useQuery({ queryKey: ['dashboard', 'day', dayKey], queryFn: () => days.getDayDashboard(dayKey), retry: false })

  const limit = week.error && isPlanLimit(week.error) ? (week.error as unknown as { response: { data: PlanLimitError } }).response.data : null

  return (
    <div className="px-4 py-3">
      <header className="flex items-center justify-between">
        <button type="button" onClick={() => setDayKey(shiftDateKey(dayKey, -7))} className="rounded-md p-2 text-slate-500" aria-label="前の週">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base font-semibold">
          {week.data ? `${week.data.week_start.slice(5).replace('-', '/')} 〜 ${week.data.week_end.slice(5).replace('-', '/')}` : 'ふりかえり'}
        </h1>
        <button type="button" onClick={() => setDayKey(shiftDateKey(dayKey, 7))} className="rounded-md p-2 text-slate-500" aria-label="次の週">
          <ChevronRight size={20} />
        </button>
      </header>

      {limit && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
          <p>{limit.message}</p>
          <button type="button" onClick={() => setDayKey(toDateKey(new Date()))} className="mt-2 underline">
            今週に戻る
          </button>
        </div>
      )}

      {week.data && (
        <section className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-700">今週のバランス</h2>
            <button type="button" onClick={() => setShowTable((v) => !v)} className="text-xs text-slate-500 underline">
              {showTable ? 'グラフ' : '表で見る'}
            </button>
          </div>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <dt className="text-[11px] text-slate-500">記録合計</dt>
              <dd className="text-lg font-bold">{(week.data.recorded_minutes / 60).toFixed(1)}h</dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">仕事の割合</dt>
              <dd className="text-lg font-bold">{week.data.work_ratio === null ? '–' : `${Math.round(week.data.work_ratio * 100)}%`}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-slate-500">休息</dt>
              <dd className="text-lg font-bold">{(week.data.domains.rest / 60 / 7).toFixed(1)}h/日</dd>
            </div>
          </dl>
          <div className="mt-3">{showTable ? <WeekTable days={week.data.days} /> : <WeekBars days={week.data.days} />}</div>
        </section>
      )}

      {week.data && (
        <section className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">予定どおり率（週）</h2>
          <AdherenceSummary a={week.data.adherence} dayRate={day.data?.adherence.rate} days={week.data.days} />
          {week.data.variance.length > 0 && (
            <>
              <h3 className="mt-4 text-xs font-semibold text-slate-600">予実差分（1 日平均）</h3>
              <VarianceList rows={week.data.variance} perDay />
            </>
          )}
        </section>
      )}

      {week.data && week.data.categories.length > 0 && (
        <section className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">カテゴリ別（週）</h2>
          <ul className="mt-2 space-y-1.5">
            {week.data.categories.map((c) => {
              const pct = week.data.recorded_minutes ? (c.minutes / week.data.recorded_minutes) * 100 : 0
              return (
                <li key={c.category_id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.color }} aria-hidden />
                    <span className="flex-1 text-slate-700">{c.name}</span>
                    <span className="text-xs text-slate-500">{formatMinutes(c.minutes)}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded bg-slate-100">
                    <div className="h-1.5 rounded" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {day.data && (
        <section className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700">{dayKey === toDateKey(new Date()) ? '今日' : dayKey} の内訳</h2>
          <div className="mt-2">
            <DomainDonut domains={day.data.domains} size={140} />
          </div>
          {day.data.variance.length > 0 && (
            <>
              <h3 className="mt-3 text-xs font-semibold text-slate-600">予実差分（この日）</h3>
              <VarianceList rows={day.data.variance} perDay={false} />
            </>
          )}
        </section>
      )}

      {week.data && week.data.history_weeks !== -1 && (
        <p className="mt-3 text-center text-xs text-slate-400">無料プランでは直近 {week.data.history_weeks} 週までふりかえれます</p>
      )}
    </div>
  )
}
