import { Link, useSearchParams } from 'react-router-dom'

/**
 * メール認証リンク（API の /email/verify）からの戻り先。
 * ?status=ok | invalid
 */
export default function EmailVerified() {
  const [params] = useSearchParams()
  const ok = params.get('status') === 'ok'

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">{ok ? 'メールアドレスを確認しました' : 'リンクが無効です'}</h1>
      <p className="text-slate-600">
        {ok
          ? 'ご登録ありがとうございます。WinDays をお使いいただけます。'
          : 'リンクの有効期限が切れているか、URL が正しくありません。アプリから確認メールを再送してください。'}
      </p>
      <Link to="/" className="rounded-md bg-work px-4 py-2 text-white">
        WinDays を開く
      </Link>
    </main>
  )
}
