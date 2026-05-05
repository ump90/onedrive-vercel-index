import type { NextRequest } from 'next/server'

import { corsPreflightResponse } from '../../_shared'
import { handleRawRequest } from '../../raw/_handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function OPTIONS() {
  return corsPreflightResponse()
}

export function GET(request: NextRequest) {
  return handleRawRequest(request)
}

export function HEAD(request: NextRequest) {
  return handleRawRequest(request)
}
