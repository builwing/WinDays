import type { Domain, WeekDay } from '@/api/types'
import { formatMinutes } from '@/lib/time'

/** 領域の表示名と色（tailwind.config と同じ値。色覚検証済み） */
export const DOMAIN_META: Record<Domain, { label: string; color: string }> = {
  work: { label: '仕事', color: '#0d9488' },
  life: { label: 'プライベート', color: '#d97706' },
  rest: { label: '休息', color: '#6366f1' },
}
const ORDER: Domain[] = ['work', 'life', 'rest']

export function Legend({ domains }: { domains?: Record<Domain, number> }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-label="凡例">
      {ORDER.map((d) => (
        <li key={d} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DOMAIN_META[d].color }} aria-hidden />
          {DOMAIN_META[d].label}
          {domains && <span className="text-slate-400">{formatMinutes(domains[d])}</span>}
        </li>
      ))}
    </ul>
  )
}

/**
 * 1 日の領域内訳ドーナツ。中央に記録合計。セグメント間に 2px の余白（サーフェス色）。
 */
export function DomainDonut({ domains, size = 168 }: { domains: Record<Domain, number>; size?: number }) {
  const total = ORDER.reduce((a, d) => a + domains[d], 0)
  const r = size / 2 - 12
  const c = size / 2
  const circumference = 2 * Math.PI * r
  let offset = 0
  return (
    <figure className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="領域別の時間配分">
        <circle cx={c} cy={c} r={r} fill="none" stroke="#e2e8f0" strokeWidth={18} />
        {total > 0 &&
          ORDER.map((d) => {
            const frac = domains[d] / total
            const len = frac * circumference
            const el = (
              <circle
                key={d}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={DOMAIN_META[d].color}
                strokeWidth={18}
                strokeDasharray={`${Math.max(0, len - 2)} ${circumference - Math.max(0, len - 2)}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${c} ${c})`}
              >
                <title>
                  {DOMAIN_META[d].label} {formatMinutes(domains[d])}（{Math.round(frac * 100)}%）
                </title>
              </circle>
            )
            offset += len
            return el
          })}
        <text x={c} y={c - 4} textAnchor="middle" className="fill-slate-800" fontSize={20} fontWeight={700}>
          {(total / 60).toFixed(1)}h
        </text>
        <text x={c} y={c + 16} textAnchor="middle" className="fill-slate-500" fontSize={11}>
          記録した時間
        </text>
      </svg>
      <figcaption className="flex-1">
        <ul className="space-y-1.5 text-sm">
          {ORDER.map((d) => (
            <li key={d} className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DOMAIN_META[d].color }} aria-hidden />
              <span className="flex-1 text-slate-600">{DOMAIN_META[d].label}</span>
              <span className="font-mono text-slate-800">{total ? Math.round((domains[d] / total) * 100) : 0}%</span>
              <span className="w-16 text-right text-xs text-slate-500">{formatMinutes(domains[d])}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}

/**
 * 週の積み上げ棒（日曜始まり 7 本）。各棒は work/life/rest の順に積み、セグメント間 2px 余白。
 */
export function WeekBars({ days }: { days: WeekDay[] }) {
  const W = 320
  const H = 160
  const padL = 28
  const padB = 20
  const max = Math.max(60, ...days.map((d) => d.recorded_minutes))
  const niceMax = Math.ceil(max / 240) * 240 // 4 時間刻み
  const bw = (W - padL) / days.length
  const scale = (H - padB - 8) / niceMax
  const y0 = H - padB
  const ticks = [0, niceMax / 2, niceMax]
  const weekday = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="曜日ごとの領域別時間">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y0 - t * scale} y2={y0 - t * scale} stroke="#e2e8f0" strokeWidth={1} />
            <text x={padL - 4} y={y0 - t * scale + 3} textAnchor="end" fontSize={9} className="fill-slate-400">
              {t / 60}h
            </text>
          </g>
        ))}
        {days.map((d, i) => {
          let y = y0
          const x = padL + i * bw + bw * 0.2
          const w = bw * 0.6
          const date = new Date(d.date + 'T00:00:00')
          return (
            <g key={d.date}>
              {ORDER.map((dom) => {
                const h = d.domains[dom] * scale
                if (h <= 0) return null
                y -= h
                const el = (
                  <rect key={dom} x={x} y={y + 1} width={w} height={Math.max(0, h - 2)} rx={h > 6 ? 2 : 0} fill={DOMAIN_META[dom].color}>
                    <title>
                      {d.date} {DOMAIN_META[dom].label} {formatMinutes(d.domains[dom])}
                    </title>
                  </rect>
                )
                return el
              })}
              <text x={x + w / 2} y={H - 6} textAnchor="middle" fontSize={10} className="fill-slate-500">
                {weekday[date.getDay()]}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-2">
        <Legend />
      </figcaption>
    </figure>
  )
}

/** グラフの代替表示（テーブル）。 */
export function WeekTable({ days }: { days: WeekDay[] }) {
  return (
    <table className="mt-3 w-full text-xs">
      <thead>
        <tr className="text-slate-500">
          <th className="py-1 text-left font-normal">日付</th>
          {ORDER.map((d) => (
            <th key={d} className="py-1 text-right font-normal">
              {DOMAIN_META[d].label}
            </th>
          ))}
          <th className="py-1 text-right font-normal">合計</th>
        </tr>
      </thead>
      <tbody>
        {days.map((d) => (
          <tr key={d.date} className="border-t border-slate-100">
            <td className="py-1">{d.date.slice(5).replace('-', '/')}</td>
            {ORDER.map((dom) => (
              <td key={dom} className="py-1 text-right font-mono">
                {(d.domains[dom] / 60).toFixed(1)}
              </td>
            ))}
            <td className="py-1 text-right font-mono">{(d.recorded_minutes / 60).toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
