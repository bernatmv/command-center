import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ApiToken } from '@/lib/types'
import { CoreError, shape, unwrap, type Ctx } from './context'

const hash = (raw: string) => createHash('sha256').update(raw).digest('hex')

export async function listTokens(ctx: Ctx): Promise<ApiToken[]> {
  return unwrap(
    await ctx.db.from('api_tokens')
      .select('id,user_id,name,last_used_at,revoked_at,created_at')
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false }),
  ) as ApiToken[]
}

/** The raw token is returned exactly once; only its hash is stored. */
export async function createToken(ctx: Ctx, name: string): Promise<{ token: string; record: ApiToken }> {
  const token = `cc_${randomBytes(32).toString('hex')}`
  const record = unwrap(
    await ctx.db.from('api_tokens')
      .insert({ user_id: ctx.userId, name, token_hash: hash(token) })
      .select('id,user_id,name,last_used_at,revoked_at,created_at')
      .single(),
  ) as ApiToken
  return { token, record }
}

export async function revokeToken(ctx: Ctx, id: string): Promise<void> {
  const { error } = await ctx.db.from('api_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', ctx.userId)
  if (error) throw new CoreError(error.message, 500)
}

/**
 * Resolve a bearer token to its owner. Runs with the service-role client
 * because the caller has no session yet — this is what establishes identity for
 * the REST API and the MCP endpoint.
 */
export async function resolveToken(raw: string): Promise<string | null> {
  if (!raw.startsWith('cc_')) return null
  const db = createAdminClient()
  const candidate = hash(raw)

  const { data } = await db.from('api_tokens')
    .select('id,user_id,token_hash')
    .eq('token_hash', candidate)
    .is('revoked_at', null)
    .maybeSingle()

  if (!data) return null
  const row = shape<{ id: string; user_id: string; token_hash: string }>(data)

  // Constant-time confirmation, so a partial index match can't be timed.
  const a = Buffer.from(row.token_hash, 'hex')
  const b = Buffer.from(candidate, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  void db.from('api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', row.id).then()
  return row.user_id
}
