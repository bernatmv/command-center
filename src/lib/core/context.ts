import type { SupabaseClient } from '@supabase/supabase-js'
import type { LogSource } from '@/lib/types'

/**
 * Everything a core function needs. `db` is either a session-scoped client (RLS
 * enforces ownership) or the service-role client (core scopes by `userId`
 * itself). Either way core queries always filter on user_id, so both paths
 * behave identically.
 */
export interface Ctx {
  db: SupabaseClient
  userId: string
  source: LogSource
}

export class CoreError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message)
    this.name = 'CoreError'
  }
}

/** Unwrap a Supabase result, turning its error into a throw. */
export function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new CoreError(result.error.message, 500)
  if (result.data === null) throw new CoreError('Not found', 404)
  return result.data
}
