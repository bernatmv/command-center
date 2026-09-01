import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Command Center',
  description: 'Private portfolio dashboard — every project, status, and next action at a glance.',
}

/**
 * Applies the saved theme before first paint. Without this the page renders
 * light and then flips, which is worse than either theme.
 */
const NO_FLASH = `
try {
  var t = localStorage.getItem('cc-theme')
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
} catch (e) {}
`

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text">{children}</body>
    </html>
  )
}
