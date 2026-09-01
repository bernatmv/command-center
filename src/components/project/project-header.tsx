'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ArrowLeft, ExternalLink, GitBranch } from 'lucide-react'
import { deleteProjectAction, updateProjectAction } from '@/app/actions'
import { EditableText } from './primitives'
import { cn } from '@/lib/cn'
import { PHASE_COLOR, PHASE_LABEL, PRIORITY_COLOR, PRIORITY_LABEL, STATUS_DOT, formatStale, staleTone } from '@/lib/display'
import { PHASES, PRIORITIES, STATUSES, type ProjectOverview } from '@/lib/types'
import type { ProjectUpdate } from '@/lib/schemas'

export function ProjectHeader({ project }: { project: ProjectOverview }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const stale = staleTone(project.days_stale)

  const save = (patch: ProjectUpdate) =>
    startTransition(async () => {
      await updateProjectAction(project.slug, patch)
      router.refresh()
    })

  return (
    <header className={cn('border-b border-line', pending && 'opacity-70')}>
      <div className="px-6 pt-4 pb-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-faint hover:text-text mb-3 text-xs transition-colors">
          <ArrowLeft className="size-3" /> Board
        </Link>

        <div className="flex items-start gap-3">
          <span className={cn('size-2.5 rounded-full mt-2 shrink-0', STATUS_DOT[project.status])} />
          <div className="min-w-0 flex-1">
            <EditableText
              value={project.name}
              onSave={(name) => name && save({ name })}
              className="text-xl font-semibold tracking-tight"
            />
            <EditableText
              value={project.tagline}
              onSave={(tagline) => save({ tagline })}
              placeholder="Add a one-liner…"
              className="text-muted mt-0.5"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Select value={project.phase} options={PHASES} label={(v) => PHASE_LABEL[v]}
              className={PHASE_COLOR[project.phase]} onChange={(phase) => save({ phase })} />
            <Select value={project.status} options={STATUSES} label={(v) => v}
              className="text-muted" onChange={(status) => save({ status })} />
            <Select value={project.priority} options={PRIORITIES} label={(v) => PRIORITY_LABEL[v]}
              className={PRIORITY_COLOR[project.priority]} onChange={(priority) => save({ priority })} />
          </div>
        </div>
      </div>

      {/* The one thing that moves this project forward — given its own band. */}
      <div className="px-6 py-2.5 border-t border-line bg-panel flex items-baseline gap-3">
        <span className="text-[10px] uppercase tracking-wider text-faint shrink-0">Next</span>
        <EditableText
          value={project.next_action}
          onSave={(next_action) => save({ next_action })}
          placeholder="What is the very next action?"
          className="text-sm flex-1"
        />
      </div>

      <div className="px-6 py-2 border-t border-line flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs">
        <Meta label="Last touched">
          <span className={stale.className}>{formatStale(project.days_stale)} ago</span>
        </Meta>
        <Meta label="Target">
          <EditableDate value={project.target_release_date} onSave={(v) => save({ target_release_date: v })} />
        </Meta>
        <Meta label="Released">
          <EditableDate value={project.released_at} onSave={(v) => save({ released_at: v })} />
        </Meta>
        <Meta label="Success">
          <ScoreBar value={project.success_score} onChange={(success_score) => save({ success_score })} />
        </Meta>
        <Meta label="Repo">
          <UrlField value={project.repo_url} icon={<GitBranch className="size-3" />} onSave={(repo_url) => save({ repo_url })} />
        </Meta>
        <Meta label="Live">
          <UrlField value={project.prod_url} icon={<ExternalLink className="size-3" />} onSave={(prod_url) => save({ prod_url })} />
        </Meta>
        <Meta label="Tags">
          <EditableText
            value={project.tags.join(', ')}
            onSave={(v) => save({ tags: (v ?? '').split(',').map((t) => t.trim()).filter(Boolean) })}
            placeholder="none"
            className="text-muted"
          />
        </Meta>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => save({ pinned: !project.pinned })}
            className={cn('transition-colors', project.pinned ? 'text-accent' : 'text-faint hover:text-text')}
          >
            {project.pinned ? 'Unpin' : 'Pin'}
          </button>
          <button
            type="button"
            onClick={() => save({ archived: !project.archived_at })}
            className="text-faint hover:text-text transition-colors"
          >
            {project.archived_at ? 'Unarchive' : 'Archive'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm(`Delete "${project.name}" and everything in it? This cannot be undone.`)) return
              startTransition(() => deleteProjectAction(project.slug))
            }}
            className="text-faint hover:text-danger transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </header>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-faint">{label}</span>
      {children}
    </span>
  )
}

function Select<T extends string>({
  value, options, label, className, onChange,
}: { value: T; options: readonly T[]; label: (v: T) => string; className?: string; onChange: (v: T) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn('h-7 px-2 rounded-md bg-panel border border-line outline-none font-mono text-[11px] cursor-pointer', className)}
    >
      {options.map((o) => <option key={o} value={o} className="bg-panel text-text">{label(o)}</option>)}
    </select>
  )
}

function EditableDate({ value, onSave }: { value: string | null; onSave: (v: string | null) => void }) {
  return (
    <input
      type="date"
      defaultValue={value ?? ''}
      onChange={(e) => onSave(e.target.value || null)}
      className="bg-transparent text-muted outline-none rounded px-1 -mx-1 hover:bg-panel-2 focus:bg-panel-2 tnum"
    />
  )
}

function UrlField({ value, icon, onSave }: { value: string | null; icon: React.ReactNode; onSave: (v: string | null) => void }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {value && (
        <a href={value} target="_blank" rel="noreferrer" className="text-accent hover:text-text transition-colors">{icon}</a>
      )}
      <EditableText value={value} onSave={onSave} placeholder="add…" className="text-muted max-w-[180px] truncate" />
    </span>
  )
}

/** 0–100 "how well is this actually going", nudged in steps of 10. */
function ScoreBar({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const score = value ?? 0
  const tone = score >= 70 ? 'bg-ok' : score >= 40 ? 'bg-warn' : 'bg-danger'

  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-16 h-1.5 rounded-full bg-line overflow-hidden">
        <span className={cn('block h-full rounded-full transition-all', tone)} style={{ width: `${score}%` }} />
      </span>
      <input
        type="range" min={0} max={100} step={10} value={score}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-16 accent-accent"
        aria-label="Success score"
      />
      <span className="tnum text-muted w-7">{value === null ? '—' : `${score}`}</span>
    </span>
  )
}
