import axios from 'axios'
import CryptoJS from 'crypto-js'

import { getApiConfig } from '../../lib/config/api'

const AES_SECRET_KEY = 'onedrive-vercel-index'

export type OAuthTokenSuccess = {
  expiryTime: string
  accessToken: string
  refreshToken: string
}

export type OAuthErrorResponse = {
  error: string
  errorDescription: string
  errorUri: string
}

type MicrosoftTokenResponse = {
  expires_in: string | number
  access_token: string
  refresh_token: string
}

function normaliseTokenResponse(response: MicrosoftTokenResponse): OAuthTokenSuccess {
  return {
    expiryTime: String(response.expires_in),
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  }
}

export function obfuscateToken(token: string): string {
  const encrypted = CryptoJS.AES.encrypt(token, AES_SECRET_KEY)
  return encrypted.toString()
}

export function revealObfuscatedToken(obfuscated: string): string {
  const decrypted = CryptoJS.AES.decrypt(obfuscated, AES_SECRET_KEY)
  return decrypted.toString(CryptoJS.enc.Utf8)
}

export function generateAuthorisationUrl(): string {
  const { clientId, redirectUri, authApi, scope } = getApiConfig()
  const authUrl = authApi.replace('/token', '/authorize')
  const params = new URLSearchParams()

  params.append('client_id', clientId)
  params.append('redirect_uri', redirectUri)
  params.append('response_type', 'code')
  params.append('scope', scope)
  params.append('response_mode', 'query')

  return `${authUrl}?${params.toString()}`
}

export function extractAuthCodeFromRedirected(url: string): string {
  if (!url.startsWith(getApiConfig().redirectUri)) {
    return ''
  }

  const params = new URLSearchParams(url.split('?')[1])
  return params.get('code') ?? ''
}

export async function requestTokenWithAuthCode(code: string): Promise<OAuthTokenSuccess | OAuthErrorResponse> {
  const { clientId, redirectUri, authApi, obfuscatedClientSecret } = getApiConfig()
  const params = new URLSearchParams()

  params.append('client_id', clientId)
  params.append('redirect_uri', redirectUri)
  params.append('client_secret', revealObfuscatedToken(obfuscatedClientSecret))
  params.append('code', code)
  params.append('grant_type', 'authorization_code')

  try {
    const { data } = await axios.post<MicrosoftTokenResponse>(authApi, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return normaliseTokenResponse(data)
  } catch (err: any) {
    const { error, error_description, error_uri } = err.response.data
    return { error, errorDescription: error_description, errorUri: error_uri }
  }
}

export async function requestTokenWithRefreshToken(
  refreshToken: string,
): Promise<OAuthTokenSuccess | OAuthErrorResponse> {
  const { clientId, redirectUri, authApi, obfuscatedClientSecret } = getApiConfig()
  const params = new URLSearchParams()

  params.append('client_id', clientId)
  params.append('redirect_uri', redirectUri)
  params.append('client_secret', revealObfuscatedToken(obfuscatedClientSecret))
  params.append('refresh_token', refreshToken)
  params.append('grant_type', 'refresh_token')

  try {
    const { data } = await axios.post<MicrosoftTokenResponse>(authApi, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    return normaliseTokenResponse(data)
  } catch (err: any) {
    const { error, error_description, error_uri } = err.response.data
    return { error, errorDescription: error_description, errorUri: error_uri }
  }
}

export async function getAuthPersonInfo(accessToken: string) {
  const profileApi = getApiConfig().driveApi.replace('/drive', '')

  return axios.get(profileApi, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
}

export async function sendTokenToServer(accessToken: string, refreshToken: string, expiryTime: string) {
  return axios.post(
    '/api/drive',
    {
      obfuscatedAccessToken: obfuscateToken(accessToken),
      accessTokenExpiry: parseInt(expiryTime),
      obfuscatedRefreshToken: obfuscateToken(refreshToken),
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    },
  )
}
