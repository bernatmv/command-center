'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ExternalLink, Lock, Search } from 'lucide-react'
import { onboardReposAction } from '@/app/actions'
import { cn } from '@/lib/cn'
import type { OnboardableRepo } from '@/lib/core/repos'

/**
 * Repos on GitHub with no project yet.
 *
 * The scheduled sync only reaches the last 90 days, so this is mostly the back
 * catalogue — the repos the board would otherwise never learn about.
 */
export function OnboardList({ repos }: { repos: OnboardableRepo[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [done, setDone] = useState<string[]>([])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return repos
      .filter((r) => !done.includes(r.full_name))
      .filter((r) => !q || `${r.name} ${r.description ?? ''}`.toLowerCase().includes(q))
  }, [repos, query, done])

  const toggle = (name: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  function add(names: string[]) {
    if (names.length === 0) return
    startTransition(async () => {
      await onboardReposAction(names)
      setDone((prev) => [...prev, ...names])
      setPicked(new Set())
      router.refresh()
    })
  }

  if (repos.length === 0) {
    return (
      <div className="flex-1 grid place-items-center">
        <div className="text-center">
          <div className="size-10 rounded-full bg-ok/15 text-ok grid place-items-center mx-auto mb-3">✓</div>
          <p className="text-muted">Every repo is on the board.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-4 h-11 border-b border-line">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-faint pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter repos…"
            className="h-7 w-56 pl-7 pr-2 rounded-md bg-panel border border-line
                       outline-none focus:border-line-strong placeholder:text-faint"
          />
        </div>
        <span className="text-faint tnum">{rows.length} not on the board</span>

        <div className="ml-auto flex items-center gap-2">
          {picked.size > 0 && (
            <button
              type="button"
              onClick={() => setPicked(new Set())}
              className="text-faint hover:text-text text-xs"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            disabled={picked.size === 0 || pending}
            onClick={() => add([...picked])}
            className="h-7 px-3 rounded-md bg-accent/15 text-accent border border-accent/40
                       hover:bg-accent/25 disabled:opacity-40 disabled:cursor-not-allowed
                       font-medium transition-colors"
          >
            {pending ? 'Adding…' : `Add ${picked.size || ''}`.trim()}
          </button>
        </div>
      </div>

      <div className={cn('flex-1 overflow-auto', pending && 'opacity-70')}>
        <ul>
          {rows.map((repo) => {
            const selected = picked.has(repo.full_name)
            return (
              <li
                key={repo.full_name}
                onClick={() => toggle(repo.full_name)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 border-b border-line/60 cursor-pointer transition-colors',
                  selected ? 'bg-accent/10' : 'hover:bg-panel',
                )}
              >
                <span
                  className={cn(
                    'size-3.5 rounded border shrink-0 grid place-items-center transition-colors',
                    selected ? 'bg-accent border-accent text-white' : 'border-line-strong',
                  )}
                >
                  {selected && <Check className="size-2.5" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium truncate">{repo.name}</span>
                    {repo.is_private && <Lock className="size-3 text-faint shrink-0" />}
                    {repo.is_archived && <span className="text-[10px] text-faint">ARCHIVED</span>}
                    {repo.auto && (
                      <span
                        title="Recently pushed — the hourly sync would import this anyway"
                        className="text-[10px] px-1.5 rounded-full bg-ok/15 text-ok shrink-0"
                      >
                        auto
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-faint text-xs">{repo.description || '—'}</span>
                </span>

                {repo.open_issues > 0 && (
                  <span className="tnum text-muted text-xs shrink-0">{repo.open_issues} issues</span>
                )}
                <span className="tnum text-faint text-xs w-16 text-right shrink-0">
                  {repo.days_since_push}d ago
                </span>
                <a
                  href={repo.url} target="_blank" rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-faint hover:text-accent transition-colors shrink-0"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
