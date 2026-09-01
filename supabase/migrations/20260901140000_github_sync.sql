-- GitHub integration: repos become projects, tasks mirror issues, and
-- staleness counts commits as activity rather than only in-app edits.

set search_path = command_center, public, extensions;

alter table projects
  -- "owner/name"; null for planning-stage projects that have no repo yet
  add column github_repo      text unique,
  add column last_commit_at   timestamptz,
  add column github_synced_at timestamptz,
  -- per-project switch: off for projects whose tasks are marketing chores
  add column sync_issues      boolean not null default true;

alter table tasks
  add column github_issue_number int,
  add column github_url          text;

-- One task per issue, per project.
create unique index tasks_github_issue_uniq
  on tasks (project_id, github_issue_number)
  where github_issue_number is not null;

create index projects_github_repo_idx on projects (github_repo) where github_repo is not null;

-- --------------------------------------------------------------- view rebuild
-- Staleness now means "nothing has happened here", where a commit counts as
-- something happening. Without this a repo could be actively developed and
-- still read as abandoned just because nobody opened the dashboard.

drop view project_overview;

create view project_overview with (security_invoker = on) as
select
  p.*,
  greatest(p.last_touched_at, coalesce(p.last_commit_at, p.last_touched_at)) as last_activity_at,
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
  greatest(0, (extract(epoch from (
    now() - greatest(p.last_touched_at, coalesce(p.last_commit_at, p.last_touched_at))
  )) / 86400)::int) as days_stale
from projects p;

grant all on all tables in schema command_center to authenticated, service_role;
