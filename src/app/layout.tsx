import '@fortawesome/fontawesome-svg-core/styles.css'

import '../styles/globals.css'
import '../styles/markdown-github.css'
import '../lib/fontawesome'

import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'
import { cookies, headers } from 'next/headers'

import siteConfig from '../../config/site.config'
import AppProviders from '../components/providers/AppProviders'
import { getPreferredLocale } from '../i18n/config'
import I18nProvider from '../i18n/provider'

export const metadata: Metadata = {
  title: siteConfig.title,
  description: 'OneDrive Vercel Index',
  icons: {
    icon: '/favicon.ico',
  },
}

export default async function RootLayout({ children }: PropsWithChildren) {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()])
  const locale = getPreferredLocale(cookieStore.toString(), headersList.get('accept-language'))

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {siteConfig.googleFontLinks.map((link: string) => (
          <link key={link} rel="stylesheet" href={link} />
        ))}
      </head>
      <body>
        <AppProviders>
          <I18nProvider locale={locale}>{children}</I18nProvider>
        </AppProviders>
      </body>
    </html>
  )
}
