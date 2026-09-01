import { createClient } from '@supabase/supabase-js'
import { DB_SCHEMA, env } from '@/lib/env'
import type { AppClient, Database } from './database'

/**
 * Service-role client. RLS is bypassed, so every caller MUST scope queries to a
 * user_id itself — which the core layer does, using the id resolved from the
 * API token. Never import this from client code.
 */
export function createAdminClient(): AppClient {
  return createClient<Database, typeof DB_SCHEMA>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    db: { schema: DB_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
