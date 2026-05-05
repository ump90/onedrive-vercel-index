import { describe, expect, it } from 'vitest'

import { normalizeLocale, resolveLocaleFromAcceptLanguage, stripLocalePrefixFromPathname } from './settings'

describe('i18n settings', () => {
  it('normalizes exact and language-only locale tags', () => {
    expect(normalizeLocale('zh-CN')).toBe('zh-CN')
    expect(normalizeLocale('zh')).toBe('zh-CN')
    expect(normalizeLocale('en-US')).toBe('en')
  })

  it('resolves the best supported Accept-Language entry', () => {
    expect(resolveLocaleFromAcceptLanguage('fr-CA,zh-CN;q=0.9,en;q=0.8')).toBe('zh-CN')
  })

  it('strips locale prefixes while preserving query strings', () => {
    expect(stripLocalePrefixFromPathname('/zh-CN/folder/file.txt?download=1')).toBe('/folder/file.txt?download=1')
  })
})
