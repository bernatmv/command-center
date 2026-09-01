import type { SupabaseClient } from '@supabase/supabase-js'
import { DB_SCHEMA } from '@/lib/env'

/**
 * A minimal `Database` shape, just enough for supabase-js to resolve its schema
 * generics to `command_center` instead of `public` — without it, the three
 * clients (browser, server, service-role) infer different schema type
 * parameters and stop being interchangeable.
 *
 * Deliberately not generated table types: `@/lib/core` is the only module that
 * touches a client, and it declares its own return types. Generating a full
 * schema file here would be a second source of truth that drifts from the SQL.
 */
type LooseRelation = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
  Relationships: []
}

export type Database = {
  [K in typeof DB_SCHEMA]: {
    Tables: Record<string, LooseRelation>
    Views: Record<string, LooseRelation>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

/** The one client type every surface and `Ctx` agree on. */
export type AppClient = SupabaseClient<Database, typeof DB_SCHEMA>
