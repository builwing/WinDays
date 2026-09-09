import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import * as days from '@/api/days'
import type { Segment } from '@/api/types'
import { errorMessage } from '@/lib/api'
import { formatDateLabel, formatMinutes, shiftDateKey, toDateKey } from '@/lib/time'
import QuickStart from '@/components/QuickStart'
import Timeline from '@/components/Timeline'
import SegmentSheet, { type SheetValue } from '@/components/SegmentSheet'
import { DomainDonut } from '@/components/charts'

const FIRST_SEGMENT_KEY = 'windays.first_segment'

/** 「今日」画面: タイムライン＋ワンタップ計測＋その日の内訳。 */
export default function Today() {
  const qc = useQueryClient()
  const [dayKey, setDayKey] = useState(toDateKey(new Date()))
  const [sheet, setSheet] = useState<{ segment: Segment | null; minutes?: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => days.listCategories() })
  const segments = useQuery({ queryKey: ['segments', dayKey], queryFn: () => days.listSegments(dayKey) })
  const dashboard = useQuery({ queryKey: ['dashboard', 'day', dayKey], queryFn: () => days.getDayDashboard(dayKey), retry: false })

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

      {error && !sheet && (
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

      {segments.data && (
        <Timeline
          dayKey={dayKey}
          segments={segments.data.segments}
          running={segments.data.running}
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
        onClick={() => setSheet({ segment: null, minutes: 9 * 60 })}
        className="fixed bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-work text-white shadow-lg"
        aria-label="記録を追加"
      >
        <Plus size={26} />
      </button>

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
