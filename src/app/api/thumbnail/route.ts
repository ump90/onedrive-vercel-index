import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { checkProtectedRoute, getAccessToken, getProtectedRouteTokenFromCookies } from '../../../features/auth'
import { cleanDrivePath, getThumbnailUrl } from '../../../features/drive'
import { getApiConfig } from '../../../lib/config/api'
import { getProxiedUrl } from '../../../utils/cfProxy'
import {
  apiErrorResponse,
  getSearchParam,
  noAccessTokenResponse,
  protectedRouteErrorResponse,
  routeErrorResponse,
} from '../_shared'

type ThumbnailSize = 'large' | 'medium' | 'small'

function isThumbnailSize(size: string): size is ThumbnailSize {
  return size === 'large' || size === 'medium' || size === 'small'
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return noAccessTokenResponse()
    }

    const path = getSearchParam(request, 'path')
    const size = getSearchParam(request, 'size', 'medium')
    const odpt = getSearchParam(request, 'odpt')

    if (!isThumbnailSize(size)) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'Invalid size')
    }

    if (path === '[...path]') {
      return apiErrorResponse(400, 'BAD_REQUEST', 'No path specified.')
    }

    const cleanPath = cleanDrivePath(path, { trimTrailingSlash: false })
    const { code, message } = await checkProtectedRoute({
      cleanPath,
      accessToken,
      odTokenHeader: odpt || getProtectedRouteTokenFromCookies(cleanPath, request.cookies),
    })

    if (code !== 200) {
      return protectedRouteErrorResponse(code, message)
    }

    const thumbnailUrl = await getThumbnailUrl({ cleanPath, accessToken, size })

    if (!thumbnailUrl) {
      return apiErrorResponse(400, 'GRAPH_NOT_FOUND', "The item doesn't have a valid thumbnail.")
    }

    const response = NextResponse.redirect(getProxiedUrl(thumbnailUrl))
    response.headers.set('Cache-Control', odpt === '' && message === '' ? getApiConfig().cacheControlHeader : 'no-cache')

    return response
  } catch (error) {
    return routeErrorResponse(error)
  }
}
