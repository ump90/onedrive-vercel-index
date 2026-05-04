import { describe, expect, it } from 'vitest'

import { queryToPath } from './pathEncoding'

describe('queryToPath', () => {
  it('returns root for missing path params', () => {
    expect(queryToPath()).toBe('/')
    expect(queryToPath({})).toBe('/')
  })

  it('encodes a single route segment', () => {
    expect(queryToPath({ path: 'space name.md' })).toBe('/space%20name.md')
  })

  it('encodes every catch-all route segment separately', () => {
    expect(queryToPath({ path: ['🥟 Some test files', 'Protected route', 'read me.md'] })).toBe(
      '/%F0%9F%A5%9F%20Some%20test%20files/Protected%20route/read%20me.md'
    )
  })
})
