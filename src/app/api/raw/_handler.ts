import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { checkProtectedRoute, getAccessToken, getProtectedRouteTokenFromCookies } from '../../../features/auth'
import { cleanDrivePath, getRawDownloadInfo } from '../../../features/drive'
import { getApiConfig } from '../../../lib/config/api'
import {
  apiErrorResponse,
  getSearchParam,
  noAccessTokenResponse,
  protectedRouteErrorResponse,
  routeErrorResponse,
  withCorsHeaders,
} from '../_shared'

export async function handleRawRequest(request: NextRequest): Promise<Response> {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return withCorsHeaders(noAccessTokenResponse())
    }

    const path = getSearchParam(request, 'path', '/')
    const odpt = getSearchParam(request, 'odpt')

    if (path === '[...path]') {
      return withCorsHeaders(apiErrorResponse(400, 'BAD_REQUEST', 'No path specified.'))
    }

    const cleanPath = cleanDrivePath(path, { trimTrailingSlash: false })
    const odTokenHeader =
      request.headers.get('od-protected-token') || odpt || getProtectedRouteTokenFromCookies(cleanPath, request.cookies)
    const { code, message } = await checkProtectedRoute({ cleanPath, accessToken, odTokenHeader })

    if (code !== 200) {
      return withCorsHeaders(protectedRouteErrorResponse(code, message))
    }

    const data = await getRawDownloadInfo({ cleanPath, accessToken })

    if (!data['@microsoft.graph.downloadUrl']) {
      return withCorsHeaders(apiErrorResponse(404, 'GRAPH_NOT_FOUND', 'No download url found.'))
    }

    const downloadUrl = data['@microsoft.graph.downloadUrl']
    const cacheControl = message === '' ? getApiConfig().cacheControlHeader : 'no-cache'
    const response = NextResponse.redirect(downloadUrl)
    response.headers.set('Cache-Control', cacheControl)

    return withCorsHeaders(response)
  } catch (error) {
    return withCorsHeaders(routeErrorResponse(error))
  }
}
