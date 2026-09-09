import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as auth from '@/api/auth'
import { funnel } from '@/api/days'
import { errorMessage } from '@/lib/api'
import { gaEvent } from '@/lib/ga'
import { useAuth } from '@/stores/auth'
import { Field, PasswordField } from '@/components/Field'

export default function Register() {
  const nav = useNavigate()
  const setSession = useAuth((s) => s.setSession)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [optIn, setOptIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agree) {
      setError('利用規約とプライバシーポリシーへの同意が必要です。')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await auth.register({ name, email, password, password_confirmation: password, marketing_opt_in: optIn })
      setSession(res.user, res.token)
      funnel('register.success', { opt_in: optIn })
      gaEvent('sign_up', { method: 'email' })
      nav('/app')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold">無料で始める</h1>
      <p className="mt-1 text-sm text-slate-600">登録は 30 秒。作ったアカウントは WinTask でもそのまま使えます。</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="表示名" name="name" autoComplete="nickname" required maxLength={255} value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="メールアドレス" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} hint="確認メールを送ります" />
        <PasswordField label="パスワード（8 文字以上）" name="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" required />
          <span>
            <a href="https://win-task.winroad.org/terms.html" target="_blank" rel="noreferrer" className="underline">利用規約</a>と
            <a href="https://win-task.winroad.org/privacy.html" target="_blank" rel="noreferrer" className="underline">プライバシーポリシー</a>に同意する（必須）
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-1" />
          <span className="text-slate-600">WinTask など関連サービスのお知らせをメールで受け取る（任意・いつでも解除可）</span>
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-md bg-work px-4 py-2.5 font-medium text-white disabled:opacity-50">
          アカウントを作成
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        すでにアカウントがある方は <Link to="/login" className="text-work underline">ログイン</Link>
      </p>
    </main>
  )
}
