import { api } from '@/lib/api'
import type { Category, DayDashboard, Domain, Segment, SegmentsResponse, WeekDashboard } from './types'

// ---- カテゴリ ----
export async function listCategories(archived = false): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/days/categories', { params: archived ? { archived: 1 } : {} })
  return data
}

export async function createCategory(input: { name: string; color: string; domain: Domain }): Promise<Category> {
  const { data } = await api.post<Category>('/days/categories', input)
  return data
}

export async function updateCategory(id: number, input: Partial<{ name: string; color: string; domain: Domain }>): Promise<Category> {
  const { data } = await api.patch<Category>(`/days/categories/${id}`, input)
  return data
}

export async function deleteCategory(id: number): Promise<{ archived: boolean }> {
  const res = await api.delete(`/days/categories/${id}`)
  return res.status === 204 ? { archived: false } : { archived: true }
}

export async function restoreCategory(id: number): Promise<Category> {
  const { data } = await api.post<Category>(`/days/categories/${id}/restore`)
  return data
}

export async function reorderCategories(ids: number[]): Promise<Category[]> {
  const { data } = await api.post<Category[]>('/days/categories/reorder', { ids })
  return data
}

// ---- タイムログ ----
export async function listSegments(date: string): Promise<SegmentsResponse> {
  const { data } = await api.get<SegmentsResponse>('/days/segments', { params: { date } })
  return data
}

export async function startSegment(category_id: number): Promise<Segment> {
  const { data } = await api.post<Segment>('/days/segments', { category_id })
  return data
}

export async function stopSegment(id: number): Promise<Segment> {
  const { data } = await api.post<Segment>(`/days/segments/${id}/stop`)
  return data
}

export async function createSegment(input: {
  category_id: number
  started_at: string
  ended_at: string
  note?: string | null
  client_uid?: string
}): Promise<Segment> {
  const { data } = await api.post<Segment>('/days/segments', input)
  return data
}

export async function updateSegment(
  id: number,
  input: Partial<{ category_id: number; started_at: string; ended_at: string | null; note: string | null }>,
): Promise<Segment> {
  const { data } = await api.patch<Segment>(`/days/segments/${id}`, input)
  return data
}

export async function deleteSegment(id: number): Promise<void> {
  await api.delete(`/days/segments/${id}`)
}

// ---- ダッシュボード ----
export async function getDayDashboard(date: string): Promise<DayDashboard> {
  const { data } = await api.get<DayDashboard>('/days/dashboard', { params: { range: 'day', date } })
  return data
}

export async function getWeekDashboard(date: string): Promise<WeekDashboard> {
  const { data } = await api.get<WeekDashboard>('/days/dashboard', { params: { range: 'week', date } })
  return data
}

// ---- 計測 ----
export function funnel(name: string, props?: Record<string, unknown>): void {
  // 失敗しても UI に影響させない
  api.post('/days/funnel', { name, props }).catch(() => undefined)
}
