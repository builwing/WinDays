import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BellRing, Briefcase, Moon, Sparkles, Sun } from 'lucide-react'
import * as days from '@/api/days'
import type { Category } from '@/api/types'
import { errorMessage } from '@/lib/api'
import { pushStatus, subscribePush, type PushStatus } from '@/lib/push'
import { buildRrule, WEEKDAYS } from '@/lib/rrule'
import { dayMinutesToISO, toDateKey } from '@/lib/time'
import { useAuth } from '@/stores/auth'
import { Button } from '@/components/Field'

type Step = 0 | 1 | 2 | 3

function hm(v: string): number {
  const [h, m] = v.split(':').map(Number)
  return h * 60 + m
}

/** ISO 開始・終了。終了が開始以下なら翌日（睡眠など日跨ぎ）。 */
function range(dayKey: string, start: string, end: string): { starts_at: string; ends_at: string } {
  const s = hm(start)
  let e = hm(end)
  if (e <= s) e += 24 * 60
  return { starts_at: dayMinutesToISO(dayKey, s), ends_at: dayMinutesToISO(dayKey, e) }
}

function TimeRange({ start, end, onStart, onEnd }: { start: string; end: string; onStart: (v: string) => void; onEnd: (v: string) => void }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
      <label className="block">
        <span className="text-slate-600">開始</span>
        <input type="time" step={300} value={start} onChange={(e) => onStart(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" />
      </label>
      <label className="block">
        <span className="text-slate-600">終了</span>
        <input type="time" step={300} value={end} onChange={(e) => onEnd(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-base" />
      </label>
    </div>
  )
}

function CategoryPicker({ categories, value, onChange }: { categories: Category[]; value: number | null; onChange: (id: number) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="カテゴリ">
      {categories.map((c) => {
        const active = c.id === value
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c.id)}
            className="rounded-full border px-3 py-1 text-sm"
            style={active ? { backgroundColor: c.color, borderColor: c.color, color: '#fff' } : { borderColor: c.color, color: c.color }}
          >
            {c.name}
          </button>
        )
      })}
    </div>
  )
}

function DayPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="mt-3 flex gap-1" role="group" aria-label="曜日">
      {WEEKDAYS.map((d) => {
        const on = value.includes(d.code)
        return (
          <button
            key={d.code}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((c) => c !== d.code) : [...value, d.code])}
            className={`h-9 w-9 rounded-full border text-sm ${on ? 'border-work bg-work text-white' : 'border-slate-300 text-slate-600'}`}
          >
            {d.label}
          </button>
        )
      })}
    </div>
  )
}

/**
 * 初回設定ウィザード（3 問）: 平日の仕事・睡眠・休日の定番を繰り返し予定にして、
 * 登録直後から自動記録が動く状態にする。最後に通知の許可を求める（任意）。
 */
export default function Welcome() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const setUser = useAuth((s) => s.setUser)
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => days.listCategories() })
  const active = useMemo(() => (categories.data ?? []).filter((c) => !c.archived_at), [categories.data])
  const find = (name: string, domain?: string) => active.find((c) => c.name === name) ?? active.find((c) => c.domain === domain) ?? active[0]

  const [step, setStep] = useState<Step>(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Q1 平日の仕事
  const [workOn, setWorkOn] = useState(true)
  const [workCat, setWorkCat] = useState<number | null>(null)
  const [workDays, setWorkDays] = useState<string[]>(['MO', 'TU', 'WE', 'TH', 'FR'])
  const [workStart, setWorkStart] = useState('09:00')
  const [workEnd, setWorkEnd] = useState('18:00')
  const [workSkipHolidays, setWorkSkipHolidays] = useState(true)
  // Q2 睡眠
  const [sleepOn, setSleepOn] = useState(true)
  const [sleepCat, setSleepCat] = useState<number | null>(null)
  const [sleepStart, setSleepStart] = useState('23:30')
  const [sleepEnd, setSleepEnd] = useState('07:00')
  // Q3 休日の定番
  const [hobbyOn, setHobbyOn] = useState(false)
  const [hobbyCat, setHobbyCat] = useState<number | null>(null)
  const [hobbyTitle, setHobbyTitle] = useState('')
  const [hobbyDays, setHobbyDays] = useState<string[]>(['SA'])
  const [hobbyStart, setHobbyStart] = useState('10:00')
  const [hobbyEnd, setHobbyEnd] = useState('12:00')
  // 通知
  const [push, setPush] = useState<PushStatus | null>(null)
  const pushKey = useQuery({ queryKey: ['push-public-key'], queryFn: () => days.getPushPublicKey() })

  useEffect(() => {
    if (!active.length) return
    setWorkCat((v) => v ?? find('仕事', 'work')?.id ?? null)
    setSleepCat((v) => v ?? find('睡眠', 'rest')?.id ?? null)
    setHobbyCat((v) => v ?? find('運動', 'life')?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useEffect(() => {
    pushStatus().then(setPush)
  }, [])

  const plans = (): days.OnboardingPlan[] => {
    const today = toDateKey(new Date())
    const out: days.OnboardingPlan[] = []
    if (workOn && workCat && workDays.length) {
      out.push({ days_category_id: workCat, ...range(today, workStart, workEnd), rrule: buildRrule('weekly', workDays, new Date())!, skip_holidays: workSkipHolidays })
    }
    if (sleepOn && sleepCat) {
      out.push({ days_category_id: sleepCat, ...range(today, sleepStart, sleepEnd), rrule: 'FREQ=DAILY' })
    }
    if (hobbyOn && hobbyCat && hobbyDays.length) {
      out.push({ title: hobbyTitle.trim() || null, days_category_id: hobbyCat, ...range(today, hobbyStart, hobbyEnd), rrule: buildRrule('weekly', hobbyDays, new Date())! })
    }
    return out
  }

  const finish = async (withPlans: boolean) => {
    setBusy(true)
    setError(null)
    try {
      const res = await days.completeOnboarding(withPlans ? plans() : [])
      setUser(res.user)
      qc.invalidateQueries({ queryKey: ['plans'] })
      qc.invalidateQueries({ queryKey: ['plan-runs'] })
      days.funnel('onboarding_done', { plans: withPlans ? plans().length : 0 })
      nav('/app', { replace: true })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const enablePush = async () => {
    if (!pushKey.data?.public_key) return
    setBusy(true)
    try {
      const sub = await subscribePush(pushKey.data.public_key)
      await days.registerPush(sub)
      setPush('subscribed')
    } catch (e) {
      setError(e instanceof Error && !('response' in e) ? e.message : errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const summary = plans()

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-slate-50 px-4 py-6">
      <header className="mb-4">
        <p className="text-xs font-semibold text-work">はじめの設定 {step + 1} / 4</p>
        <div className="mt-1 flex gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-work' : 'bg-slate-200'}`} />
          ))}
        </div>
      </header>

      {step === 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h1 className="flex items-center gap-2 text-lg font-semibold"><Briefcase size={20} className="text-work" aria-hidden /> 平日は何時から何時まで仕事ですか？</h1>
          <p className="mt-1 text-sm text-slate-600">登録しておくと、毎日その時間が<strong>自動で記録</strong>されます。違った日だけ直せば OK です。</p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5" checked={workOn} onChange={(e) => setWorkOn(e.target.checked)} /> 仕事の予定を入れる
          </label>
          {workOn && (
            <>
              <CategoryPicker categories={active.filter((c) => c.domain === 'work')} value={workCat} onChange={setWorkCat} />
              <DayPicker value={workDays} onChange={setWorkDays} />
              <TimeRange start={workStart} end={workEnd} onStart={setWorkStart} onEnd={setWorkEnd} />
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={workSkipHolidays} onChange={(e) => setWorkSkipHolidays(e.target.checked)} /> 祝日は休み
              </label>
            </>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h1 className="flex items-center gap-2 text-lg font-semibold"><Moon size={20} className="text-rest" aria-hidden /> 睡眠は何時から何時ですか？</h1>
          <p className="mt-1 text-sm text-slate-600">毎日の睡眠を自動で記録します。休息の割合がふりかえりに出ます。</p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5" checked={sleepOn} onChange={(e) => setSleepOn(e.target.checked)} /> 睡眠の予定を入れる
          </label>
          {sleepOn && (
            <>
              <CategoryPicker categories={active.filter((c) => c.domain === 'rest')} value={sleepCat} onChange={setSleepCat} />
              <TimeRange start={sleepStart} end={sleepEnd} onStart={setSleepStart} onEnd={setSleepEnd} />
              <p className="mt-1 text-xs text-slate-500">終了が開始より早ければ翌朝として扱います。</p>
            </>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h1 className="flex items-center gap-2 text-lg font-semibold"><Sun size={20} className="text-life" aria-hidden /> 休日の定番はありますか？</h1>
          <p className="mt-1 text-sm text-slate-600">運動・買い物・家族の時間など、決まってやることがあれば。あとから「今日」で追加もできます。</p>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-5 w-5" checked={hobbyOn} onChange={(e) => setHobbyOn(e.target.checked)} /> 定番の予定を入れる
          </label>
          {hobbyOn && (
            <>
              <input value={hobbyTitle} onChange={(e) => setHobbyTitle(e.target.value)} maxLength={255} className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-base" placeholder="タイトル（例: ジム。空ならカテゴリ名）" />
              <CategoryPicker categories={active.filter((c) => c.domain !== 'rest')} value={hobbyCat} onChange={setHobbyCat} />
              <DayPicker value={hobbyDays} onChange={setHobbyDays} />
              <TimeRange start={hobbyStart} end={hobbyEnd} onStart={setHobbyStart} onEnd={setHobbyEnd} />
            </>
          )}
        </section>
      )}

      {step === 3 && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h1 className="flex items-center gap-2 text-lg font-semibold"><Sparkles size={20} className="text-work" aria-hidden /> これで準備完了です</h1>
          {summary.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm">
              {summary.map((p, i) => {
                const c = active.find((x) => x.id === p.days_category_id)
                const s = new Date(p.starts_at)
                const e = new Date(p.ends_at)
                const f = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
                return (
                  <li key={i} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c?.color }} aria-hidden />
                    <span>{p.title || c?.name}</span>
                    <span className="text-slate-500">{f(s)}〜{f(e)}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">予定は入れずに始めます。「今日」からいつでも追加できます。</p>
          )}
          <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium">自動記録のしくみ</p>
            <p className="mt-1">予定の開始時刻に確認が出て、3 分以内に変更が無ければ予定どおりに記録が始まります。終了も同じです。<strong>アプリを閉じていても記録されます。</strong>設定でいつでも OFF にできます。</p>
          </div>
          <div className="mt-3 rounded-md border border-slate-200 p-3 text-sm">
            <p className="flex items-center gap-1 font-medium"><BellRing size={16} aria-hidden /> 開始・終了の確認を通知で受け取る（任意）</p>
            {push === 'subscribed' && <p className="mt-1 text-emerald-700">この端末で受信します。</p>}
            {push === 'unsubscribed' && pushKey.data?.enabled && (
              <Button variant="secondary" className="mt-2" onClick={enablePush} disabled={busy}>通知を許可する</Button>
            )}
            {push === 'ios-not-installed' && <p className="mt-1 text-slate-600">iPhone では、Safari の共有メニューから「ホーム画面に追加」して開くと通知を使えます。あとで設定からも有効にできます。</p>}
            {(push === 'unsupported' || push === 'denied' || (push === 'unsubscribed' && pushKey.data && !pushKey.data.enabled)) && (
              <p className="mt-1 text-slate-500">この端末では今は使えません。通知が無くても記録は予定どおり残ります。</p>
            )}
          </div>
        </section>
      )}

      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}

      <div className="mt-4 flex gap-2">
        {step > 0 && <Button variant="secondary" onClick={() => setStep((s) => (s - 1) as Step)} disabled={busy}>戻る</Button>}
        <span className="flex-1" />
        {step < 3 && <button type="button" onClick={() => finish(false)} disabled={busy} className="px-2 text-sm text-slate-500 underline">あとで設定する</button>}
        {step < 3 && <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={busy || !active.length}>次へ</Button>}
        {step === 3 && <Button onClick={() => finish(true)} disabled={busy}>はじめる</Button>}
      </div>
    </div>
  )
}
