import { taskCreateSchema, taskUpdateSchema } from '@/lib/schemas'
import type { TaskCreate, TaskUpdate } from '@/lib/schemas'
import type { Task } from '@/lib/types'
import { pushTaskCreated, pushTaskDeleted, pushTaskStatus, pushTaskTitle } from '@/lib/github/push'
import { CoreError, shape, unwrap, type Ctx } from './context'
import { touchProject } from './touch'

export async function listTasks(
  ctx: Ctx,
  opts: { projectId?: string; openOnly?: boolean; overdueOnly?: boolean } = {},
): Promise<Task[]> {
  let q = ctx.db.from('tasks').select('*').eq('user_id', ctx.userId)
  if (opts.projectId) q = q.eq('project_id', opts.projectId)
  if (opts.openOnly || opts.overdueOnly) q = q.neq('status', 'done')
  if (opts.overdueOnly) q = q.lt('due_date', new Date().toISOString().slice(0, 10))
  return unwrap(await q.order('priority').order('due_date', { nullsFirst: false })) as Task[]
}

export async function addTask(ctx: Ctx, input: TaskCreate): Promise<Task> {
  const v = taskCreateSchema.parse(input)
  const task = unwrap(
    await ctx.db.from('tasks').insert({ ...v, user_id: ctx.userId }).select().single(),
  ) as Task
  await touchProject(ctx, task.project_id, `Task added: ${task.title}`)
  // Mirrors to a GitHub issue when the project has a repo and syncing is on.
  return pushTaskCreated(ctx, task)
}

export async function updateTask(ctx: Ctx, id: string, input: TaskUpdate): Promise<Task> {
  const v = taskUpdateSchema.parse(input)
  const before = shape<Task>(
    unwrap(await ctx.db.from('tasks').select('*').eq('id', id).eq('user_id', ctx.userId).single()),
  )

  // done_at tracks the status column so "when did I finish this" is never guesswork.
  const patch: Record<string, unknown> = { ...v }
  if (v.status !== undefined) patch.done_at = v.status === 'done' ? new Date().toISOString() : null

  const task = unwrap(
    await ctx.db.from('tasks').update(patch).eq('id', id).eq('user_id', ctx.userId).select().single(),
  ) as Task
  await touchProject(ctx, task.project_id, v.status === 'done' ? `Task done: ${task.title}` : undefined)

  // Only push what actually changed, so a rename doesn't reopen a closed issue.
  const wasDone = before.status === 'done'
  const isDone = task.status === 'done'
  if (wasDone !== isDone) await pushTaskStatus(ctx, task, isDone)
  if (v.title !== undefined && v.title !== before.title) await pushTaskTitle(ctx, task, task.title)

  return task
}

export async function completeTask(ctx: Ctx, id: string): Promise<Task> {
  return updateTask(ctx, id, { status: 'done' })
}

export async function deleteTask(ctx: Ctx, id: string): Promise<void> {
  const { data } = await ctx.db.from('tasks').select('*').eq('id', id).eq('user_id', ctx.userId).maybeSingle()
  // Close the issue before the link is gone.
  if (data) await pushTaskDeleted(ctx, shape<Task>(data))

  const { error } = await ctx.db.from('tasks').delete().eq('id', id).eq('user_id', ctx.userId)
  if (error) throw new CoreError(error.message, 500)
}
