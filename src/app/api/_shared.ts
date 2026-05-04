import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { GraphRequestError } from '../../lib/graph/errors'
import { RedisConfigurationError } from '../../lib/redis/errors'

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'CONFIGURATION_ERROR'
  | 'GRAPH_AUTHENTICATION_FAILED'
  | 'GRAPH_FORBIDDEN'
  | 'GRAPH_NOT_FOUND'
  | 'GRAPH_RATE_LIMITED'
  | 'GRAPH_REQUEST_FAILED'
  | 'OD_AUTH_REQUIRED'
  | 'OD_PROTECTED_ROUTE_UNAUTHORISED'
  | 'REDIS_UNAVAILABLE'
  | 'UNKNOWN_ERROR'

type ApiErrorPayload = {
  error: string
  code: ApiErrorCode
  details?: unknown
}

const redisErrorCodes = new Set(['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'CONNECTION_BROKEN'])

export const corsHeaders = {
  'Access-Control-Allow-Headers': 'Content-Type, od-protected-token',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Max-Age': '86400',
}

export function jsonResponse<T>(body: T, init: ResponseInit = {}): NextResponse<T> {
  return NextResponse.json(body, init)
}

export function apiErrorResponse(
  status: number,
  code: ApiErrorCode,
  error: string,
  details?: unknown,
): NextResponse<ApiErrorPayload> {
  const payload: ApiErrorPayload = { error, code }

  if (details !== undefined) {
    payload.details = details
  }

  return jsonResponse(payload, { status })
}

function graphErrorCode(status: number): ApiErrorCode {
  if (status === 401) return 'GRAPH_AUTHENTICATION_FAILED'
  if (status === 403) return 'GRAPH_FORBIDDEN'
  if (status === 404) return 'GRAPH_NOT_FOUND'
  if (status === 429) return 'GRAPH_RATE_LIMITED'

  return 'GRAPH_REQUEST_FAILED'
}

function graphErrorMessage(data: unknown): string {
  if (typeof data === 'string') {
    return data
  }

  if (typeof data === 'object' && data !== null) {
    const record = data as { error?: unknown; message?: unknown }

    if (typeof record.message === 'string') {
      return record.message
    }

    if (typeof record.error === 'object' && record.error !== null) {
      const graphError = record.error as { message?: unknown }

      if (typeof graphError.message === 'string') {
        return graphError.message
      }
    }
  }

  return 'Microsoft Graph request failed.'
}

function isRedisAvailabilityError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false
  }

  const code = (error as { code?: unknown }).code
  const message = error instanceof Error ? error.message : ''

  return (
    (typeof code === 'string' && redisErrorCodes.has(code)) ||
    message.toLowerCase().includes('redis')
  )
}

export function routeErrorResponse(error: unknown): NextResponse<ApiErrorPayload> {
  if (error instanceof GraphRequestError) {
    return apiErrorResponse(error.status, graphErrorCode(error.status), graphErrorMessage(error.data), error.data)
  }

  if (error instanceof RedisConfigurationError) {
    return apiErrorResponse(500, 'CONFIGURATION_ERROR', error.message)
  }

  if (isRedisAvailabilityError(error)) {
    const message = error instanceof Error ? error.message : 'Redis is unavailable.'
    return apiErrorResponse(503, 'REDIS_UNAVAILABLE', message)
  }

  return apiErrorResponse(500, 'UNKNOWN_ERROR', 'Internal server error.')
}

export function noAccessTokenResponse(): NextResponse<ApiErrorPayload> {
  return apiErrorResponse(403, 'OD_AUTH_REQUIRED', 'No access token.')
}

export function protectedRouteErrorResponse(status: number, error: string): NextResponse<ApiErrorPayload> {
  return apiErrorResponse(status, 'OD_PROTECTED_ROUTE_UNAUTHORISED', error)
}

export function corsPreflightResponse(): Response {
  return new Response(null, {
    headers: corsHeaders,
    status: 204,
  })
}

export function withCorsHeaders<T extends Response>(response: T): T {
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value)
  }

  return response
}

export function getSearchParam(request: NextRequest, name: string, fallback = ''): string {
  return request.nextUrl.searchParams.get(name) ?? fallback
}

export function getBooleanSearchParam(request: NextRequest, name: string): boolean {
  const value = request.nextUrl.searchParams.get(name)

  if (value === null) {
    return false
  }

  return value === '' || value === '1' || value.toLowerCase() === 'true'
}
