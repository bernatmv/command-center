import { ideaCreateSchema, ideaUpdateSchema } from '@/lib/schemas'
import type { IdeaCreate, IdeaUpdate } from '@/lib/schemas'
import type { Idea, Task } from '@/lib/types'
import { CoreError, unwrap, type Ctx } from './context'
import { touchProject } from './touch'
import { addTask } from './tasks'

export async function listIdeas(
  ctx: Ctx,
  opts: { projectId?: string; inboxOnly?: boolean } = {},
): Promise<Idea[]> {
  let q = ctx.db.from('ideas').select('*').eq('user_id', ctx.userId)
  if (opts.projectId) q = q.eq('project_id', opts.projectId)
  // The inbox is everything captured without a home, still awaiting triage.
  if (opts.inboxOnly) q = q.is('project_id', null).eq('status', 'inbox')
  return unwrap(await q.order('created_at', { ascending: false })) as Idea[]
}

export async function captureIdea(ctx: Ctx, input: IdeaCreate): Promise<Idea> {
  const v = ideaCreateSchema.parse(input)
  const idea = unwrap(
    await ctx.db.from('ideas').insert({ ...v, user_id: ctx.userId }).select().single(),
  ) as Idea
  if (idea.project_id) await touchProject(ctx, idea.project_id, `Idea captured: ${idea.title}`)
  return idea
}

export async function updateIdea(ctx: Ctx, id: string, input: IdeaUpdate): Promise<Idea> {
  const v = ideaUpdateSchema.parse(input)
  const idea = unwrap(
    await ctx.db.from('ideas').update(v).eq('id', id).eq('user_id', ctx.userId).select().single(),
  ) as Idea
  if (idea.project_id) await touchProject(ctx, idea.project_id)
  return idea
}

/** Triage move: an inbox idea becomes a real task on a project. */
export async function convertIdeaToTask(ctx: Ctx, id: string, projectId: string): Promise<Task> {
  const idea = unwrap(
    await ctx.db.from('ideas').select('*').eq('id', id).eq('user_id', ctx.userId).single(),
  ) as Idea
  const task = await addTask(ctx, { project_id: projectId, title: idea.title })
  await ctx.db.from('ideas').update({ status: 'converted', project_id: projectId })
    .eq('id', id).eq('user_id', ctx.userId)
  return task
}

export async function deleteIdea(ctx: Ctx, id: string): Promise<void> {
  const { error } = await ctx.db.from('ideas').delete().eq('id', id).eq('user_id', ctx.userId)
  if (error) throw new CoreError(error.message, 500)
}
