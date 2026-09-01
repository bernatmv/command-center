-- Sample portfolio, attached to the first (and only) auth user.
-- Safe to run more than once: it clears its own rows first.
--
-- Sign in to the dashboard once before running this, so an auth user exists.

do $$
declare
  owner uuid;
  p_forkcast uuid; p_tripo uuid; p_meshy uuid; p_cal uuid; p_vid uuid; p_old uuid;
begin
  select id into owner from auth.users order by created_at limit 1;
  if owner is null then
    raise notice 'No auth user found — sign in to the dashboard once, then re-run this seed.';
    return;
  end if;

  delete from projects where user_id = owner;
  delete from ideas where user_id = owner and project_id is null;
  delete from resources where user_id = owner and project_id is null;

  -- Live and earning, but marketing has gone quiet.
  insert into projects (user_id, slug, name, tagline, phase, status, priority, next_action,
                        success_score, prod_url, repo_url, released_at, tags, last_touched_at)
  values (owner, 'forkcast', 'Forkcast', 'AI meal-planning copilot — pantry to grocery order.',
          'marketing', 'live', 'p0', 'Write the launch retrospective thread',
          72, 'https://forkcast.app', 'https://github.com/example/forkcast',
          current_date - 40, '{saas,ai}', now() - interval '2 days')
  returning id into p_forkcast;

  -- The active build.
  insert into projects (user_id, slug, name, tagline, phase, status, priority, next_action,
                        success_score, repo_url, target_release_date, tags, last_touched_at)
  values (owner, 'tripo-bot', 'Tripo Bot', '3D asset generation pipeline as a Discord bot.',
          'development', 'active', 'p0', 'Finish the auth flow, then ship the beta',
          40, 'https://github.com/example/tripo-bot', current_date + 18, '{ai,3d}', now() - interval '1 day')
  returning id into p_tripo;

  -- Quietly going stale — the case this dashboard exists for.
  insert into projects (user_id, slug, name, tagline, phase, status, priority, next_action,
                        success_score, repo_url, tags, last_touched_at)
  values (owner, 'meshy-kit', 'Meshy Kit', 'React component kit for 3D product configurators.',
          'development', 'active', 'p1', 'Decide whether this is still worth finishing',
          25, 'https://github.com/example/meshy-kit', '{oss,react}', now() - interval '17 days')
  returning id into p_meshy;

  -- Barely started, and forgotten.
  insert into projects (user_id, slug, name, tagline, phase, status, priority, next_action, tags, last_touched_at)
  values (owner, 'cal-sync', 'Cal Sync', 'Two-way calendar sync without a server.',
          'plan', 'idea', 'p2', 'Validate that the CalDAV approach actually works',
          '{tool}', now() - interval '44 days')
  returning id into p_cal;

  -- Small but profitable.
  insert into projects (user_id, slug, name, tagline, phase, status, priority, next_action,
                        success_score, prod_url, released_at, tags, last_touched_at)
  values (owner, 'vidtool', 'Vidtool', 'Batch video captioning for short-form creators.',
          'marketing', 'live', 'p1', 'Ship the affiliate program',
          61, 'https://vidtool.io', current_date - 120, '{saas}', now() - interval '6 days')
  returning id into p_vid;

  -- Kept for the revenue, no longer worked on.
  insert into projects (user_id, slug, name, tagline, phase, status, priority,
                        success_score, prod_url, released_at, tags, last_touched_at)
  values (owner, 'legacy-invoicer', 'Legacy Invoicer', 'Invoicing app kept alive for its handful of paying users.',
          'maintenance', 'paused', 'p3', 30, 'https://invoicer.example.com',
          current_date - 900, '{saas,legacy}', now() - interval '120 days')
  returning id into p_old;

  -- Tasks: a mix of open, overdue, and done.
  insert into tasks (user_id, project_id, title, status, priority, due_date, done_at) values
    (owner, p_forkcast, 'Launch retrospective thread', 'todo',  'p0', current_date + 2, null),
    (owner, p_forkcast, 'Add allergen disclaimer to onboarding', 'doing', 'p1', current_date - 3, null),
    (owner, p_forkcast, 'Ship the public changelog', 'done',  'p2', null, now() - interval '5 days'),
    (owner, p_tripo,    'Finish GitHub OAuth flow', 'doing', 'p0', current_date + 1, null),
    (owner, p_tripo,    'Rate-limit the generation queue', 'todo', 'p1', current_date + 6, null),
    (owner, p_tripo,    'Write the bot README', 'todo', 'p2', null, null),
    (owner, p_tripo,    'Set up the staging environment', 'done', 'p1', null, now() - interval '2 days'),
    (owner, p_meshy,    'Decide: finish or archive', 'blocked', 'p1', current_date - 9, null),
    (owner, p_meshy,    'Publish v0.2 to npm', 'todo', 'p2', null, null),
    (owner, p_cal,      'Prototype CalDAV read path', 'todo', 'p2', null, null),
    (owner, p_vid,      'Affiliate program landing page', 'todo', 'p1', current_date + 9, null),
    (owner, p_vid,      'Answer the two open support emails', 'todo', 'p0', current_date - 1, null),
    (owner, p_old,      'Renew the TLS certificate', 'todo', 'p3', current_date + 40, null);

  -- Money: monthly and yearly roll up into the dashboard columns.
  insert into money_entries (user_id, project_id, kind, label, amount_cents, cadence, occurred_on) values
    (owner, p_forkcast, 'earning', 'Subscriptions', 34000, 'monthly', current_date),
    (owner, p_forkcast, 'cost',    'Vercel Pro',     2000, 'monthly', current_date),
    (owner, p_forkcast, 'cost',    'OpenAI usage',   1800, 'monthly', current_date),
    (owner, p_tripo,    'cost',    'GPU credits',    4500, 'monthly', current_date),
    (owner, p_meshy,    'cost',    'Domain',         1400, 'yearly',  current_date),
    (owner, p_vid,      'earning', 'Subscriptions',  9500, 'monthly', current_date),
    (owner, p_vid,      'cost',    'Supabase',       2500, 'monthly', current_date),
    (owner, p_old,      'earning', 'Legacy plans',   1200, 'monthly', current_date),
    (owner, p_old,      'cost',    'Hosting',         500, 'monthly', current_date);

  -- Ideas: some filed, some still in the inbox.
  insert into ideas (user_id, project_id, title, status) values
    (owner, p_forkcast, 'Weekly "what to cook" email digest', 'kept'),
    (owner, p_tripo,    'Let users upload reference images', 'kept'),
    (owner, null, 'A tiny tool that turns a repo into a changelog site', 'inbox'),
    (owner, null, 'Newsletter about solo-founder economics', 'inbox');

  insert into resources (user_id, project_id, kind, title, url) values
    (owner, p_forkcast, 'article', 'How Notion did their public launch', 'https://example.com/notion-launch'),
    (owner, p_tripo,    'repo',    'discord.js guide', 'https://github.com/discordjs/discord.js'),
    (owner, null, 'video', 'Pricing for solo SaaS', 'https://youtube.com/watch?v=example'),
    (owner, null, 'link',  'Indie Hackers thread on churn', 'https://indiehackers.com/post/example');

  insert into project_log (user_id, project_id, body, source) values
    (owner, p_forkcast, 'Shipped public changelog', 'ui'),
    (owner, p_tripo,    'Staging environment up and running', 'ui'),
    (owner, p_meshy,    'Paused to focus on Tripo Bot', 'ui');

  raise notice 'Seeded 6 projects for user %', owner;
end $$;
