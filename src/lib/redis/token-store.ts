import type Redis from 'ioredis'

import { getSiteConfig } from '../config/site'
import { getRedisClient } from './client'

export type OdAuthTokens = {
  accessToken: string | null
  refreshToken: string | null
}

export type StoreOdAuthTokensInput = {
  accessToken: string
  accessTokenExpiry: number
  refreshToken: string
}

function tokenKey(name: 'access_token' | 'refresh_token'): string {
  return `${getSiteConfig().kvPrefix}${name}`
}

export async function getOdAuthTokens(client: Redis = getRedisClient()): Promise<OdAuthTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    client.get(tokenKey('access_token')),
    client.get(tokenKey('refresh_token')),
  ])

  return {
    accessToken,
    refreshToken,
  }
}

export async function storeOdAuthTokens(
  { accessToken, accessTokenExpiry, refreshToken }: StoreOdAuthTokensInput,
  client: Redis = getRedisClient(),
): Promise<void> {
  await Promise.all([
    client.set(tokenKey('access_token'), accessToken, 'EX', accessTokenExpiry),
    client.set(tokenKey('refresh_token'), refreshToken),
  ])
}
