import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { CoreError, type Ctx } from '@/lib/core/context'
import { requireApiCtx } from '@/lib/auth'

/**
 * Wraps a route body with authentication and uniform error shaping, so each
 * route file is just a call into `@/lib/core`.
 */
export function route<T>(handler: (ctx: Ctx, request: Request) => Promise<T>) {
  return async (request: Request) => {
    try {
      const ctx = await requireApiCtx(request, 'api')
      return NextResponse.json({ data: await handler(ctx, request) })
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid input', issues: error.issues },
          { status: 422 },
        )
      }
      if (error instanceof CoreError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      console.error(error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  }
}

/** Same, for routes carrying a dynamic path segment. */
export function paramRoute<P, T>(handler: (ctx: Ctx, params: P, request: Request) => Promise<T>) {
  return async (request: Request, context: { params: Promise<P> }) => {
    try {
      const ctx = await requireApiCtx(request, 'api')
      return NextResponse.json({ data: await handler(ctx, await context.params, request) })
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 422 })
      }
      if (error instanceof CoreError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      console.error(error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  }
}

export async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>
  } catch {
    throw new CoreError('Expected a JSON body', 400)
  }
}

/** Query params as a plain object, with `true`/`false` coerced to booleans. */
export function query(request: Request): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  new URL(request.url).searchParams.forEach((value, key) => {
    out[key] = value === 'true' ? true : value === 'false' ? false : value
  })
  return out
}
