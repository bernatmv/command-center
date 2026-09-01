-- Drop the success score. It asked for a 0–100 judgement that never had a
-- defensible answer, so it stayed empty and added a control to every project
-- page for nothing.

set search_path = command_center, public, extensions;

-- The view selects projects.*, so it holds a resolved column list and pins the
-- column. Rebuild it around the narrower table.
drop view project_overview;

alter table projects drop column success_score;

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
