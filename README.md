# Command Center

A private portfolio dashboard for running many projects at once without losing
track of any of them. One screen shows every project, its phase, its priority,
what the next action is, how long since anything happened to it, and what it
earns and costs. Everything is editable from the UI, a REST API, or MCP — so
Claude can read and update the board directly.

Single user. Next.js on Vercel, Postgres on Supabase.

## Why it exists

Running a lot of projects alone, the failure mode isn't building — it's
forgetting. A project goes quiet, marketing stops, and an idea or a link
evaporates because there was nowhere to put it in the five seconds available.

So the board is built around three things:

- **Staleness is loud.** Every write bumps `last_touched_at`. Projects nothing
  has touched for 10 days turn amber, 30 days turn red. It is a column, not a
  buried detail.
- **Capture costs nothing.** `⌘K` saves an idea or a link to an inbox in one
  field and one keystroke. Deciding where it belongs happens later, in triage.
- **The next action is a first-class field.** Each project carries exactly one
  `next_action`, shown inline on the board.

## Screens

| Route | What it is |
|---|---|
| `/` | The board: summary strip plus the dense priority table. Inline-editable, `j`/`k` to move, `/` to filter |
| `/p/[slug]` | One project: fields, tasks, ideas, resources, money, activity log — all edited in place |
| `/inbox` | Triage for captures with no project yet |
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

Create a project at [supabase.com](https://supabase.com), then:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
pnpm db:push          # applies supabase/migrations
pnpm db:seed          # optional sample portfolio (sign in once first)
```

Enable **GitHub** under Authentication → Providers, using a GitHub OAuth app
whose callback URL is `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.

### 2. Environment

Copy `.env.example` to `.env.local` and fill it in:

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page |
| `SUPABASE_SERVICE_ROLE_KEY` | same page — server-only, never exposed to the browser |
| `ALLOWED_EMAIL` | the single GitHub account allowed to sign in |
| `NEXT_PUBLIC_SITE_URL` | production URL; leave unset locally |

### 3. Run

```bash
pnpm dev
```

### 4. Deploy

Import the repo on Vercel, set the same environment variables, and add the
deployed URL to Supabase → Authentication → URL Configuration.

## Access control

Two independent layers, so neither is load-bearing alone:

- **RLS.** Every table carries a `user_id` and a policy of `auth.uid() = user_id`.
  The dashboard view is `security_invoker`, so it inherits the same rules.
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
