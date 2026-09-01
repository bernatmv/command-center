import { paramRoute, body } from '../../_lib/handler'
import { deleteMoney, updateMoney } from '@/lib/core/money'

type P = { id: string }

export const PATCH = paramRoute<P, unknown>(async (ctx, { id }, req) =>
  updateMoney(ctx, id, (await body(req)) as never))
export const DELETE = paramRoute<P, unknown>(async (ctx, { id }) => {
  await deleteMoney(ctx, id)
  return { deleted: id }
})
