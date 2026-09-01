import { route, body, query } from '../_lib/handler'
import { addTask, listTasks } from '@/lib/core/tasks'

export const GET = route((ctx, req) => {
  const q = query(req)
  return listTasks(ctx, {
    projectId: q.project_id as string | undefined,
    openOnly: q.open === true,
    overdueOnly: q.overdue === true,
  })
})
export const POST = route(async (ctx, req) => addTask(ctx, (await body(req)) as never))
