import { logCreateSchema } from '@/lib/schemas'
import type { Ctx } from './context'
import { touchProject } from './touch'

/** Record what happened on a project — and mark it worked on. */
export async function logUpdate(ctx: Ctx, input: { project_id: string; body: string }) {
  const v = logCreateSchema.parse(input)
  await touchProject(ctx, v.project_id, v.body)
  return { ok: true as const }
}
