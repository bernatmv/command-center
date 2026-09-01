import { notFound } from 'next/navigation'
import { requireCtx } from '@/lib/auth'
import { getProject } from '@/lib/core/projects'
import { CoreError } from '@/lib/core/context'
import { ProjectHeader } from '@/components/project/project-header'
import { IdeaPanel, LogPanel, MoneyPanel, NotesPanel, ResourcePanel, TaskPanel } from '@/components/project/project-panels'

export default async function ProjectPage({ params }: PageProps<'/p/[slug]'>) {
  const { slug } = await params
  const ctx = await requireCtx()

  let detail
  try {
    detail = await getProject(ctx, slug)
  } catch (error) {
    if (error instanceof CoreError && error.status === 404) notFound()
    throw error
  }

  const { project, tasks, ideas, resources, money, log } = detail

  return (
    <>
      <ProjectHeader project={project} />

      <div className="grid gap-3 p-3 lg:grid-cols-3 items-start">
        <div className="space-y-3">
          <TaskPanel slug={project.slug} projectId={project.id} tasks={tasks} />
          <NotesPanel slug={project.slug} notes={project.notes} />
        </div>

        <div className="space-y-3">
          <IdeaPanel projectId={project.id} ideas={ideas} />
          <ResourcePanel projectId={project.id} resources={resources} />
        </div>

        <div className="space-y-3">
          <MoneyPanel slug={project.slug} projectId={project.id} money={money} />
          <LogPanel slug={project.slug} projectId={project.id} log={log} />
        </div>
      </div>
    </>
  )
}
