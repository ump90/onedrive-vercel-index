'use client'

import type { PropsWithChildren } from 'react'

import '../../lib/fontawesome'

import { Analytics } from '@vercel/analytics/react'
import NextNProgress from 'nextjs-progressbar'
import { CookiesProvider } from 'react-cookie'

export default function AppProviders({ children }: PropsWithChildren) {
  return (
    <CookiesProvider defaultSetOptions={{ path: '/' }}>
      <NextNProgress height={1} color="rgb(156, 163, 175, 0.9)" options={{ showSpinner: false }} />
      <Analytics />
      {children}
    </CookiesProvider>
  )
}
