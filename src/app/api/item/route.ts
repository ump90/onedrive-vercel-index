import type { NextRequest } from 'next/server'

import { getAccessToken } from '../../../features/auth'
import { getDriveItemById } from '../../../features/drive'
import { getApiConfig } from '../../../lib/config/api'
import { apiErrorResponse, getSearchParam, jsonResponse, noAccessTokenResponse, routeErrorResponse } from '../_shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return noAccessTokenResponse()
    }

    const id = getSearchParam(request, 'id')

    if (!id) {
      return apiErrorResponse(400, 'BAD_REQUEST', 'Invalid driveItem ID.')
    }

    const data = await getDriveItemById({ accessToken, id })
    const response = jsonResponse(data)
    response.headers.set('Cache-Control', getApiConfig().cacheControlHeader)

    return response
  } catch (error) {
    return routeErrorResponse(error)
  }
}
