# Command Center

A private portfolio dashboard for running many projects at once without losing
track of any of them. One screen shows every project, its phase, its priority,
what the next action is, how long since anything happened to it, and what it
earns and costs. Everything is editable from the UI, a REST API, or MCP — so
Claude can read and update the board directly.

Single user. Next.js on Vercel, Postgres on Supabase. Light theme by default,
dark on a toggle.

## Why it exists

Running a lot of projects alone, the failure mode isn't building — it's
forgetting. A project goes quiet, marketing stops, and an idea or a link
evaporates because there was nowhere to put it in the five seconds available.

So the board is built around three things:

- **Staleness is loud.** Every write bumps `last_touched_at`, and commits count
  too. Projects nothing has touched for 10 days turn amber, 30 days turn red.
  The board sorts by activity, so what you have been working on sits at the top
  and everything drifting away collects at the bottom. Star a project to keep it
  on top regardless.
- **Capture costs nothing.** `⌘K` saves an idea or a link to an inbox in one
  field and one keystroke. Deciding where it belongs happens later, in triage.
- **The next action is a first-class field.** Each project carries exactly one
  `next_action`, shown inline on the board.

## Screens

| Route | What it is |
|---|---|
| `/` | The board: summary strip plus the dense priority table, most recently active first with favourites on top. Inline-editable, `j`/`k` to move, `/` to filter |
| `/p/[slug]` | One project: fields, tasks, ideas, resources, money, activity log — all edited in place |
| `/inbox` | Triage for captures with no project yet |
| `/onboard` | Repos on GitHub with no project yet — pick which to bring onto the board |
| `/settings` | API tokens, and the command to register the MCP server |

## Architecture

The point of the layout is that **UI, REST, and MCP share one implementation**.

```
src/lib/schemas.ts    Zod schemas — the only definition of valid input
src/lib/core/*.ts     All business logic. Takes a Supabase client + input.
      │
      ├── src/app/(app)/**       Server Components + Server Actions
      ├── src/app/api/**         REST, session- or token-authed
      └── src/app/api/mcp        MCP tools over Streamable HTTP
```

Because every mutation funnels through core, every write — from any surface —
also bumps the project's last-touched time and appends to its activity log.
That is what makes the staleness signal trustworthy.

## Setup

### 1. Supabase

This app does **not** get its own Supabase project. It lives in the
`command_center` schema on the shared **Mini Apps** project
(`gqknhdnmakqmumxkpinw`), alongside `customer_finder`, `map_shop`,
`seo_optimizer`, and `video_generator` — one schema per small app, to stay under
the project limit. Nothing of ours touches `public`.

```bash
supabase login
supabase link --project-ref gqknhdnmakqmumxkpinw
pnpm db:status        # which of our migrations are applied
pnpm db:push          # apply pending ones
```

`pnpm db:*` runs `scripts/db.mjs`, not `supabase db push`. The project's
migration history is shared, so the CLI sees migrations it has no local files
for and refuses to run — and the repair it suggests would mark the *other* apps'
migrations as reverted. The script applies our files through the Management API
and records only our own versions.

Two settings on the shared project are already configured, and are worth knowing
about because they are global:

- PostgREST's exposed schemas include `command_center` (added alongside
  `public`, not replacing it).
- Authentication → Providers → **GitHub**, with a GitHub OAuth app whose
  callback URL is `https://gqknhdnmakqmumxkpinw.supabase.co/auth/v1/callback`.
- Authentication → URL Configuration: site URL `http://localhost:3100`, with the
  redirect allow list covering it. Add the Vercel URL here when deploying —
  append, don't replace, since other apps may rely on this list.

### 2. Environment

Copy `.env.example` to `.env.local` and fill it in:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Mini Apps → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | same page — server-only, never exposed to the browser |
| `ALLOWED_EMAIL` | the single GitHub account allowed to sign in |
| `NEXT_PUBLIC_SITE_URL` | production URL; leave unset locally |

### 3. Run

```bash
pnpm dev     # http://localhost:3100
```

Port 3100, not 3000 — 3000 is usually taken by another local app.

### 4. Deploy

Import the repo on Vercel, set the same environment variables plus
`NEXT_PUBLIC_SITE_URL`, and add the deployed URL to the Mini Apps project under
Authentication → URL Configuration (redirect allow list).

## GitHub sync

The board fills itself from GitHub. Every repo you own that has been pushed in
the last 90 days becomes a project (forks excluded), and its open issues become
tasks.

**Staleness counts commits.** `days_stale` measures from the later of
`last_touched_at` (you did something in the app) and `last_commit_at` (you
pushed to the repo). A repo you are actively developing never reads as
abandoned just because you haven't opened the dashboard — and equally, a project
with no repo still goes stale if you ignore it.

**Tasks and issues stay in step, both ways.**

| In the app | On GitHub |
|---|---|
| Add a task | Issue opened, linked back to the task |
| Rename a task | Issue renamed |
| Complete a task | Issue closed |
| Reopen a task | Issue reopened |
| Delete a task | Issue closed with a comment saying why |
| — | Issue opened → task appears |
| — | Issue closed → task marked done |

On a pull, GitHub wins: the app pushes its own changes the moment they happen,
so anything different on GitHub by sync time is news. Pushes are best-effort —
if GitHub is unreachable the task edit still succeeds, and the failure is
recorded on the project's activity log rather than thrown at you.

Syncing is per-project (`sync_issues`, on by default, toggled on the project
page) so a project whose tasks are marketing chores doesn't litter its repo.
Projects without a repo — ideas at the planning stage — work exactly as before.

**When it runs.** Hourly, via a Vercel Cron hitting `/api/cron/sync` (see
`vercel.json`), authenticated with `CRON_SECRET`. Force it with the **Sync**
button on the board, `pnpm sync` locally, `POST /api/sync`, or the
`sync_github` MCP tool.

**Older repos.** The sync deliberately only reaches the last 90 days, so a repo
you haven't touched in a year never appears on its own. `/onboard` lists every
repo with no project — mostly the back catalogue — and adds the ones you pick,
pulling their issues immediately. Anything still inside the 90-day window is
flagged `auto` there, because the next sync would import it anyway.

## Access control

Two independent layers, so neither is load-bearing alone:

- **RLS.** Every table carries a `user_id` and a policy of `auth.uid() = user_id`.
  The dashboard view is `security_invoker`, so it inherits the same rules. The
  `command_center` schema grants to `authenticated` and `service_role` only —
  `anon` cannot reach it at all, which matters on a shared project.
- **An email gate.** `/auth/callback` signs out any account whose email isn't
  `ALLOWED_EMAIL`, so publishing the OAuth app can't hand anyone else a session.

API tokens are stored only as SHA-256 hashes and compared in constant time.

## REST API

Authenticate with `Authorization: Bearer <token>` (created in Settings) or a
browser session. Responses are `{ "data": ... }`, errors `{ "error": ... }`.

| Method | Path |
|---|---|
| `GET` `POST` | `/api/projects` |
| `GET` `PATCH` `DELETE` | `/api/projects/[slug]` |
| `GET` `POST` | `/api/tasks` · `/api/ideas` · `/api/resources` · `/api/money` |
| `PATCH` `DELETE` | `/api/tasks/[id]` · `/api/ideas/[id]` · `/api/resources/[id]` · `/api/money/[id]` |
| `GET` | `/api/briefing` |

```bash
curl -H "Authorization: Bearer $CC_TOKEN" https://your-app.vercel.app/api/briefing
```

## MCP

Register once, then Claude can read and edit the whole board:

```bash
claude mcp add --transport http command-center \
  https://your-app.vercel.app/api/mcp \
  --header "Authorization: Bearer YOUR_TOKEN"
```

Tools: `portfolio_briefing`, `list_projects`, `get_project`, `create_project`,
`update_project`, `list_tasks`, `add_task`, `complete_task`, `capture_idea`,
`capture_resource`, `record_money`, `log_update`.

`portfolio_briefing` is the one to reach for first — it returns what is stale,
what is overdue, and which projects most deserve attention, with the reason for
each.
