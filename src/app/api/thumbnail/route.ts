import type { NextRequest } from 'next/server'

import { handleThumbnailRequest } from '../../../server/onedrive/routes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleThumbnailRequest(request)
}
