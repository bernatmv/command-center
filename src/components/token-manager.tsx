'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy } from 'lucide-react'
import { createTokenAction, revokeTokenAction } from '@/app/actions'
import { cn } from '@/lib/cn'
import type { ApiToken } from '@/lib/types'

export function TokenManager({ tokens, mcpUrl }: { tokens: ApiToken[]; mcpUrl: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [fresh, setFresh] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  function create(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    startTransition(async () => {
      const { token } = await createTokenAction(name.trim())
      setFresh(token)
      setName('')
      router.refresh()
    })
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  const active = tokens.filter((t) => !t.revoked_at)

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-medium mb-1">API tokens</h2>
        <p className="text-muted mb-3">
          Used by the REST API and the MCP server. Shown once at creation — store it somewhere safe.
        </p>

        <form onSubmit={create} className="flex gap-2 mb-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Token name (e.g. laptop, claude-desktop)"
            className="flex-1 h-8 px-2.5 rounded-md bg-panel border border-line outline-none
                       focus:border-line-strong placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={!name.trim() || pending}
            className="h-8 px-3 rounded-md bg-accent/20 text-accent border border-accent/40
                       hover:bg-accent/30 disabled:opacity-40 font-medium transition-colors"
          >
            Create
          </button>
        </form>

        {fresh && (
          <div className="mb-3 p-3 rounded-lg border border-ok/40 bg-ok/10">
            <p className="text-ok text-xs mb-2">Copy this now — it will not be shown again.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs break-all">{fresh}</code>
              <CopyButton copied={copied === 'fresh'} onClick={() => copy(fresh, 'fresh')} />
            </div>
          </div>
        )}

        <ul className="border border-line rounded-lg overflow-hidden">
          {active.length === 0 && <li className="px-3 py-4 text-center text-faint text-xs">No tokens yet.</li>}
          {active.map((token) => (
            <li key={token.id} className="flex items-center gap-3 px-3 h-9 border-b border-line last:border-b-0 bg-panel">
              <span className="flex-1 truncate">{token.name}</span>
              <span className="text-faint text-xs tnum">
                {token.last_used_at ? `used ${new Date(token.last_used_at).toLocaleDateString('en-CA')}` : 'never used'}
              </span>
              <button
                type="button"
                onClick={() => startTransition(async () => { await revokeTokenAction(token.id); router.refresh() })}
                className="text-faint hover:text-danger transition-colors text-xs"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-medium mb-1">Connect Claude</h2>
        <p className="text-muted mb-3">Register the MCP server once, then Claude can read and edit the whole board.</p>
        <div className="flex items-start gap-2 p-3 rounded-lg border border-line bg-panel">
          <code className="flex-1 font-mono text-xs break-all text-muted leading-relaxed">
            claude mcp add --transport http command-center {mcpUrl} --header &quot;Authorization: Bearer YOUR_TOKEN&quot;
          </code>
          <CopyButton
            copied={copied === 'mcp'}
            onClick={() => copy(
              `claude mcp add --transport http command-center ${mcpUrl} --header "Authorization: Bearer YOUR_TOKEN"`,
              'mcp',
            )}
          />
        </div>
      </section>
    </div>
  )
}

function CopyButton({ copied, onClick }: { copied: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick} aria-label="Copy"
      className={cn('shrink-0 transition-colors', copied ? 'text-ok' : 'text-faint hover:text-text')}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}
