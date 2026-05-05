export const defaultLocale = 'en'
export const localeCookieName = 'NEXT_LOCALE'

export const locales = ['de-DE', 'en', 'es', 'zh-CN', 'hi', 'id', 'tr-TR', 'zh-TW'] as const

export type Locale = (typeof locales)[number]

export const localeLabels: Record<Locale, string> = {
  'de-DE': '🇩🇪 Deutsch',
  en: '🇬🇧 English',
  es: '🇪🇸 Español',
  'zh-CN': '🇨🇳 简体中文',
  hi: '🇮🇳 हिन्दी',
  id: '🇮🇩 Indonesia',
  'tr-TR': '🇹🇷 Türkçe',
  'zh-TW': '🇹🇼 繁體中文',
}

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale))
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value) {
    return defaultLocale
  }

  if (isLocale(value)) {
    return value
  }

  const lowerValue = value.toLowerCase()
  const exactMatch = locales.find(locale => locale.toLowerCase() === lowerValue)

  if (exactMatch) {
    return exactMatch
  }

  const languageMatch = locales.find(locale => locale.toLowerCase().split('-')[0] === lowerValue.split('-')[0])

  return languageMatch ?? defaultLocale
}

export function resolveLocaleFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) {
    return defaultLocale
  }

  const acceptedLocales = header
    .split(',')
    .map(part => {
      const [tag, quality = 'q=1'] = part.trim().split(';')
      const parsedQuality = Number.parseFloat(quality.replace(/^q=/, ''))

      return { quality: Number.isFinite(parsedQuality) ? parsedQuality : 1, tag }
    })
    .filter(({ tag }) => Boolean(tag))
    .sort((a, b) => b.quality - a.quality)

  for (const { tag } of acceptedLocales) {
    const locale = normalizeLocale(tag)

    if (locale !== defaultLocale || tag.toLowerCase().startsWith(defaultLocale)) {
      return locale
    }
  }

  return defaultLocale
}

export function resolveLocale(options: {
  acceptLanguage?: string | null
  cookieLocale?: string | null
  pathLocale?: string | null
}): Locale {
  if (isLocale(options.pathLocale)) {
    return options.pathLocale
  }

  if (isLocale(options.cookieLocale)) {
    return options.cookieLocale
  }

  return resolveLocaleFromAcceptLanguage(options.acceptLanguage)
}

export function splitLocaleFromSegments(pathSegments: string[]): { locale: Locale | null; pathSegments: string[] } {
  const [firstSegment, ...restSegments] = pathSegments

  if (isLocale(firstSegment)) {
    return { locale: firstSegment, pathSegments: restSegments }
  }

  return { locale: null, pathSegments }
}

export function stripLocalePrefixFromPathname(pathname: string): string {
  const match = pathname.match(/^([^?#]*)([?#].*)?$/)
  const pathOnly = match?.[1] || '/'
  const suffix = match?.[2] || ''
  const segments = pathOnly.split('/').filter(Boolean)
  const { pathSegments } = splitLocaleFromSegments(segments)
  const strippedPath = `/${pathSegments.join('/')}`.replace(/\/$/, '') || '/'

  return `${strippedPath}${suffix}`
}
