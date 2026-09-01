'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, GitBranch, Search, TriangleAlert } from 'lucide-react'
import { updateProjectAction } from '@/app/actions'
import { SyncButton } from '@/components/sync-button'
import { cn } from '@/lib/cn'
import {
  PHASE_COLOR, PHASE_LABEL, PRIORITY_COLOR, PRIORITY_LABEL,
  STATUS_DOT, formatMoney, formatStale, staleTone,
} from '@/lib/display'
import { PHASES, PRIORITIES, STALE_DAYS, STATUSES, type Phase, type Priority, type ProjectOverview } from '@/lib/types'

type Sort = 'priority' | 'stale' | 'name' | 'earnings'

/**
 * The daily view. One row per project, everything inline-editable, sorted so
 * that whatever most deserves attention sits at the top. Rows dim as they go
 * quiet and turn red once genuinely forgotten.
 */
export function ProjectTable({ projects }: { projects: ProjectOverview[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const searchRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [phase, setPhase] = useState<Phase | null>(null)
  const [priority, setPriority] = useState<Priority | null>(null)
  const [staleOnly, setStaleOnly] = useState(false)
  const [sort, setSort] = useState<Sort>('priority')
  const [cursor, setCursor] = useState(0)

  // Inline edits render instantly; the server action reconciles behind them.
  const [overrides, setOverrides] = useState<Record<string, Partial<ProjectOverview>>>({})

  const rows = useMemo(() => {
    const merged = projects.map((p) => ({ ...p, ...overrides[p.id] }))
    const q = query.trim().toLowerCase()

    const filtered = merged.filter((p) => {
      if (phase && p.phase !== phase) return false
      if (priority && p.priority !== priority) return false
      if (staleOnly && p.days_stale < STALE_DAYS) return false
      if (!q) return true
      return [p.name, p.tagline, p.next_action, ...p.tags]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    })

    const rank = (p: ProjectOverview) => PRIORITIES.indexOf(p.priority)
    return filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      switch (sort) {
        case 'stale': return b.days_stale - a.days_stale
        case 'name': return a.name.localeCompare(b.name)
        case 'earnings': return Number(b.monthly_earnings_cents) - Number(a.monthly_earnings_cents)
        default: return rank(a) - rank(b) || b.days_stale - a.days_stale
      }
    })
  }, [projects, overrides, query, phase, priority, staleOnly, sort])

  // Filtering can shrink the list under the cursor; clamp on read rather than
  // correcting state in an effect.
  const active = Math.min(cursor, Math.max(rows.length - 1, 0))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)

      if (e.key === '/' && !typing) { e.preventDefault(); searchRef.current?.focus(); return }
      if (typing || e.metaKey || e.ctrlKey) return

      if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, rows.length - 1)) }
      if (e.key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
      if (e.key === 'Enter' && rows[active]) router.push(`/p/${rows[active].slug}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rows, active, router])

  function patch(project: ProjectOverview, change: Partial<ProjectOverview>) {
    setOverrides((prev) => ({ ...prev, [project.id]: { ...prev[project.id], ...change } }))
    startTransition(async () => {
      await updateProjectAction(project.slug, change as never)
      router.refresh()
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ------------------------------------------------------------ filters */}
      <div className="flex items-center gap-2 px-4 h-11 border-b border-line overflow-x-auto">
        <div className="relative shrink-0">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-faint pointer-events-none" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && (setQuery(''), e.currentTarget.blur())}
            placeholder="Filter…  /"
            className="h-7 w-48 pl-7 pr-2 rounded-md bg-panel border border-line
                       outline-none focus:border-line-strong placeholder:text-faint"
          />
        </div>

        <Chip active={staleOnly} onClick={() => setStaleOnly((v) => !v)} tone="warn">Stale only</Chip>

        <span className="w-px h-4 bg-line shrink-0" />

        {PHASES.map((p) => (
          <Chip key={p} active={phase === p} onClick={() => setPhase(phase === p ? null : p)}>
            <span className={phase === p ? '' : PHASE_COLOR[p]}>{PHASE_LABEL[p]}</span>
          </Chip>
        ))}

        <span className="w-px h-4 bg-line shrink-0" />

        {PRIORITIES.map((p) => (
          <Chip key={p} active={priority === p} onClick={() => setPriority(priority === p ? null : p)}>
            {PRIORITY_LABEL[p]}
          </Chip>
        ))}

        <div className="ml-auto flex items-center gap-2 shrink-0 pl-2">
          <SyncButton />
          <span className="text-faint tnum">{rows.length}/{projects.length}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-7 px-2 rounded-md bg-panel border border-line outline-none text-muted"
          >
            <option value="priority">Sort: priority</option>
            <option value="stale">Sort: stalest</option>
            <option value="earnings">Sort: revenue</option>
            <option value="name">Sort: name</option>
          </select>
        </div>
      </div>

      {/* -------------------------------------------------------------- table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-bg">
            <tr className="text-[10px] uppercase tracking-wider text-faint border-b border-line">
              <Th className="text-left pl-4">Project</Th>
              <Th className="w-[76px]">Phase</Th>
              <Th className="w-[52px]">Pri</Th>
              <Th className="w-[96px] text-left">Status</Th>
              <Th className="w-[76px] text-right">Tasks</Th>
              <Th className="w-[68px] text-right">Stale</Th>
              <Th className="w-[76px] text-right">Rev/mo</Th>
              <Th className="w-[76px] text-right">Cost/mo</Th>
              <Th className="w-[64px] pr-4">Links</Th>
            </tr>
          </thead>

          <tbody>
            {rows.map((p, i) => {
              const stale = staleTone(p.days_stale)
              return (
                <tr
                  key={p.id}
                  onClick={() => router.push(`/p/${p.slug}`)}
                  onMouseEnter={() => setCursor(i)}
                  className={cn(
                    'border-b border-line/60 cursor-pointer group',
                    i === active ? 'bg-panel-2' : 'hover:bg-panel',
                    p.status === 'abandoned' && 'opacity-45',
                  )}
                >
                  {/* name + the single next action */}
                  <td className="pl-4 py-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('size-1.5 rounded-full shrink-0', STATUS_DOT[p.status])} />
                      <span className="font-medium truncate">{p.name}</span>
                      {p.pinned && <span className="text-faint text-[10px]">PIN</span>}
                      {p.overdue_tasks > 0 && (
                        <span className="inline-flex items-center gap-1 text-danger text-[10px] shrink-0">
                          <TriangleAlert className="size-3" />{p.overdue_tasks}
                        </span>
                      )}
                    </div>
                    <div className="text-faint truncate pl-3.5 text-xs">
                      {p.next_action || p.tagline || '—'}
                    </div>
                  </td>

                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <InlineSelect
                      value={p.phase} options={PHASES}
                      label={(v) => PHASE_LABEL[v]}
                      className={cn('font-mono text-[11px]', PHASE_COLOR[p.phase])}
                      onChange={(v) => patch(p, { phase: v })}
                    />
                  </td>

                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <InlineSelect
                      value={p.priority} options={PRIORITIES}
                      label={(v) => PRIORITY_LABEL[v]}
                      className={cn('font-mono text-[11px] px-1.5 py-0.5 rounded border', PRIORITY_COLOR[p.priority])}
                      onChange={(v) => patch(p, { priority: v })}
                    />
                  </td>

                  <td onClick={(e) => e.stopPropagation()}>
                    <InlineSelect
                      value={p.status} options={STATUSES}
                      label={(v) => v}
                      className="text-muted"
                      onChange={(v) => patch(p, { status: v })}
                    />
                  </td>

                  <td className="text-right tnum text-muted">
                    {p.total_tasks === 0
                      ? <span className="text-faint">—</span>
                      : <>{p.total_tasks - p.open_tasks}<span className="text-faint">/{p.total_tasks}</span></>}
                  </td>

                  <td className={cn('text-right tnum', stale.className)}>
                    {formatStale(p.days_stale)}{stale.warn && <span className="ml-0.5">⚠</span>}
                  </td>

                  <td className={cn('text-right tnum', Number(p.monthly_earnings_cents) > 0 ? 'text-ok' : 'text-faint')}>
                    {Number(p.monthly_earnings_cents) > 0 ? formatMoney(p.monthly_earnings_cents) : '—'}
                  </td>

                  <td className={cn('text-right tnum', Number(p.monthly_cost_cents) > 0 ? 'text-muted' : 'text-faint')}>
                    {Number(p.monthly_cost_cents) > 0 ? formatMoney(p.monthly_cost_cents) : '—'}
                  </td>

                  <td className="pr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.repo_url && <IconLink href={p.repo_url}><GitBranch className="size-3.5" /></IconLink>}
                      {p.prod_url && <IconLink href={p.prod_url}><ExternalLink className="size-3.5" /></IconLink>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="py-20 text-center text-faint">
            {projects.length === 0
              ? <>No projects yet. Press <kbd className="font-mono px-1.5 py-0.5 rounded bg-panel-2 border border-line">⌘K</kbd> to add one.</>
              : 'Nothing matches those filters.'}
          </div>
        )}
      </div>

      <div className="h-8 px-4 flex items-center gap-4 border-t border-line text-faint text-xs shrink-0">
        <span><kbd className="font-mono">j</kbd>/<kbd className="font-mono">k</kbd> move</span>
        <span><kbd className="font-mono">↵</kbd> open</span>
        <span><kbd className="font-mono">/</kbd> filter</span>
        <span><kbd className="font-mono">⌘K</kbd> capture</span>
      </div>
    </div>
  )
}

/**
 * A native <select> laid transparently over a styled label. Keeps full keyboard
 * and platform behaviour while the cell still looks like a table cell.
 */
function InlineSelect<T extends string>({
  value, options, label, className, onChange,
}: {
  value: T; options: readonly T[]; label: (v: T) => string
  className?: string; onChange: (v: T) => void
}) {
  return (
    <span className="relative inline-flex items-center justify-center">
      <span className={cn('pointer-events-none', className)}>{label(value)}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label="Change value"
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
      >
        {options.map((o) => <option key={o} value={o}>{label(o)}</option>)}
      </select>
    </span>
  )
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('font-normal py-1.5 px-2', className)}>{children}</th>
}

function Chip({
  children, active, onClick, tone,
}: { children: React.ReactNode; active: boolean; onClick: () => void; tone?: 'warn' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-7 px-2 rounded-md border shrink-0 font-mono text-[11px] transition-colors',
        active
          ? tone === 'warn'
            ? 'bg-warn/15 border-warn/50 text-warn'
            : 'bg-accent/15 border-accent/50 text-accent'
          : 'bg-transparent border-line text-muted hover:border-line-strong hover:text-text',
      )}
    >
      {children}
    </button>
  )
}

function IconLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href} target="_blank" rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-faint hover:text-accent transition-colors"
    >
      {children}
    </a>
  )
}
