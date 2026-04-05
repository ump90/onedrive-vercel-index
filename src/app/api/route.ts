import type { NextRequest } from 'next/server'

import { handleDriveRequest, handleTokenStorage } from '../../server/onedrive/routes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleDriveRequest(request)
}

export async function POST(request: NextRequest) {
  return handleTokenStorage(request)
}
