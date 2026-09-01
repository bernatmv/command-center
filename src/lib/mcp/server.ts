import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/server'
import type { Ctx } from '@/lib/core/context'
import { createProject, getProject, listProjects, updateProject } from '@/lib/core/projects'
import { addTask, completeTask, listTasks } from '@/lib/core/tasks'
import { captureIdea } from '@/lib/core/ideas'
import { captureResource } from '@/lib/core/resources'
import { recordMoney } from '@/lib/core/money'
import { logUpdate } from '@/lib/core/log'
import { portfolioBriefing } from '@/lib/core/briefing'
import { syncGitHub } from '@/lib/github/sync'
import { moneyCreateSchema, projectCreateSchema, projectUpdateSchema } from '@/lib/schemas'
import { MONEY_CADENCES, MONEY_KINDS, PRIORITIES, RESOURCE_KINDS, TASK_STATUSES } from '@/lib/types'

/** MCP tools return text; JSON keeps them parseable and compact. */
const json = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] })

/** Tools take a slug or a uuid — whichever the caller happens to have. */
const projectRef = z.string().describe('Project slug or id')
const resolve = async (ctx: Ctx, ref: string) => (await getProject(ctx, ref)).project.id

/**
 * The MCP surface. Every tool is a call into `@/lib/core`, so anything Claude
 * does here is identical to doing it in the UI — including bumping the
 * project's last-touched time and writing the activity log.
 */
export function buildServer(ctx: Ctx): McpServer {
  const server = new McpServer({ name: 'command-center', version: '1.0.0' })

  server.registerTool(
    'portfolio_briefing',
    {
      title: 'Portfolio briefing',
      description:
        'What deserves attention right now across the whole portfolio: totals, the top projects to work on and why, projects going stale, and overdue tasks. Start here when asked what to work on.',
      inputSchema: z.object({ limit: z.number().int().min(1).max(20).default(5) }),
    },
    async ({ limit }) => json(await portfolioBriefing(ctx, limit)),
  )

  server.registerTool(
    'sync_github',
    {
      title: 'Sync GitHub',
      description:
        'Pull GitHub into the board: repos pushed recently become projects, and their open issues become tasks. Also refreshes each project\'s last-commit time, which feeds the staleness signal. Runs hourly on its own; call this to force it.',
      inputSchema: z.object({
        days: z.number().int().min(1).max(365).default(90)
          .describe('How far back a repo must have been pushed to count as active'),
      }),
    },
    async ({ days }) => json(await syncGitHub(ctx, days)),
  )

  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description: 'All projects with status, phase, priority, staleness, task counts, and monthly revenue.',
      inputSchema: z.object({
        phase: z.string().optional(),
        status: z.string().optional(),
        priority: z.enum(PRIORITIES).optional(),
        tag: z.string().optional(),
        q: z.string().optional().describe('Free-text match on name, tagline, or next action'),
        stale: z.boolean().optional().describe('Only projects nothing has touched recently'),
        includeArchived: z.boolean().default(false),
      }),
    },
    async (input) => {
      const projects = await listProjects(ctx, input as never)
      return json(projects.map((p) => ({
        slug: p.slug, name: p.name, tagline: p.tagline,
        phase: p.phase, status: p.status, priority: p.priority,
        next_action: p.next_action, days_stale: p.days_stale,
        open_tasks: p.open_tasks, overdue_tasks: p.overdue_tasks,
        monthly_earnings_cents: Number(p.monthly_earnings_cents),
        monthly_cost_cents: Number(p.monthly_cost_cents),
        tags: p.tags,
        prod_url: p.prod_url, repo_url: p.repo_url,
        target_release_date: p.target_release_date,
      })))
    },
  )

  server.registerTool(
    'get_project',
    {
      title: 'Get project',
      description: 'Everything about one project: fields, tasks, ideas, resources, money entries, and recent activity.',
      inputSchema: z.object({ project: projectRef }),
    },
    async ({ project }) => json(await getProject(ctx, project)),
  )

  server.registerTool(
    'create_project',
    {
      title: 'Create project',
      description: 'Add a new project to the portfolio. Only the name is required.',
      inputSchema: projectCreateSchema,
    },
    async (input) => json(await createProject(ctx, input as never)),
  )

  server.registerTool(
    'update_project',
    {
      title: 'Update project',
      description:
        'Change any field on a project — phase, status, priority, next action, URLs, release dates, tags, notes. Only pass the fields you want changed.',
      inputSchema: projectUpdateSchema.extend({ project: projectRef }),
    },
    async ({ project, ...patch }) => json(await updateProject(ctx, project, patch as never)),
  )

  server.registerTool(
    'list_tasks',
    {
      title: 'List tasks',
      description: 'Tasks across the portfolio, or for one project. Use overdue:true to find what has slipped.',
      inputSchema: z.object({
        project: projectRef.optional(),
        open: z.boolean().default(true),
        overdue: z.boolean().default(false),
      }),
    },
    async ({ project, open, overdue }) => json(await listTasks(ctx, {
      projectId: project ? await resolve(ctx, project) : undefined,
      openOnly: open,
      overdueOnly: overdue,
    })),
  )

  server.registerTool(
    'add_task',
    {
      title: 'Add task',
      description: 'Add a pending task to a project.',
      inputSchema: z.object({
        project: projectRef,
        title: z.string(),
        priority: z.enum(PRIORITIES).default('p2'),
        status: z.enum(TASK_STATUSES).default('todo'),
        due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }),
    },
    async ({ project, ...task }) => json(await addTask(ctx, {
      ...task, project_id: await resolve(ctx, project),
    } as never)),
  )

  server.registerTool(
    'complete_task',
    {
      title: 'Complete task',
      description: 'Mark a task done by its id (get ids from list_tasks or get_project).',
      inputSchema: z.object({ task_id: z.uuid() }),
    },
    async ({ task_id }) => json(await completeTask(ctx, task_id)),
  )

  server.registerTool(
    'capture_idea',
    {
      title: 'Capture idea',
      description:
        'Save an idea. Omit the project to drop it in the inbox for triage later — capturing beats classifying.',
      inputSchema: z.object({
        title: z.string(),
        body: z.string().optional(),
        project: projectRef.optional(),
      }),
    },
    async ({ title, body, project }) => json(await captureIdea(ctx, {
      title, body, project_id: project ? await resolve(ctx, project) : null,
    })),
  )

  server.registerTool(
    'capture_resource',
    {
      title: 'Capture resource',
      description:
        'Save a link, article, video, or repo. Omit the project to send it to the inbox. The kind is inferred from the URL when not given.',
      inputSchema: z.object({
        url: z.url(),
        title: z.string().optional(),
        kind: z.enum(RESOURCE_KINDS).optional(),
        note: z.string().optional(),
        project: projectRef.optional(),
      }),
    },
    async ({ url, title, kind, note, project }) => json(await captureResource(ctx, {
      url, title: title ?? url, kind, note,
      project_id: project ? await resolve(ctx, project) : null,
    } as never)),
  )

  server.registerTool(
    'record_money',
    {
      title: 'Record cost or earning',
      description:
        'Record a cost or an earning against a project. Amounts are in cents. Monthly and yearly cadences roll up into the dashboard revenue and cost columns.',
      inputSchema: moneyCreateSchema.omit({ project_id: true }).extend({ project: projectRef }),
    },
    async ({ project, ...entry }) => json(await recordMoney(ctx, {
      ...entry, project_id: await resolve(ctx, project),
    } as never)),
  )

  server.registerTool(
    'log_update',
    {
      title: 'Log an update',
      description:
        'Record what just happened on a project and mark it as worked on. Use this after making progress so the project stops reading as stale.',
      inputSchema: z.object({ project: projectRef, body: z.string() }),
    },
    async ({ project, body }) => json(await logUpdate(ctx, {
      project_id: await resolve(ctx, project), body,
    })),
  )

  return server
}

export { MONEY_CADENCES, MONEY_KINDS }
