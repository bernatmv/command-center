import { resourceCreateSchema, resourceUpdateSchema } from '@/lib/schemas'
import type { ResourceCreate, ResourceUpdate } from '@/lib/schemas'
import type { Resource, ResourceKind } from '@/lib/types'
import { CoreError, unwrap, type Ctx } from './context'
import { touchProject } from './touch'

/** Best-effort kind from the URL, so a fast paste still lands categorised. */
export function inferKind(url: string): ResourceKind {
  const u = url.toLowerCase()
  if (/youtube\.com|youtu\.be|vimeo\.com|loom\.com/.test(u)) return 'video'
  if (/github\.com|gitlab\.com/.test(u)) return 'repo'
  if (/figma\.com|dribbble\.com|behance\.net/.test(u)) return 'design'
  if (/docs\.google\.com|notion\.so|\.pdf$/.test(u)) return 'doc'
  if (/medium\.com|substack\.com|dev\.to|\/blog\//.test(u)) return 'article'
  return 'link'
}

export async function listResources(
  ctx: Ctx,
  opts: { projectId?: string; inboxOnly?: boolean } = {},
): Promise<Resource[]> {
  let q = ctx.db.from('resources').select('*').eq('user_id', ctx.userId)
  if (opts.projectId) q = q.eq('project_id', opts.projectId)
  if (opts.inboxOnly) q = q.is('project_id', null)
  return unwrap(await q.order('created_at', { ascending: false })) as Resource[]
}

export async function captureResource(ctx: Ctx, input: ResourceCreate): Promise<Resource> {
  const v = resourceCreateSchema.parse(input)
  const resource = unwrap(
    await ctx.db.from('resources')
      .insert({ ...v, kind: v.kind ?? inferKind(v.url), user_id: ctx.userId })
      .select().single(),
  ) as Resource
  if (resource.project_id) await touchProject(ctx, resource.project_id, `Resource saved: ${resource.title}`)
  return resource
}

export async function updateResource(ctx: Ctx, id: string, input: ResourceUpdate): Promise<Resource> {
  const v = resourceUpdateSchema.parse(input)
  const resource = unwrap(
    await ctx.db.from('resources').update(v).eq('id', id).eq('user_id', ctx.userId).select().single(),
  ) as Resource
  if (resource.project_id) await touchProject(ctx, resource.project_id)
  return resource
}

export async function deleteResource(ctx: Ctx, id: string): Promise<void> {
  const { error } = await ctx.db.from('resources').delete().eq('id', id).eq('user_id', ctx.userId)
  if (error) throw new CoreError(error.message, 500)
}
