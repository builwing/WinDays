/**
 * 繰り返し（RRULE）の簡易ビルダーと表示。WinDays のプリセット（毎日・平日・毎週・毎月）だけを扱い、
 * それ以外の RRULE（WinTask や Google 由来）は文字列のまま「カスタム」として表示する。
 */
export type RepeatPreset = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly'

export const WEEKDAYS = [
  { code: 'MO', label: '月' },
  { code: 'TU', label: '火' },
  { code: 'WE', label: '水' },
  { code: 'TH', label: '木' },
  { code: 'FR', label: '金' },
  { code: 'SA', label: '土' },
  { code: 'SU', label: '日' },
] as const

const DAY_CODES = WEEKDAYS.map((d) => d.code)

/** プリセット → RRULE。weekly は byday（空なら開始日の曜日）。monthly は開始日の日付。 */
export function buildRrule(preset: RepeatPreset, byday: string[], startDate: Date): string | null {
  switch (preset) {
    case 'daily':
      return 'FREQ=DAILY'
    case 'weekdays':
      return 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
    case 'weekly': {
      const days = byday.length ? DAY_CODES.filter((c) => byday.includes(c)) : [DAY_CODES[(startDate.getDay() + 6) % 7]]
      return `FREQ=WEEKLY;BYDAY=${days.join(',')}`
    }
    case 'monthly':
      return `FREQ=MONTHLY;BYMONTHDAY=${startDate.getDate()}`
    default:
      return null
  }
}

function parts(rrule: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const p of rrule.split(';')) {
    const [k, v] = p.split('=')
    if (k && v) out[k.toUpperCase()] = v.toUpperCase()
  }
  return out
}

/** RRULE → プリセット（判定できなければ null＝カスタム）。 */
export function parseRrule(rrule: string | null | undefined): { preset: RepeatPreset; byday: string[] } | null {
  if (!rrule) return { preset: 'none', byday: [] }
  const p = parts(rrule)
  if (p.INTERVAL && p.INTERVAL !== '1') return null
  if (p.FREQ === 'DAILY' && !p.BYDAY) return { preset: 'daily', byday: [] }
  if (p.FREQ === 'WEEKLY') {
    const byday = (p.BYDAY ?? '').split(',').filter(Boolean)
    if (byday.join(',') === 'MO,TU,WE,TH,FR') return { preset: 'weekdays', byday }
    if (byday.every((d) => DAY_CODES.includes(d as (typeof DAY_CODES)[number]))) return { preset: 'weekly', byday }
    return null
  }
  if (p.FREQ === 'MONTHLY' && p.BYMONTHDAY && !p.BYDAY) return { preset: 'monthly', byday: [] }
  return null
}

/** RRULE → 日本語の短い説明（「毎週 月・水・金」など）。 */
export function describeRrule(rrule: string | null | undefined): string {
  if (!rrule) return '繰り返しなし'
  const parsed = parseRrule(rrule)
  const p = parts(rrule)
  const until = p.UNTIL ? `（${p.UNTIL.slice(0, 4)}/${p.UNTIL.slice(4, 6)}/${p.UNTIL.slice(6, 8)} まで）` : ''
  if (!parsed) return `カスタム（${rrule}）`
  switch (parsed.preset) {
    case 'daily':
      return `毎日${until}`
    case 'weekdays':
      return `平日（月〜金）${until}`
    case 'weekly':
      return `毎週 ${parsed.byday.map((c) => WEEKDAYS.find((d) => d.code === c)?.label ?? c).join('・')}${until}`
    case 'monthly':
      return `毎月 ${p.BYMONTHDAY} 日${until}`
    default:
      return '繰り返しなし'
  }
}
