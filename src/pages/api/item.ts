import type { NextApiRequest, NextApiResponse } from 'next'

import { getApiConfig } from '../../lib/config/api'
import { sendApiError } from '../../lib/http/api-error'
import { getAccessToken } from '../../features/auth'
import { getDriveItemById } from '../../features/drive'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await getAccessToken()
    const { id = '' } = req.query

    res.setHeader('Cache-Control', getApiConfig().cacheControlHeader)

    if (typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid driveItem ID.' })
      return
    }

    const data = await getDriveItemById({ accessToken, id })
    res.status(200).json(data)
  } catch (error) {
    sendApiError(res, error)
  }
}
