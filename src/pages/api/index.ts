import type { NextApiRequest, NextApiResponse } from 'next'

import { getApiConfig } from '../../lib/config/api'
import { sendApiError } from '../../lib/http/api-error'
import { runCorsMiddleware } from '../../lib/http/cors'
import { checkProtectedRoute, getAccessToken, getAuthTokenPath, storeObfuscatedAuthTokens } from '../../features/auth'
import { cleanDrivePath, encodeDrivePath, getDrivePathResponse, getRawDownloadInfo } from '../../features/drive'
import { getProxiedUrl } from '../../utils/cfProxy'

export { getAccessToken, getAuthTokenPath }
export { encodeDrivePath as encodePath } from '../../features/drive'
export { checkProtectedRoute as checkAuthRoute } from '../../features/auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      const stored = await storeObfuscatedAuthTokens(req.body)

      if (!stored) {
        res.status(400).send('Invalid request body')
        return
      }

      res.status(200).send('OK')
      return
    }

    const { path = '/', raw = false, next = '', sort = '' } = req.query

    res.setHeader('Cache-Control', getApiConfig().cacheControlHeader)

    if (path === '[...path]') {
      res.status(400).json({ error: 'No path specified.' })
      return
    }

    if (typeof path !== 'string') {
      res.status(400).json({ error: 'Path query invalid.' })
      return
    }

    if (typeof sort !== 'string') {
      res.status(400).json({ error: 'Sort query invalid.' })
      return
    }

    if (typeof next !== 'string') {
      res.status(400).json({ error: 'Next query invalid.' })
      return
    }

    const cleanPath = cleanDrivePath(path)
    const accessToken = await getAccessToken()

    if (!accessToken) {
      res.status(403).json({ error: 'No access token.' })
      return
    }

    const { code, message } = await checkProtectedRoute({
      cleanPath,
      accessToken,
      odTokenHeader: req.headers['od-protected-token'] as string,
    })

    if (code !== 200) {
      res.status(code).json({ error: message })
      return
    }

    if (message !== '') {
      res.setHeader('Cache-Control', 'no-cache')
    }

    if (raw) {
      await runCorsMiddleware(req, res)
      res.setHeader('Cache-Control', 'no-cache')

      const data = await getRawDownloadInfo({ cleanPath, accessToken })

      if (data['@microsoft.graph.downloadUrl']) {
        res.redirect(getProxiedUrl(data['@microsoft.graph.downloadUrl']))
      } else {
        res.status(404).json({ error: 'No download url found.' })
      }

      return
    }

    const data = await getDrivePathResponse({ cleanPath, accessToken, next, sort })
    res.status(200).json(data)
  } catch (error) {
    sendApiError(res, error)
  }
}
