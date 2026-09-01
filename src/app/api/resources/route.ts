import { route, body, query } from '../_lib/handler'
import { captureResource, listResources } from '@/lib/core/resources'

export const GET = route((ctx, req) => {
  const q = query(req)
  return listResources(ctx, { projectId: q.project_id as string | undefined, inboxOnly: q.inbox === true })
})
export const POST = route(async (ctx, req) => captureResource(ctx, (await body(req)) as never))
