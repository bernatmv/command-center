/**
 * Domain vocabulary. The enum arrays here are the single source of truth for
 * every enum in the database — Zod schemas, UI labels, and colours all derive
 * from them, so adding a value means editing one line plus a migration.
 */

export const PHASES = ['idea', 'plan', 'development', 'launch', 'marketing', 'maintenance'] as const
export const STATUSES = ['idea', 'active', 'live', 'paused', 'shipped', 'abandoned'] as const
export const PRIORITIES = ['p0', 'p1', 'p2', 'p3'] as const
export const TASK_STATUSES = ['todo', 'doing', 'blocked', 'done'] as const
export const RESOURCE_KINDS = ['link', 'article', 'video', 'repo', 'design', 'doc', 'other'] as const
export const IDEA_STATUSES = ['inbox', 'kept', 'converted', 'dropped'] as const
export const MONEY_KINDS = ['cost', 'earning'] as const
export const MONEY_CADENCES = ['one_time', 'monthly', 'yearly'] as const
export const LOG_SOURCES = ['ui', 'api', 'mcp'] as const

export type Phase = (typeof PHASES)[number]
export type Status = (typeof STATUSES)[number]
export type Priority = (typeof PRIORITIES)[number]
export type TaskStatus = (typeof TASK_STATUSES)[number]
export type ResourceKind = (typeof RESOURCE_KINDS)[number]
export type IdeaStatus = (typeof IDEA_STATUSES)[number]
export type MoneyKind = (typeof MONEY_KINDS)[number]
export type MoneyCadence = (typeof MONEY_CADENCES)[number]
export type LogSource = (typeof LOG_SOURCES)[number]

/** A project is stale once nothing has touched it for this many days. */
export const STALE_DAYS = 10
/** Past this, it has effectively been forgotten. */
export const VERY_STALE_DAYS = 30

export interface Project {
  id: string
  user_id: string
  slug: string
  name: string
  tagline: string | null
  description: string | null
  phase: Phase
  status: Status
  priority: Priority
  next_action: string | null
  success_score: number | null
  repo_url: string | null
  prod_url: string | null
  target_release_date: string | null
  released_at: string | null
  tags: string[]
  pinned: boolean
  notes: string | null
  /** "owner/name", or null for a planning-stage project with no repo yet. */
  github_repo: string | null
  /** Last push to the repo. Counts as activity alongside in-app edits. */
  last_commit_at: string | null
  github_synced_at: string | null
  /** Whether this project's tasks mirror to GitHub issues. */
  sync_issues: boolean
  last_touched_at: string
  archived_at: string | null
  created_at: string
  updated_at: string
}

/** `projects` plus the aggregates the dashboard table needs, from the SQL view. */
export interface ProjectOverview extends Project {
  /** The later of last_touched_at and last_commit_at — what days_stale counts from. */
  last_activity_at: string
  open_tasks: number
  total_tasks: number
  overdue_tasks: number
  monthly_earnings_cents: number
  monthly_cost_cents: number
  one_time_earnings_cents: number
  idea_count: number
  resource_count: number
  days_stale: number
}

export interface Task {
  id: string
  user_id: string
  project_id: string
  title: string
  status: TaskStatus
  priority: Priority
  due_date: string | null
  done_at: string | null
  position: number
  github_issue_number: number | null
  github_url: string | null
  created_at: string
  updated_at: string
}

export interface Idea {
  id: string
  user_id: string
  project_id: string | null
  title: string
  body: string | null
  status: IdeaStatus
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  user_id: string
  project_id: string | null
  kind: ResourceKind
  title: string
  url: string
  note: string | null
  created_at: string
  updated_at: string
}

export interface MoneyEntry {
  id: string
  user_id: string
  project_id: string
  kind: MoneyKind
  label: string
  amount_cents: number
  currency: string
  cadence: MoneyCadence
  occurred_on: string
  created_at: string
  updated_at: string
}

export interface LogEntry {
  id: string
  user_id: string
  project_id: string
  body: string
  source: LogSource
  created_at: string
}

export interface ApiToken {
  id: string
  user_id: string
  name: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

/** Everything on a project detail page, in one payload. */
export interface ProjectDetail {
  project: ProjectOverview
  tasks: Task[]
  ideas: Idea[]
  resources: Resource[]
  money: MoneyEntry[]
  log: LogEntry[]
}
