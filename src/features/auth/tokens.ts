import { getOdAuthTokens, storeOdAuthTokens } from '../../lib/redis/token-store'
import { revealObfuscatedToken, requestTokenWithRefreshToken } from './oauth'

export async function getAccessToken(): Promise<string> {
  const { accessToken, refreshToken } = await getOdAuthTokens()

  if (typeof accessToken === 'string' && accessToken.length > 0) {
    console.log('Fetch access token from storage.')
    return accessToken
  }

  if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
    console.log('No refresh token, return empty access token.')
    return ''
  }

  const response = await requestTokenWithRefreshToken(refreshToken)

  if ('error' in response) {
    return ''
  }

  const accessTokenExpiry = Number.parseInt(response.expiryTime, 10)

  await storeOdAuthTokens({
    accessToken: response.accessToken,
    accessTokenExpiry,
    refreshToken: response.refreshToken,
  })

  console.log('Fetch new access token with stored refresh token.')
  return response.accessToken
}

export async function storeObfuscatedAuthTokens({
  obfuscatedAccessToken,
  accessTokenExpiry,
  obfuscatedRefreshToken,
}: {
  obfuscatedAccessToken: unknown
  accessTokenExpiry: unknown
  obfuscatedRefreshToken: unknown
}): Promise<boolean> {
  if (
    typeof obfuscatedAccessToken !== 'string' ||
    typeof obfuscatedRefreshToken !== 'string' ||
    typeof accessTokenExpiry !== 'number'
  ) {
    return false
  }

  await storeOdAuthTokens({
    accessToken: revealObfuscatedToken(obfuscatedAccessToken),
    accessTokenExpiry,
    refreshToken: revealObfuscatedToken(obfuscatedRefreshToken),
  })

  return true
}
