import { requireCtx, currentUser } from '@/lib/auth'
import { listProjects } from '@/lib/core/projects'
import { listIdeas } from '@/lib/core/ideas'
import { listResources } from '@/lib/core/resources'
import { TopBar } from '@/components/top-bar'
import { CommandPalette } from '@/components/command-palette'

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const ctx = await requireCtx()
  const [projects, ideas, resources, user] = await Promise.all([
    listProjects(ctx),
    listIdeas(ctx, { inboxOnly: true }),
    listResources(ctx, { inboxOnly: true }),
    currentUser(),
  ])

  return (
    <>
      <TopBar inboxCount={ideas.length + resources.length} email={user?.email} />
      <CommandPalette projects={projects.map(({ id, slug, name, phase }) => ({ id, slug, name, phase }))} />
      <main className="flex-1 flex flex-col">{children}</main>
    </>
  )
}
