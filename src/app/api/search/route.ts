import type { NextRequest } from 'next/server'

import { getAccessToken } from '../../../features/auth'
import { searchDriveItems } from '../../../features/drive'
import { getApiConfig } from '../../../lib/config/api'
import { getSearchParam, jsonResponse, noAccessTokenResponse, routeErrorResponse } from '../_shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return noAccessTokenResponse()
    }

    const data = await searchDriveItems({ accessToken, query: getSearchParam(request, 'q') })
    const response = jsonResponse(data)
    response.headers.set('Cache-Control', getApiConfig().cacheControlHeader)

    return response
  } catch (error) {
    return routeErrorResponse(error)
  }
}
