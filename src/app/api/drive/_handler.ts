import type { NextRequest } from 'next/server'

import {
  checkProtectedRoute,
  getAccessToken,
  getProtectedRouteTokenFromCookies,
  storeObfuscatedAuthTokens,
} from '../../../features/auth'
import { cleanDrivePath, getDrivePathResponse } from '../../../features/drive'
import { getApiConfig } from '../../../lib/config/api'
import {
  apiErrorResponse,
  getBooleanSearchParam,
  getSearchParam,
  jsonResponse,
  noAccessTokenResponse,
  protectedRouteErrorResponse,
  routeErrorResponse,
} from '../_shared'
import { handleRawRequest } from '../raw/_handler'

type ObfuscatedTokensBody = Parameters<typeof storeObfuscatedAuthTokens>[0]

async function readJsonBody(request: NextRequest): Promise<ObfuscatedTokensBody> {
  try {
    const body = await request.json()

    if (typeof body === 'object' && body !== null) {
      return body as ObfuscatedTokensBody
    }
  } catch {
    // Fall through to an invalid body shape.
  }

  return {
    accessTokenExpiry: undefined,
    obfuscatedAccessToken: undefined,
    obfuscatedRefreshToken: undefined,
  }
}

export async function handleDriveRequest(request: NextRequest): Promise<Response> {
  try {
    if (request.method === 'POST') {
      const stored = await storeObfuscatedAuthTokens(await readJsonBody(request))

      if (!stored) {
        return apiErrorResponse(400, 'BAD_REQUEST', 'Invalid request body')
      }

      return new Response('OK', { status: 200 })
    }

    if (getBooleanSearchParam(request, 'raw')) {
      return handleRawRequest(request)
    }

    const path = getSearchParam(request, 'path', '/')
    const next = getSearchParam(request, 'next')
    const sort = getSearchParam(request, 'sort')

    if (path === '[...path]') {
      return apiErrorResponse(400, 'BAD_REQUEST', 'No path specified.')
    }

    const cleanPath = cleanDrivePath(path)
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return noAccessTokenResponse()
    }

    const { code, message } = await checkProtectedRoute({
      cleanPath,
      accessToken,
      odTokenHeader:
        request.headers.get('od-protected-token') || getProtectedRouteTokenFromCookies(cleanPath, request.cookies),
    })

    if (code !== 200) {
      return protectedRouteErrorResponse(code, message)
    }

    const data = await getDrivePathResponse({ cleanPath, accessToken, next, sort })
    const response = jsonResponse(data)
    response.headers.set('Cache-Control', message === '' ? getApiConfig().cacheControlHeader : 'no-cache')

    return response
  } catch (error) {
    return routeErrorResponse(error)
  }
}
