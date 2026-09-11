import { useState } from 'react'
import { Bell } from 'lucide-react'
import type { Category, PlanRun, PlanRunAction } from '@/api/types'
import { formatClock } from '@/lib/time'
import { Button } from './Field'

interface Props {
  cards: PlanRun[]
  categories: Category[]
  onAct: (run: PlanRun, action: PlanRunAction, params?: { category_id?: number; started_at?: string; minutes?: number }) => Promise<void>
  busy?: boolean
}

/**
 * 自動記録の確認カード。未操作の予定を時系列で 1 枚ずつ出す。
 * 放置しても予定どおり記録されるので、ここは「変更するための入口」。
 */
export default function ConfirmCards({ cards, categories, onAct, busy }: Props) {
  const [changing, setChanging] = useState(false)
  const run = cards[0]
  if (!run || !run.plan) return null
  const plan = run.plan
  const color = plan.days_category?.color ?? '#94a3b8'
  const name = plan.days_category?.name ?? plan.title
  const endAt = run.extended_until ?? plan.ends_at
  const rest = cards.length - 1

  const act = (action: PlanRunAction, params?: { category_id?: number; started_at?: string; minutes?: number }) => {
    setChanging(false)
    return onAct(run, action, params)
  }

  const heading =
    run.state === 'starting'
      ? `〔${name}〕を ${formatClock(plan.starts_at)} から開始します`
      : run.state === 'started' || run.state === 'changed'
        ? `〔${name}〕を記録中（${formatClock(run.segment?.started_at ?? plan.starts_at)}〜）`
        : run.state === 'ending'
          ? `〔${name}〕を ${formatClock(endAt)} で終了します`
          : `〔${name}〕を延長中${run.extended_until ? `（〜${formatClock(run.extended_until)}）` : ''}`

  const sub =
    run.state === 'starting'
      ? `〜${formatClock(plan.ends_at)}。何もしなければ ${formatClock(plan.starts_at)} から記録します。`
      : run.state === 'ending'
        ? '何もしなければ予定の時刻で終了します。続ける場合は下のボタンを。'
        : run.state === 'extended'
          ? '終了したら「今終了」を押してください。'
          : `〜${formatClock(plan.ends_at)} の予定です。違っていれば「変更」。`

  return (
    <section className="mx-4 mb-2 rounded-lg border-l-4 bg-white p-3 shadow-sm" style={{ borderColor: color }} aria-live="polite" aria-label="確認">
      <div className="flex items-start gap-2">
        <Bell size={16} className="mt-0.5 shrink-0" style={{ color }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{heading}</p>
          <p className="mt-0.5 text-xs text-slate-500">{sub}</p>
        </div>
      </div>

      {changing ? (
        <div className="mt-2">
          <p className="text-xs text-slate-600">別のカテゴリで{run.state === 'starting' ? '開始' : '記録'}する</p>
          <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="カテゴリ">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                disabled={busy}
                onClick={() => act('change', { category_id: c.id })}
                className="rounded-full border px-3 py-1 text-sm"
                style={{ borderColor: c.color, color: c.color }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => act('shift', { minutes: 0 })} disabled={busy}>今から</Button>
            <Button variant="secondary" onClick={() => act('shift', { minutes: 15 })} disabled={busy}>15 分後から</Button>
            <Button variant="secondary" onClick={() => act('skip')} disabled={busy}>今日はスキップ</Button>
            {run.previous_segment_id && (
              <Button variant="secondary" onClick={() => act('resume_previous')} disabled={busy}>さっきの記録を続ける</Button>
            )}
            <span className="flex-1" />
            <Button variant="secondary" onClick={() => setChanging(false)} disabled={busy}>戻る</Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {(run.state === 'starting' || run.state === 'started' || run.state === 'changed') && (
            <>
              <Button onClick={() => act('ok')} disabled={busy}>OK</Button>
              <Button variant="secondary" onClick={() => setChanging(true)} disabled={busy}>変更</Button>
              {run.state !== 'starting' && <Button variant="secondary" onClick={() => act('stop_now')} disabled={busy}>今終了</Button>}
            </>
          )}
          {run.state === 'ending' && (
            <>
              <Button onClick={() => act('ok')} disabled={busy}>{formatClock(endAt)} で終了</Button>
              <Button variant="secondary" onClick={() => act('continue')} disabled={busy}>続ける</Button>
              <Button variant="secondary" onClick={() => act('extend', { minutes: 30 })} disabled={busy}>+30 分</Button>
              <Button variant="secondary" onClick={() => act('extend', { minutes: 60 })} disabled={busy}>+1 時間</Button>
              <Button variant="secondary" onClick={() => act('stop_now')} disabled={busy}>今終了</Button>
            </>
          )}
          {run.state === 'extended' && (
            <>
              <Button onClick={() => act('stop_now')} disabled={busy}>今終了</Button>
              <Button variant="secondary" onClick={() => act('extend', { minutes: 30 })} disabled={busy}>+30 分</Button>
              <Button variant="secondary" onClick={() => act('ok')} disabled={busy}>そのまま</Button>
            </>
          )}
        </div>
      )}
      {rest > 0 && <p className="mt-2 text-[11px] text-slate-400">あと {rest} 件の確認があります</p>}
    </section>
  )
}
