import { paramRoute, body } from '../../_lib/handler'
import { deleteResource, updateResource } from '@/lib/core/resources'

type P = { id: string }

export const PATCH = paramRoute<P, unknown>(async (ctx, { id }, req) =>
  updateResource(ctx, id, (await body(req)) as never))
export const DELETE = paramRoute<P, unknown>(async (ctx, { id }) => {
  await deleteResource(ctx, id)
  return { deleted: id }
})
