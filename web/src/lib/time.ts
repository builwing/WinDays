import { addDays, format, parseISO, startOfDay } from 'date-fns'

export const DAY_MINUTES = 24 * 60

/** YYYY-MM-DD（ローカル） */
export function toDateKey(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function fromDateKey(key: string): Date {
  return startOfDay(parseISO(key))
}

export function shiftDateKey(key: string, days: number): string {
  return toDateKey(addDays(fromDateKey(key), days))
}

/** その日の 0:00 からの経過分（範囲外はクリップ） */
export function minutesIntoDay(iso: string, dayKey: string): number {
  const t = parseISO(iso).getTime()
  const day0 = fromDateKey(dayKey).getTime()
  const m = (t - day0) / 60000
  return Math.max(0, Math.min(DAY_MINUTES, m))
}

/** 分 → "3時間20分" / "45分" */
export function formatMinutes(min: number): string {
  const m = Math.round(min)
  const h = Math.floor(m / 60)
  const r = m % 60
  if (h === 0) return `${r}分`
  if (r === 0) return `${h}時間`
  return `${h}時間${r}分`
}

export function formatClock(iso: string): string {
  return format(parseISO(iso), 'HH:mm')
}

/** 5 分刻みに丸める */
export function snapMinutes(min: number, step = 5): number {
  return Math.round(min / step) * step
}

/** 日付キー + 分 → ISO（ローカルタイムゾーン付き） */
export function dayMinutesToISO(dayKey: string, minutes: number): string {
  const d = new Date(fromDateKey(dayKey).getTime() + minutes * 60000)
  return toLocalISO(d)
}

/** タイムゾーンオフセット付きの ISO 8601（API へ渡す形式） */
export function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  const oh = pad(Math.floor(Math.abs(off) / 60))
  const om = pad(Math.abs(off) % 60)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${oh}:${om}`
}

export function formatDateLabel(key: string): string {
  const d = fromDateKey(key)
  const w = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${d.getMonth() + 1}/${d.getDate()}（${w}）`
}
