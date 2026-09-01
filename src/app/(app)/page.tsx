import { requireCtx } from '@/lib/auth'
import { listProjects } from '@/lib/core/projects'
import { portfolioBriefing } from '@/lib/core/briefing'
import { SummaryStrip } from '@/components/summary-strip'
import { ProjectTable } from '@/components/project-table'

export default async function BoardPage() {
  const ctx = await requireCtx()
  const [projects, briefing] = await Promise.all([
    listProjects(ctx, { includeArchived: false }),
    portfolioBriefing(ctx),
  ])

  return (
    <>
      <SummaryStrip briefing={briefing} />
      <ProjectTable projects={projects} />
    </>
  )
}
