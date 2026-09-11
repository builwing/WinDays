import { useEffect, useState } from 'react'
import { Repeat } from 'lucide-react'
import type { Category, Plan, PlanScope } from '@/api/types'
import { dayMinutesToISO, fromDateKey, minutesIntoDay } from '@/lib/time'
import { buildRrule, describeRrule, WEEKDAYS, type RepeatPreset } from '@/lib/rrule'
import { Button } from './Field'

export interface PlanSheetValue {
  title: string
  days_category_id: number | null
  starts_at: string
  ends_at: string
  description: string
  rrule: string | null          // 新規のときだけ（繰り返しの作成）
  skip_nonworking: boolean      // 土日祝をスキップ（skip_weekends + skip_holidays）
  scope: PlanScope              // 展開済みの回を編集するときの反映範囲
}

interface Props {
  dayKey: string
  categories: Category[]
  plan: Plan | null            // 編集対象（null なら新規）
  initialMinutes?: number      // 新規の開始（その日の 0:00 からの分）
  onSave: (value: PlanSheetValue) => Promise<void>
  onDelete?: (scope: PlanScope) => Promise<void>
  onCopy?: (categoryId: number | null) => Promise<void>
  onClose: () => void
  error?: string | null
}

const SCOPES: { value: PlanScope; label: string }[] = [
  { value: 'this', label: 'この回のみ' },
  { value: 'following', label: '以降すべて' },
  { value: 'all', label: 'すべて' },
]

const DAY_END = 24 * 60 - 1
function toHM(min: number): string {
  const m = Math.max(0, Math.min(DAY_END, Math.round(min)))
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
function fromHM(v: string): number {
  const [h, m] = v.split(':').map(Number)
  return h * 60 + m
}

/**
 * 予定の作成・編集シート。予定は WinTask の個人予定と共通で、カテゴリは任意（予実対比に使う）。
 * 「実績にコピー」で同じ時間帯のタイムログを作る。
 */
export default function PlanSheet({ dayKey, categories, plan, initialMinutes = 9 * 60, onSave, onDelete, onCopy, onClose, error }: Props) {
  const [title, setTitle] = useState(plan?.title ?? '')
  const [categoryId, setCategoryId] = useState<number | null>(plan?.days_category_id ?? null)
  const [start, setStart] = useState(toHM(plan ? minutesIntoDay(plan.starts_at, dayKey) : initialMinutes))
  const [end, setEnd] = useState(toHM(plan ? minutesIntoDay(plan.ends_at, dayKey) : initialMinutes + 60))
  const [description, setDescription] = useState(plan?.description ?? '')
  const [busy, setBusy] = useState(false)
  const [preset, setPreset] = useState<RepeatPreset>('none')
  const [byday, setByday] = useState<string[]>([])
  const [skipNonworking, setSkipNonworking] = useState(false)
  const [scope, setScope] = useState<PlanScope>('this')
  const isOccurrence = plan !== null && plan.recurrence_parent_id !== null
  const parentRule = plan?.rrule ?? null

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }

  const submit = () =>
    run(() =>
      onSave({
        title: title.trim(),
        days_category_id: categoryId,
        starts_at: dayMinutesToISO(dayKey, fromHM(start)),
        ends_at: dayMinutesToISO(dayKey, fromHM(end) === 0 && fromHM(start) > 0 ? 24 * 60 : fromHM(end)),
        description: description.trim(),
        rrule: plan ? null : buildRrule(preset, byday, fromDateKey(dayKey)),
        skip_nonworking: skipNonworking,
        scope,
      }),
    )

  const fromWinTask = plan !== null && plan.days_category_id === null && plan.source !== 'local'

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={onClose} role="presentation">
      <div
        className="mx-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={plan ? '予定を編集' : '予定を追加'}
      >
        <h2 className="text-base font-semibold">{plan ? '予定を編集' : '予定を追加'}</h2>
        <p className="mt-0.5 text-xs text-slate-500">予定は WinTask の個人予定と共通です。{fromWinTask && ' この予定は外部から取り込まれたものです。'}</p>

        <label className="mt-3 block text-sm">
          <span className="text-slate-600">タイトル（空ならカテゴリ名）</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" placeholder="例: A社と打ち合わせ" />
        </label>

        <div className="mt-3 text-sm text-slate-600">カテゴリ（予実対比に使います）</div>
        <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="カテゴリ">
          <button
            type="button"
            role="radio"
            aria-checked={categoryId === null}
            onClick={() => setCategoryId(null)}
            className={`rounded-full border px-3 py-1 text-sm ${categoryId === null ? 'border-slate-500 bg-slate-500 text-white' : 'border-slate-300 text-slate-500'}`}
          >
            なし
          </button>
          {categories.map((c) => {
            const active = c.id === categoryId
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setCategoryId(c.id)}
                className="rounded-full border px-3 py-1 text-sm"
                style={active ? { backgroundColor: c.color, borderColor: c.color, color: '#fff' } : { borderColor: c.color, color: c.color }}
              >
                {c.name}
              </button>
            )
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <label className="block">
            <span className="text-slate-600">開始</span>
            <input type="time" step={300} value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" />
          </label>
          <label className="block">
            <span className="text-slate-600">終了</span>
            <input type="time" step={300} value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          <span className="text-slate-600">メモ（任意）</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" placeholder="例: 議題は来期の計画" />
        </label>

        {!plan && (
          <fieldset className="mt-3 text-sm">
            <legend className="flex items-center gap-1 text-slate-600"><Repeat size={14} aria-hidden /> 繰り返し</legend>
            <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="繰り返し">
              {([['none', 'なし'], ['daily', '毎日'], ['weekdays', '平日'], ['weekly', '毎週'], ['monthly', '毎月']] as [RepeatPreset, string][]).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={preset === v}
                  onClick={() => setPreset(v)}
                  className={`rounded-full border px-3 py-1 ${preset === v ? 'border-work bg-work text-white' : 'border-slate-300 text-slate-600'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {preset === 'weekly' && (
              <div className="mt-2 flex gap-1" role="group" aria-label="曜日">
                {WEEKDAYS.map((d) => {
                  const on = byday.includes(d.code)
                  return (
                    <button
                      key={d.code}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setByday(on ? byday.filter((c) => c !== d.code) : [...byday, d.code])}
                      className={`h-8 w-8 rounded-full border text-xs ${on ? 'border-work bg-work text-white' : 'border-slate-300 text-slate-600'}`}
                    >
                      {d.label}
                    </button>
                  )
                })}
              </div>
            )}
            {preset !== 'none' && (
              <label className="mt-2 flex items-center gap-2 text-slate-600">
                <input type="checkbox" checked={skipNonworking} onChange={(e) => setSkipNonworking(e.target.checked)} />
                土日・祝日はスキップ
              </label>
            )}
            {preset !== 'none' && <p className="mt-1 text-xs text-slate-500">14 日先まで予定が作られ、毎日自動で延びます。WinTask のカレンダーにも出ます。</p>}
          </fieldset>
        )}

        {isOccurrence && (
          <fieldset className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-2 text-sm">
            <legend className="flex items-center gap-1 px-1 text-slate-600"><Repeat size={14} aria-hidden /> 繰り返しの予定{parentRule && `（${describeRrule(parentRule)}）`}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="変更の反映範囲">
              {SCOPES.map((sc) => (
                <button
                  key={sc.value}
                  type="button"
                  role="radio"
                  aria-checked={scope === sc.value}
                  onClick={() => setScope(sc.value)}
                  className={`rounded-full border px-3 py-1 ${scope === sc.value ? 'border-slate-600 bg-slate-600 text-white' : 'border-slate-300 text-slate-600'}`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">保存・削除の反映範囲です。「以降すべて」「すべて」では時刻の変更が各日に同じ時刻で反映されます。</p>
          </fieldset>
        )}

        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}

        {plan && onCopy && (
          <Button variant="secondary" className="mt-4 w-full" onClick={() => run(() => onCopy(categoryId))} disabled={busy}>
            予定どおりだった（実績にコピー）
          </Button>
        )}

        <div className="mt-3 flex gap-2">
          {plan && onDelete && (
            <Button variant="danger" onClick={() => run(() => onDelete(scope))} disabled={busy}>
              {isOccurrence && scope === 'this' ? 'この回をスキップ' : '削除'}
            </Button>
          )}
          <span className="flex-1" />
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            キャンセル
          </Button>
          <Button onClick={submit} disabled={busy}>
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}
