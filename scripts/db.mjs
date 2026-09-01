#!/usr/bin/env node
/**
 * Migration runner for a shared Supabase project.
 *
 * This app is one of several sharing the "Mini Apps" project, so
 * `supabase_migrations.schema_migrations` holds other apps' migrations too.
 * `supabase db push` refuses to run against a history it doesn't fully own, and
 * its suggested repair would mark those other apps' migrations as reverted —
 * so we apply our own files through the Management API and record only our own
 * versions, leaving everyone else's history untouched.
 *
 *   node scripts/db.mjs push   # apply pending migrations from supabase/migrations
 *   node scripts/db.mjs status # show which of our migrations are applied
 *   node scripts/db.mjs sync   # trigger a GitHub sync against the local server
 */
import { readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const MIGRATIONS_DIR = 'supabase/migrations'

const ref = process.env.SUPABASE_PROJECT_REF
  ?? readFileSync('supabase/.temp/project-ref', 'utf8').trim()

function accessToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN
  try {
    // Where `supabase login` puts it on macOS.
    return execFileSync('security', ['find-generic-password', '-s', 'Supabase CLI', '-w'], {
      encoding: 'utf8',
    }).trim()
  } catch {
    throw new Error('No Supabase access token. Run `supabase login`, or set SUPABASE_ACCESS_TOKEN.')
  }
}

const token = accessToken()

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status}: ${text}`)
  return text ? JSON.parse(text) : []
}

const localMigrations = () =>
  readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((file) => ({
      file,
      version: file.split('_')[0],
      name: file.replace(/^\d+_/, '').replace(/\.sql$/, ''),
    }))

async function appliedVersions() {
  const rows = await query('select version from supabase_migrations.schema_migrations')
  return new Set(rows.map((r) => r.version))
}

const commands = {
  async status() {
    const applied = await appliedVersions()
    for (const m of localMigrations()) {
      console.log(`${applied.has(m.version) ? '✓' : '·'} ${m.version}  ${m.name}`)
    }
  },

  async push() {
    const applied = await appliedVersions()
    const pending = localMigrations().filter((m) => !applied.has(m.version))
    if (pending.length === 0) return console.log('Up to date.')

    for (const m of pending) {
      process.stdout.write(`applying ${m.version} ${m.name} … `)
      await query(readFileSync(join(MIGRATIONS_DIR, m.file), 'utf8'))
      // Record only our own version; other apps' rows are never touched.
      await query(
        `insert into supabase_migrations.schema_migrations (version, name)
         values ('${m.version}', '${m.name.replace(/'/g, "''")}')
         on conflict (version) do nothing`,
      )
      console.log('ok')
    }
  },

  /** Fires the same endpoint Vercel Cron calls, against the local dev server. */
  async sync() {
    const secret = process.env.CRON_SECRET
      ?? (readFileSync('.env.local', 'utf8').match(/^CRON_SECRET=(.+)$/m) ?? [])[1]
    if (!secret) throw new Error('CRON_SECRET not found in env or .env.local')

    const res = await fetch('http://localhost:3100/api/cron/sync', {
      headers: { Authorization: `Bearer ${secret.trim()}` },
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`)
    const r = body.data
    console.log(`${r.repos_seen} repos · +${r.projects_created.length} projects · +${r.tasks_created} tasks · ${r.tasks_closed} closed`)
    for (const e of r.errors) console.error('  !', e)
  },
}

const command = process.argv[2] ?? 'status'
if (!commands[command]) {
  console.error(`Unknown command "${command}". Use: push | status | sync`)
  process.exit(1)
}
await commands[command]().catch((error) => {
  console.error(`\n${error.message}`)
  process.exit(1)
})
