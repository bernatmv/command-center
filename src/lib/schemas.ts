import { z } from 'zod'
import {
  IDEA_STATUSES, MONEY_CADENCES, MONEY_KINDS, PHASES, PRIORITIES,
  RESOURCE_KINDS, STATUSES, TASK_STATUSES,
} from './types'

/**
 * Input validation shared by all three write surfaces (UI server actions, the
 * REST API, and the MCP tools). If a field isn't described here, no surface can
 * write it — that's the point.
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

export const projectCreateSchema = z.object({
  name: trimmed(120),
  slug: z.string().trim().max(60).optional(),
  tagline: optionalText(200),
  description: optionalText(5000),
  phase: z.enum(PHASES).default('idea'),
  status: z.enum(STATUSES).default('idea'),
  priority: z.enum(PRIORITIES).default('p2'),
  next_action: optionalText(300),
  success_score: z.number().int().min(0).max(100).nullish(),
  repo_url: z.url().nullish(),
  prod_url: z.url().nullish(),
  target_release_date: dateStr.nullish(),
  released_at: dateStr.nullish(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  pinned: z.boolean().default(false),
  notes: optionalText(20000),
})

/** Every field optional — used for inline edits, where one cell changes at a time. */
export const projectUpdateSchema = projectCreateSchema.partial().extend({
  archived: z.boolean().optional(),
})

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

export const taskCreateSchema = z.object({
  project_id: z.uuid(),
  title: trimmed(300),
  status: z.enum(TASK_STATUSES).default('todo'),
  priority: z.enum(PRIORITIES).default('p2'),
  due_date: dateStr.nullish(),
})

export const taskUpdateSchema = taskCreateSchema.partial().omit({ project_id: true })

// --------------------------------------------------------------------- ideas
// project_id is nullable everywhere: a capture with no project lands in the inbox.

export const ideaCreateSchema = z.object({
  project_id: z.uuid().nullish(),
  title: trimmed(300),
  body: optionalText(10000),
  status: z.enum(IDEA_STATUSES).default('inbox'),
})

export const ideaUpdateSchema = ideaCreateSchema.partial()

// ----------------------------------------------------------------- resources

export const resourceCreateSchema = z.object({
  project_id: z.uuid().nullish(),
  kind: z.enum(RESOURCE_KINDS).default('link'),
  title: trimmed(300),
  url: z.url(),
  note: optionalText(2000),
})

export const resourceUpdateSchema = resourceCreateSchema.partial()

// --------------------------------------------------------------------- money

export const moneyCreateSchema = z.object({
  project_id: z.uuid(),
  kind: z.enum(MONEY_KINDS),
  label: trimmed(200),
  amount_cents: z.number().int(),
  currency: z.string().trim().length(3).default('USD'),
  cadence: z.enum(MONEY_CADENCES).default('monthly'),
  occurred_on: dateStr.optional(),
})

export const moneyUpdateSchema = moneyCreateSchema.partial().omit({ project_id: true })

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
 * is the one exception — it is consumed after parsing, so it wants the output.
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
