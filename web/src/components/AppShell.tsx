import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Clock, PenLine, Settings, Tags } from 'lucide-react'
import clsx from 'clsx'
import VerifyBanner from './VerifyBanner'
import MemoSheet from './MemoSheet'
import { useMemoSheet } from '@/stores/memoSheet'

const tabs = [
  { to: '/app', label: '今日', icon: Clock, end: true },
  { to: '/app/dashboard', label: 'ふりかえり', icon: BarChart3 },
  { to: '/app/categories', label: 'カテゴリ', icon: Tags },
  { to: '/app/settings', label: '設定', icon: Settings },
]

/** ログイン後の共通レイアウト（下部タブ＋中央のメモボタン）。 */
export default function AppShell() {
  const openMemo = useMemoSheet((s) => s.openNew)
  const items = [...tabs.slice(0, 2), null, ...tabs.slice(2)]

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-slate-50">
      <VerifyBanner />
      <div className="flex-1 pb-20">
        <Outlet />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur" aria-label="メイン">
        <ul className="mx-auto flex max-w-lg items-end" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {items.map((t) =>
            t === null ? (
              <li key="memo" className="flex flex-1 justify-center">
                <button
                  type="button"
                  onClick={openMemo}
                  className="-mt-5 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-life text-white shadow-lg"
                  aria-label="メモを書く"
                >
                  <PenLine size={22} aria-hidden />
                  <span className="text-[10px] font-semibold leading-none">メモ</span>
                </button>
              </li>
            ) : (
              <li key={t.to} className="flex-1">
                <NavLink
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    clsx('flex flex-col items-center gap-0.5 py-2 text-[11px]', isActive ? 'text-work font-semibold' : 'text-slate-500')
                  }
                >
                  <t.icon size={22} strokeWidth={1.8} aria-hidden />
                  {t.label}
                </NavLink>
              </li>
            ),
          )}
        </ul>
      </nav>
      <MemoSheet />
    </div>
  )
}
