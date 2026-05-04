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

function encryptToken(token: string): string {
  return sha256(token).toString()
}

export function getStoredToken(path: string): string | null {
  const authTokenPath = matchProtectedRoute(path)
  const storedToken =
    typeof window !== 'undefined' && authTokenPath ? JSON.parse(localStorage.getItem(authTokenPath) as string) : ''

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

  for (const protectedRoute of protectedRoutes) {
    if (
      protectedRoute &&
      route.startsWith(
        protectedRoute
          .split('/')
          .map(part => encodeURIComponent(part))
          .join('/'),
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
