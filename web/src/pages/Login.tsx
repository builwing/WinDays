import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as auth from '@/api/auth'
import { errorMessage } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { Field } from '@/components/Field'

export default function Login() {
  const nav = useNavigate()
  const setSession = useAuth((s) => s.setSession)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await auth.login(email, password)
      setSession(res.user, res.token)
      nav('/app')
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-bold">ログイン</h1>
      <p className="mt-1 text-sm text-slate-600">WinTask のアカウントでもログインできます。</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="メールアドレス" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="パスワード" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-md bg-work px-4 py-2.5 font-medium text-white disabled:opacity-50">
          ログイン
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        アカウントがない方は <Link to="/register" className="text-work underline">新規登録</Link>
      </p>
      <p className="mt-2 text-center text-sm"><Link to="/" className="text-slate-500 underline">トップへ</Link></p>
    </main>
  )
}
