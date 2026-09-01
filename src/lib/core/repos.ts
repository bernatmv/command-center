import { activeRepos, listRepos, type GhRepo } from '@/lib/github/client'
import { ACTIVE_WINDOW_DAYS, createProjectFromRepo, emptyReport, syncIssuesFor } from '@/lib/github/sync'
import type { Project } from '@/lib/types'
import { CoreError, shape, type Ctx } from './context'

export interface OnboardableRepo {
  full_name: string
  name: string
  description: string | null
  url: string
  homepage_url: string | null
  is_private: boolean
  is_archived: boolean
  pushed_at: string
  days_since_push: number
  open_issues: number
  /** True when the scheduled sync would import it anyway on its next run. */
  auto: boolean
}

const daysSince = (iso: string) =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000))

/**
 * Repos on GitHub with no project yet.
 *
 * The scheduled sync only reaches repos pushed in the last 90 days, so
 * everything older is invisible to the board until it is onboarded by hand.
 * Those are most of what this returns; anything still inside the window is
 * flagged `auto`, because the next sync would pick it up regardless.
 */
export async function listOnboardableRepos(ctx: Ctx): Promise<OnboardableRepo[]> {
  const [repos, { data }] = await Promise.all([
    listRepos(),
    ctx.db.from('projects').select('github_repo').eq('user_id', ctx.userId).not('github_repo', 'is', null),
  ])

  const taken = new Set(shape<{ github_repo: string }[]>(data ?? []).map((r) => r.github_repo))
  const auto = new Set(activeRepos(repos, ACTIVE_WINDOW_DAYS).map((r) => r.nameWithOwner))

  return repos
    .filter((r) => !r.isFork && !taken.has(r.nameWithOwner))
    .map((r) => ({
      full_name: r.nameWithOwner,
      name: r.name,
      description: r.description,
      url: r.url,
      homepage_url: r.homepageUrl,
      is_private: r.isPrivate,
      is_archived: r.isArchived,
      pushed_at: r.pushedAt,
      days_since_push: daysSince(r.pushedAt),
      open_issues: r.openIssueCount,
      auto: auto.has(r.nameWithOwner),
    }))
}

/**
 * Bring specific repos onto the board, whatever their age, and pull their
 * issues straight away rather than leaving them until the next hourly sync.
 */
export async function onboardRepos(ctx: Ctx, fullNames: string[]) {
  if (fullNames.length === 0) throw new CoreError('No repositories given', 400)

  const wanted = new Set(fullNames)
  const repos = (await listRepos()).filter((r) => wanted.has(r.nameWithOwner))

  const missing = [...wanted].filter((n) => !repos.some((r) => r.nameWithOwner === n))
  if (missing.length) throw new CoreError(`Not found on GitHub: ${missing.join(', ')}`, 404)

  const { data } = await ctx.db
    .from('projects').select('github_repo').eq('user_id', ctx.userId).in('github_repo', [...wanted])
  const already = new Set(shape<{ github_repo: string }[]>(data ?? []).map((r) => r.github_repo))

  const report = emptyReport()
  const pairs: { repo: GhRepo; project: Project }[] = []

  for (const repo of repos) {
    if (already.has(repo.nameWithOwner)) continue
    try {
      const project = await createProjectFromRepo(ctx, repo)
      report.projects_created.push(project.slug)
      pairs.push({ repo, project })
    } catch (error) {
      report.errors.push(`${repo.nameWithOwner}: ${(error as Error).message}`)
    }
  }

  report.repos_seen = repos.length
  await syncIssuesFor(ctx, pairs, report)
  return report
}
