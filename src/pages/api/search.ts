import type { NextApiRequest, NextApiResponse } from 'next'

import { getApiConfig } from '../../lib/config/api'
import { sendApiError } from '../../lib/http/api-error'
import { getAccessToken } from '../../features/auth'
import { searchDriveItems } from '../../features/drive'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await getAccessToken()
    const { q: searchQuery = '' } = req.query

    res.setHeader('Cache-Control', getApiConfig().cacheControlHeader)

    if (typeof searchQuery !== 'string') {
      res.status(200).json([])
      return
    }

    const data = await searchDriveItems({ accessToken, query: searchQuery })
    res.status(200).json(data)
  } catch (error) {
    sendApiError(res, error)
  }
}
