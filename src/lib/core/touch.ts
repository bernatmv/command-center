import type { Ctx } from './context'

/**
 * Mark a project as worked on, and optionally say what happened.
 *
 * Every mutation in core funnels through here. That is what makes the
 * staleness column on the dashboard mean something: if a project's number is
 * high, nothing at all has happened to it — through any surface.
 */
export async function touchProject(ctx: Ctx, projectId: string, logBody?: string) {
  await ctx.db
    .from('projects')
    .update({ last_touched_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', ctx.userId)

  if (logBody) {
    await ctx.db.from('project_log').insert({
      user_id: ctx.userId,
      project_id: projectId,
      body: logBody,
      source: ctx.source,
    })
  }
}
