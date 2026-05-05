import { createInstance } from 'i18next'
import { cookies, headers } from 'next/headers'

import { resources } from './resources'
import { defaultLocale, localeCookieName, normalizeLocale, resolveLocale, type Locale } from './settings'

export async function getRequestLocale(): Promise<Locale> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  const headerLocale = headerStore.get('x-next-locale')

  if (headerLocale) {
    return normalizeLocale(headerLocale)
  }

  return resolveLocale({
    acceptLanguage: headerStore.get('accept-language'),
    cookieLocale: cookieStore.get(localeCookieName)?.value,
  })
}

export async function getServerTranslation(locale?: string) {
  const resolvedLocale = normalizeLocale(locale ?? (await getRequestLocale()))
  const i18n = createInstance()

  await i18n.init({
    contextSeparator: '——',
    defaultNS: 'common',
    fallbackLng: defaultLocale,
    interpolation: {
      escapeValue: false,
    },
    keySeparator: false,
    lng: resolvedLocale,
    ns: ['common'],
    nsSeparator: false,
    pluralSeparator: '——',
    resources,
    returnNull: false,
  })

  return {
    i18n,
    locale: resolvedLocale,
    t: i18n.t.bind(i18n),
  }
}
