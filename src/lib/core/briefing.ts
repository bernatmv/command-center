import { PRIORITIES, STALE_DAYS, VERY_STALE_DAYS, type Priority, type ProjectOverview } from '@/lib/types'
import type { Ctx } from './context'
import { listProjects } from './projects'
import { listTasks } from './tasks'
import { listIdeas } from './ideas'
import { listResources } from './resources'

export interface Briefing {
  generated_at: string
  totals: {
    active_projects: number
    stale_projects: number
    very_stale_projects: number
    open_tasks: number
    overdue_tasks: number
    monthly_earnings_cents: number
    monthly_cost_cents: number
    inbox_items: number
  }
  focus: { slug: string; name: string; priority: Priority; phase: string; next_action: string | null; reason: string }[]
  stale: { slug: string; name: string; days_stale: number; phase: string; priority: Priority }[]
  overdue: { title: string; project: string; due_date: string | null }[]
}

const PRIORITY_WEIGHT: Record<Priority, number> = { p0: 40, p1: 25, p2: 12, p3: 5 }

/**
 * Score = how much this project deserves attention right now.
 *
 * Deliberately simple and explainable: importance, plus neglect, plus overdue
 * work. Staleness is capped so a long-abandoned p3 can never outrank a p0.
 */
function score(p: ProjectOverview) {
  return PRIORITY_WEIGHT[p.priority] + Math.min(p.days_stale, 30) + p.overdue_tasks * 6
}

function reasonFor(p: ProjectOverview): string {
  if (p.overdue_tasks > 0) return `${p.overdue_tasks} overdue task${p.overdue_tasks > 1 ? 's' : ''}`
  if (p.days_stale >= VERY_STALE_DAYS) return `untouched for ${p.days_stale} days`
  if (p.days_stale >= STALE_DAYS) return `going quiet — ${p.days_stale} days`
  if (p.priority === 'p0') return 'top priority'
  return `${p.priority.toUpperCase()} · ${p.phase}`
}

/**
 * The anti-forgetting digest. Powers both the dashboard summary strip and the
 * `portfolio_briefing` MCP tool, so what Claude sees matches what you see.
 */
export async function portfolioBriefing(ctx: Ctx, limit = 5): Promise<Briefing> {
  const [projects, overdueTasks, openTasks, inboxIdeas, inboxResources] = await Promise.all([
    listProjects(ctx),
    listTasks(ctx, { overdueOnly: true }),
    listTasks(ctx, { openOnly: true }),
    listIdeas(ctx, { inboxOnly: true }),
    listResources(ctx, { inboxOnly: true }),
  ])

  const live = projects.filter((p) => !['abandoned', 'paused'].includes(p.status))
  const byName = new Map(projects.map((p) => [p.id, p.name]))

  const ranked = [...live].sort((a, b) => score(b) - score(a))

  return {
    generated_at: new Date().toISOString(),
    totals: {
      active_projects: live.length,
      stale_projects: live.filter((p) => p.days_stale >= STALE_DAYS).length,
      very_stale_projects: live.filter((p) => p.days_stale >= VERY_STALE_DAYS).length,
      open_tasks: openTasks.length,
      overdue_tasks: overdueTasks.length,
      monthly_earnings_cents: projects.reduce((s, p) => s + Number(p.monthly_earnings_cents), 0),
      monthly_cost_cents: projects.reduce((s, p) => s + Number(p.monthly_cost_cents), 0),
      inbox_items: inboxIdeas.length + inboxResources.length,
    },
    focus: ranked.slice(0, limit).map((p) => ({
      slug: p.slug, name: p.name, priority: p.priority, phase: p.phase,
      next_action: p.next_action, reason: reasonFor(p),
    })),
    stale: live
      .filter((p) => p.days_stale >= STALE_DAYS)
      .sort((a, b) => b.days_stale - a.days_stale)
      .slice(0, 10)
      .map((p) => ({ slug: p.slug, name: p.name, days_stale: p.days_stale, phase: p.phase, priority: p.priority })),
    overdue: overdueTasks.slice(0, 10).map((t) => ({
      title: t.title, project: byName.get(t.project_id) ?? 'unknown', due_date: t.due_date,
    })),
  }
}

export { PRIORITIES }
