import { describe, expect, it } from 'vitest'

import { getLanguageByFileName, getPreviewType, preview } from './getPreviewType'

describe('getPreviewType', () => {
  it('maps common preview extensions', () => {
    expect(getPreviewType('md')).toBe(preview.markdown)
    expect(getPreviewType('png')).toBe(preview.image)
    expect(getPreviewType('pdf')).toBe(preview.pdf)
    expect(getPreviewType('mp4')).toBe(preview.video)
  })

  it('uses OneDrive video metadata to disambiguate .ts files', () => {
    expect(getPreviewType('ts')).toBe(preview.code)
    expect(getPreviewType('ts', { video: true })).toBe(preview.video)
  })

  it('returns syntax highlighter languages for known filenames', () => {
    expect(getLanguageByFileName('example.tsx')).toBe('typescript')
    expect(getLanguageByFileName('script.sh')).toBe('shell')
    expect(getLanguageByFileName('workflow.yml')).toBe('yaml')
  })
})
