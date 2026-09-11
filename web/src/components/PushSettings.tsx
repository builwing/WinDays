import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BellRing } from 'lucide-react'
import * as days from '@/api/days'
import { errorMessage } from '@/lib/api'
import { isIOS, pushStatus, subscribePush, unsubscribePush, type PushStatus } from '@/lib/push'
import { Button } from './Field'

/** 設定 > 通知: この端末で Web Push を受け取る／解除／テスト。 */
export default function PushSettings({ onMessage }: { onMessage: (m: string) => void }) {
  const key = useQuery({ queryKey: ['push-public-key'], queryFn: () => days.getPushPublicKey() })
  const [status, setStatus] = useState<PushStatus | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = () => pushStatus().then(setStatus)
  useEffect(() => {
    refresh()
  }, [])

  const enable = async () => {
    if (!key.data?.public_key) return
    setBusy(true)
    try {
      const sub = await subscribePush(key.data.public_key)
      await days.registerPush(sub)
      onMessage('この端末で通知を受け取ります。')
      await refresh()
    } catch (e) {
      onMessage(e instanceof Error && !('response' in e) ? e.message : errorMessage(e))
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    try {
      const endpoint = await unsubscribePush()
      if (endpoint) await days.unregisterPush(endpoint)
      onMessage('この端末の通知を解除しました。')
      await refresh()
    } catch (e) {
      onMessage(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const test = async () => {
    setBusy(true)
    try {
      const r = await days.sendTestPush()
      onMessage(r.sent > 0 ? 'テスト通知を送りました。数秒待っても届かない場合は端末の通知設定を確認してください。' : '送信先がありません。')
    } catch (e) {
      onMessage(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const serverOff = key.data && !key.data.enabled

  return (
    <section className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <div className="flex items-center gap-1 font-medium"><BellRing size={16} aria-hidden /> 通知（Web Push）</div>
      <p className="mt-1 text-xs text-slate-500">予定の開始・終了の確認をこの端末に通知します。通知が来なくても記録は予定どおり残ります（通知は変更するための入口です）。</p>
      {serverOff && <p className="mt-2 text-slate-500">サーバー側で通知が有効になっていません。</p>}
      {!serverOff && status === 'ios-not-installed' && (
        <p className="mt-2 text-slate-600">iPhone / iPad では、Safari の共有メニューから「ホーム画面に追加」し、そのアイコンから開くと通知を使えます（iOS 16.4 以降）。</p>
      )}
      {!serverOff && status === 'unsupported' && <p className="mt-2 text-slate-500">このブラウザは通知に対応していません。</p>}
      {!serverOff && status === 'denied' && (
        <p className="mt-2 text-slate-600">通知がブロックされています。{isIOS() ? 'iOS の設定 > 通知 > WinDays' : 'ブラウザのサイト設定'}で許可してください。</p>
      )}
      {!serverOff && status === 'unsubscribed' && (
        <Button className="mt-2" onClick={enable} disabled={busy || !key.data?.public_key}>この端末で通知を受け取る</Button>
      )}
      {!serverOff && status === 'subscribed' && (
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">この端末で受信中</span>
          <Button variant="secondary" onClick={test} disabled={busy}>テスト送信</Button>
          <Button variant="secondary" onClick={disable} disabled={busy}>解除</Button>
        </div>
      )}
    </section>
  )
}
