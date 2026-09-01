import { route, body, query } from '../_lib/handler'
import { createProject, listProjects } from '@/lib/core/projects'

export const GET = route((ctx, req) => listProjects(ctx, query(req)))
export const POST = route(async (ctx, req) => createProject(ctx, (await body(req)) as never))
