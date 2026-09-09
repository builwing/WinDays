import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as days from '@/api/days'
import { errorMessage } from '@/lib/api'
import { formatClock, toLocalISO } from '@/lib/time'
import { useMemoSheet } from '@/stores/memoSheet'
import { Button } from './Field'

/**
 * いつでもメモ。新規は「今」の時刻で保存（記録中のセグメントに自動で紐づく）。
 * 編集では本文と時刻を変えられる。
 */
export default function MemoSheet() {
  const { open, memo, close } = useMemoSheet()
  const qc = useQueryClient()
  const [body, setBody] = useState('')
  const [time, setTime] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    setBody(memo?.body ?? '')
    setTime(memo ? formatClock(memo.noted_at) : '')
    setError(null)
    document.body.style.overflow = 'hidden'
    setTimeout(() => ref.current?.focus(), 50)
    return () => {
      document.body.style.overflow = ''
    }
  }, [open, memo])

  if (!open) return null

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['memos'] })
  }

  const save = async () => {
    const text = body.trim()
    if (!text) return
    setBusy(true)
    setError(null)
    try {
      if (memo) {
        const input: { body: string; noted_at?: string } = { body: text }
        if (time && time !== formatClock(memo.noted_at)) {
          const d = new Date(memo.noted_at)
          const [h, m] = time.split(':').map(Number)
          d.setHours(h, m, 0, 0)
          input.noted_at = toLocalISO(d)
        }
        await days.updateMemo(memo.id, input)
      } else {
        await days.createMemo({ body: text })
      }
      invalidate()
      close()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!memo || !confirm('このメモを削除しますか？')) return
    setBusy(true)
    try {
      await days.deleteMemo(memo.id)
      invalidate()
      close()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/40" onClick={close} role="presentation">
      <div
        className="mx-auto w-full max-w-lg rounded-t-2xl bg-white p-4 shadow-xl"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={memo ? 'メモを編集' : 'メモ'}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">{memo ? 'メモを編集' : 'メモ'}</h2>
          {memo ? (
            <label className="text-xs text-slate-500">
              時刻{' '}
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="rounded border border-slate-300 px-1 py-0.5 text-sm" />
            </label>
          ) : (
            <span className="text-xs text-slate-500">{formatClock(new Date().toISOString())} に記録{memo === null ? '' : ''}</span>
          )}
        </div>
        <textarea
          ref={ref}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save()
          }}
          maxLength={2000}
          rows={4}
          placeholder="思いついたことをそのまま。記録中の活動に自動で紐づきます。"
          className="mt-2 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-base focus:border-work focus:outline-none"
        />
        {error && <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>}
        <div className="mt-3 flex gap-2">
          {memo && (
            <Button variant="danger" onClick={remove} disabled={busy}>
              削除
            </Button>
          )}
          <span className="flex-1" />
          <Button variant="secondary" onClick={close} disabled={busy}>
            キャンセル
          </Button>
          <Button onClick={save} disabled={busy || !body.trim()}>
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}
