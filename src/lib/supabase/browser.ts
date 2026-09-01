import { createBrowserClient } from '@supabase/ssr'
import { DB_SCHEMA } from '@/lib/env'
import type { AppClient, Database } from './database'

export function createClient(): AppClient {
  return createBrowserClient<Database, typeof DB_SCHEMA>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: DB_SCHEMA } },
  )
}
