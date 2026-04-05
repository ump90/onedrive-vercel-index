'use client'

import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'

import '../../lib/fontawesome'

import { Analytics } from '@vercel/analytics/react'
import NextNProgress from 'nextjs-progressbar'
import { CookiesProvider } from 'react-cookie'
import { debugError, debugLog } from '../../utils/debugLog'

export default function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    debugLog('app-providers-mounted', {
      href: window.location.href,
      userAgent: window.navigator.userAgent,
      language: window.navigator.language,
    })

    const handleError = (event: ErrorEvent) => {
      debugError('window-error', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error instanceof Error ? event.error.stack : undefined,
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      debugError('unhandled-rejection', {
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return (
    <CookiesProvider defaultSetOptions={{ path: '/' }}>
      <NextNProgress height={1} color="rgb(156, 163, 175, 0.9)" options={{ showSpinner: false }} />
      <Analytics />
      {children}
    </CookiesProvider>
  )
}
