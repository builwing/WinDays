import { useState } from 'react'
import { gaEnabled, getConsent, setConsent } from '@/lib/ga'

/** GA4 の Cookie 同意バナー。測定 ID 未設定なら表示しない。 */
export default function ConsentBanner() {
  const [consent, setLocal] = useState(getConsent())
  if (!gaEnabled() || consent !== null) return null

  const choose = (c: 'granted' | 'denied') => {
    setConsent(c)
    setLocal(c)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg p-3" role="dialog" aria-label="Cookie の利用について">
      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-lg">
        <p className="text-slate-700">
          サービス改善のため、同意いただいた場合のみ Google アナリティクス（Cookie）で利用状況を計測します。詳しくは
          <a href="https://win-task.winroad.org/privacy.html" className="underline" target="_blank" rel="noreferrer">
            プライバシーポリシー
          </a>
          をご覧ください。
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => choose('granted')} className="flex-1 rounded-md bg-work px-3 py-2 text-white">
            同意する
          </button>
          <button type="button" onClick={() => choose('denied')} className="flex-1 rounded-md border border-slate-300 px-3 py-2">
            同意しない
          </button>
        </div>
      </div>
    </div>
  )
}
