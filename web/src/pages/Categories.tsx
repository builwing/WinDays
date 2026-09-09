import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ArchiveRestore, Pencil } from 'lucide-react'
import * as days from '@/api/days'
import type { Category, Domain } from '@/api/types'
import { errorMessage } from '@/lib/api'
import { DOMAIN_META } from '@/components/charts'
import { Button, Field } from '@/components/Field'

const DOMAINS: Domain[] = ['work', 'life', 'rest']
const PRESET_COLORS = ['#0d9488', '#0e7490', '#4338ca', '#b45309', '#d97706', '#db2777', '#16a34a', '#6366f1', '#6b7280', '#94a3b8']

/** カテゴリ管理。追加・編集・アーカイブ・復元。 */
export default function Categories() {
  const qc = useQueryClient()
  const list = useQuery({ queryKey: ['categories', 'all'], queryFn: () => days.listCategories(true) })
  const [editing, setEditing] = useState<Partial<Category> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => qc.invalidateQueries({ queryKey: ['categories'] })

  const save = useMutation({
    mutationFn: async (c: Partial<Category>) => {
      const input = { name: c.name ?? '', color: c.color ?? PRESET_COLORS[0], domain: c.domain ?? 'life' }
      return c.id ? days.updateCategory(c.id, input) : days.createCategory(input)
    },
    onSuccess: () => {
      setEditing(null)
      setError(null)
      refresh()
    },
    onError: (e) => setError(errorMessage(e)),
  })
  const archive = useMutation({ mutationFn: (id: number) => days.deleteCategory(id), onSuccess: refresh, onError: (e) => setError(errorMessage(e)) })
  const restore = useMutation({ mutationFn: (id: number) => days.restoreCategory(id), onSuccess: refresh, onError: (e) => setError(errorMessage(e)) })

  const active = (list.data ?? []).filter((c) => !c.archived_at)
  const archived = (list.data ?? []).filter((c) => c.archived_at)

  return (
    <div className="px-4 py-3">
      <header className="flex items-center justify-between">
        <h1 className="text-base font-semibold">カテゴリ</h1>
        <Button onClick={() => setEditing({ domain: 'life', color: PRESET_COLORS[3] })}>追加</Button>
      </header>
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}

      {DOMAINS.map((d) => (
        <section key={d} className="mt-4">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DOMAIN_META[d].color }} aria-hidden />
            {DOMAIN_META[d].label}
          </h2>
          <ul className="mt-1 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {active.filter((c) => c.domain === d).map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="inline-block h-4 w-4 rounded" style={{ backgroundColor: c.color }} aria-hidden />
                <span className="flex-1">{c.name}</span>
                <button type="button" onClick={() => setEditing(c)} className="p-1 text-slate-500" aria-label={`${c.name} を編集`}>
                  <Pencil size={16} />
                </button>
                <button type="button" onClick={() => archive.mutate(c.id)} className="p-1 text-slate-500" aria-label={`${c.name} をアーカイブ`}>
                  <Archive size={16} />
                </button>
              </li>
            ))}
            {active.filter((c) => c.domain === d).length === 0 && <li className="px-3 py-2 text-xs text-slate-400">なし</li>}
          </ul>
        </section>
      ))}

      {archived.length > 0 && (
        <section className="mt-4">
          <h2 className="text-xs font-semibold text-slate-500">アーカイブ済み</h2>
          <ul className="mt-1 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {archived.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500">
                <span className="inline-block h-4 w-4 rounded opacity-50" style={{ backgroundColor: c.color }} aria-hidden />
                <span className="flex-1">{c.name}</span>
                <button type="button" onClick={() => restore.mutate(c.id)} className="p-1" aria-label={`${c.name} を復元`}>
                  <ArchiveRestore size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-4 text-xs text-slate-400">領域（仕事・プライベート・休息）はバランス集計の軸です。アーカイブしても過去の記録は残ります。</p>

      {editing && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/40" onClick={() => setEditing(null)} role="presentation">
          <div className="mx-auto w-full max-w-lg rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="カテゴリ">
            <h2 className="text-base font-semibold">{editing.id ? 'カテゴリを編集' : 'カテゴリを追加'}</h2>
            <div className="mt-3">
              <Field label="名前" name="name" value={editing.name ?? ''} maxLength={50} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="mt-3 text-sm">
              <span className="text-slate-600">領域</span>
              <div className="mt-1 flex gap-2" role="radiogroup">
                {DOMAINS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={editing.domain === d}
                    onClick={() => setEditing({ ...editing, domain: d })}
                    className="flex-1 rounded-md border px-2 py-1.5"
                    style={editing.domain === d ? { backgroundColor: DOMAIN_META[d].color, borderColor: DOMAIN_META[d].color, color: '#fff' } : {}}
                  >
                    {DOMAIN_META[d].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 text-sm">
              <span className="text-slate-600">色</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditing({ ...editing, color: c })}
                    className="h-8 w-8 rounded-full border-2"
                    style={{ backgroundColor: c, borderColor: editing.color === c ? '#0f172a' : 'transparent' }}
                    aria-label={c}
                    aria-pressed={editing.color === c}
                  />
                ))}
                <input type="color" value={editing.color ?? PRESET_COLORS[0]} onChange={(e) => setEditing({ ...editing, color: e.target.value })} className="h-8 w-8" aria-label="任意の色" />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                キャンセル
              </Button>
              <Button onClick={() => save.mutate(editing)} disabled={save.isPending || !editing.name?.trim()}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
