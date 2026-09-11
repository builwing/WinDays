import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import * as auth from '@/api/auth'
import { errorMessage } from '@/lib/api'
import { getConsent, gaEnabled, setConsent } from '@/lib/ga'
import { useAuth } from '@/stores/auth'
import { Button, PasswordField } from '@/components/Field'

const TASK_URL = import.meta.env.VITE_TASK_URL

/** 設定: アカウント、WinTask への導線、計測の同意、ログアウト、アカウント削除。 */
export default function Settings() {
  const { user, clear } = useAuth()
  const nav = useNavigate()
  const [msg, setMsg] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const logout = async () => {
    try {
      await auth.logout()
    } catch {
      /* トークン失効でも続行 */
    }
    clear()
    nav('/')
  }

  const openWinTask = async () => {
    setBusy(true)
    try {
      const code = await auth.handoffCode()
      window.location.href = `${TASK_URL}/?handoff=${encodeURIComponent(code)}`
    } catch (e) {
      setMsg(errorMessage(e))
      setBusy(false)
    }
  }

  const removeAccount = async () => {
    setBusy(true)
    setMsg(null)
    try {
      await auth.deleteAccount(password)
      clear()
      nav('/?deleted=1')
    } catch (e) {
      setMsg(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 py-3">
      <h1 className="text-base font-semibold">設定</h1>

      <section className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="text-slate-500">アカウント</div>
        <div className="mt-1 font-medium">{user?.name}</div>
        <div className="text-slate-600">{user?.email}</div>
        <div className="mt-1 text-xs text-slate-500">{user?.email_verified_at ? 'メール確認済み' : 'メール未確認'}</div>
      </section>

      <section className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="font-medium">WinTask（タスク管理）</div>
        <p className="mt-1 text-slate-600">同じアカウントでそのまま使えます。チームで共有したい記録やタスクは WinTask で。</p>
        <p className="mt-1 text-slate-600">
          <strong>予定は WinTask と共通です。</strong>WinTask で入れた個人予定は「今日」のタイムライン左列に表示され、WinDays で立てた予定も WinTask のカレンダーに出ます（チーム予定は WinTask のみ）。
        </p>
        <Button variant="secondary" className="mt-2 inline-flex items-center gap-1" onClick={openWinTask} disabled={busy}>
          WinTask を開く <ExternalLink size={14} />
        </Button>
      </section>

      {gaEnabled() && (
        <section className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <div className="font-medium">利用状況の計測（Google アナリティクス）</div>
          <p className="mt-1 text-slate-600">現在: {getConsent() === 'granted' ? '同意しています' : '同意していません'}</p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" onClick={() => { setConsent('granted'); setMsg('同意しました。') }}>同意する</Button>
            <Button variant="secondary" onClick={() => { setConsent('denied'); setMsg('同意を取り消しました。次回の読み込みから計測しません。') }}>取り消す</Button>
          </div>
        </section>
      )}

      <section className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <a href="/manual.html" target="_blank" rel="noreferrer" className="underline">使い方マニュアル</a>
          <a href="https://win-task.winroad.org/terms.html" target="_blank" rel="noreferrer" className="underline">利用規約</a>
          <a href="https://win-task.winroad.org/privacy.html" target="_blank" rel="noreferrer" className="underline">プライバシーポリシー</a>
        </div>
        <Button variant="secondary" className="mt-3" onClick={logout}>ログアウト</Button>
      </section>

      <section className="mt-3 rounded-lg border border-red-200 bg-white p-4 text-sm">
        <div className="font-medium text-red-700">アカウントの削除</div>
        <p className="mt-1 text-slate-600">WinDays と WinTask の両方のデータが削除され、元に戻せません。</p>
        {!confirmDelete ? (
          <Button variant="secondary" className="mt-2" onClick={() => setConfirmDelete(true)}>削除に進む</Button>
        ) : (
          <div className="mt-2 space-y-2">
            <PasswordField label="確認のためパスワードを入力" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex gap-2">
              <Button variant="danger" onClick={removeAccount} disabled={busy || !password}>アカウントを削除する</Button>
              <Button variant="secondary" onClick={() => setConfirmDelete(false)}>やめる</Button>
            </div>
          </div>
        )}
      </section>

      {msg && <p className="mt-3 text-sm text-slate-700" role="status">{msg}</p>}
    </div>
  )
}
