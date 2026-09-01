import { shape, type Ctx } from '@/lib/core/context'
import type { Task } from '@/lib/types'
import { commentOnIssue, createIssue, setIssueState, setIssueTitle } from './client'

/**
 * The app → GitHub direction of the sync.
 *
 * Nothing here is allowed to throw at its caller: a task edit must succeed even
 * if GitHub is down or the token has expired. Failures are recorded on the
 * project's activity log, where they're visible without being destructive.
 */

interface Target { repo: string; projectId: string }

/** The repo a task should mirror to, or null if the project isn't syncing. */
async function targetFor(ctx: Ctx, projectId: string): Promise<Target | null> {
  const { data } = await ctx.db
    .from('projects').select('id,github_repo,sync_issues')
    .eq('id', projectId).eq('user_id', ctx.userId).maybeSingle()

  if (!data) return null
  const project = shape<{ id: string; github_repo: string | null; sync_issues: boolean }>(data)
  if (!project.github_repo || !project.sync_issues) return null
  return { repo: project.github_repo, projectId: project.id }
}

async function attempt(ctx: Ctx, projectId: string, what: string, fn: () => Promise<void>) {
  try {
    await fn()
  } catch (error) {
    await ctx.db.from('project_log').insert({
      user_id: ctx.userId,
      project_id: projectId,
      body: `GitHub sync failed (${what}): ${(error as Error).message}`.slice(0, 2000),
      source: ctx.source,
    })
  }
}

/** Mirror a new task as an issue and link it back. */
export async function pushTaskCreated(ctx: Ctx, task: Task): Promise<Task> {
  const target = await targetFor(ctx, task.project_id)
  if (!target || task.github_issue_number) return task

  let linked = task
  await attempt(ctx, task.project_id, 'create issue', async () => {
    const issue = await createIssue(
      target.repo, task.title,
      'Opened from Command Center.',
    )
    const { data } = await ctx.db.from('tasks')
      .update({ github_issue_number: issue.number, github_url: issue.html_url })
      .eq('id', task.id).eq('user_id', ctx.userId).select().single()
    if (data) linked = shape<Task>(data)
  })
  return linked
}

export async function pushTaskStatus(ctx: Ctx, task: Task, done: boolean) {
  if (!task.github_issue_number) return
  const target = await targetFor(ctx, task.project_id)
  if (!target) return

  await attempt(ctx, task.project_id, done ? 'close issue' : 'reopen issue', () =>
    setIssueState(target.repo, task.github_issue_number!, done ? 'closed' : 'open').then(() => undefined),
  )
}

export async function pushTaskTitle(ctx: Ctx, task: Task, title: string) {
  if (!task.github_issue_number) return
  const target = await targetFor(ctx, task.project_id)
  if (!target) return

  await attempt(ctx, task.project_id, 'rename issue', () =>
    setIssueTitle(target.repo, task.github_issue_number!, title).then(() => undefined),
  )
}

/**
 * A deleted task closes its issue with a note. GitHub can only truly delete an
 * issue via an admin-only mutation that destroys history, so closing with an
 * explanation is both reversible and less surprising to read later.
 */
export async function pushTaskDeleted(ctx: Ctx, task: Task) {
  if (!task.github_issue_number) return
  const target = await targetFor(ctx, task.project_id)
  if (!target) return

  await attempt(ctx, task.project_id, 'close deleted issue', async () => {
    await commentOnIssue(
      target.repo, task.github_issue_number!,
      'Closing: this task was removed from Command Center.',
    )
    await setIssueState(target.repo, task.github_issue_number!, 'closed')
  })
}
