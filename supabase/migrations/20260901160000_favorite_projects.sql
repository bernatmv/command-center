-- "Favorite" is the word used for this on the board; make the column match so
-- the UI, REST API, and MCP tools all name the concept the same way.

set search_path = command_center, public, extensions;

alter table projects rename column pinned to favorite;

-- The board's default ordering is now favorites first, then stalest.
drop index if exists projects_user_id_archived_at_priority_last_touched_at_idx;
create index projects_board_order_idx
  on projects (user_id, archived_at, favorite desc, last_touched_at);

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
