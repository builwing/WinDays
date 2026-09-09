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
