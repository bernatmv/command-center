'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'

const LINKS = [
  { href: '/', label: 'Board' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/settings', label: 'Settings' },
]

export function TopBar({ inboxCount, email }: { inboxCount: number; email?: string | null }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 h-11 flex items-center gap-1 px-4
                       border-b border-line bg-bg/85 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
        <span className="size-2 rounded-full bg-ok" />
        <span className="font-semibold tracking-tight">Command Center</span>
      </Link>

      <nav className="flex items-center gap-0.5">
        {LINKS.map((link) => {
          const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-2.5 h-7 inline-flex items-center gap-1.5 rounded-md transition-colors',
                active ? 'bg-panel-2 text-text' : 'text-muted hover:text-text hover:bg-panel',
              )}
            >
              {link.label}
              {link.href === '/inbox' && inboxCount > 0 && (
                <span className="tnum text-[10px] px-1.5 h-4 inline-flex items-center rounded-full bg-accent/20 text-accent">
                  {inboxCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={() => document.dispatchEvent(new CustomEvent('cc:open-palette'))}
          className="hidden sm:flex items-center gap-2 h-7 pl-2.5 pr-1.5 rounded-md
                     border border-line text-muted hover:text-text hover:border-line-strong transition-colors"
        >
          Quick capture
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-panel-2 border border-line">⌘K</kbd>
        </button>
        {email && <span className="hidden md:inline text-faint text-xs">{email}</span>}
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-faint hover:text-text transition-colors text-xs">Sign out</button>
        </form>
      </div>
    </header>
  )
}
