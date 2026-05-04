import type { OdAPIResponse } from '../../types'
import type { AppDriveInitialError } from './AppDriveClientShell'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getAccessToken } from '../auth/tokens'
import { checkProtectedRoute, getProtectedRouteTokenFromCookies } from '../auth/protected-route'
import { GraphRequestError } from '../../lib/graph/errors'
import { RedisConfigurationError } from '../../lib/redis/errors'
import AppDriveClientShell from './AppDriveClientShell'
import { cleanDrivePath, getDrivePathResponse, pathSegmentsToPath } from './index'

function driveLoadError(error: unknown): AppDriveInitialError {
  if (error instanceof GraphRequestError) {
    const message =
      typeof error.data === 'object' &&
      error.data !== null &&
      'error' in error.data &&
      typeof error.data.error === 'object' &&
      error.data.error !== null &&
      'message' in error.data.error &&
      typeof error.data.error.message === 'string'
        ? error.data.error.message
        : error.message

    return { message, status: error.status }
  }

  if (error instanceof RedisConfigurationError) {
    return { message: error.message, status: 500 }
  }

  return { message: error instanceof Error ? error.message : 'Internal server error.', status: 500 }
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_REDIRECT')
  )
}

async function loadInitialDriveResponse(path: string): Promise<{
  error?: AppDriveInitialError
  response?: OdAPIResponse
}> {
  try {
    const cleanPath = cleanDrivePath(path)
    const accessToken = await getAccessToken()

    if (!accessToken) {
      redirect('/onedrive-vercel-index-oauth/step-1')
    }

    const cookieStore = await cookies()
    const { code, message } = await checkProtectedRoute({
      cleanPath,
      accessToken,
      odTokenHeader: getProtectedRouteTokenFromCookies(cleanPath, cookieStore),
    })

    if (code !== 200) {
      return { error: { message, status: code } }
    }

    return { response: await getDrivePathResponse({ cleanPath, accessToken }) }
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error
    }

    return { error: driveLoadError(error) }
  }
}

export default async function AppDriveShell({ pathSegments }: { pathSegments: string[] }) {
  const path = pathSegmentsToPath(pathSegments)
  const { error, response } = await loadInitialDriveResponse(path)

  return <AppDriveClientShell initialError={error} initialResponse={response} pathSegments={pathSegments} />
}
