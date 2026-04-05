import type { NextRequest } from 'next/server'

import { handleRawOptions, handleRawRequest } from '../../../../server/onedrive/routes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleRawRequest(request)
}

export async function HEAD(request: NextRequest) {
  return handleRawRequest(request)
}

export function OPTIONS() {
  return handleRawOptions()
}
