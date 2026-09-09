import { api } from '@/lib/api'
import type { User } from './types'

export interface AuthResponse {
  user: User
  token: string
}

export async function register(input: {
  name: string
  email: string
  password: string
  password_confirmation: string
  marketing_opt_in: boolean
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/register', { ...input, client: 'days' })
  return data
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/login', { email, password })
  return data
}

export async function logout(): Promise<void> {
  await api.post('/logout')
}

export async function me(): Promise<User> {
  const { data } = await api.get<User>('/me')
  return data
}

export async function resendVerification(): Promise<string> {
  const { data } = await api.post<{ message: string }>('/email/verification-notification')
  return data.message
}

export async function deleteAccount(password: string): Promise<void> {
  await api.delete('/me', { data: { password } })
}

/** WinTask へ遷移するためのワンタイムコード */
export async function handoffCode(): Promise<string> {
  const { data } = await api.post<{ code: string }>('/auth/handoff')
  return data.code
}
