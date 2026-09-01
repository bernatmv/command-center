import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveToken } from '@/lib/core/tokens'
import { CoreError, type Ctx } from '@/lib/core/context'

/** Session-backed context for pages and server actions. Redirects if signed out. */
export async function requireCtx(): Promise<Ctx> {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  return { db, userId: user.id, source: 'ui' }
}

export async function currentUser() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  return user
}

/**
 * Context for the REST API and MCP endpoint.
 *
 * A bearer token wins when present (that is how Claude and scripts call in);
 * otherwise fall back to the browser session, so the same routes work when
 * fetched from the dashboard itself.
 */
export async function requireApiCtx(request: Request, source: 'api' | 'mcp' = 'api'): Promise<Ctx> {
  const header = request.headers.get('authorization')

  if (header?.startsWith('Bearer ')) {
    const userId = await resolveToken(header.slice(7).trim())
    if (!userId) throw new CoreError('Invalid or revoked API token', 401)
    return { db: createAdminClient(), userId, source }
  }

  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) throw new CoreError('Authentication required', 401)
  return { db, userId: user.id, source }
}
