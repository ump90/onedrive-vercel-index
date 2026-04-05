export const defaultLocale = 'en'
export const locales = ['de-DE', 'en', 'es', 'zh-CN', 'hi', 'id', 'tr-TR', 'zh-TW'] as const
export const localeCookieName = 'NEXT_LOCALE'

export type AppLocale = (typeof locales)[number]

const languageFallbackMap: Record<string, AppLocale> = {
  de: 'de-DE',
  en: 'en',
  es: 'es',
  hi: 'hi',
  id: 'id',
  tr: 'tr-TR',
  zh: 'zh-CN',
}

export function localeText(locale: string): string {
  switch (locale) {
    case 'de-DE':
      return '🇩🇪 Deutsch'
    case 'en':
      return '🇬🇧 English'
    case 'es':
      return '🇪🇸 Español'
    case 'zh-CN':
      return '🇨🇳 简体中文'
    case 'hi':
      return '🇮🇳 हिन्दी'
    case 'id':
      return '🇮🇩 Indonesia'
    case 'tr-TR':
      return '🇹🇷 Türkçe'
    case 'zh-TW':
      return '🇹🇼 繁體中文'
    default:
      return '🇬🇧 English'
  }
}

export function resolveLocale(value?: string | null): AppLocale {
  if (!value) {
    return defaultLocale
  }

  const normalized = decodeURIComponent(value).trim()
  const exactMatch = locales.find(locale => locale.toLowerCase() === normalized.toLowerCase())
  if (exactMatch) {
    return exactMatch
  }

  const baseLanguage = normalized.split('-')[0].toLowerCase()
  return languageFallbackMap[baseLanguage] ?? defaultLocale
}

export function getCookieLocale(cookieHeader?: string | null): AppLocale {
  if (!cookieHeader) {
    return defaultLocale
  }

  const match = cookieHeader.match(new RegExp(`(?:^|; )${localeCookieName}=([^;]+)`))
  return resolveLocale(match?.[1])
}

export function getPreferredLocale(cookieHeader?: string | null, acceptLanguage?: string | string[] | null): AppLocale {
  const cookieLocale = getCookieLocale(cookieHeader)
  if (cookieLocale !== defaultLocale || cookieHeader?.includes(`${localeCookieName}=`)) {
    return cookieLocale
  }

  const acceptLanguageValue = Array.isArray(acceptLanguage) ? acceptLanguage.join(',') : acceptLanguage
  const candidates = acceptLanguageValue
    ?.split(',')
    .map(item => item.split(';')[0]?.trim())
    .filter(Boolean)

  if (candidates?.length) {
    return resolveLocale(candidates[0])
  }

  return defaultLocale
}
