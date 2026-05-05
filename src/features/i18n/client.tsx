'use client'

import type { ReactNode } from 'react'

import { createInstance, type i18n as I18nInstance } from 'i18next'
import { useEffect, useState } from 'react'
import { I18nextProvider, Trans, initReactI18next, useTranslation } from 'react-i18next'

import { resources } from './resources'
import { defaultLocale, localeCookieName, normalizeLocale, type Locale } from './settings'

function createClientI18n(locale: Locale): I18nInstance {
  const instance = createInstance()

  void instance.use(initReactI18next).init({
    contextSeparator: '——',
    defaultNS: 'common',
    fallbackLng: defaultLocale,
    initImmediate: false,
    interpolation: {
      escapeValue: false,
    },
    keySeparator: false,
    lng: locale,
    ns: ['common'],
    nsSeparator: false,
    pluralSeparator: '——',
    react: {
      useSuspense: false,
    },
    resources,
    returnNull: false,
  })

  return instance
}

export function setLocaleCookie(locale: Locale) {
  document.cookie = `${localeCookieName}=${encodeURIComponent(locale)}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export function I18nProvider({ children, locale }: { children: ReactNode; locale: string }) {
  const resolvedLocale = normalizeLocale(locale)
  const [i18n] = useState(() => createClientI18n(resolvedLocale))

  useEffect(() => {
    if (normalizeLocale(i18n.resolvedLanguage || i18n.language) !== resolvedLocale) {
      void i18n.changeLanguage(resolvedLocale)
    }
  }, [i18n, resolvedLocale])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

export { Trans, useTranslation }
