import { route } from '../_lib/handler'
import { portfolioBriefing } from '@/lib/core/briefing'

export const GET = route((ctx) => portfolioBriefing(ctx))
