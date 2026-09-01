import { paramRoute, body } from '../../_lib/handler'
import { deleteProject, getProject, updateProject } from '@/lib/core/projects'

type P = { slug: string }

export const GET = paramRoute<P, unknown>((ctx, { slug }) => getProject(ctx, slug))
export const PATCH = paramRoute<P, unknown>(async (ctx, { slug }, req) =>
  updateProject(ctx, slug, (await body(req)) as never))
export const DELETE = paramRoute<P, unknown>(async (ctx, { slug }) => {
  await deleteProject(ctx, slug)
  return { deleted: slug }
})
