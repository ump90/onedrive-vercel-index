import { describe, expect, it } from 'vitest'

import { getAuthTokenPath } from './protected-route'

describe('server protected route helpers', () => {
  it('maps protected folders to their .password path', () => {
    expect(getAuthTokenPath('/Private/Folder/secret.txt', ['/private/folder'])).toBe('/private/folder/.password')
  })

  it('returns an empty auth token path for public folders', () => {
    expect(getAuthTokenPath('/public/readme.md', ['/private/folder'])).toBe('')
  })
})
