import { route, body, query } from '../_lib/handler'
import { listMoney, recordMoney } from '@/lib/core/money'

export const GET = route((ctx, req) => listMoney(ctx, query(req).project_id as string | undefined))
export const POST = route(async (ctx, req) => recordMoney(ctx, (await body(req)) as never))
