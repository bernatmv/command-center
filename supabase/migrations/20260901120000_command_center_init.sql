-- Command Center — initial schema.
--
-- This app lives in its own schema on the shared "Mini Apps" project, matching
-- the convention used by customer_finder, map_shop, seo_optimizer, and
-- video_generator. Nothing is created in public.

create schema if not exists command_center;

-- Unqualified objects below land in command_center; auth.* is always explicit.
set search_path = command_center, public, extensions;

-- ---------------------------------------------------------------- enums

create type project_phase  as enum ('idea','plan','development','launch','marketing','maintenance');
create type project_status as enum ('idea','active','live','paused','shipped','abandoned');
create type priority       as enum ('p0','p1','p2','p3');
create type task_status    as enum ('todo','doing','blocked','done');
create type resource_kind  as enum ('link','article','video','repo','design','doc','other');
create type idea_status    as enum ('inbox','kept','converted','dropped');
create type money_kind     as enum ('cost','earning');
create type money_cadence  as enum ('one_time','monthly','yearly');
create type log_source     as enum ('ui','api','mcp');

-- ---------------------------------------------------------------- helpers

create or replace function set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- tables

create table projects (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,
  slug                text not null,
  name                text not null,
  tagline             text,
  description         text,
  phase               project_phase not null default 'idea',
  status              project_status not null default 'idea',
  priority            priority not null default 'p2',
  -- the single most important thing to do next; shown inline on the dashboard
  next_action         text,
  success_score       smallint check (success_score between 0 and 100),
  repo_url            text,
  prod_url            text,
  target_release_date date,
  released_at         date,
  tags                text[] not null default '{}',
  pinned              boolean not null default false,
  notes               text,
  -- bumped by every write through the core layer; drives the staleness signal
  last_touched_at     timestamptz not null default now(),
  archived_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, slug)
);

create table tasks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  title      text not null,
  status     task_status not null default 'todo',
  priority   priority not null default 'p2',
  due_date   date,
  done_at    timestamptz,
  position   double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- project_id null => sits in the inbox awaiting triage
create table ideas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title      text not null,
  body       text,
  status     idea_status not null default 'inbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resources (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  kind       resource_kind not null default 'link',
  title      text not null,
  url        text not null,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table money_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id   uuid not null references projects(id) on delete cascade,
  kind         money_kind not null,
  label        text not null,
  amount_cents bigint not null,
  currency     text not null default 'USD',
  cadence      money_cadence not null default 'monthly',
  occurred_on  date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table project_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  body       text not null,
  source     log_source not null default 'ui',
  created_at timestamptz not null default now()
);

create table api_tokens (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name         text not null,
  token_hash   text not null unique,
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------- indexes

create index on projects (user_id, archived_at, priority, last_touched_at desc);
create index on tasks (project_id, status);
create index on tasks (user_id, due_date) where status <> 'done';
create index on ideas (user_id, status);
create index on ideas (project_id);
create index on resources (project_id);
create index on resources (user_id, created_at desc);
create index on money_entries (project_id, kind);
create index on project_log (project_id, created_at desc);

-- ---------------------------------------------------------------- updated_at triggers

create trigger set_updated_at before update on projects      for each row execute function set_updated_at();
create trigger set_updated_at before update on tasks         for each row execute function set_updated_at();
create trigger set_updated_at before update on ideas         for each row execute function set_updated_at();
create trigger set_updated_at before update on resources     for each row execute function set_updated_at();
create trigger set_updated_at before update on money_entries for each row execute function set_updated_at();

-- ---------------------------------------------------------------- RLS

alter table projects      enable row level security;
alter table tasks         enable row level security;
alter table ideas         enable row level security;
alter table resources     enable row level security;
alter table money_entries enable row level security;
alter table project_log   enable row level security;
alter table api_tokens    enable row level security;

create policy owner_all on projects      for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on tasks         for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on ideas         for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on resources     for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on money_entries for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on project_log   for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy owner_all on api_tokens    for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------- dashboard view
-- One query backs the whole priority table. security_invoker keeps RLS applied.

create view project_overview with (security_invoker = on) as
select
  p.*,
  (select count(*) from tasks t
     where t.project_id = p.id and t.status <> 'done')::int as open_tasks,
  (select count(*) from tasks t
     where t.project_id = p.id)::int as total_tasks,
  (select count(*) from tasks t
     where t.project_id = p.id and t.status <> 'done' and t.due_date < current_date)::int as overdue_tasks,
  (select coalesce(sum(case m.cadence
       when 'monthly' then m.amount_cents
       when 'yearly'  then m.amount_cents / 12
       else 0 end), 0)
     from money_entries m
     where m.project_id = p.id and m.kind = 'earning')::bigint as monthly_earnings_cents,
  (select coalesce(sum(case m.cadence
       when 'monthly' then m.amount_cents
       when 'yearly'  then m.amount_cents / 12
       else 0 end), 0)
     from money_entries m
     where m.project_id = p.id and m.kind = 'cost')::bigint as monthly_cost_cents,
  (select coalesce(sum(m.amount_cents), 0) from money_entries m
     where m.project_id = p.id and m.kind = 'earning' and m.cadence = 'one_time')::bigint as one_time_earnings_cents,
  (select count(*) from ideas i
     where i.project_id = p.id and i.status <> 'dropped')::int as idea_count,
  (select count(*) from resources r
     where r.project_id = p.id)::int as resource_count,
  greatest(0, (extract(epoch from (now() - p.last_touched_at)) / 86400)::int) as days_stale
from projects p;

-- ---------------------------------------------------------------- grants
-- A fresh schema inherits none of the privileges Supabase pre-grants on public,
-- so PostgREST roles need them explicitly. `anon` is deliberately excluded:
-- nothing here should be readable before sign-in. RLS still guards every row.

grant usage on schema command_center to authenticated, service_role;
grant all on all tables    in schema command_center to authenticated, service_role;
grant all on all sequences in schema command_center to authenticated, service_role;
grant all on all functions in schema command_center to authenticated, service_role;

alter default privileges in schema command_center
  grant all on tables to authenticated, service_role;
alter default privileges in schema command_center
  grant all on sequences to authenticated, service_role;
