/** Fail loudly at first use rather than producing confusing 500s later. */
function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

/**
 * This app lives in its own Postgres schema on a shared "Mini Apps" Supabase
 * project — one schema per small app, to stay under the project limit. Nothing
 * of ours is in `public`.
 */
export const DB_SCHEMA = 'command_center'

export const env = {
  get supabaseUrl() { return required('NEXT_PUBLIC_SUPABASE_URL') },
  get supabaseAnonKey() { return required('NEXT_PUBLIC_SUPABASE_ANON_KEY') },
  get supabaseServiceRoleKey() { return required('SUPABASE_SERVICE_ROLE_KEY') },
  /** Only this email may hold a session. Anyone else is signed out at the callback. */
  get allowedEmail() { return required('ALLOWED_EMAIL').toLowerCase() },
}
