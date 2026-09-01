import { taskCreateSchema, taskUpdateSchema } from '@/lib/schemas'
import type { TaskCreate, TaskUpdate } from '@/lib/schemas'
import type { Task } from '@/lib/types'
import { CoreError, unwrap, type Ctx } from './context'
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
  return task
}

export async function updateTask(ctx: Ctx, id: string, input: TaskUpdate): Promise<Task> {
  const v = taskUpdateSchema.parse(input)

  // done_at tracks the status column so "when did I finish this" is never guesswork.
  const patch: Record<string, unknown> = { ...v }
  if (v.status !== undefined) patch.done_at = v.status === 'done' ? new Date().toISOString() : null

  const task = unwrap(
    await ctx.db.from('tasks').update(patch).eq('id', id).eq('user_id', ctx.userId).select().single(),
  ) as Task
  await touchProject(ctx, task.project_id, v.status === 'done' ? `Task done: ${task.title}` : undefined)
  return task
}

export async function completeTask(ctx: Ctx, id: string): Promise<Task> {
  return updateTask(ctx, id, { status: 'done' })
}

export async function deleteTask(ctx: Ctx, id: string): Promise<void> {
  const { error } = await ctx.db.from('tasks').delete().eq('id', id).eq('user_id', ctx.userId)
  if (error) throw new CoreError(error.message, 500)
}
