import type { NextApiRequest, NextApiResponse } from 'next'
import Cors from 'cors'

export function runCorsMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const cors = Cors({ methods: ['GET', 'HEAD'] })

  return new Promise((resolve, reject) => {
    cors(req, res, result => {
      if (result instanceof Error) {
        reject(result)
        return
      }

      resolve(result)
    })
  })
}
