import { create } from 'zustand'
import type { Memo } from '@/api/types'

/** どの画面からでも開ける「いつでもメモ」シートの状態。 */
interface MemoSheetState {
  open: boolean
  memo: Memo | null // 編集対象（null なら新規）
  openNew: () => void
  openEdit: (memo: Memo) => void
  close: () => void
}

export const useMemoSheet = create<MemoSheetState>((set) => ({
  open: false,
  memo: null,
  openNew: () => set({ open: true, memo: null }),
  openEdit: (memo) => set({ open: true, memo }),
  close: () => set({ open: false, memo: null }),
}))
