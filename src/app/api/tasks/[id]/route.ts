import { paramRoute, body } from '../../_lib/handler'
import { deleteTask, updateTask } from '@/lib/core/tasks'

type P = { id: string }

export const PATCH = paramRoute<P, unknown>(async (ctx, { id }, req) =>
  updateTask(ctx, id, (await body(req)) as never))
export const DELETE = paramRoute<P, unknown>(async (ctx, { id }) => {
  await deleteTask(ctx, id)
  return { deleted: id }
})
