import '@fortawesome/fontawesome-svg-core/styles.css'

import '../styles/globals.css'
import '../styles/markdown-github.css'

import type { Metadata } from 'next'
import Script from 'next/script'
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
        <Script id="ovi-debug-bootstrap" strategy="beforeInteractive">
          {`
            (function () {
              var prefix = '[ovi-debug-bootstrap]';
              var log = function (label, payload) {
                if (payload === undefined) {
                  console.info(prefix, label);
                  return;
                }
                console.info(prefix, label, payload);
              };
              var error = function (label, payload) {
                if (payload === undefined) {
                  console.error(prefix, label);
                  return;
                }
                console.error(prefix, label, payload);
              };
              window.__OVI_DEBUG__ = { log: log, error: error };
              log('boot', {
                href: window.location.href,
                language: window.navigator.language,
                userAgent: window.navigator.userAgent
              });
              window.addEventListener('error', function (event) {
                error('window-error', {
                  message: event.message,
                  source: event.filename,
                  line: event.lineno,
                  column: event.colno
                });
              });
              window.addEventListener('unhandledrejection', function (event) {
                var reason = event.reason;
                error('unhandled-rejection', {
                  message: reason && reason.message ? reason.message : String(reason),
                  stack: reason && reason.stack ? reason.stack : undefined
                });
              });
            })();
          `}
        </Script>
      </head>
      <body>
        <AppProviders>
          <I18nProvider locale={locale}>{children}</I18nProvider>
        </AppProviders>
      </body>
    </html>
  )
}
