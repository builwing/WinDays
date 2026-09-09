import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/api/types'
import { setToken, setUnauthorizedHandler } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  setSession: (user: User, token: string) => void
  setUser: (user: User) => void
  clear: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => {
        setToken(token)
        set({ user, token })
      },
      setUser: (user) => set({ user }),
      clear: () => {
        setToken(null)
        set({ user: null, token: null })
      },
    }),
    {
      name: 'windays.auth',
      onRehydrateStorage: () => (state) => {
        if (state?.token) setToken(state.token)
      },
    },
  ),
)

setUnauthorizedHandler(() => useAuth.getState().clear())
