import { paramRoute, body } from '../../_lib/handler'
import { deleteIdea, updateIdea } from '@/lib/core/ideas'

type P = { id: string }

export const PATCH = paramRoute<P, unknown>(async (ctx, { id }, req) =>
  updateIdea(ctx, id, (await body(req)) as never))
export const DELETE = paramRoute<P, unknown>(async (ctx, { id }) => {
  await deleteIdea(ctx, id)
  return { deleted: id }
})
