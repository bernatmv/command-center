import { z } from 'zod'
import {
  IDEA_STATUSES, MONEY_CADENCES, MONEY_KINDS, PHASES, PRIORITIES,
  RESOURCE_KINDS, STATUSES, TASK_STATUSES,
} from './types'

/**
 * Input validation shared by all three write surfaces (UI server actions, the
 * REST API, and the MCP tools). If a field isn't described here, no surface can
 * write it — that's the point.
 *
 * Each entity declares its fields ONCE, without defaults. Create schemas layer
 * defaults on top; update schemas are `.partial()` of the bare fields.
 * Defaults must never reach an update schema: `.partial()` does not strip a
 * `.default()`, so a patch built from one would quietly rewrite every
 * defaulted column on the row.
 */

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD')
const trimmed = (max: number) => z.string().trim().min(1).max(max)
const optionalText = (max: number) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null))

export const slugify = (input: string) =>
  input.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

// ------------------------------------------------------------------ projects

const projectFields = {
  name: trimmed(120),
  slug: z.string().trim().max(60),
  tagline: optionalText(200),
  description: optionalText(5000),
  phase: z.enum(PHASES),
  status: z.enum(STATUSES),
  priority: z.enum(PRIORITIES),
  next_action: optionalText(300),
  success_score: z.number().int().min(0).max(100).nullish(),
  repo_url: z.url().nullish(),
  prod_url: z.url().nullish(),
  target_release_date: dateStr.nullish(),
  released_at: dateStr.nullish(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  pinned: z.boolean(),
  notes: optionalText(20000),
}

export const projectCreateSchema = z.object({
  ...projectFields,
  slug: projectFields.slug.optional(),
  phase: projectFields.phase.default('idea'),
  status: projectFields.status.default('idea'),
  priority: projectFields.priority.default('p2'),
  tags: projectFields.tags.default([]),
  pinned: projectFields.pinned.default(false),
})

/** Every field optional — used for inline edits, where one cell changes at a time. */
export const projectUpdateSchema = z.object(projectFields).partial()
  .extend({ archived: z.boolean().optional() })

export const projectFilterSchema = z.object({
  phase: z.enum(PHASES).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  tag: z.string().trim().optional(),
  q: z.string().trim().optional(),
  stale: z.boolean().optional(),
  includeArchived: z.boolean().default(false),
  sort: z.enum(['priority', 'stale', 'name', 'phase', 'earnings']).default('priority'),
})

// --------------------------------------------------------------------- tasks

const taskFields = {
  project_id: z.uuid(),
  title: trimmed(300),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(PRIORITIES),
  due_date: dateStr.nullish(),
}

export const taskCreateSchema = z.object({
  ...taskFields,
  status: taskFields.status.default('todo'),
  priority: taskFields.priority.default('p2'),
})

export const taskUpdateSchema = z.object(taskFields).omit({ project_id: true }).partial()

// --------------------------------------------------------------------- ideas
// project_id is nullable everywhere: a capture with no project lands in the inbox.

const ideaFields = {
  project_id: z.uuid().nullish(),
  title: trimmed(300),
  body: optionalText(10000),
  status: z.enum(IDEA_STATUSES),
}

export const ideaCreateSchema = z.object({
  ...ideaFields,
  status: ideaFields.status.default('inbox'),
})

export const ideaUpdateSchema = z.object(ideaFields).partial()

// ----------------------------------------------------------------- resources

const resourceFields = {
  project_id: z.uuid().nullish(),
  kind: z.enum(RESOURCE_KINDS),
  title: trimmed(300),
  url: z.url(),
  note: optionalText(2000),
}

// `kind` stays optional on create so an omitted one is inferred from the URL.
export const resourceCreateSchema = z.object({
  ...resourceFields,
  kind: resourceFields.kind.optional(),
})

export const resourceUpdateSchema = z.object(resourceFields).partial()

// --------------------------------------------------------------------- money

const moneyFields = {
  project_id: z.uuid(),
  kind: z.enum(MONEY_KINDS),
  label: trimmed(200),
  amount_cents: z.number().int(),
  currency: z.string().trim().length(3),
  cadence: z.enum(MONEY_CADENCES),
  occurred_on: dateStr,
}

export const moneyCreateSchema = z.object({
  ...moneyFields,
  currency: moneyFields.currency.default('USD'),
  cadence: moneyFields.cadence.default('monthly'),
  occurred_on: moneyFields.occurred_on.optional(),
})

export const moneyUpdateSchema = z.object(moneyFields).omit({ project_id: true }).partial()

// ----------------------------------------------------------------------- log

export const logCreateSchema = z.object({
  project_id: z.uuid(),
  body: trimmed(2000),
})

// -------------------------------------------------------------------- tokens

export const tokenCreateSchema = z.object({ name: trimmed(80) })

/*
 * Callers are typed with `z.input`, not `z.infer`: defaults and transforms mean
 * the parsed output has fields the caller never has to supply. `ProjectFilter`
 * is the exception — it is consumed after parsing, so it wants the output.
 */
export type ProjectCreate = z.input<typeof projectCreateSchema>
export type ProjectUpdate = z.input<typeof projectUpdateSchema>
export type ProjectFilter = z.infer<typeof projectFilterSchema>
export type ProjectFilterInput = z.input<typeof projectFilterSchema>
export type TaskCreate = z.input<typeof taskCreateSchema>
export type TaskUpdate = z.input<typeof taskUpdateSchema>
export type IdeaCreate = z.input<typeof ideaCreateSchema>
export type IdeaUpdate = z.input<typeof ideaUpdateSchema>
export type ResourceCreate = z.input<typeof resourceCreateSchema>
export type ResourceUpdate = z.input<typeof resourceUpdateSchema>
export type MoneyCreate = z.input<typeof moneyCreateSchema>
export type MoneyUpdate = z.input<typeof moneyUpdateSchema>
