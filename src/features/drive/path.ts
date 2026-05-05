import { posix as pathPosix } from 'path'

import { getSiteConfig } from '../../lib/config/site'

export function cleanDrivePath(
  path: string,
  { trimTrailingSlash = true }: { trimTrailingSlash?: boolean } = {},
): string {
  const cleanPath = decodeDrivePath(pathPosix.resolve('/', pathPosix.normalize(path)))

  if (trimTrailingSlash) {
    return cleanPath.replace(/\/$/, '')
  }

  return cleanPath
}

export function encodeDrivePath(path: string, baseDirectory = getSiteConfig().baseDirectory): string {
  let encodedPath = pathPosix.join(pathPosix.resolve('/', baseDirectory), path)

  if (encodedPath === '/' || encodedPath === '') {
    return ''
  }

  encodedPath = encodedPath.replace(/\/$/, '')

  return `:${encodeURIComponent(encodedPath)}`
}

export function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

export function decodeDrivePath(path: string): string {
  return path.split('/').map(decodePathSegment).join('/')
}

export function decodePathSegments(pathSegments: string[]): string[] {
  return pathSegments.map(decodePathSegment)
}

export function pathSegmentsToPath(pathSegments: string[]): string {
  if (pathSegments.length === 0) {
    return '/'
  }

  return `/${pathSegments.join('/')}`
}

export function itemPath(parentPath: string, name: string): string {
  return `${parentPath === '/' ? '' : parentPath}/${encodeURIComponent(name)}`
}

export function extractNextPageToken(nextLink?: string): string | null {
  if (!nextLink) {
    return null
  }

  return nextLink.match(/[?&]\$skiptoken=([^&]+)/i)?.[1] ?? null
}

export function sanitiseSearchQuery(query: string): string {
  const sanitisedQuery = query
    .replace(/'/g, "''")
    .replace('<', ' &lt; ')
    .replace('>', ' &gt; ')
    .replace('?', ' ')
    .replace('/', ' ')

  return encodeURIComponent(sanitisedQuery)
}
