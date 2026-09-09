import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Clock, Settings, Tags } from 'lucide-react'
import clsx from 'clsx'
import VerifyBanner from './VerifyBanner'

const tabs = [
  { to: '/app', label: '今日', icon: Clock, end: true },
  { to: '/app/dashboard', label: 'ふりかえり', icon: BarChart3 },
  { to: '/app/categories', label: 'カテゴリ', icon: Tags },
  { to: '/app/settings', label: '設定', icon: Settings },
]

/** ログイン後の共通レイアウト（下部タブ）。 */
export default function AppShell() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-slate-50">
      <VerifyBanner />
      <div className="flex-1 pb-20">
        <Outlet />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur" aria-label="メイン">
        <ul className="mx-auto flex max-w-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx('flex flex-col items-center gap-0.5 py-2 text-[11px]', isActive ? 'text-work font-semibold' : 'text-slate-500')
                }
              >
                <Icon size={22} strokeWidth={1.8} aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
