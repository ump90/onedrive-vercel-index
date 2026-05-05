import '@fortawesome/fontawesome-svg-core/styles.css'
import 'katex/dist/katex.min.css'
import 'plyr-react/plyr.css'
import '../styles/globals.css'
import '../styles/markdown-github.css'
import '../lib/fontawesome'

import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'

import siteConfig from '../../config/site.config'
import { I18nProvider } from '../features/i18n/client'
import { getRequestLocale } from '../features/i18n/server'

export const metadata: Metadata = {
  title: siteConfig.title,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <Analytics />
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  )
}
