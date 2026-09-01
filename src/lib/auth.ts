import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveToken } from '@/lib/core/tokens'
import { CoreError, type Ctx } from '@/lib/core/context'
import { env } from '@/lib/env'

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

/**
 * Context for background work with no request behind it (the sync cron).
 *
 * Resolves the single owner by ALLOWED_EMAIL rather than "the first user",
 * because auth.users is shared with the other apps on this Supabase project.
 */
export async function ownerCtx(source: 'api' | 'mcp' = 'api'): Promise<Ctx> {
  const db = createAdminClient()
  const { data, error } = await db.auth.admin.listUsers()
  if (error) throw new CoreError(`Could not resolve owner: ${error.message}`, 500)

  const owner = data.users.find((u) => u.email?.toLowerCase() === env.allowedEmail)
  if (!owner) throw new CoreError(`No user matching ALLOWED_EMAIL (${env.allowedEmail})`, 500)

  return { db, userId: owner.id, source }
}
