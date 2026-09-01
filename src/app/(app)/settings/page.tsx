import { requireCtx } from '@/lib/auth'
import { listTokens } from '@/lib/core/tokens'
import { getOrigin } from '@/lib/origin'
import { TokenManager } from '@/components/token-manager'

export default async function SettingsPage() {
  const ctx = await requireCtx()
  const [tokens, origin] = await Promise.all([listTokens(ctx), getOrigin()])

  return (
    <div className="max-w-2xl w-full mx-auto px-6 py-8">
      <h1 className="text-lg font-semibold tracking-tight mb-6">Settings</h1>
      <TokenManager tokens={tokens} mcpUrl={`${origin}/api/mcp`} />
    </div>
  )
}
