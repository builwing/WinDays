import { api } from '@/lib/api'
import type { AutoTrackSettings, Category, DayDashboard, DaysNotification, Domain, Memo, Plan, PlanRun, PlanRunAction, PlanRunsResponse, PlanScope, PlansResponse, Segment, SegmentsResponse, WeekDashboard } from './types'

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

// ---- いつでもメモ ----
export async function listMemos(date: string): Promise<Memo[]> {
  const { data } = await api.get<Memo[]>('/days/memos', { params: { date } })
  return data
}

export async function searchMemos(q: string): Promise<Memo[]> {
  const { data } = await api.get<Memo[]>('/days/memos', { params: { q } })
  return data
}

export async function createMemo(input: { body: string; noted_at?: string }): Promise<Memo> {
  const { data } = await api.post<Memo>('/days/memos', input)
  return data
}

export async function updateMemo(id: number, input: Partial<{ body: string; noted_at: string }>): Promise<Memo> {
  const { data } = await api.patch<Memo>(`/days/memos/${id}`, input)
  return data
}

export async function deleteMemo(id: number): Promise<void> {
  await api.delete(`/days/memos/${id}`)
}

// ---- 予定（プラン）= WinTask の個人予定を共用 ----
export interface PlanInput {
  title?: string | null
  days_category_id?: number | null
  starts_at: string
  ends_at: string
  description?: string | null
  rrule?: string | null
  skip_weekends?: boolean
  skip_holidays?: boolean
  nonworking_action?: 'skip' | 'shift' | 'shift_prev'
  days_auto_track?: boolean
}

export async function listPlans(date: string): Promise<PlansResponse> {
  const { data } = await api.get<PlansResponse>('/days/plans', { params: { date } })
  return data
}

export async function createPlan(input: PlanInput): Promise<Plan> {
  const { data } = await api.post<Plan>('/days/plans', input)
  return data
}

/** 展開済みの回を編集するときは scope（this / following / all）で反映範囲を指定する。 */
export async function updatePlan(id: number, input: Partial<PlanInput>, scope: PlanScope = 'this'): Promise<Plan> {
  const { data } = await api.patch<Plan>(`/days/plans/${id}`, { ...input, scope })
  return data
}

export async function deletePlan(id: number, scope: PlanScope = 'this'): Promise<void> {
  await api.delete(`/days/plans/${id}`, { params: { scope } })
}

/** 繰り返し予定（マスター）の一覧。設定画面用。 */
export async function listRecurringPlans(): Promise<Plan[]> {
  const { data } = await api.get<Plan[]>('/days/plans/recurring')
  return data
}

/** この回を今日はスキップ。 */
export async function skipPlan(id: number): Promise<void> {
  await api.post(`/days/plans/${id}/skip`)
}

/** 予定を実績（タイムログ）にコピー。予定にカテゴリが無ければ category_id が必要。 */
export async function copyPlanToActual(id: number, input: { category_id?: number | null } = {}): Promise<Segment> {
  const { data } = await api.post<Segment>(`/days/plans/${id}/copy-to-actual`, input)
  return data
}

// ---- 自動記録（オートトラック）----
export async function listPlanRuns(date: string): Promise<PlanRunsResponse> {
  const { data } = await api.get<PlanRunsResponse>('/days/plan-runs', { params: { date } })
  return data
}

export async function actPlanRun(id: number, action: PlanRunAction, params: { category_id?: number; started_at?: string; minutes?: number } = {}): Promise<PlanRun> {
  const { data } = await api.post<PlanRun>(`/days/plan-runs/${id}/act`, { action, ...params })
  return data
}

export async function getAutoTrackSettings(): Promise<AutoTrackSettings> {
  const { data } = await api.get<AutoTrackSettings>('/days/settings/auto-track')
  return data
}

export async function updateAutoTrackSettings(input: Partial<AutoTrackSettings>): Promise<AutoTrackSettings> {
  const { data } = await api.put<AutoTrackSettings>('/days/settings/auto-track', input)
  return data
}

export async function listNotifications(): Promise<DaysNotification[]> {
  const { data } = await api.get<DaysNotification[]>('/days/notifications')
  return data
}
