import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

/**
 * OAuth landing. Beyond exchanging the code, this is the single-user gate: any
 * account whose email isn't ALLOWED_EMAIL is signed straight back out, so
 * publishing the GitHub OAuth app can't hand anyone else a session.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  const fail = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`)

  if (!code) return fail('No authorization code returned by GitHub.')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return fail(error.message)

  const email = data.user?.email?.toLowerCase()
  if (email !== env.allowedEmail) {
    await supabase.auth.signOut()
    return fail(`${email ?? 'That account'} is not permitted on this dashboard.`)
  }

  return NextResponse.redirect(`${origin}${next.startsWith('/') ? next : '/'}`)
}
