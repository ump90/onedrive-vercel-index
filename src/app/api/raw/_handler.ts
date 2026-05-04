import { Readable } from 'node:stream'

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import axios from 'axios'

import { checkProtectedRoute, getAccessToken, getProtectedRouteTokenFromCookies } from '../../../features/auth'
import { cleanDrivePath, getRawDownloadInfo } from '../../../features/drive'
import { getApiConfig } from '../../../lib/config/api'
import { getProxiedUrl } from '../../../utils/cfProxy'
import {
  apiErrorResponse,
  getBooleanSearchParam,
  getSearchParam,
  noAccessTokenResponse,
  protectedRouteErrorResponse,
  routeErrorResponse,
  withCorsHeaders,
} from '../_shared'

function appendHeaders(headers: Headers, source: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined || value === null || value === false) {
      continue
    }

    headers.set(key, Array.isArray(value) ? value.map(String).join(', ') : String(value))
  }
}

export async function handleRawRequest(request: NextRequest): Promise<Response> {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return withCorsHeaders(noAccessTokenResponse())
    }

    const path = getSearchParam(request, 'path', '/')
    const odpt = getSearchParam(request, 'odpt')
    const proxy = getBooleanSearchParam(request, 'proxy')

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

    if (proxy && typeof data.size === 'number' && data.size < 4194304) {
      const { headers: sourceHeaders, data: stream } = await axios.get<Readable>(downloadUrl, {
        responseType: 'stream',
      })
      const headers = new Headers()

      appendHeaders(headers, sourceHeaders)
      headers.set('Cache-Control', cacheControl)

      return withCorsHeaders(
        new Response(Readable.toWeb(stream) as ReadableStream, {
          headers,
          status: 200,
        }),
      )
    }

    const response = NextResponse.redirect(getProxiedUrl(downloadUrl))
    response.headers.set('Cache-Control', cacheControl)

    return withCorsHeaders(response)
  } catch (error) {
    return withCorsHeaders(routeErrorResponse(error))
  }
}
