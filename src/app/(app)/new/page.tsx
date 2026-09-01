import { createProjectAction } from '@/app/actions'
import { PHASES, PRIORITIES, STATUSES, type Phase, type Priority, type Status } from '@/lib/types'
import { PHASE_LABEL, PRIORITY_LABEL } from '@/lib/display'

export default function NewProjectPage() {
  async function create(formData: FormData) {
    'use server'
    const text = (key: string) => {
      const v = formData.get(key)
      return typeof v === 'string' && v.trim() ? v.trim() : null
    }
    await createProjectAction({
      name: String(formData.get('name') ?? '').trim(),
      tagline: text('tagline'),
      phase: text('phase') as Phase | undefined,
      status: text('status') as Status | undefined,
      priority: text('priority') as Priority | undefined,
      next_action: text('next_action'),
      repo_url: text('repo_url'),
      prod_url: text('prod_url'),
      target_release_date: text('target_release_date'),
      tags: (text('tags') ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    })
  }

  return (
    <div className="max-w-xl w-full mx-auto px-6 py-10">
      <h1 className="text-lg font-semibold tracking-tight mb-1">New project</h1>
      <p className="text-muted mb-6">Only the name is required — fill the rest in as it becomes real.</p>

      <form action={create} className="space-y-4">
        <Field label="Name"><input name="name" required autoFocus className={input} /></Field>
        <Field label="One-liner"><input name="tagline" className={input} placeholder="What it is, in a sentence" /></Field>
        <Field label="Next action">
          <input name="next_action" className={input} placeholder="The one thing that moves it forward" />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Phase">
            <select name="phase" className={input} defaultValue="idea">
              {PHASES.map((p) => <option key={p} value={p}>{PHASE_LABEL[p]}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select name="status" className={input} defaultValue="idea">
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select name="priority" className={input} defaultValue="p2">
              {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Repo URL"><input name="repo_url" type="url" className={input} /></Field>
          <Field label="Live URL"><input name="prod_url" type="url" className={input} /></Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Target release"><input name="target_release_date" type="date" className={input} /></Field>
          <Field label="Tags"><input name="tags" className={input} placeholder="saas, ai" /></Field>
        </div>

        <button
          type="submit"
          className="h-9 px-4 rounded-md bg-accent/20 text-accent border border-accent/40
                     hover:bg-accent/30 font-medium transition-colors"
        >
          Create project
        </button>
      </form>
    </div>
  )
}

const input = 'w-full h-9 px-2.5 rounded-md bg-panel border border-line outline-none focus:border-line-strong placeholder:text-faint'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-wider text-faint mb-1">{label}</span>
      {children}
    </label>
  )
}
