import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { env } from '@/lib/env'

/** Session-scoped client for Server Components and Server Actions. RLS applies. */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component, where cookies are read-only. The
          // middleware refreshes the session, so this is safe to ignore.
        }
      },
    },
  })
}
