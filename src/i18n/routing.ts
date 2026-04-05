import { locales, type AppLocale } from './config'

export function getRouteLocale(routeSegments?: string[]): AppLocale | undefined {
  const firstSegment = routeSegments?.[0]
  if (!firstSegment) {
    return undefined
  }

  return locales.find(locale => locale.toLowerCase() === firstSegment.toLowerCase())
}

export function resolveRouteContext(routeSegments?: string[]) {
  const locale = getRouteLocale(routeSegments)

  return {
    locale,
    driveSegments: locale ? (routeSegments?.slice(1) ?? []) : (routeSegments ?? []),
  }
}

export function getLocalePrefix(locale?: string | null) {
  return locale ? `/${encodeURIComponent(locale)}` : ''
}

export function prefixPathWithLocale(path: string, locale?: string | null) {
  const localePrefix = getLocalePrefix(locale)

  if (!localePrefix) {
    return path
  }

  if (path === '/') {
    return localePrefix
  }

  return `${localePrefix}${path}`
}
