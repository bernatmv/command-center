import { NextResponse } from 'next/server'
import { createMcpHandler } from '@modelcontextprotocol/server'
import { requireApiCtx } from '@/lib/auth'
import { CoreError } from '@/lib/core/context'
import { buildServer } from '@/lib/mcp/server'

export const maxDuration = 60

/**
 * Remote MCP endpoint, authenticated by a bearer API token from Settings.
 *
 * The handler is constructed per request so the server instance closes over the
 * caller's context; serving is stateless, which is what a serverless deployment
 * wants anyway.
 */
async function handle(request: Request): Promise<Response> {
  let ctx
  try {
    ctx = await requireApiCtx(request, 'mcp')
  } catch (error) {
    const status = error instanceof CoreError ? error.status : 500
    const message = error instanceof CoreError ? error.message : 'Internal error'
    return NextResponse.json({ error: message }, {
      status,
      headers: status === 401 ? { 'WWW-Authenticate': 'Bearer' } : undefined,
    })
  }

  const handler = createMcpHandler(() => buildServer(ctx))
  try {
    return await handler.fetch(request)
  } finally {
    await handler.close()
  }
}

export { handle as GET, handle as POST, handle as DELETE }
