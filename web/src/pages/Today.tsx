import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import * as days from '@/api/days'
import type { Memo, Plan, PlanScope, Segment } from '@/api/types'
import { errorMessage } from '@/lib/api'
import { formatClock, formatDateLabel, formatMinutes, shiftDateKey, toDateKey } from '@/lib/time'
import QuickStart from '@/components/QuickStart'
import Timeline from '@/components/Timeline'
import SegmentSheet, { type SheetValue } from '@/components/SegmentSheet'
import PlanSheet, { type PlanSheetValue } from '@/components/PlanSheet'
import { DomainDonut } from '@/components/charts'
import { useMemoSheet } from '@/stores/memoSheet'
import { PenLine } from 'lucide-react'

const FIRST_SEGMENT_KEY = 'windays.first_segment'

/** 「今日」画面: タイムライン＋ワンタップ計測＋その日の内訳。 */
export default function Today() {
  const qc = useQueryClient()
  const [dayKey, setDayKey] = useState(toDateKey(new Date()))
  const [sheet, setSheet] = useState<{ segment: Segment | null; minutes?: number } | null>(null)
  const [planSheet, setPlanSheet] = useState<{ plan: Plan | null; minutes?: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => days.listCategories() })
  const segments = useQuery({ queryKey: ['segments', dayKey], queryFn: () => days.listSegments(dayKey) })
  const dashboard = useQuery({ queryKey: ['dashboard', 'day', dayKey], queryFn: () => days.getDayDashboard(dayKey), retry: false })
  const memos = useQuery({ queryKey: ['memos', dayKey], queryFn: () => days.listMemos(dayKey) })
  const plans = useQuery({ queryKey: ['plans', dayKey], queryFn: () => days.listPlans(dayKey) })
  const openMemoEdit = useMemoSheet((s) => s.openEdit)

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['segments'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }, [qc])

  // 進行中の経過時間を反映するため 1 分ごとに内訳を更新
  useEffect(() => {
    if (!segments.data?.running) return
    const t = setInterval(() => qc.invalidateQueries({ queryKey: ['dashboard', 'day', dayKey] }), 60_000)
    return () => clearInterval(t)
  }, [segments.data?.running, dayKey, qc])

  const trackFirst = () => {
    try {
      if (!localStorage.getItem(FIRST_SEGMENT_KEY)) {
        localStorage.setItem(FIRST_SEGMENT_KEY, '1')
        days.funnel('first_segment')
      }
    } catch {
      /* ignore */
    }
  }

  const start = async (categoryId: number) => {
    setBusy(true)
    setError(null)
    try {
      await days.startSegment(categoryId)
      trackFirst()
      invalidate()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const stop = async () => {
    const running = segments.data?.running
    if (!running) return
    setBusy(true)
    try {
      await days.stopSegment(running.id)
      invalidate()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const save = async (v: SheetValue) => {
    setError(null)
    try {
      if (sheet?.segment) {
        await days.updateSegment(sheet.segment.id, { ...v, note: v.note || null })
      } else {
        await days.createSegment({ ...v, note: v.note || null })
        trackFirst()
      }
      setSheet(null)
      invalidate()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const remove = async () => {
    if (!sheet?.segment) return
    if (!confirm('この記録を削除しますか？')) return
    try {
      await days.deleteSegment(sheet.segment.id)
      setSheet(null)
      invalidate()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  // ---- 予定（WinTask の個人予定と共通）----
  const savePlan = async (v: PlanSheetValue) => {
    setError(null)
    try {
      const input = { title: v.title || null, days_category_id: v.days_category_id, starts_at: v.starts_at, ends_at: v.ends_at, description: v.description || null }
      if (planSheet?.plan) {
        await days.updatePlan(planSheet.plan.id, input, v.scope)
      } else {
        await days.createPlan(v.rrule ? { ...input, rrule: v.rrule, skip_weekends: v.skip_nonworking, skip_holidays: v.skip_nonworking, nonworking_action: 'skip' } : input)
      }
      setPlanSheet(null)
      qc.invalidateQueries({ queryKey: ['plans'] })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const removePlan = async (scope: PlanScope) => {
    if (!planSheet?.plan) return
    const isOcc = planSheet.plan.recurrence_parent_id !== null
    const msg = isOcc && scope === 'this' ? 'この回をスキップしますか？' : isOcc && scope === 'following' ? 'この回以降の予定をすべて削除しますか？' : isOcc ? 'この繰り返し予定をすべて削除しますか？' : 'この予定を削除しますか？（WinTask 側からも消えます）'
    if (!confirm(msg)) return
    try {
      await days.deletePlan(planSheet.plan.id, scope)
      setPlanSheet(null)
      qc.invalidateQueries({ queryKey: ['plans'] })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const copyPlan = async (categoryId: number | null) => {
    if (!planSheet?.plan) return
    setError(null)
    try {
      await days.copyPlanToActual(planSheet.plan.id, { category_id: categoryId })
      trackFirst()
      setPlanSheet(null)
      invalidate()
      qc.invalidateQueries({ queryKey: ['plans'] })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  const activeCategories = useMemo(() => (categories.data ?? []).filter((c) => !c.archived_at), [categories.data])
  const isToday = dayKey === toDateKey(new Date())

  return (
    <div>
      <QuickStart categories={activeCategories} running={segments.data?.running ?? null} onStart={start} onStop={stop} busy={busy} />

      <header className="flex items-center justify-between px-4 py-2">
        <button type="button" onClick={() => setDayKey(shiftDateKey(dayKey, -1))} className="rounded-md p-2 text-slate-500" aria-label="前日">
          <ChevronLeft size={20} />
        </button>
        <button type="button" onClick={() => setDayKey(toDateKey(new Date()))} className="text-base font-semibold">
          {formatDateLabel(dayKey)}
          {isToday && <span className="ml-1 text-xs font-normal text-work">今日</span>}
        </button>
        <button type="button" onClick={() => setDayKey(shiftDateKey(dayKey, 1))} className="rounded-md p-2 text-slate-500" aria-label="翌日">
          <ChevronRight size={20} />
        </button>
      </header>

      {error && !sheet && !planSheet && (
        <p className="mx-4 mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {dashboard.data && dashboard.data.recorded_minutes > 0 && (
        <div className="mx-4 mb-2 rounded-lg border border-slate-200 bg-white p-3">
          <DomainDonut domains={dashboard.data.domains} size={120} />
          <p className="mt-2 text-xs text-slate-500">
            記録 {formatMinutes(dashboard.data.recorded_minutes)}
            {dashboard.data.work_ratio !== null && ` ・ 仕事 ${Math.round(dashboard.data.work_ratio * 100)}%`}
          </p>
        </div>
      )}

      {memos.data && memos.data.length > 0 && (
        <section className="mx-4 mb-2 rounded-lg border border-slate-200 bg-white" aria-label="この日のメモ">
          <h2 className="flex items-center gap-1 px-3 pt-2 text-xs font-semibold text-slate-500">
            <PenLine size={12} aria-hidden /> メモ {memos.data.length} 件
          </h2>
          <ul className="divide-y divide-slate-100">
            {memos.data.map((m: Memo) => (
              <li key={m.id}>
                <button type="button" onClick={() => openMemoEdit(m)} className="flex w-full items-start gap-3 px-3 py-2 text-left text-sm">
                  <span className="mt-0.5 font-mono text-xs text-slate-400">{formatClock(m.noted_at)}</span>
                  <span className="flex-1 whitespace-pre-wrap break-words text-slate-700">{m.body}</span>
                  {m.segment?.category && (
                    <span className="mt-0.5 shrink-0 rounded-full px-2 text-[10px] text-white" style={{ backgroundColor: m.segment.category.color }}>
                      {m.segment.category.name}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {segments.data && (
        <Timeline
          dayKey={dayKey}
          segments={segments.data.segments}
          running={segments.data.running}
          memos={memos.data ?? []}
          onSelectMemo={openMemoEdit}
          plans={plans.data?.plans ?? []}
          onSelectPlan={(p) => {
            setError(null)
            setPlanSheet({ plan: p })
          }}
          onSelect={(s) => {
            setError(null)
            setSheet({ segment: s })
          }}
          onCreateAt={(m) => {
            setError(null)
            setSheet({ segment: null, minutes: m })
          }}
        />
      )}

      <button
        type="button"
        onClick={() => {
          setError(null)
          setPlanSheet({ plan: null, minutes: 9 * 60 })
        }}
        className="fixed bottom-[9.5rem] right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-md"
        aria-label="予定を追加"
      >
        <CalendarPlus size={20} />
      </button>
      <button
        type="button"
        onClick={() => setSheet({ segment: null, minutes: 9 * 60 })}
        className="fixed bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-work text-white shadow-lg"
        aria-label="記録を追加"
      >
        <Plus size={26} />
      </button>

      {planSheet && (
        <PlanSheet
          dayKey={dayKey}
          categories={activeCategories}
          plan={planSheet.plan}
          initialMinutes={planSheet.minutes}
          onSave={savePlan}
          onDelete={planSheet.plan ? removePlan : undefined}
          onCopy={planSheet.plan ? copyPlan : undefined}
          onClose={() => setPlanSheet(null)}
          error={error}
        />
      )}

      {sheet && (
        <SegmentSheet
          dayKey={dayKey}
          categories={activeCategories}
          segment={sheet.segment}
          initialMinutes={sheet.minutes}
          onSave={save}
          onDelete={sheet.segment ? remove : undefined}
          onClose={() => setSheet(null)}
          error={error}
        />
      )}
    </div>
  )
}
