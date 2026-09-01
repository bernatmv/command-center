import Link from 'next/link'
import { formatMoney } from '@/lib/display'
import { cn } from '@/lib/cn'
import type { Briefing } from '@/lib/core/briefing'

/**
 * The portfolio in eight numbers. Anything that represents neglect (stale,
 * overdue, unsorted inbox) turns amber or red so a bad week is visible before
 * you have read a single project row.
 */
export function SummaryStrip({ briefing }: { briefing: Briefing }) {
  const t = briefing.totals
  const net = t.monthly_earnings_cents - t.monthly_cost_cents

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-line">
      <Stat label="Active" value={String(t.active_projects)} />
      <Stat
        label="Stale"
        value={String(t.stale_projects)}
        tone={t.very_stale_projects > 0 ? 'danger' : t.stale_projects > 0 ? 'warn' : 'ok'}
        sub={t.very_stale_projects > 0 ? `${t.very_stale_projects} over a month` : undefined}
      />
      <Stat
        label="Overdue"
        value={String(t.overdue_tasks)}
        tone={t.overdue_tasks > 0 ? 'danger' : 'ok'}
        sub={`${t.open_tasks} open`}
      />
      <Stat label="Inbox" value={String(t.inbox_items)} tone={t.inbox_items > 0 ? 'warn' : 'ok'} href="/inbox" />
      <Stat label="Revenue" value={`${formatMoney(t.monthly_earnings_cents)}/mo`} tone="ok" />
      <Stat
        label="Net"
        value={`${formatMoney(net)}/mo`}
        tone={net >= 0 ? 'ok' : 'danger'}
        sub={`${formatMoney(t.monthly_cost_cents)} cost`}
      />
    </div>
  )
}

function Stat({
  label, value, sub, tone = 'neutral', href,
}: {
  label: string; value: string; sub?: string
  tone?: 'neutral' | 'ok' | 'warn' | 'danger'; href?: string
}) {
  const toneClass = {
    neutral: 'text-text', ok: 'text-ok', warn: 'text-warn', danger: 'text-danger',
  }[tone]

  const body = (
    <div className="px-4 py-2.5 border-r border-line last:border-r-0 h-full">
      <div className="text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div className={cn('tnum text-xl font-semibold leading-tight mt-0.5', toneClass)}>{value}</div>
      <div className="text-xs text-faint h-4">{sub ?? ''}</div>
    </div>
  )

  return href
    ? <Link href={href} className="block hover:bg-panel transition-colors">{body}</Link>
    : body
}
