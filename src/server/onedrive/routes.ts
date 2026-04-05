import { posix as pathPosix } from 'path'

import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

import apiConfig from '../../../config/api.config'
import siteConfig from '../../../config/site.config'
import { getOdAuthTokens, storeOdAuthTokens } from '../../utils/odAuthTokenStore'
import { revealObfuscatedToken } from '../../utils/oAuthHandler'
import { compareHashedToken } from '../../utils/protectedRouteHandler'

const basePath = pathPosix.resolve('/', siteConfig.baseDirectory)
const clientSecret = revealObfuscatedToken(apiConfig.obfuscatedClientSecret)
const rawCorsHeaderValues = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, od-protected-token',
}

function createHeaders(init?: HeadersInit) {
  return new Headers(init)
}

function jsonError(status: number, error: unknown, headers?: HeadersInit) {
  return NextResponse.json({ error }, { status, headers })
}

function redirectResponse(url: string, headers?: HeadersInit) {
  const response = NextResponse.redirect(url)
  if (headers) {
    const responseHeaders = createHeaders(headers)
    responseHeaders.forEach((value, key) => response.headers.set(key, value))
  }
  return response
}

function withRawCors(headers?: HeadersInit) {
  const nextHeaders = createHeaders(headers)
  for (const [key, value] of Object.entries(rawCorsHeaderValues)) {
    nextHeaders.set(key, value)
  }
  return nextHeaders
}

function getAxiosErrorStatus(error: any) {
  return error?.response?.status ?? 500
}

function getAxiosErrorPayload(error: any) {
  return error?.response?.data ?? 'Internal server error.'
}

function sanitizePath(path: string) {
  return pathPosix.resolve('/', pathPosix.normalize(path)).replace(/\/$/, '')
}

function getBooleanParam(value: string | null) {
  return value !== null && value !== 'false'
}

export function encodePath(path: string): string {
  let encodedPath = pathPosix.join(basePath, path)
  if (encodedPath === '/' || encodedPath === '') {
    return ''
  }
  encodedPath = encodedPath.replace(/\/$/, '')
  return `:${encodeURIComponent(encodedPath)}`
}

export async function getAccessToken(): Promise<string> {
  const { accessToken, refreshToken } = await getOdAuthTokens()

  if (typeof accessToken === 'string') {
    console.log('Fetch access token from storage.')
    return accessToken
  }

  if (typeof refreshToken !== 'string') {
    console.log('No refresh token, return empty access token.')
    return ''
  }

  const body = new URLSearchParams()
  body.append('client_id', apiConfig.clientId)
  body.append('redirect_uri', apiConfig.redirectUri)
  body.append('client_secret', clientSecret)
  body.append('refresh_token', refreshToken)
  body.append('grant_type', 'refresh_token')

  const resp = await axios.post(apiConfig.authApi, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  if ('access_token' in resp.data && 'refresh_token' in resp.data) {
    const { expires_in, access_token, refresh_token } = resp.data
    await storeOdAuthTokens({
      accessToken: access_token,
      accessTokenExpiry: parseInt(expires_in),
      refreshToken: refresh_token,
    })
    console.log('Fetch new access token with stored refresh token.')
    return access_token
  }

  return ''
}

export function getAuthTokenPath(path: string) {
  path = path.toLowerCase() + '/'
  const protectedRoutes = siteConfig.protectedRoutes as string[]
  let authTokenPath = ''

  for (let r of protectedRoutes) {
    if (typeof r !== 'string') continue
    r = r.toLowerCase().replace(/\/$/, '') + '/'
    if (path.startsWith(r)) {
      authTokenPath = `${r}.password`
      break
    }
  }

  return authTokenPath
}

export async function checkAuthRoute(
  cleanPath: string,
  accessToken: string,
  odTokenHeader: string
): Promise<{ code: 200 | 401 | 404 | 500; message: string }> {
  const authTokenPath = getAuthTokenPath(cleanPath)

  if (authTokenPath === '') {
    return { code: 200, message: '' }
  }

  try {
    const token = await axios.get(`${apiConfig.driveApi}/root${encodePath(authTokenPath)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: '@microsoft.graph.downloadUrl,file',
      },
    })

    const odProtectedToken = await axios.get(token.data['@microsoft.graph.downloadUrl'])

    if (
      !compareHashedToken({
        odTokenHeader,
        dotPassword: odProtectedToken.data.toString(),
      })
    ) {
      return { code: 401, message: 'Password required.' }
    }
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { code: 404, message: "You didn't set a password." }
    }

    return { code: 500, message: 'Internal server error.' }
  }

  return { code: 200, message: 'Authenticated.' }
}

export function handleRawOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: withRawCors(),
  })
}

export async function handleDriveRequest(request: NextRequest) {
  const headers = createHeaders({
    'Cache-Control': apiConfig.cacheControlHeader,
  })
  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path') ?? '/'
  const raw = getBooleanParam(searchParams.get('raw'))
  const next = searchParams.get('next') ?? ''
  const sort = searchParams.get('sort') ?? ''

  if (path === '[...path]') {
    return jsonError(400, 'No path specified.', headers)
  }

  const cleanPath = sanitizePath(path)
  const accessToken = await getAccessToken()

  if (!accessToken) {
    return jsonError(403, 'No access token.', headers)
  }

  const { code, message } = await checkAuthRoute(cleanPath, accessToken, request.headers.get('od-protected-token') ?? '')
  if (code !== 200) {
    return jsonError(code, message, headers)
  }

  if (message !== '') {
    headers.set('Cache-Control', 'no-cache')
  }

  const requestPath = encodePath(cleanPath)
  const requestUrl = `${apiConfig.driveApi}/root${requestPath}`
  const isRoot = requestPath === ''

  if (raw) {
    const rawHeaders = withRawCors(headers)
    rawHeaders.set('Cache-Control', 'no-cache')

    try {
      const { data } = await axios.get(requestUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          select: 'id,@microsoft.graph.downloadUrl',
        },
      })

      if ('@microsoft.graph.downloadUrl' in data) {
        return redirectResponse(data['@microsoft.graph.downloadUrl'], rawHeaders)
      }

      return jsonError(404, 'No download url found.', rawHeaders)
    } catch (error: any) {
      return jsonError(getAxiosErrorStatus(error), getAxiosErrorPayload(error), rawHeaders)
    }
  }

  try {
    const { data: identityData } = await axios.get(requestUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: 'name,size,id,lastModifiedDateTime,folder,file,video,image',
      },
    })

    if ('folder' in identityData) {
      const { data: folderData } = await axios.get(`${requestUrl}${isRoot ? '' : ':'}/children`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          ...{
            select: 'name,size,id,lastModifiedDateTime,folder,file,video,image',
            $top: siteConfig.maxItems,
          },
          ...(next ? { $skipToken: next } : {}),
          ...(sort ? { $orderby: sort } : {}),
        },
      })

      const nextPage = folderData['@odata.nextLink']?.match(/&\$skiptoken=(.+)/i)?.[1] ?? null
      return NextResponse.json(nextPage ? { folder: folderData, next: nextPage } : { folder: folderData }, { headers })
    }

    return NextResponse.json({ file: identityData }, { headers })
  } catch (error: any) {
    return jsonError(getAxiosErrorStatus(error), getAxiosErrorPayload(error), headers)
  }
}

export async function handleTokenStorage(request: NextRequest) {
  const { obfuscatedAccessToken, accessTokenExpiry, obfuscatedRefreshToken } = await request.json()
  const accessToken = revealObfuscatedToken(obfuscatedAccessToken)
  const refreshToken = revealObfuscatedToken(obfuscatedRefreshToken)
  const parsedExpiry = Number(accessTokenExpiry)

  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string' || !Number.isFinite(parsedExpiry)) {
    return new NextResponse('Invalid request body', { status: 400 })
  }

  await storeOdAuthTokens({ accessToken, accessTokenExpiry: parsedExpiry, refreshToken })
  return new NextResponse('OK')
}

export async function handleItemRequest(request: NextRequest) {
  const headers = createHeaders({
    'Cache-Control': apiConfig.cacheControlHeader,
  })
  const accessToken = await getAccessToken()
  const id = request.nextUrl.searchParams.get('id') ?? ''

  if (!id) {
    return jsonError(400, 'Invalid driveItem ID.', headers)
  }

  const itemApi = `${apiConfig.driveApi}/items/${id}`

  try {
    const { data } = await axios.get(itemApi, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: 'id,name,parentReference',
      },
    })

    return NextResponse.json(data, { headers })
  } catch (error: any) {
    return jsonError(getAxiosErrorStatus(error), getAxiosErrorPayload(error), headers)
  }
}

function sanitiseQuery(query: string): string {
  const sanitisedQuery = query
    .replace(/'/g, "''")
    .replace('<', ' &lt; ')
    .replace('>', ' &gt; ')
    .replace('?', ' ')
    .replace('/', ' ')
  return encodeURIComponent(sanitisedQuery)
}

export async function handleSearchRequest(request: NextRequest) {
  const headers = createHeaders({
    'Cache-Control': apiConfig.cacheControlHeader,
  })
  const accessToken = await getAccessToken()
  const searchQuery = request.nextUrl.searchParams.get('q') ?? ''

  const searchRootPath = encodePath('/')
  const encodedPath = searchRootPath === '' ? searchRootPath : `${searchRootPath}:`
  const searchApi = `${apiConfig.driveApi}/root${encodedPath}/search(q='${sanitiseQuery(searchQuery)}')`

  try {
    const { data } = await axios.get(searchApi, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: 'id,name,file,folder,parentReference',
        top: siteConfig.maxItems,
      },
    })

    return NextResponse.json(data.value, { headers })
  } catch (error: any) {
    return jsonError(getAxiosErrorStatus(error), getAxiosErrorPayload(error), headers)
  }
}

export async function handleRawRequest(request: NextRequest) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return jsonError(403, 'No access token.')
  }

  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path') ?? '/'
  const odpt = searchParams.get('odpt') ?? ''
  const proxy = getBooleanParam(searchParams.get('proxy'))

  if (path === '[...path]') {
    return jsonError(400, 'No path specified.')
  }

  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))
  const headers = withRawCors()
  const odTokenHeader = request.headers.get('od-protected-token') ?? odpt
  const { code, message } = await checkAuthRoute(cleanPath, accessToken, odTokenHeader)

  if (code !== 200) {
    return jsonError(code, message, headers)
  }

  if (message !== '') {
    headers.set('Cache-Control', 'no-cache')
  }

  try {
    const requestUrl = `${apiConfig.driveApi}/root${encodePath(cleanPath)}`
    const { data } = await axios.get(requestUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: 'id,size,@microsoft.graph.downloadUrl',
      },
    })

    if ('@microsoft.graph.downloadUrl' in data) {
      if (proxy && 'size' in data && data.size < 4194304) {
        const proxiedResponse = await fetch(data['@microsoft.graph.downloadUrl'] as string)
        const proxiedHeaders = withRawCors(proxiedResponse.headers)
        proxiedHeaders.set('Cache-Control', apiConfig.cacheControlHeader)
        return new NextResponse(proxiedResponse.body, {
          status: proxiedResponse.status,
          headers: proxiedHeaders,
        })
      }

      return redirectResponse(data['@microsoft.graph.downloadUrl'], headers)
    }

    return jsonError(404, 'No download url found.', headers)
  } catch (error: any) {
    return jsonError(getAxiosErrorStatus(error), getAxiosErrorPayload(error), headers)
  }
}

export async function handleThumbnailRequest(request: NextRequest) {
  const accessToken = await getAccessToken()
  if (!accessToken) {
    return jsonError(403, 'No access token.')
  }

  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get('path') ?? ''
  const size = searchParams.get('size') ?? 'medium'
  const odpt = searchParams.get('odpt') ?? ''
  const headers = createHeaders(odpt === '' ? { 'Cache-Control': apiConfig.cacheControlHeader } : undefined)

  if (size !== 'large' && size !== 'medium' && size !== 'small') {
    return jsonError(400, 'Invalid size', headers)
  }

  if (path === '[...path]') {
    return jsonError(400, 'No path specified.', headers)
  }

  const cleanPath = pathPosix.resolve('/', pathPosix.normalize(path))
  const { code, message } = await checkAuthRoute(cleanPath, accessToken, odpt)
  if (code !== 200) {
    return jsonError(code, message, headers)
  }

  if (message !== '') {
    headers.set('Cache-Control', 'no-cache')
  }

  const requestPath = encodePath(cleanPath)
  const requestUrl = `${apiConfig.driveApi}/root${requestPath}`
  const isRoot = requestPath === ''

  try {
    const { data } = await axios.get(`${requestUrl}${isRoot ? '' : ':'}/thumbnails`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const thumbnailUrl = data.value?.length > 0 ? data.value[0][size]?.url : null
    if (!thumbnailUrl) {
      return jsonError(400, "The item doesn't have a valid thumbnail.", headers)
    }

    return redirectResponse(thumbnailUrl, headers)
  } catch (error: any) {
    return jsonError(getAxiosErrorStatus(error), getAxiosErrorPayload(error), headers)
  }
}
