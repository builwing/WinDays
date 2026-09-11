export type Domain = 'work' | 'life' | 'rest'

export interface User {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  signup_source: string | null
  marketing_opt_in_at: string | null
  days_onboarded_at?: string | null
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
  source: 'tap' | 'manual' | 'plan_copy' | 'auto'
  plan_id?: number | null
  edited_at?: string | null
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

// ---- 自動記録（オートトラック）----
export type PlanRunState = 'pending' | 'starting' | 'started' | 'ending' | 'extended' | 'ended' | 'skipped' | 'changed'
export type PlanRunAction = 'ok' | 'change' | 'shift' | 'skip' | 'resume_previous' | 'continue' | 'extend' | 'stop_now'

export interface PlanRun {
  id: number
  calendar_event_id: number
  user_id: number
  segment_id: number | null
  previous_segment_id: number | null
  state: PlanRunState
  grace_until: string | null
  extended_until: string | null
  start_notified_at: string | null
  end_notified_at: string | null
  acknowledged_at: string | null
  resolved_at: string | null
  resolved_by: 'auto' | 'user' | null
  plan?: { id: number; title: string; starts_at: string; ends_at: string; days_category_id: number | null; days_category?: CategoryLite | null }
  segment?: Pick<Segment, 'id' | 'category_id' | 'started_at' | 'ended_at' | 'source'> | null
  previous_segment?: Pick<Segment, 'id' | 'category_id' | 'started_at' | 'ended_at'> | null
}

export interface AutoTrackSettings {
  auto_track: boolean
  grace_minutes: number
  paused_today: boolean
}

export interface PlanRunsResponse {
  date: string
  runs: PlanRun[]
  cards: PlanRun[]
  settings: AutoTrackSettings
}

export interface DaysNotification {
  id: number
  kind: 'start' | 'end' | 'switch' | 'overrun' | 'morning' | 'reminder'
  title: string
  body: string | null
  sent_at: string
  read_at: string | null
  acted_at: string | null
  action: string | null
}

export interface PushPublicKey {
  enabled: boolean
  public_key: string | null
}

export interface PushSubscriptionInfo {
  id: number
  kind: string
  user_agent: string | null
  last_used_at: string | null
  failed_at: string | null
  created_at: string
}
