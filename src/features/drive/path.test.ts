import { describe, expect, it } from 'vitest'

import {
  cleanDrivePath,
  decodeDrivePath,
  decodePathSegments,
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
    expect(cleanDrivePath('/%E5%90%8C%E4%BA%BA/%25E4%25B8%2587%25E5%258D%258E.mp4')).toBe(
      '/同人/%E4%B8%87%E5%8D%8E.mp4',
    )
  })

  it('encodes OneDrive paths relative to the configured base directory', () => {
    expect(encodeDrivePath('/', '/')).toBe('')
    expect(encodeDrivePath('/nested/read me.md', '/Shared')).toBe(':%2FShared%2Fnested%2Fread%20me.md')
  })

  it('keeps decoded drive paths unescaped for Graph path encoding', () => {
    expect(pathSegmentsToPath(['🥟 Some test files', 'read me.md'])).toBe('/🥟 Some test files/read me.md')
    expect(itemPath('/folder', 'read me.md')).toBe('/folder/read%20me.md')
  })

  it('decodes encoded route params before building OneDrive paths', () => {
    expect(decodePathSegments(['%E7%95%AA%E5%89%A7'])).toEqual(['番剧'])
    expect(decodeDrivePath('/%E7%95%AA%E5%89%A7/read%20me.md')).toBe('/番剧/read me.md')
    expect(pathSegmentsToPath(decodePathSegments(['%E7%95%AA%E5%89%A7']))).toBe('/番剧')
  })

  it('extracts Microsoft Graph pagination tokens from next links', () => {
    expect(extractNextPageToken('https://graph.microsoft.com/items?select=id&$skiptoken=abc123')).toBe('abc123')
    expect(extractNextPageToken()).toBeNull()
  })

  it('sanitises Graph search queries with the legacy escaping rules', () => {
    expect(sanitiseSearchQuery("one'drive?/file")).toBe("one''drive%20%20file")
  })
})
