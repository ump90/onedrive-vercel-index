import '@fortawesome/fontawesome-svg-core/styles.css'
import '../styles/globals.css'
import '../styles/markdown-github.css'
import '../lib/fontawesome'

import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'

import siteConfig from '../../config/site.config'

export const metadata: Metadata = {
  title: siteConfig.title,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Analytics />
        {children}
      </body>
    </html>
  )
}
