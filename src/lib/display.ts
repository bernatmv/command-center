import { STALE_DAYS, VERY_STALE_DAYS, type MoneyCadence, type Phase, type Priority, type ResourceKind, type Status, type TaskStatus } from './types'

/** Short, uppercase labels — the table has no room for prose. */
export const PHASE_LABEL: Record<Phase, string> = {
  idea: 'IDEA', plan: 'PLAN', development: 'DEV',
  launch: 'LAUNCH', marketing: 'MARKET', maintenance: 'MAINT',
}

export const PHASE_COLOR: Record<Phase, string> = {
  idea: 'text-faint', plan: 'text-violet', development: 'text-info',
  launch: 'text-cyan', marketing: 'text-warn', maintenance: 'text-ok',
}

export const STATUS_LABEL: Record<Status, string> = {
  idea: 'idea', active: 'active', live: 'live',
  paused: 'paused', shipped: 'shipped', abandoned: 'abandoned',
}

export const STATUS_DOT: Record<Status, string> = {
  idea: 'bg-faint', active: 'bg-info pulse', live: 'bg-ok',
  paused: 'bg-warn', shipped: 'bg-violet', abandoned: 'bg-faint/40',
}

export const PRIORITY_LABEL: Record<Priority, string> = { p0: 'P0', p1: 'P1', p2: 'P2', p3: 'P3' }

export const PRIORITY_COLOR: Record<Priority, string> = {
  p0: 'text-danger border-danger/40 bg-danger/10',
  p1: 'text-warn border-warn/40 bg-warn/10',
  p2: 'text-info border-info/30 bg-info/10',
  p3: 'text-faint border-line-strong bg-panel-2',
}

export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  todo: 'text-muted', doing: 'text-info', blocked: 'text-danger', done: 'text-faint line-through',
}

export const RESOURCE_KIND_LABEL: Record<ResourceKind, string> = {
  link: 'link', article: 'article', video: 'video', repo: 'repo',
  design: 'design', doc: 'doc', other: 'other',
}

export const CADENCE_LABEL: Record<MoneyCadence, string> = {
  one_time: 'one-off', monthly: '/mo', yearly: '/yr',
}

/** Compact money: $340, $1.2k, $12.5k — never wider than the column. */
export function formatMoney(cents: number, currency = 'USD'): string {
  const value = Number(cents) / 100
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `
  const abs = Math.abs(value)
  const body =
    abs >= 10_000 ? `${(value / 1000).toFixed(1)}k`
    : abs >= 1000 ? `${(value / 1000).toFixed(2)}k`
    : abs % 1 === 0 ? value.toFixed(0)
    : value.toFixed(2)
  return `${symbol}${body}`
}

/** Escalating treatment for neglect — the whole point of the dashboard. */
export function staleTone(days: number) {
  if (days >= VERY_STALE_DAYS) return { className: 'text-danger', warn: true as const }
  if (days >= STALE_DAYS) return { className: 'text-warn', warn: true as const }
  if (days <= 1) return { className: 'text-muted', warn: false as const }
  return { className: 'text-muted', warn: false as const }
}

export const formatStale = (days: number) => (days < 1 ? 'today' : `${days}d`)

export function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-CA')
}
