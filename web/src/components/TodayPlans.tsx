import { CalendarDays } from 'lucide-react'
import type { Plan, PlanRun } from '@/api/types'
import { formatClock } from '@/lib/time'

interface Props {
  plans: Plan[]
  runs: PlanRun[]
  autoTrack: boolean
  onSelect: (plan: Plan) => void
}

function badge(plan: Plan, run: PlanRun | undefined, autoTrack: boolean, now: Date): { label: string; cls: string } {
  if (plan.days_category_id === null) return { label: 'カテゴリ未設定', cls: 'bg-slate-100 text-slate-500' }
  if (!plan.days_auto_track || !autoTrack) return { label: '自動記録なし', cls: 'bg-slate-100 text-slate-500' }
  switch (run?.state) {
    case 'starting':
      return { label: '開始の確認中', cls: 'bg-amber-100 text-amber-800' }
    case 'started':
    case 'changed':
      return { label: '記録中', cls: 'bg-emerald-100 text-emerald-800' }
    case 'ending':
      return { label: '終了の確認中', cls: 'bg-amber-100 text-amber-800' }
    case 'extended':
      return { label: '延長中', cls: 'bg-emerald-100 text-emerald-800' }
    case 'ended':
      return { label: run.resolved_by === 'auto' ? '予定どおり' : '記録済み', cls: 'bg-slate-100 text-slate-600' }
    case 'skipped':
      return { label: 'スキップ', cls: 'bg-slate-100 text-slate-500' }
    default:
      return new Date(plan.ends_at).getTime() < now.getTime()
        ? { label: '未記録', cls: 'bg-slate-100 text-slate-500' }
        : { label: 'これから自動記録', cls: 'bg-sky-50 text-sky-700' }
  }
}

/** 「今日の予定」リスト。アプリを開いた瞬間に「今日どう過ごす予定で、今どこか」が分かる。 */
export default function TodayPlans({ plans, runs, autoTrack, onSelect }: Props) {
  if (plans.length === 0) return null
  const now = new Date()
  const byPlan = new Map(runs.map((r) => [r.calendar_event_id, r]))
  return (
    <section className="mx-4 mb-2 rounded-lg border border-slate-200 bg-white" aria-label="今日の予定">
      <h2 className="flex items-center gap-1 px-3 pt-2 text-xs font-semibold text-slate-500">
        <CalendarDays size={12} aria-hidden /> 今日の予定 {plans.length} 件
      </h2>
      <ul className="divide-y divide-slate-100">
        {plans.map((p) => {
          const b = badge(p, byPlan.get(p.id), autoTrack, now)
          const color = p.days_category?.color ?? '#94a3b8'
          return (
            <li key={p.id}>
              <button type="button" onClick={() => onSelect(p)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm">
                <span className="font-mono text-xs text-slate-400">{formatClock(p.starts_at)}</span>
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{p.recurrence_parent_id !== null && <span className="mr-0.5 text-slate-400">↻</span>}{p.title}</span>
                  <span className="block text-[11px] text-slate-400">〜{formatClock(p.ends_at)}{p.days_category && ` ・ ${p.days_category.name}`}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${b.cls}`}>{b.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
