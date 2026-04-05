import '@fortawesome/fontawesome-svg-core/styles.css'

import '../styles/globals.css'
import '../styles/markdown-github.css'
import '../lib/fontawesome'

import type { Metadata } from 'next'
import type { PropsWithChildren } from 'react'

import siteConfig from '../../config/site.config'

export const metadata: Metadata = {
  title: siteConfig.title,
  description: 'OneDrive Vercel Index',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {siteConfig.googleFontLinks.map((link: string) => (
          <link key={link} rel="stylesheet" href={link} />
        ))}
      </head>
      <body>{children}</body>
    </html>
  )
}
