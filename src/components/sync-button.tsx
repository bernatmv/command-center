'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { syncGitHubAction } from '@/app/actions'
import { cn } from '@/lib/cn'

/** Forces the GitHub pull that otherwise runs hourly. */
export function SyncButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  function sync() {
    setResult(null)
    startTransition(async () => {
      try {
        const r = await syncGitHubAction()
        const parts = [
          r.projects_created.length ? `+${r.projects_created.length} projects` : null,
          r.tasks_created ? `+${r.tasks_created} tasks` : null,
          r.tasks_closed ? `${r.tasks_closed} closed` : null,
          r.errors.length ? `${r.errors.length} errors` : null,
        ].filter(Boolean)
        setResult(parts.length ? parts.join(' · ') : `${r.repos_seen} repos, no changes`)
        router.refresh()
      } catch (error) {
        setResult((error as Error).message.slice(0, 60))
      }
      setTimeout(() => setResult(null), 6000)
    })
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {result && <span className="text-faint text-xs whitespace-nowrap">{result}</span>}
      <button
        type="button"
        onClick={sync}
        disabled={pending}
        title="Pull repos and issues from GitHub"
        className="h-7 px-2 inline-flex items-center gap-1.5 rounded-md border border-line
                   text-muted hover:text-text hover:border-line-strong transition-colors
                   disabled:opacity-50"
      >
        <RefreshCw className={cn('size-3.5', pending && 'animate-spin')} />
        {pending ? 'Syncing…' : 'Sync'}
      </button>
    </div>
  )
}
