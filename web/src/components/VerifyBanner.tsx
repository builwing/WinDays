import { useState } from 'react'
import { resendVerification } from '@/api/auth'
import { errorMessage } from '@/lib/api'
import { useAuth } from '@/stores/auth'

/** メール未確認のユーザーに再送導線を出す（利用はブロックしない）。 */
export default function VerifyBanner() {
  const user = useAuth((s) => s.user)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  if (!user || user.email_verified_at) return null

  const resend = async () => {
    setBusy(true)
    try {
      setMsg(await resendVerification())
    } catch (e) {
      setMsg(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-amber-50 px-4 py-2 text-xs text-amber-900" role="status">
      <span className="font-medium">{user.email}</span> に確認メールを送りました。届いていない場合は{' '}
      <button type="button" onClick={resend} disabled={busy} className="underline disabled:opacity-50">
        再送
      </button>
      {msg && <span className="ml-2 text-amber-700">{msg}</span>}
    </div>
  )
}
