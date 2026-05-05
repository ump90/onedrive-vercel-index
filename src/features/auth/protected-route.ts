import axios from 'axios'
import sha256 from 'crypto-js/sha256'

import { getApiConfig } from '../../lib/config/api'
import { getSiteConfig } from '../../lib/config/site'
import { GraphRequestError } from '../../lib/graph/errors'
import { graphGet } from '../../lib/graph/client'
import { encodeDrivePath } from '../drive/path'

type ProtectedRouteAuthResult = {
  code: 200 | 401 | 404 | 500
  message: string
}

type DownloadUrlResponse = {
  '@microsoft.graph.downloadUrl'?: string
}

type CookieReader = {
  get: (name: string) => { value?: string } | undefined
}

function encryptToken(token: string): string {
  return sha256(token).toString()
}

function safeDecodeRoute(route: string): string {
  try {
    return decodeURIComponent(route)
  } catch {
    return route
  }
}

function routePrefixCandidates(route: string): string[] {
  const decodedRoute = safeDecodeRoute(route)
  const encodedRoute = decodedRoute
    .split('/')
    .map(part => encodeURIComponent(part))
    .join('/')

  return Array.from(new Set([route, decodedRoute, encodedRoute])).map(candidate =>
    `${candidate.toLowerCase().replace(/\/$/, '')}/`,
  )
}

function cookieNameSuffix(value: string): string {
  return Array.from(new TextEncoder().encode(value))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function getProtectedRouteTokenCookieNameForRoute(protectedRoute: string): string {
  return `odpt_${cookieNameSuffix(protectedRoute)}`
}

export function getProtectedRouteTokenCookieName(path: string): string {
  const authTokenPath = matchProtectedRoute(path)

  return authTokenPath ? getProtectedRouteTokenCookieNameForRoute(authTokenPath) : ''
}

export function getProtectedRouteTokenFromCookies(path: string, cookies: CookieReader): string | undefined {
  const cookieName = getProtectedRouteTokenCookieName(path)

  return cookieName ? cookies.get(cookieName)?.value : undefined
}

export function setStoredToken(path: string, token: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const authTokenPath = matchProtectedRoute(path)

  if (!authTokenPath) {
    return
  }

  localStorage.setItem(authTokenPath, JSON.stringify(token))
  document.cookie = `${getProtectedRouteTokenCookieNameForRoute(authTokenPath)}=${encryptToken(
    token,
  )}; Path=/; Max-Age=2592000; SameSite=Lax`
  window.dispatchEvent(new Event('local-storage'))
}

export function clearStoredTokens(protectedRoutes = getSiteConfig().protectedRoutes): void {
  if (typeof window === 'undefined') {
    return
  }

  protectedRoutes.forEach(route => {
    localStorage.removeItem(route)
    document.cookie = `${getProtectedRouteTokenCookieNameForRoute(route)}=; Path=/; Max-Age=0; SameSite=Lax`
  })
  window.dispatchEvent(new Event('local-storage'))
}

export function getStoredToken(path: string): string | null {
  const authTokenPath = matchProtectedRoute(path)
  let storedToken = ''

  if (typeof window !== 'undefined' && authTokenPath) {
    try {
      storedToken = JSON.parse(localStorage.getItem(authTokenPath) as string) ?? ''
    } catch {
      storedToken = ''
    }
  }

  if (!storedToken && typeof document !== 'undefined' && authTokenPath) {
    const cookieName = getProtectedRouteTokenCookieNameForRoute(authTokenPath)
    const cookieToken = document.cookie
      .split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith(`${cookieName}=`))
      ?.split('=')
      .slice(1)
      .join('=')

    return cookieToken || null
  }

  return storedToken ? encryptToken(storedToken) : null
}

export function compareHashedToken({
  odTokenHeader,
  dotPassword,
}: {
  odTokenHeader: string
  dotPassword: string
}): boolean {
  return encryptToken(dotPassword.trim()) === odTokenHeader
}

export function matchProtectedRoute(route: string, protectedRoutes = getSiteConfig().protectedRoutes): string {
  let authTokenPath = ''
  const routeCandidates = routePrefixCandidates(route)

  for (const protectedRoute of protectedRoutes) {
    const protectedRouteCandidates = routePrefixCandidates(protectedRoute)

    if (
      protectedRoute &&
      routeCandidates.some(routeCandidate =>
        protectedRouteCandidates.some(protectedRouteCandidate => routeCandidate.startsWith(protectedRouteCandidate)),
      )
    ) {
      authTokenPath = protectedRoute
      break
    }
  }

  return authTokenPath
}

export function getAuthTokenPath(path: string, protectedRoutes = getSiteConfig().protectedRoutes): string {
  const matchPath = path.toLowerCase() + '/'
  let authTokenPath = ''

  for (let protectedRoute of protectedRoutes) {
    if (typeof protectedRoute !== 'string') {
      continue
    }

    protectedRoute = protectedRoute.toLowerCase().replace(/\/$/, '') + '/'

    if (matchPath.startsWith(protectedRoute)) {
      authTokenPath = `${protectedRoute}.password`
      break
    }
  }

  return authTokenPath
}

export async function checkProtectedRoute({
  cleanPath,
  accessToken,
  odTokenHeader,
}: {
  cleanPath: string
  accessToken: string
  odTokenHeader?: string
}): Promise<ProtectedRouteAuthResult> {
  const authTokenPath = getAuthTokenPath(cleanPath)

  if (authTokenPath === '') {
    return { code: 200, message: '' }
  }

  try {
    const token = await graphGet<DownloadUrlResponse>(
      `${getApiConfig().driveApi}/root${encodeDrivePath(authTokenPath)}`,
      accessToken,
      {
        params: {
          select: '@microsoft.graph.downloadUrl,file',
        },
      },
    )

    if (!token['@microsoft.graph.downloadUrl']) {
      return { code: 404, message: "You didn't set a password." }
    }

    const odProtectedToken = await axios.get(token['@microsoft.graph.downloadUrl'])

    if (
      !compareHashedToken({
        odTokenHeader: odTokenHeader ?? '',
        dotPassword: odProtectedToken.data.toString(),
      })
    ) {
      return { code: 401, message: 'Password required.' }
    }
  } catch (error) {
    if (error instanceof GraphRequestError && error.status === 404) {
      return { code: 404, message: "You didn't set a password." }
    }

    return { code: 500, message: 'Internal server error.' }
  }

  return { code: 200, message: 'Authenticated.' }
}
