import type { NextApiResponse } from 'next'

import { GraphRequestError } from '../graph/errors'
import { RedisConfigurationError } from '../redis/errors'

export function sendApiError(res: NextApiResponse, error: unknown): void {
  if (error instanceof GraphRequestError) {
    res.status(error.status).json({ error: error.data })
    return
  }

  if (error instanceof RedisConfigurationError) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(500).json({ error: 'Internal server error.' })
}
