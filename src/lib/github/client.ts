import { CoreError } from '@/lib/core/context'

/**
 * Thin GitHub API wrapper. Only the handful of calls the sync needs — no SDK,
 * since that would be a large dependency for six endpoints.
 */

const API = 'https://api.github.com'

function token(): string {
  const value = process.env.GITHUB_TOKEN
  if (!value) throw new CoreError('GITHUB_TOKEN is not set; GitHub sync is unavailable', 503)
  return value
}

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new CoreError(`GitHub ${init.method ?? 'GET'} ${path} failed: ${res.status} ${await res.text()}`, 502)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${API}/graphql`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  const payload = await res.json() as { data?: T; errors?: { message: string }[] }
  if (payload.errors?.length) throw new CoreError(`GitHub GraphQL: ${payload.errors[0].message}`, 502)
  if (!payload.data) throw new CoreError('GitHub GraphQL returned no data', 502)
  return payload.data
}

export interface GhRepo {
  nameWithOwner: string
  name: string
  description: string | null
  url: string
  homepageUrl: string | null
  isFork: boolean
  isArchived: boolean
  isPrivate: boolean
  pushedAt: string
  openIssueCount: number
}

/**
 * Repos the user owns that have been pushed within `days`.
 *
 * One GraphQL call rather than REST pagination, because it also gives the open
 * issue count — which lets the sync skip fetching issues for the ~40 repos
 * that have none.
 */
export async function listActiveRepos(days: number): Promise<GhRepo[]> {
  type Node = Omit<GhRepo, 'openIssueCount'> & { issues: { totalCount: number } }
  const data = await graphql<{ viewer: { repositories: { nodes: Node[] } } }>(`
    query {
      viewer {
        repositories(first: 100, orderBy: {field: PUSHED_AT, direction: DESC}, affiliations: [OWNER]) {
          nodes {
            nameWithOwner name description url homepageUrl
            isFork isArchived isPrivate pushedAt
            issues(states: OPEN) { totalCount }
          }
        }
      }
    }
  `)

  const cutoff = Date.now() - days * 86_400_000
  return data.viewer.repositories.nodes
    .filter((r) => new Date(r.pushedAt).getTime() > cutoff)
    .map(({ issues, ...rest }) => ({ ...rest, openIssueCount: issues.totalCount }))
}

export interface GhIssue {
  number: number
  title: string
  state: 'open' | 'closed'
  html_url: string
  updated_at: string
}

interface GqlIssue { number: number; title: string; state: string; url: string; updatedAt: string }

const ISSUE_FIELDS = 'nodes { number title state url updatedAt }'

/**
 * Every open issue, plus any issue touched since `since` so closures are seen.
 *
 * GraphQL rather than REST: the REST `/issues` endpoint returns pull requests
 * alongside issues, and on a repo with a lot of PR traffic they crowd the open
 * issues out of the first page entirely. GraphQL's `issues` connection is
 * issues only.
 */
export async function listIssues(repo: string, since?: string): Promise<GhIssue[]> {
  const [owner, name] = repo.split('/')

  const recent = since
    ? `recent: issues(first: 100, filterBy: {since: $since}, orderBy: {field: UPDATED_AT, direction: DESC}) { ${ISSUE_FIELDS} }`
    : ''

  const data = await graphql<{ repository: { open: { nodes: GqlIssue[] }; recent?: { nodes: GqlIssue[] } } }>(
    `query($owner: String!, $name: String!${since ? ', $since: DateTime!' : ''}) {
       repository(owner: $owner, name: $name) {
         open: issues(states: OPEN, first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) { ${ISSUE_FIELDS} }
         ${recent}
       }
     }`,
    since ? { owner, name, since } : { owner, name },
  )

  // Merge by number: an issue can appear in both connections.
  const merged = new Map<number, GhIssue>()
  for (const node of [...(data.repository.open.nodes), ...(data.repository.recent?.nodes ?? [])]) {
    merged.set(node.number, {
      number: node.number,
      title: node.title,
      state: node.state.toLowerCase() === 'closed' ? 'closed' : 'open',
      html_url: node.url,
      updated_at: node.updatedAt,
    })
  }
  return [...merged.values()]
}

export const createIssue = (repo: string, title: string, body?: string) =>
  rest<GhIssue>(`/repos/${repo}/issues`, { method: 'POST', body: JSON.stringify({ title, body }) })

export const setIssueState = (repo: string, number: number, state: 'open' | 'closed') =>
  rest<GhIssue>(`/repos/${repo}/issues/${number}`, { method: 'PATCH', body: JSON.stringify({ state }) })

export const setIssueTitle = (repo: string, number: number, title: string) =>
  rest<GhIssue>(`/repos/${repo}/issues/${number}`, { method: 'PATCH', body: JSON.stringify({ title }) })

export const commentOnIssue = (repo: string, number: number, body: string) =>
  rest<unknown>(`/repos/${repo}/issues/${number}/comments`, { method: 'POST', body: JSON.stringify({ body }) })

/** Turn "kindle-watchlist" into "Kindle Watchlist" for a readable project name. */
export const humanizeRepoName = (name: string) =>
  name.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
