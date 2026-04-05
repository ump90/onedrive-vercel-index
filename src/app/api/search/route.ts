import type { NextRequest } from 'next/server'

import { handleSearchRequest } from '../../../server/onedrive/routes'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return handleSearchRequest(request)
}
