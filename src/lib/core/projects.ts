import { projectCreateSchema, projectFilterSchema, projectUpdateSchema, slugify } from '@/lib/schemas'
import type { ProjectCreate, ProjectFilterInput, ProjectUpdate } from '@/lib/schemas'
import { STALE_DAYS, type LogEntry, type Idea, type MoneyEntry, type Project, type ProjectDetail, type ProjectOverview, type Resource, type Task } from '@/lib/types'
import { CoreError, shape, unwrap, type Ctx } from './context'
import { touchProject } from './touch'

const daysAgoIso = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString()

export async function listProjects(ctx: Ctx, input: ProjectFilterInput = {}): Promise<ProjectOverview[]> {
  const f = projectFilterSchema.parse(input)

  let q = ctx.db.from('project_overview').select('*').eq('user_id', ctx.userId)

  if (!f.includeArchived) q = q.is('archived_at', null)
  if (f.phase) q = q.eq('phase', f.phase)
  if (f.status) q = q.eq('status', f.status)
  if (f.priority) q = q.eq('priority', f.priority)
  if (f.tag) q = q.contains('tags', [f.tag])
  if (f.stale) q = q.lt('last_touched_at', daysAgoIso(STALE_DAYS))
  if (f.q) q = q.or(`name.ilike.%${f.q}%,tagline.ilike.%${f.q}%,next_action.ilike.%${f.q}%`)

  // Favourites always float to the top; the chosen sort orders the rest.
  q = q.order('favorite', { ascending: false })
  switch (f.sort) {
    // Enum columns sort by declaration order, so ascending priority is p0 first.
    case 'priority': q = q.order('priority').order('last_touched_at'); break
    // Most recently active first, so the stalest sink to the bottom.
    // Staleness is derived, so order by what it is derived from.
    case 'activity': q = q.order('last_activity_at', { ascending: false }); break
    case 'name':     q = q.order('name'); break
    case 'phase':    q = q.order('phase').order('priority'); break
    case 'earnings': q = q.order('monthly_earnings_cents', { ascending: false }); break
  }

  return unwrap(await q) as ProjectOverview[]
}

/** Accepts either a uuid or a slug, so URLs and MCP calls can both be human-friendly. */
export async function getProject(ctx: Ctx, idOrSlug: string): Promise<ProjectDetail> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

  const { data } = await ctx.db
    .from('project_overview')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq(isUuid ? 'id' : 'slug', idOrSlug)
    .maybeSingle()

  if (!data) throw new CoreError(`No project matching "${idOrSlug}"`, 404)
  const project = shape<ProjectOverview>(data)
  const id = project.id

  const [tasks, ideas, resources, money, log] = await Promise.all([
    ctx.db.from('tasks').select('*').eq('project_id', id).order('status').order('position').order('created_at'),
    ctx.db.from('ideas').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ctx.db.from('resources').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ctx.db.from('money_entries').select('*').eq('project_id', id).order('occurred_on', { ascending: false }),
    ctx.db.from('project_log').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(50),
  ])

  return {
    project,
    tasks: shape<Task[]>(tasks.data ?? []),
    ideas: shape<Idea[]>(ideas.data ?? []),
    resources: shape<Resource[]>(resources.data ?? []),
    money: shape<MoneyEntry[]>(money.data ?? []),
    log: shape<LogEntry[]>(log.data ?? []),
  }
}

export async function createProject(ctx: Ctx, input: ProjectCreate): Promise<Project> {
  const v = projectCreateSchema.parse(input)
  const slug = await uniqueSlug(ctx, v.slug ? slugify(v.slug) : slugify(v.name))

  const project = unwrap(
    await ctx.db.from('projects')
      .insert({ ...v, slug, user_id: ctx.userId })
      .select().single(),
  ) as Project

  await touchProject(ctx, project.id, `Project created: ${project.name}`)
  return project
}

export async function updateProject(ctx: Ctx, idOrSlug: string, input: ProjectUpdate): Promise<Project> {
  const { archived, ...v } = projectUpdateSchema.parse(input)
  const { project } = await getProject(ctx, idOrSlug)

  const patch: Record<string, unknown> = { ...v }
  if (v.slug !== undefined) patch.slug = await uniqueSlug(ctx, slugify(v.slug ?? ''), project.id)
  if (archived !== undefined) patch.archived_at = archived ? new Date().toISOString() : null

  const updated = unwrap(
    await ctx.db.from('projects')
      .update(patch).eq('id', project.id).eq('user_id', ctx.userId)
      .select().single(),
  ) as Project

  await touchProject(ctx, project.id, describeChange(patch))
  return updated
}

export async function deleteProject(ctx: Ctx, idOrSlug: string): Promise<void> {
  const { project } = await getProject(ctx, idOrSlug)
  const { error } = await ctx.db.from('projects').delete().eq('id', project.id).eq('user_id', ctx.userId)
  if (error) throw new CoreError(error.message, 500)
}

/** Slugs are unique per user; append -2, -3, … rather than rejecting the write. */
async function uniqueSlug(ctx: Ctx, base: string, excludeId?: string): Promise<string> {
  const root = base || 'project'
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`
    let q = ctx.db.from('projects').select('id').eq('user_id', ctx.userId).eq('slug', candidate)
    if (excludeId) q = q.neq('id', excludeId)
    const { data } = await q.maybeSingle()
    if (!data) return candidate
  }
  return `${root}-${Date.now()}`
}

/** A readable log line for whichever fields the caller actually changed. */
function describeChange(patch: Record<string, unknown>): string | undefined {
  const fields = Object.keys(patch).filter((k) => patch[k] !== undefined)
  if (fields.length === 0) return undefined
  const notable = ['phase', 'status', 'priority', 'next_action', 'archived_at']
    .filter((k) => fields.includes(k))
    .map((k) => `${k} → ${String(patch[k])}`)
  return notable.length ? `Updated ${notable.join(', ')}` : `Updated ${fields.join(', ')}`
}
