import Redis from 'ioredis'
import siteConfig from '../../config/site.config'

let kv: Redis | null = null

function getKv() {
  if (!process.env.REDIS_URL) {
    return null
  }

  if (!kv) {
    // Persistent key-value store is provided by Redis, hosted on Upstash
    // https://vercel.com/integrations/upstash
    kv = new Redis(process.env.REDIS_URL)
  }

  return kv
}

export async function getOdAuthTokens(): Promise<{ accessToken: unknown; refreshToken: unknown }> {
  const redis = getKv()
  if (!redis) {
    return { accessToken: null, refreshToken: null }
  }

  const accessToken = await redis.get(`${siteConfig.kvPrefix}access_token`)
  const refreshToken = await redis.get(`${siteConfig.kvPrefix}refresh_token`)

  return {
    accessToken,
    refreshToken,
  }
}

export async function storeOdAuthTokens({
  accessToken,
  accessTokenExpiry,
  refreshToken,
}: {
  accessToken: string
  accessTokenExpiry: number
  refreshToken: string
}): Promise<void> {
  const redis = getKv()
  if (!redis) {
    throw new Error('REDIS_URL is not configured.')
  }

  await redis.set(`${siteConfig.kvPrefix}access_token`, accessToken, 'EX', accessTokenExpiry)
  await redis.set(`${siteConfig.kvPrefix}refresh_token`, refreshToken)
}
