import { describe, expect, it } from 'vitest'

import {
  compareHashedToken,
  getProtectedRouteTokenCookieNameForRoute,
  matchProtectedRoute,
} from './protectedRouteHandler'

describe('protected route helpers', () => {
  it('matches encoded protected route prefixes', () => {
    expect(matchProtectedRoute('/%F0%9F%8C%9E%20Private%20folder/u-need-a-password/secret.txt')).toBe(
      '/🌞 Private folder/u-need-a-password'
    )
  })

  it('matches decoded protected route prefixes', () => {
    expect(matchProtectedRoute('/🌞 Private folder/u-need-a-password/secret.txt')).toBe(
      '/🌞 Private folder/u-need-a-password'
    )
  })

  it('returns an empty string for public routes', () => {
    expect(matchProtectedRoute('/public/readme.md')).toBe('')
  })

  it('compares hashed tokens after trimming the stored password file', () => {
    expect(
      compareHashedToken({
        odTokenHeader: '2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b',
        dotPassword: 'secret\n',
      })
    ).toBe(true)
  })

  it('creates cookie-safe names for protected route tokens', () => {
    expect(getProtectedRouteTokenCookieNameForRoute('/🌞 Private folder/u-need-a-password')).toMatch(/^odpt_[a-f0-9]+$/)
  })
})
