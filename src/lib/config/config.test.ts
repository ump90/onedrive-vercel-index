import { describe, expect, it } from 'vitest'

import { readApiConfig } from './api'
import { readSiteConfig } from './site'

const validApiConfig = {
  clientId: 'client-id',
  obfuscatedClientSecret: 'secret',
  redirectUri: 'http://localhost',
  authApi: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  driveApi: 'https://graph.microsoft.com/v1.0/me/drive',
  scope: 'user.read files.read.all offline_access',
  cacheControlHeader: 'max-age=0',
}

const validSiteConfig = {
  userPrincipalName: 'owner@example.com',
  icon: '/icons/128.png',
  kvPrefix: 'test:',
  title: 'Test Drive',
  baseDirectory: '/',
  maxItems: 100,
  googleFontSans: 'Inter',
  googleFontMono: 'Fira Mono',
  googleFontLinks: ['https://fonts.googleapis.com/css2?family=Inter'],
  footer: 'Footer',
  protectedRoutes: ['/private'],
  email: '',
  links: [{ name: 'GitHub', link: 'https://github.com/example/repo' }],
  datetimeFormat: 'YYYY-MM-DD HH:mm:ss',
}

describe('typed config readers', () => {
  it('accepts valid legacy API config objects', () => {
    expect(readApiConfig(validApiConfig).driveApi).toBe(validApiConfig.driveApi)
  })

  it('rejects invalid API URLs', () => {
    expect(() => readApiConfig({ ...validApiConfig, driveApi: 'not-a-url' })).toThrow('driveApi')
  })

  it('accepts valid legacy site config objects', () => {
    expect(readSiteConfig(validSiteConfig).protectedRoutes).toEqual(['/private'])
  })

  it('rejects malformed protected route config', () => {
    expect(() => readSiteConfig({ ...validSiteConfig, protectedRoutes: [123] })).toThrow('protectedRoutes')
  })
})
