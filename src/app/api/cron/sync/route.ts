import { NextResponse } from 'next/server'
import { ownerCtx } from '@/lib/auth'
import { syncGitHub } from '@/lib/github/sync'

export const maxDuration = 300

/**
 * Hourly GitHub sync (see vercel.json). Vercel sends CRON_SECRET as a bearer
 * token; without the secret configured the endpoint refuses to run rather than
 * sitting there publicly triggerable.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const report = await syncGitHub(await ownerCtx('api'))
    return NextResponse.json({ data: report })
  } catch (error) {
    console.error('cron sync failed', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
