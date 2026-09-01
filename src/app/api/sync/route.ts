import { route } from '../_lib/handler'
import { syncGitHub } from '@/lib/github/sync'

export const maxDuration = 300

/** Manual sync, from the board's "Sync" button, a script, or the MCP tool. */
export const POST = route((ctx) => syncGitHub(ctx))
