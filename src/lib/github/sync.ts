import { shape, type Ctx } from '@/lib/core/context'
import { slugify } from '@/lib/schemas'
import type { Project, Task } from '@/lib/types'
import { humanizeRepoName, listActiveRepos, listIssues, type GhIssue, type GhRepo } from './client'

export interface SyncReport {
  ran_at: string
  repos_seen: number
  projects_created: string[]
  projects_updated: number
  tasks_created: number
  tasks_closed: number
  tasks_reopened: number
  errors: string[]
}

/** Repos pushed within this window are considered live enough to track. */
export const ACTIVE_WINDOW_DAYS = 90

/**
 * Pull GitHub into the board: repos become projects, issues become tasks.
 *
 * Deliberately never writes `last_touched_at`. That column means "you did
 * something", and a scheduled job running hourly would otherwise make every
 * project look permanently fresh and destroy the staleness signal. Repo
 * activity lands in `last_commit_at`, and the view takes the later of the two.
 */
export async function syncGitHub(ctx: Ctx, days = ACTIVE_WINDOW_DAYS): Promise<SyncReport> {
  const report: SyncReport = {
    ran_at: new Date().toISOString(),
    repos_seen: 0, projects_created: [], projects_updated: 0,
    tasks_created: 0, tasks_closed: 0, tasks_reopened: 0, errors: [],
  }

  // Forks aren't the user's projects.
  const repos = (await listActiveRepos(days)).filter((r) => !r.isFork)
  report.repos_seen = repos.length

  const { data: existingRows } = await ctx.db
    .from('projects').select('*').eq('user_id', ctx.userId).not('github_repo', 'is', null)
  const existing = new Map(
    shape<Project[]>(existingRows ?? []).map((p) => [p.github_repo as string, p]),
  )

  for (const repo of repos) {
    try {
      const project = existing.get(repo.nameWithOwner)
      if (project) {
        await updateFromRepo(ctx, project, repo)
        report.projects_updated++
      } else {
        const created = await createFromRepo(ctx, repo)
        existing.set(repo.nameWithOwner, created)
        report.projects_created.push(created.slug)
      }
    } catch (error) {
      report.errors.push(`${repo.nameWithOwner}: ${(error as Error).message}`)
    }
  }

  await syncIssues(ctx, repos, existing, report)
  return report
}

// ------------------------------------------------------------------ projects

async function createFromRepo(ctx: Ctx, repo: GhRepo): Promise<Project> {
  // A published homepage is decent evidence the thing actually shipped.
  const shipped = Boolean(repo.homepageUrl)

  const { data } = await ctx.db.from('projects').insert({
    user_id: ctx.userId,
    slug: slugify(repo.name),
    name: humanizeRepoName(repo.name),
    tagline: repo.description,
    github_repo: repo.nameWithOwner,
    repo_url: repo.url,
    prod_url: repo.homepageUrl || null,
    phase: shipped ? 'launch' : 'development',
    status: repo.isArchived ? 'paused' : shipped ? 'live' : 'active',
    priority: 'p2',
    last_commit_at: repo.pushedAt,
    // Imported projects start at their real activity time, not "now", so a repo
    // last touched months ago shows up stale immediately.
    last_touched_at: repo.pushedAt,
  }).select().single()

  return shape<Project>(data)
}

async function updateFromRepo(ctx: Ctx, project: Project, repo: GhRepo) {
  // Only fill gaps — never overwrite something edited by hand on the board.
  const patch: Record<string, unknown> = { last_commit_at: repo.pushedAt }
  if (!project.repo_url) patch.repo_url = repo.url
  if (!project.prod_url && repo.homepageUrl) patch.prod_url = repo.homepageUrl
  if (!project.tagline && repo.description) patch.tagline = repo.description

  await ctx.db.from('projects').update(patch).eq('id', project.id).eq('user_id', ctx.userId)
}

// --------------------------------------------------------------------- issues

async function syncIssues(
  ctx: Ctx, repos: GhRepo[], projects: Map<string, Project>, report: SyncReport,
) {
  // Existing links tell us which repos to check even when they have no open
  // issues left — that is how a task learns its issue was closed on GitHub.
  const { data: linkedRows } = await ctx.db
    .from('tasks').select('*').eq('user_id', ctx.userId).not('github_issue_number', 'is', null)
  const linked = shape<Task[]>(linkedRows ?? [])
  const projectsWithLinks = new Set(linked.map((t) => t.project_id))

  for (const repo of repos) {
    const project = projects.get(repo.nameWithOwner)
    if (!project || !project.sync_issues) continue
    if (repo.openIssueCount === 0 && !projectsWithLinks.has(project.id)) continue

    try {
      // Take the watermark before the request, so issues updated mid-pull are
      // caught next time rather than skipped.
      const watermark = new Date().toISOString()
      const issues = await listIssues(repo.nameWithOwner, project.github_synced_at ?? undefined)
      const byNumber = new Map(
        linked.filter((t) => t.project_id === project.id).map((t) => [t.github_issue_number as number, t]),
      )

      for (const issue of issues) {
        const task = byNumber.get(issue.number)
        if (task) await reconcile(ctx, task, issue, report)
        else if (issue.state === 'open') await taskFromIssue(ctx, project, issue, report)
      }

      // Only now is the project genuinely synced up to this point. Stamping it
      // any earlier makes the very first pull ask for issues "since now" and
      // silently import nothing.
      await ctx.db.from('projects').update({ github_synced_at: watermark })
        .eq('id', project.id).eq('user_id', ctx.userId)
    } catch (error) {
      report.errors.push(`${repo.nameWithOwner} issues: ${(error as Error).message}`)
    }
  }
}

async function taskFromIssue(ctx: Ctx, project: Project, issue: GhIssue, report: SyncReport) {
  await ctx.db.from('tasks').insert({
    user_id: ctx.userId,
    project_id: project.id,
    title: issue.title,
    status: 'todo',
    github_issue_number: issue.number,
    github_url: issue.html_url,
  })
  report.tasks_created++
}

/**
 * GitHub wins on a pull. The app pushes its own changes at the moment they
 * happen, so by the time a sync runs, anything different on GitHub is news.
 */
async function reconcile(ctx: Ctx, task: Task, issue: GhIssue, report: SyncReport) {
  const patch: Record<string, unknown> = {}

  if (issue.state === 'closed' && task.status !== 'done') {
    patch.status = 'done'
    patch.done_at = new Date().toISOString()
    report.tasks_closed++
  } else if (issue.state === 'open' && task.status === 'done') {
    patch.status = 'todo'
    patch.done_at = null
    report.tasks_reopened++
  }
  if (issue.title !== task.title) patch.title = issue.title

  if (Object.keys(patch).length > 0) {
    await ctx.db.from('tasks').update(patch).eq('id', task.id).eq('user_id', ctx.userId)
  }
}
