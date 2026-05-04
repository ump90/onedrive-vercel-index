import Redis from 'ioredis'

import { RedisConfigurationError } from './errors'

let redisClient: Redis | null = null

export function getRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    throw new RedisConfigurationError()
  }

  if (!redisClient) {
    redisClient = new Redis(redisUrl)
  }

  return redisClient
}

export function resetRedisClientForTests(): void {
  redisClient?.disconnect()
  redisClient = null
}
