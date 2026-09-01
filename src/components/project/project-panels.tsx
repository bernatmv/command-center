'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ExternalLink, Trash2, Wand2 } from 'lucide-react'
import {
  addTaskAction, captureIdeaAction, captureResourceAction, convertIdeaAction, deleteIdeaAction,
  deleteMoneyAction, deleteResourceAction, deleteTaskAction, logUpdateAction,
  recordMoneyAction, updateIdeaAction, updateProjectAction, updateResourceAction, updateTaskAction,
} from '@/app/actions'
import { AddRow, EditableText, Empty, Panel } from './primitives'
import { cn } from '@/lib/cn'
import { CADENCE_LABEL, PRIORITY_COLOR, PRIORITY_LABEL, TASK_STATUS_COLOR, formatMoney } from '@/lib/display'
import { MONEY_CADENCES, PRIORITIES, TASK_STATUSES, type Idea, type LogEntry, type MoneyEntry, type Resource, type Task } from '@/lib/types'

function useAction() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => { await fn(); router.refresh() })
  return { run, pending }
}

// ---------------------------------------------------------------------- tasks

export function TaskPanel({ slug, projectId, tasks }: { slug: string; projectId: string; tasks: Task[] }) {
  const { run } = useAction()
  const open = tasks.filter((t) => t.status !== 'done')
  const done = tasks.filter((t) => t.status === 'done')
  const [showDone, setShowDone] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  const row = (task: Task) => {
    const overdue = task.status !== 'done' && task.due_date && task.due_date < today

    return (
      <li key={task.id} className="flex items-center gap-2 px-3 h-8 border-b border-line/60 last:border-b-0 group">
        <button
          type="button"
          aria-label={task.status === 'done' ? 'Reopen task' : 'Complete task'}
          onClick={() => run(() => updateTaskAction(slug, task.id, { status: task.status === 'done' ? 'todo' : 'done' }))}
          className={cn(
            'size-3.5 rounded border shrink-0 grid place-items-center transition-colors',
            task.status === 'done' ? 'bg-ok/20 border-ok text-ok' : 'border-line-strong hover:border-accent',
          )}
        >
          {task.status === 'done' && <Check className="size-2.5" />}
        </button>

        <EditableText
          value={task.title}
          onSave={(title) => title && run(() => updateTaskAction(slug, task.id, { title }))}
          className={cn('flex-1 min-w-0 truncate', TASK_STATUS_COLOR[task.status])}
        />

        <select
          value={task.status}
          onChange={(e) => run(() => updateTaskAction(slug, task.id, { status: e.target.value as never }))}
          className="bg-transparent text-faint outline-none text-[11px] opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="Task status"
        >
          {TASK_STATUSES.map((s) => <option key={s} value={s} className="bg-panel">{s}</option>)}
        </select>

        <select
          value={task.priority}
          onChange={(e) => run(() => updateTaskAction(slug, task.id, { priority: e.target.value as never }))}
          className={cn('bg-transparent outline-none font-mono text-[11px] cursor-pointer', PRIORITY_COLOR[task.priority].split(' ')[0])}
          aria-label="Task priority"
        >
          {PRIORITIES.map((p) => <option key={p} value={p} className="bg-panel text-text">{PRIORITY_LABEL[p]}</option>)}
        </select>

        <input
          type="date"
          defaultValue={task.due_date ?? ''}
          onChange={(e) => run(() => updateTaskAction(slug, task.id, { due_date: e.target.value || null }))}
          className={cn('bg-transparent outline-none tnum text-[11px] w-[92px]', overdue ? 'text-danger' : 'text-faint')}
          aria-label="Due date"
        />

        <DeleteButton onClick={() => run(() => deleteTaskAction(slug, task.id))} />
      </li>
    )
  }

  return (
    <Panel
      title="Tasks"
      count={open.length}
      action={done.length > 0 && (
        <button type="button" onClick={() => setShowDone((v) => !v)} className="text-faint hover:text-text text-xs">
          {showDone ? 'Hide' : 'Show'} {done.length} done
        </button>
      )}
    >
      {open.length === 0 && !showDone && <Empty>Nothing open.</Empty>}
      <ul>{open.map(row)}{showDone && done.map(row)}</ul>
      <AddRow placeholder="Add a task…" onAdd={(title) => run(() => addTaskAction(slug, { project_id: projectId, title }))} />
    </Panel>
  )
}

// ---------------------------------------------------------------------- ideas

export function IdeaPanel({ projectId, ideas }: { projectId: string; ideas: Idea[] }) {
  const { run } = useAction()
  const live = ideas.filter((i) => i.status !== 'dropped' && i.status !== 'converted')

  return (
    <Panel title="Ideas" count={live.length}>
      {live.length === 0 && <Empty>No ideas parked here yet.</Empty>}
      <ul>
        {live.map((idea) => (
          <li key={idea.id} className="flex items-center gap-2 px-3 py-1.5 border-b border-line/60 last:border-b-0 group">
            <EditableText
              value={idea.title}
              onSave={(title) => title && run(() => updateIdeaAction(idea.id, { title }))}
              className="flex-1 min-w-0"
            />
            <button
              type="button"
              title="Turn into a task"
              onClick={() => run(() => convertIdeaAction(idea.id, projectId))}
              className="text-faint hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Wand2 className="size-3.5" />
            </button>
            <DeleteButton onClick={() => run(() => deleteIdeaAction(idea.id))} />
          </li>
        ))}
      </ul>
      <AddRow placeholder="Park an idea…" onAdd={(title) => run(() => captureIdeaAction({ project_id: projectId, title }))} />
    </Panel>
  )
}

// ------------------------------------------------------------------ resources

export function ResourcePanel({ projectId, resources }: { projectId: string; resources: Resource[] }) {
  const { run } = useAction()

  return (
    <Panel title="Resources" count={resources.length}>
      {resources.length === 0 && <Empty>Links, articles, and videos land here.</Empty>}
      <ul>
        {resources.map((r) => (
          <li key={r.id} className="flex items-center gap-2 px-3 h-8 border-b border-line/60 last:border-b-0 group">
            <span className="font-mono text-[10px] text-faint w-12 shrink-0 uppercase">{r.kind}</span>
            <EditableText
              value={r.title}
              onSave={(title) => title && run(() => updateResourceAction(r.id, { title }))}
              className="flex-1 min-w-0 truncate"
            />
            <a href={r.url} target="_blank" rel="noreferrer" className="text-faint hover:text-accent transition-colors">
              <ExternalLink className="size-3.5" />
            </a>
            <DeleteButton onClick={() => run(() => deleteResourceAction(r.id))} />
          </li>
        ))}
      </ul>
      <AddRow
        type="url"
        placeholder="Paste a URL…"
        onAdd={(url) => run(() => captureResourceAction({ project_id: projectId, url, title: url }))}
      />
    </Panel>
  )
}

// ---------------------------------------------------------------------- money

export function MoneyPanel({ slug, projectId, money }: { slug: string; projectId: string; money: MoneyEntry[] }) {
  const { run } = useAction()
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [kind, setKind] = useState<'earning' | 'cost'>('earning')
  const [cadence, setCadence] = useState<(typeof MONEY_CADENCES)[number]>('monthly')

  function add(e: React.FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!label.trim() || !Number.isFinite(value)) return
    run(() => recordMoneyAction(slug, {
      project_id: projectId, kind, label: label.trim(),
      amount_cents: Math.round(value * 100), currency: 'USD', cadence,
    }))
    setLabel(''); setAmount('')
  }

  return (
    <Panel title="Costs & earnings" count={money.length}>
      {money.length === 0 && <Empty>No money recorded yet.</Empty>}
      <ul>
        {money.map((m) => (
          <li key={m.id} className="flex items-center gap-2 px-3 h-8 border-b border-line/60 last:border-b-0 group">
            <span className={cn('size-1.5 rounded-full shrink-0', m.kind === 'earning' ? 'bg-ok' : 'bg-danger')} />
            <span className="flex-1 min-w-0 truncate">{m.label}</span>
            <span className="text-faint text-[11px]">{CADENCE_LABEL[m.cadence]}</span>
            <span className={cn('tnum w-16 text-right', m.kind === 'earning' ? 'text-ok' : 'text-muted')}>
              {m.kind === 'cost' ? '−' : ''}{formatMoney(m.amount_cents, m.currency)}
            </span>
            <DeleteButton onClick={() => run(() => deleteMoneyAction(slug, m.id))} />
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="flex items-center gap-1.5 px-3 h-10 border-t border-line">
        <button
          type="button"
          onClick={() => setKind(kind === 'earning' ? 'cost' : 'earning')}
          className={cn('h-6 px-2 rounded border font-mono text-[10px] shrink-0',
            kind === 'earning' ? 'text-ok border-ok/40 bg-ok/10' : 'text-danger border-danger/40 bg-danger/10')}
        >
          {kind === 'earning' ? 'EARN' : 'COST'}
        </button>
        <input
          value={label} onChange={(e) => setLabel(e.target.value)}
          placeholder="What for?"
          className="flex-1 min-w-0 h-6 bg-transparent outline-none placeholder:text-faint"
        />
        <input
          value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00" inputMode="decimal"
          className="w-16 h-6 bg-transparent outline-none text-right tnum placeholder:text-faint"
        />
        <select
          value={cadence} onChange={(e) => setCadence(e.target.value as never)}
          className="h-6 bg-transparent text-faint outline-none text-[11px]"
          aria-label="Cadence"
        >
          {MONEY_CADENCES.map((c) => <option key={c} value={c} className="bg-panel text-text">{CADENCE_LABEL[c]}</option>)}
        </select>
      </form>
    </Panel>
  )
}

// ------------------------------------------------------------------------ log

export function LogPanel({ slug, projectId, log }: { slug: string; projectId: string; log: LogEntry[] }) {
  const { run } = useAction()

  return (
    <Panel title="Activity" count={log.length}>
      {log.length === 0 && <Empty>Every change lands here automatically.</Empty>}
      <ul className="max-h-72 overflow-y-auto">
        {log.map((entry) => (
          <li key={entry.id} className="flex items-baseline gap-2.5 px-3 py-1.5 border-b border-line/60 last:border-b-0">
            <time className="tnum text-faint text-[11px] shrink-0 w-[76px]">
              {new Date(entry.created_at).toLocaleDateString('en-CA')}
            </time>
            <span className="font-mono text-[10px] text-faint uppercase w-7 shrink-0">{entry.source}</span>
            <span className="text-muted min-w-0">{entry.body}</span>
          </li>
        ))}
      </ul>
      <AddRow placeholder="Note what happened…" onAdd={(body) => run(() => logUpdateAction(slug, projectId, body))} />
    </Panel>
  )
}

// ---------------------------------------------------------------------- notes

export function NotesPanel({ slug, notes }: { slug: string; notes: string | null }) {
  const { run } = useAction()

  return (
    <Panel title="Notes">
      <div className="p-3">
        <EditableText
          value={notes}
          multiline
          onSave={(value) => run(() => updateProjectAction(slug, { notes: value }))}
          placeholder="Context, decisions, anything you'll want back later…"
          className="text-muted leading-relaxed whitespace-pre-wrap min-h-16 block"
          inputClassName="font-sans"
        />
      </div>
    </Panel>
  )
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick} aria-label="Delete"
      className="text-faint hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
    >
      <Trash2 className="size-3.5" />
    </button>
  )
}
