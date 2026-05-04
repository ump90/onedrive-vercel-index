import type { ParsedUrlQuery } from 'querystring'

/**
 * Convert a Next catch-all route query into the encoded OneDrive path string used by API calls.
 */
export function queryToPath(query?: ParsedUrlQuery): string {
  if (!query) {
    return '/'
  }

  const { path } = query
  if (!path) {
    return '/'
  }

  if (typeof path === 'string') {
    return `/${encodeURIComponent(path)}`
  }

  return `/${path.map(p => encodeURIComponent(p)).join('/')}`
}
