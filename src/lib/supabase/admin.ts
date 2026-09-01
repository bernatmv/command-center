import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Service-role client. RLS is bypassed, so every caller MUST scope queries to a
 * user_id itself — which the core layer does, using the id resolved from the
 * API token. Never import this from client code.
 */
export function createAdminClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
