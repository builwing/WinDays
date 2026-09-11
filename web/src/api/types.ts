export type Domain = 'work' | 'life' | 'rest'

export interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  signup_source: string | null
  marketing_opt_in_at: string | null
}

export interface Category {
  id: number
  user_id: number
  name: string
  color: string
  domain: Domain
  sort: number
  archived_at: string | null
}

export type CategoryLite = Pick<Category, 'id' | 'name' | 'color' | 'domain'> & { archived_at?: string | null }

export interface Segment {
  id: number
  user_id: number
  category_id: number
  started_at: string
  ended_at: string | null
  note: string | null
  source: 'tap' | 'manual' | 'plan_copy'
  client_uid: string | null
  category?: CategoryLite
  clip_start?: string
  clip_end?: string
}

export interface SegmentsResponse {
  date: string
  segments: Segment[]
  running: Segment | null
}

export interface CategoryMinutes {
  category_id: number
  name: string
  color: string
  domain: Domain
  minutes: number
}

export interface DashboardBase {
  range: 'day' | 'week'
  domains: Record<Domain, number>
  categories: CategoryMinutes[]
  recorded_minutes: number
  work_ratio: number | null
  history_weeks: number
}

export interface DayDashboard extends DashboardBase {
  range: 'day'
  date: string
}

export interface WeekDay {
  date: string
  domains: Record<Domain, number>
  recorded_minutes: number
}

export interface WeekDashboard extends DashboardBase {
  range: 'week'
  week_start: string
  week_end: string
  days: WeekDay[]
}

export interface PlanLimitError {
  error: 'plan_limit'
  feature: string
  limit: number
  message: string
  upgradeable: boolean
}

export interface Memo {
  id: number
  user_id: number
  segment_id: number | null
  noted_at: string
  body: string
  segment?: { id: number; category?: CategoryLite } | null
}

/** 予定（プラン）。実体は WinTask の個人予定（calendar_events）。 */
export interface Plan {
  id: number
  team_id: number | null
  created_by: number
  days_category_id: number | null
  title: string
  description: string | null
  location: string | null
  starts_at: string
  ends_at: string
  all_day: boolean
  source: string
  is_personal: boolean
  days_category?: CategoryLite | null
  clip_start?: string
  clip_end?: string
  // 繰り返し（WinTask 予定要件定義書 v0.3 §15）
  rrule: string | null                  // マスター行だけ持つ
  recurrence_parent_id: number | null   // 展開済みの回はマスターの id
  original_starts_at: string | null
  is_exception: boolean
  is_master: boolean
  days_auto_track: boolean
  skip_weekends: boolean
  skip_holidays: boolean
  nonworking_action: 'skip' | 'shift' | 'shift_prev'
  next_occurrence_at?: string | null    // GET /days/plans/recurring のみ
}

export type PlanScope = 'this' | 'following' | 'all'

export interface PlansResponse {
  date: string
  plans: Plan[]
}
