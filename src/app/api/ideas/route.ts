import { route, body, query } from '../_lib/handler'
import { captureIdea, listIdeas } from '@/lib/core/ideas'

export const GET = route((ctx, req) => {
  const q = query(req)
  return listIdeas(ctx, { projectId: q.project_id as string | undefined, inboxOnly: q.inbox === true })
})
export const POST = route(async (ctx, req) => captureIdea(ctx, (await body(req)) as never))
