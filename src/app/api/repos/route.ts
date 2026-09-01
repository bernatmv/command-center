import { route, body } from '../_lib/handler'
import { listOnboardableRepos, onboardRepos } from '@/lib/core/repos'

export const maxDuration = 120

/** Repos on GitHub with no project yet. */
export const GET = route((ctx) => listOnboardableRepos(ctx))

/** Bring named repos onto the board: { "repos": ["owner/name", …] } */
export const POST = route(async (ctx, req) => {
  const input = await body(req)
  const repos = Array.isArray(input.repos) ? (input.repos as string[]) : []
  return onboardRepos(ctx, repos)
})
