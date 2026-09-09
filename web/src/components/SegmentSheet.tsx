import { useEffect, useState } from 'react'
import type { Category, Segment } from '@/api/types'
import { dayMinutesToISO, minutesIntoDay } from '@/lib/time'
import { Button } from './Field'

export interface SheetValue {
  category_id: number
  started_at: string
  ended_at: string
  note: string
}

interface Props {
  dayKey: string
  categories: Category[]
  segment: Segment | null       // 編集対象（null なら新規）
  initialMinutes?: number       // 新規の開始（その日の 0:00 からの分）
  onSave: (value: SheetValue) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
  error?: string | null
}

function toHM(min: number): string {
  const m = Math.max(0, Math.min(DAY_END, Math.round(min)))
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
function fromHM(v: string): number {
  const [h, m] = v.split(':').map(Number)
  return h * 60 + m
}
const DAY_END = 24 * 60 - 1

/** 帯入力・編集シート。時刻はその日の HH:MM で扱い、API へは ISO に変換する。 */
export default function SegmentSheet({ dayKey, categories, segment, initialMinutes = 9 * 60, onSave, onDelete, onClose, error }: Props) {
  const [categoryId, setCategoryId] = useState<number>(segment?.category_id ?? categories[0]?.id ?? 0)
  const [start, setStart] = useState(toHM(segment ? minutesIntoDay(segment.started_at, dayKey) : initialMinutes))
  const [end, setEnd] = useState(toHM(segment ? minutesIntoDay(segment.ended_at ?? segment.started_at, dayKey) : initialMinutes + 30))
  const [note, setNote] = useState(segment?.note ?? '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const submit = async () => {
    setBusy(true)
    try {
      await onSave({
        category_id: categoryId,
        started_at: dayMinutesToISO(dayKey, fromHM(start)),
        ended_at: dayMinutesToISO(dayKey, fromHM(end) === 0 && fromHM(start) > 0 ? 24 * 60 : fromHM(end)),
        note: note.trim(),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={onClose} role="presentation">
      <div
        className="mx-auto w-full max-w-lg rounded-t-2xl bg-white p-4 shadow-xl"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={segment ? '記録を編集' : '記録を追加'}
      >
        <h2 className="text-base font-semibold">{segment ? '記録を編集' : '記録を追加'}</h2>

        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="カテゴリ">
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
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" placeholder="例: 資料作成" />
        </label>

        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}

        <div className="mt-4 flex gap-2">
          {segment && onDelete && (
            <Button variant="danger" onClick={onDelete} disabled={busy}>
              削除
            </Button>
          )}
          <span className="flex-1" />
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            キャンセル
          </Button>
          <Button onClick={submit} disabled={busy || !categoryId}>
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}
