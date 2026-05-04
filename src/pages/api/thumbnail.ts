import type { NextApiRequest, NextApiResponse } from 'next'

import { getApiConfig } from '../../lib/config/api'
import { sendApiError } from '../../lib/http/api-error'
import { checkProtectedRoute, getAccessToken } from '../../features/auth'
import { cleanDrivePath, getThumbnailUrl } from '../../features/drive'
import { getProxiedUrl } from '../../utils/cfProxy'

type ThumbnailSize = 'large' | 'medium' | 'small'

function isThumbnailSize(size: unknown): size is ThumbnailSize {
  return size === 'large' || size === 'medium' || size === 'small'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      res.status(403).json({ error: 'No access token.' })
      return
    }

    const { path = '', size = 'medium', odpt = '' } = req.query

    if (odpt === '') {
      res.setHeader('Cache-Control', getApiConfig().cacheControlHeader)
    }

    if (!isThumbnailSize(size)) {
      res.status(400).json({ error: 'Invalid size' })
      return
    }

    if (path === '[...path]') {
      res.status(400).json({ error: 'No path specified.' })
      return
    }

    if (typeof path !== 'string') {
      res.status(400).json({ error: 'Path query invalid.' })
      return
    }

    const cleanPath = cleanDrivePath(path, { trimTrailingSlash: false })
    const { code, message } = await checkProtectedRoute({ cleanPath, accessToken, odTokenHeader: odpt as string })

    if (code !== 200) {
      res.status(code).json({ error: message })
      return
    }

    if (message !== '') {
      res.setHeader('Cache-Control', 'no-cache')
    }

    const thumbnailUrl = await getThumbnailUrl({ cleanPath, accessToken, size })

    if (thumbnailUrl) {
      res.redirect(getProxiedUrl(thumbnailUrl))
      return
    }

    res.status(400).json({ error: "The item doesn't have a valid thumbnail." })
  } catch (error) {
    sendApiError(res, error)
  }
}
