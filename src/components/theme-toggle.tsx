'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

const KEY = 'cc-theme'

/**
 * The <html> attribute is the source of truth — an inline script in the layout
 * sets it before first paint — and localStorage is only persistence.
 *
 * Read through useSyncExternalStore rather than an effect: it hydrates from the
 * server snapshot and then re-reads the real value, which is exactly the
 * problem it exists to solve.
 */
const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  // Other tabs change the same setting.
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

const getSnapshot = (): Theme =>
  document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'

const getServerSnapshot = (): Theme => 'light'

function apply(theme: Theme) {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  else document.documentElement.removeAttribute('data-theme')
  try { localStorage.setItem(KEY, theme) } catch { /* private browsing */ }
  listeners.forEach((notify) => notify())
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => apply(dark ? 'light' : 'dark')}
      title={dark ? 'Switch to light' : 'Switch to dark'}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="text-faint hover:text-text transition-colors"
    >
      {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </button>
  )
}
