# Command Center

A private single-user portfolio dashboard: Next.js (App Router) on Vercel,
Postgres on Supabase. Edited through three surfaces — the UI, a REST API, and
an MCP server.

## The one rule

**All business logic lives in `src/lib/core/`. Nothing else may contain any.**

```
src/lib/schemas.ts   Zod schemas — the only definition of valid input
src/lib/core/*.ts    Business logic: takes a Ctx (Supabase client + userId + source)
      │
      ├── src/app/actions.ts     Server Actions  → core
      ├── src/app/api/**         REST routes     → core
      └── src/app/api/mcp        MCP tools       → core
```

When adding a capability, add it to core first, then expose it from whichever
surfaces need it. Never implement a behaviour in a route handler, a server
action, or an MCP tool — the three would drift, and the point of the layout is
that they cannot.

Concretely, that means:

- Validation belongs in `src/lib/schemas.ts`, and core parses it. Surfaces pass
  raw input through.
- Every mutation must go through core so `touchProject()` runs. That is what
  keeps `last_touched_at` — and therefore the staleness column — honest.
- Caller-facing types are `z.input<...>`, not `z.infer<...>`; schema defaults
  mean the parsed output has fields no caller supplies.

## Database

Migrations are plain SQL in `supabase/migrations/`, applied with `pnpm db:push`.
There is no ORM and no generated types file — `src/lib/types.ts` holds
hand-written row types, and the enum arrays there are the source of truth that
the Zod schemas and the UI labels both derive from. Changing an enum means
editing that array *and* writing a migration.

Every table has a `user_id` and an RLS policy of `auth.uid() = user_id`. Core
also filters on `user_id` explicitly, because the API and MCP paths use the
service-role client, which bypasses RLS.

The `project_overview` view supplies the dashboard's aggregates (task counts,
normalised monthly money, `days_stale`) in one query. Extend the view rather
than adding per-row queries to the board.

## Conventions

- Dark theme only; tokens are defined in `src/app/globals.css` under `@theme`.
  Use `bg-panel`, `text-muted`, `border-line` and friends — no raw hex.
- Density is deliberate: 13px base, tight rows, `.tnum` on anything numeric.
- Colour carries signal (stale, overdue, priority, revenue). Don't decorate with it.

## Checks

```bash
pnpm check     # typecheck + lint, both must be clean
pnpm build
```
