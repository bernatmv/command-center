'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Click-to-edit text. Everything on a project page is editable in place, so
 * updating a status or a next action never costs a form, a modal, or a save
 * button — the friction is what stops a dashboard from being kept current.
 */
export function EditableText({
  value, onSave, placeholder = 'Empty', multiline = false, className, inputClassName,
}: {
  value: string | null
  onSave: (next: string | null) => void
  placeholder?: string
  multiline?: boolean
  className?: string
  inputClassName?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  // The draft is seeded when editing starts, so it never fights an incoming prop.
  const startEditing = () => { setDraft(value ?? ''); setEditing(true) }

  function commit() {
    setEditing(false)
    const next = draft.trim() || null
    if (next !== value) onSave(next)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        className={cn(
          'text-left w-full rounded px-1 -mx-1 hover:bg-panel-2 transition-colors',
          !value && 'text-faint italic',
          className,
        )}
      >
        {value || placeholder}
      </button>
    )
  }

  const shared = {
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false) }
      if (e.key === 'Enter' && (!multiline || e.metaKey)) { e.preventDefault(); commit() }
    },
    className: cn(
      'w-full rounded px-1 -mx-1 bg-panel-2 border border-accent/50 outline-none resize-none',
      className, inputClassName,
    ),
  }

  return multiline
    ? <textarea ref={ref as React.Ref<HTMLTextAreaElement>} rows={4} {...shared} />
    : <input ref={ref as React.Ref<HTMLInputElement>} {...shared} />
}

/** A labelled panel. Sections carry an optional count and an "add" affordance. */
export function Panel({
  title, count, action, children, className,
}: {
  title: string; count?: number; action?: React.ReactNode
  children: React.ReactNode; className?: string
}) {
  return (
    <section className={cn('border border-line rounded-lg bg-panel overflow-hidden', className)}>
      <header className="flex items-center gap-2 h-9 px-3 border-b border-line bg-panel-2">
        <h2 className="text-[10px] uppercase tracking-wider text-faint">{title}</h2>
        {count !== undefined && <span className="tnum text-faint text-xs">{count}</span>}
        <div className="ml-auto">{action}</div>
      </header>
      {children}
    </section>
  )
}

/** Single-input inline add form used by every list on the page. */
export function AddRow({
  placeholder, onAdd, type = 'text',
}: { placeholder: string; onAdd: (value: string) => void; type?: string }) {
  const [value, setValue] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!value.trim()) return
        onAdd(value.trim())
        setValue('')
      }}
      className="border-t border-line"
    >
      <input
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 bg-transparent outline-none placeholder:text-faint
                   focus:bg-panel-2 transition-colors"
      />
    </form>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-3 py-5 text-center text-faint text-xs">{children}</p>
}
