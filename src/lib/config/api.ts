import rawApiConfig from '../../../config/api.config'

export type ApiConfig = {
  clientId: string
  obfuscatedClientSecret: string
  redirectUri: string
  authApi: string
  driveApi: string
  scope: string
  cacheControlHeader: string
}

function assertString(value: unknown, key: keyof ApiConfig): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`api.config.js field "${key}" must be a non-empty string.`)
  }

  return value
}

function assertUrl(value: unknown, key: keyof ApiConfig): string {
  const url = assertString(value, key)

  try {
    new URL(url)
  } catch {
    throw new Error(`api.config.js field "${key}" must be a valid URL.`)
  }

  return url
}

export function readApiConfig(config: Record<string, unknown> = rawApiConfig): ApiConfig {
  return {
    clientId: assertString(config.clientId, 'clientId'),
    obfuscatedClientSecret: assertString(config.obfuscatedClientSecret, 'obfuscatedClientSecret'),
    redirectUri: assertUrl(config.redirectUri, 'redirectUri'),
    authApi: assertUrl(config.authApi, 'authApi'),
    driveApi: assertUrl(config.driveApi, 'driveApi'),
    scope: assertString(config.scope, 'scope'),
    cacheControlHeader: assertString(config.cacheControlHeader, 'cacheControlHeader'),
  }
}

export const apiConfig = readApiConfig()

export function getApiConfig(): ApiConfig {
  return apiConfig
}
