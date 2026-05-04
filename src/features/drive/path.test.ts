import { describe, expect, it } from 'vitest'

import {
  cleanDrivePath,
  encodeDrivePath,
  extractNextPageToken,
  itemPath,
  pathSegmentsToPath,
  sanitiseSearchQuery,
} from './path'

describe('drive path helpers', () => {
  it('normalises route paths before Graph requests', () => {
    expect(cleanDrivePath('/folder/../file.md/')).toBe('/file.md')
    expect(cleanDrivePath('/folder/', { trimTrailingSlash: false })).toBe('/folder')
  })

  it('encodes OneDrive paths relative to the configured base directory', () => {
    expect(encodeDrivePath('/', '/')).toBe('')
    expect(encodeDrivePath('/nested/read me.md', '/Shared')).toBe(':%2FShared%2Fnested%2Fread%20me.md')
  })

  it('keeps URL path segments separately encoded', () => {
    expect(pathSegmentsToPath(['🥟 Some test files', 'read me.md'])).toBe(
      '/%F0%9F%A5%9F%20Some%20test%20files/read%20me.md',
    )
    expect(itemPath('/folder', 'read me.md')).toBe('/folder/read%20me.md')
  })

  it('extracts Microsoft Graph pagination tokens from next links', () => {
    expect(extractNextPageToken('https://graph.microsoft.com/items?select=id&$skiptoken=abc123')).toBe('abc123')
    expect(extractNextPageToken()).toBeNull()
  })

  it('sanitises Graph search queries with the legacy escaping rules', () => {
    expect(sanitiseSearchQuery("one'drive?/file")).toBe("one''drive%20%20file")
  })
})
