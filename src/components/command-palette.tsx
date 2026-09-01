'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import * as Dialog from '@radix-ui/react-dialog'
import { FileText, Inbox, Link2, ListPlus, Plus, Settings } from 'lucide-react'
import { addTaskAction, captureIdeaAction, captureResourceAction } from '@/app/actions'
import { PHASE_COLOR, PHASE_LABEL } from '@/lib/display'
import type { ProjectOverview } from '@/lib/types'

type Mode = 'root' | 'idea' | 'link' | 'task'
type Project = Pick<ProjectOverview, 'id' | 'slug' | 'name' | 'phase'>

/**
 * ⌘K capture. The five-second path: an idea or a link goes straight to the
 * inbox with one field and one keystroke — triage happens later, so nothing is
 * ever lost for want of deciding where it belongs.
 */
export function CommandPalette({ projects }: { projects: Project[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('root')
  const [value, setValue] = useState('')
  const [extra, setExtra] = useState('')
  const [target, setTarget] = useState<Project | null>(null)
  const [pending, startTransition] = useTransition()

  const reset = () => { setMode('root'); setValue(''); setExtra(''); setTarget(null) }

  // Closing always returns the palette to its root state, so the next ⌘K is clean.
  const setOpenAndReset = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    const onOpen = () => setOpen(true)
    document.addEventListener('keydown', onKey)
    document.addEventListener('cc:open-palette', onOpen)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('cc:open-palette', onOpen)
    }
  }, [])

  function submit() {
    const text = value.trim()
    if (!text || pending) return

    startTransition(async () => {
      if (mode === 'idea') await captureIdeaAction({ title: text })
      if (mode === 'link') await captureResourceAction({ url: text, title: extra.trim() || text })
      if (mode === 'task' && target) await addTaskAction(target.slug, { project_id: target.id, title: text })
      setOpenAndReset(false)
      router.refresh()
    })
  }

  const go = (href: string) => { setOpenAndReset(false); router.push(href) }

  return (
    <Dialog.Root open={open} onOpenChange={setOpenAndReset}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed z-50 left-1/2 top-[18vh] -translate-x-1/2 w-[min(92vw,560px)]
                     rounded-xl border border-line-strong bg-panel shadow-2xl shadow-black/50 overflow-hidden"
        >
          <Dialog.Title className="sr-only">Quick capture</Dialog.Title>

          {mode === 'root' ? (
            <Command loop className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5
                                     [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase
                                     [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-faint">
              <Command.Input
                autoFocus
                placeholder="Jump to a project, or capture something…"
                className="w-full h-12 px-4 bg-transparent border-b border-line
                           outline-none placeholder:text-faint text-sm"
              />
              <Command.List className="max-h-[52vh] overflow-y-auto p-1.5">
                <Command.Empty className="py-8 text-center text-faint">No match.</Command.Empty>

                <Command.Group heading="Capture">
                  <PaletteItem icon={<FileText className="size-3.5" />} onSelect={() => setMode('idea')}>
                    Capture idea <Hint>to inbox</Hint>
                  </PaletteItem>
                  <PaletteItem icon={<Link2 className="size-3.5" />} onSelect={() => setMode('link')}>
                    Save link <Hint>to inbox</Hint>
                  </PaletteItem>
                  <PaletteItem icon={<ListPlus className="size-3.5" />} onSelect={() => setMode('task')}>
                    Add task <Hint>pick a project</Hint>
                  </PaletteItem>
                  <PaletteItem icon={<Plus className="size-3.5" />} onSelect={() => go('/new')}>
                    New project
                  </PaletteItem>
                </Command.Group>

                <Command.Group heading="Projects">
                  {projects.map((p) => (
                    <PaletteItem
                      key={p.id}
                      value={`${p.name} ${p.slug}`}
                      icon={<span className={`font-mono text-[10px] ${PHASE_COLOR[p.phase]}`}>{PHASE_LABEL[p.phase]}</span>}
                      onSelect={() => go(`/p/${p.slug}`)}
                    >
                      {p.name}
                    </PaletteItem>
                  ))}
                </Command.Group>

                <Command.Group heading="Go to">
                  <PaletteItem icon={<Inbox className="size-3.5" />} onSelect={() => go('/inbox')}>Inbox</PaletteItem>
                  <PaletteItem icon={<Settings className="size-3.5" />} onSelect={() => go('/settings')}>Settings</PaletteItem>
                </Command.Group>
              </Command.List>
            </Command>
          ) : mode === 'task' && !target ? (
            <Command loop>
              <Command.Input
                autoFocus
                placeholder="Which project?"
                className="w-full h-12 px-4 bg-transparent border-b border-line outline-none placeholder:text-faint text-sm"
              />
              <Command.List className="max-h-[52vh] overflow-y-auto p-1.5">
                <Command.Empty className="py-8 text-center text-faint">No match.</Command.Empty>
                {projects.map((p) => (
                  <PaletteItem
                    key={p.id}
                    value={`${p.name} ${p.slug}`}
                    icon={<span className={`font-mono text-[10px] ${PHASE_COLOR[p.phase]}`}>{PHASE_LABEL[p.phase]}</span>}
                    onSelect={() => setTarget(p)}
                  >
                    {p.name}
                  </PaletteItem>
                ))}
              </Command.List>
            </Command>
          ) : (
            <form
              onSubmit={(e) => { e.preventDefault(); submit() }}
              onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); reset() } }}
            >
              <div className="flex items-center gap-2 px-4 h-9 border-b border-line text-[10px] uppercase tracking-wider text-faint">
                {mode === 'idea' && 'New idea → inbox'}
                {mode === 'link' && 'New link → inbox'}
                {mode === 'task' && target && <>New task → <span className="text-accent normal-case tracking-normal text-xs">{target.name}</span></>}
              </div>

              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={mode === 'link' ? 'https://…' : mode === 'idea' ? "What's the idea?" : 'What needs doing?'}
                className="w-full h-12 px-4 bg-transparent outline-none placeholder:text-faint text-sm"
              />

              {mode === 'link' && (
                <input
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                  placeholder="Title (optional)"
                  className="w-full h-10 px-4 bg-transparent border-t border-line outline-none placeholder:text-faint text-sm"
                />
              )}

              <div className="flex items-center justify-between px-4 h-10 border-t border-line bg-panel-2">
                <button type="button" onClick={reset} className="text-faint hover:text-text text-xs">← Back</button>
                <button
                  type="submit"
                  disabled={!value.trim() || pending}
                  className="h-6 px-3 rounded bg-accent/20 text-accent border border-accent/40
                             hover:bg-accent/30 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium"
                >
                  {pending ? 'Saving…' : 'Save ↵'}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function PaletteItem({
  children, icon, onSelect, value,
}: { children: React.ReactNode; icon?: React.ReactNode; onSelect: () => void; value?: string }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex items-center gap-2.5 px-2.5 h-8 rounded-md cursor-pointer text-muted
                 data-[selected=true]:bg-panel-2 data-[selected=true]:text-text"
    >
      <span className="w-9 shrink-0 flex items-center text-faint">{icon}</span>
      <span className="truncate">{children}</span>
    </Command.Item>
  )
}

const Hint = ({ children }: { children: React.ReactNode }) => (
  <span className="ml-1.5 text-faint text-xs">{children}</span>
)
