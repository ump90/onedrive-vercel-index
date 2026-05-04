import type { OutgoingHttpHeaders } from 'http'

import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

import { getApiConfig } from '../../lib/config/api'
import { sendApiError } from '../../lib/http/api-error'
import { runCorsMiddleware } from '../../lib/http/cors'
import { checkProtectedRoute, getAccessToken } from '../../features/auth'
import { cleanDrivePath, getRawDownloadInfo } from '../../features/drive'
import { getProxiedUrl } from '../../utils/cfProxy'

export { runCorsMiddleware }

function toOutgoingHeaders(headers: Record<string, unknown>): OutgoingHttpHeaders {
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([, value]) => value !== undefined && value !== null && value !== false)
      .map(([key, value]) => [key, Array.isArray(value) ? value.map(String) : String(value)]),
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await getAccessToken()

    if (!accessToken) {
      res.status(403).json({ error: 'No access token.' })
      return
    }

    const { path = '/', odpt = '', proxy = false } = req.query

    if (path === '[...path]') {
      res.status(400).json({ error: 'No path specified.' })
      return
    }

    if (typeof path !== 'string') {
      res.status(400).json({ error: 'Path query invalid.' })
      return
    }

    const cleanPath = cleanDrivePath(path, { trimTrailingSlash: false })
    const odTokenHeader = (req.headers['od-protected-token'] as string) ?? odpt
    const { code, message } = await checkProtectedRoute({ cleanPath, accessToken, odTokenHeader })

    if (code !== 200) {
      res.status(code).json({ error: message })
      return
    }

    if (message !== '') {
      res.setHeader('Cache-Control', 'no-cache')
    }

    await runCorsMiddleware(req, res)

    const data = await getRawDownloadInfo({ cleanPath, accessToken })

    if (!data['@microsoft.graph.downloadUrl']) {
      res.status(404).json({ error: 'No download url found.' })
      return
    }

    const downloadUrl = data['@microsoft.graph.downloadUrl']

    if (proxy && typeof data.size === 'number' && data.size < 4194304) {
      const { headers, data: stream } = await axios.get(downloadUrl, {
        responseType: 'stream',
      })
      const responseHeaders = toOutgoingHeaders(headers)
      responseHeaders['Cache-Control'] = getApiConfig().cacheControlHeader

      res.writeHead(200, responseHeaders)
      stream.pipe(res)
      return
    }

    res.redirect(getProxiedUrl(downloadUrl))
  } catch (error) {
    sendApiError(res, error)
  }
}
