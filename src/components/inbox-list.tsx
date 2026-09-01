'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Trash2 } from 'lucide-react'
import { deleteIdeaAction, deleteResourceAction, updateIdeaAction, updateResourceAction, convertIdeaAction } from '@/app/actions'
import { cn } from '@/lib/cn'
import type { Idea, ProjectOverview, Resource } from '@/lib/types'

type Project = Pick<ProjectOverview, 'id' | 'slug' | 'name'>

/**
 * Triage. Captures arrive here with no project attached; the only decisions are
 * "which project", "is this a task", or "drop it". Keeping capture and triage
 * separate is what lets capture take five seconds.
 */
export function InboxList({
  ideas, resources, projects,
}: { ideas: Idea[]; resources: Resource[]; projects: Project[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => { await fn(); router.refresh() })

  const total = ideas.length + resources.length

  if (total === 0) {
    return (
      <div className="flex-1 grid place-items-center">
        <div className="text-center">
          <div className="size-10 rounded-full bg-ok/15 text-ok grid place-items-center mx-auto mb-3">✓</div>
          <p className="text-muted">Inbox is empty.</p>
          <p className="text-faint text-xs mt-1">
            Press <kbd className="font-mono px-1.5 py-0.5 rounded bg-panel-2 border border-line">⌘K</kbd> to capture something.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex-1 overflow-auto', pending && 'opacity-70')}>
      {ideas.length > 0 && (
        <Group title="Ideas" count={ideas.length}>
          {ideas.map((idea) => (
            <Row key={idea.id}>
              <span className="flex-1 min-w-0">
                <span className="block truncate">{idea.title}</span>
                {idea.body && <span className="block truncate text-faint text-xs">{idea.body}</span>}
              </span>

              <ProjectPicker
                projects={projects}
                placeholder="File under…"
                onPick={(id) => run(() => updateIdeaAction(idea.id, { project_id: id, status: 'kept' }))}
              />
              <ProjectPicker
                projects={projects}
                placeholder="As task in…"
                onPick={(id) => run(() => convertIdeaAction(idea.id, id))}
              />
              <Delete onClick={() => run(() => deleteIdeaAction(idea.id))} />
            </Row>
          ))}
        </Group>
      )}

      {resources.length > 0 && (
        <Group title="Links" count={resources.length}>
          {resources.map((r) => (
            <Row key={r.id}>
              <span className="font-mono text-[10px] text-faint w-12 shrink-0 uppercase">{r.kind}</span>
              <span className="flex-1 min-w-0">
                <span className="block truncate">{r.title}</span>
                <span className="block truncate text-faint text-xs">{r.url}</span>
              </span>

              <a href={r.url} target="_blank" rel="noreferrer" className="text-faint hover:text-accent transition-colors shrink-0">
                <ExternalLink className="size-3.5" />
              </a>
              <ProjectPicker
                projects={projects}
                placeholder="File under…"
                onPick={(id) => run(() => updateResourceAction(r.id, { project_id: id }))}
              />
              <Delete onClick={() => run(() => deleteResourceAction(r.id))} />
            </Row>
          ))}
        </Group>
      )}
    </div>
  )
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="sticky top-0 bg-bg px-4 h-8 flex items-center gap-2 border-b border-line
                     text-[10px] uppercase tracking-wider text-faint">
        {title} <span className="tnum">{count}</span>
      </h2>
      <ul>{children}</ul>
    </section>
  )
}

const Row = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-center gap-3 px-4 py-2 border-b border-line/60 hover:bg-panel transition-colors group">
    {children}
  </li>
)

function ProjectPicker({
  projects, placeholder, onPick,
}: { projects: Project[]; placeholder: string; onPick: (projectId: string) => void }) {
  return (
    <select
      value=""
      onChange={(e) => e.target.value && onPick(e.target.value)}
      aria-label={placeholder}
      className="h-7 px-2 rounded-md bg-panel border border-line text-muted outline-none
                 hover:border-line-strong cursor-pointer shrink-0 max-w-[150px]"
    >
      <option value="">{placeholder}</option>
      {projects.map((p) => <option key={p.id} value={p.id} className="bg-panel text-text">{p.name}</option>)}
    </select>
  )
}

const Delete = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button" onClick={onClick} aria-label="Delete"
    className="text-faint hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
  >
    <Trash2 className="size-3.5" />
  </button>
)
