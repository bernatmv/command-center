import { requireCtx } from '@/lib/auth'
import { listProjects } from '@/lib/core/projects'
import { listIdeas } from '@/lib/core/ideas'
import { listResources } from '@/lib/core/resources'
import { InboxList } from '@/components/inbox-list'

export default async function InboxPage() {
  const ctx = await requireCtx()
  const [ideas, resources, projects] = await Promise.all([
    listIdeas(ctx, { inboxOnly: true }),
    listResources(ctx, { inboxOnly: true }),
    listProjects(ctx),
  ])

  return (
    <InboxList
      ideas={ideas}
      resources={resources}
      projects={projects.map(({ id, slug, name }) => ({ id, slug, name }))}
    />
  )
}
