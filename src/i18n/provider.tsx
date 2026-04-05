'use client'

import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import { I18nextProvider } from 'react-i18next'

import { createI18nInstance } from './createInstance'
import { defaultLocale, resolveLocale } from './config'

export default function I18nProvider({
  children,
  locale = defaultLocale,
}: PropsWithChildren<{ locale?: string | null }>) {
  const resolvedLocale = resolveLocale(locale)
  const [instance] = useState(() => createI18nInstance(resolvedLocale))

  useEffect(() => {
    if (instance.resolvedLanguage !== resolvedLocale) {
      void instance.changeLanguage(resolvedLocale)
    }
  }, [instance, resolvedLocale])

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
}
