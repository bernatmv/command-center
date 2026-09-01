import type { AppClient } from '@/lib/supabase/database'
import type { LogSource } from '@/lib/types'

/**
 * Everything a core function needs. `db` is either a session-scoped client (RLS
 * enforces ownership) or the service-role client (core scopes by `userId`
 * itself). Either way core queries always filter on user_id, so both paths
 * behave identically.
 */
export interface Ctx {
  db: AppClient
  userId: string
  source: LogSource
}

export class CoreError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message)
    this.name = 'CoreError'
  }
}

/**
 * Unwrap a Supabase result, turning its error into a throw.
 *
 * `data` is deliberately untyped. We don't generate table types from the SQL —
 * that would be a second source of truth that drifts — so PostgREST rows arrive
 * shapeless and each core function names the domain type it is returning.
 */
export function unwrap<T = unknown>(
  result: { data: unknown; error: { message: string } | null },
): T {
  if (result.error) throw new CoreError(result.error.message, 500)
  if (result.data === null || result.data === undefined) throw new CoreError('Not found', 404)
  return result.data as T
}

/** Same narrowing, for rows that didn't come through `unwrap`. */
export const shape = <T>(value: unknown): T => value as T
