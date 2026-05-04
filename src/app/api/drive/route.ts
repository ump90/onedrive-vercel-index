import type { NextRequest } from 'next/server'

import { handleDriveRequest } from './_handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  return handleDriveRequest(request)
}

export function POST(request: NextRequest) {
  return handleDriveRequest(request)
}
