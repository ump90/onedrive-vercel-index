import rawSiteConfig from '../../../config/site.config'

export type SiteLink = {
  name: string
  link: string
}

export type SiteConfig = {
  userPrincipalName: string
  icon: string
  kvPrefix: string
  title: string
  baseDirectory: string
  maxItems: number
  googleFontSans: string
  googleFontMono: string
  googleFontLinks: string[]
  footer: string
  protectedRoutes: string[]
  email: string
  links: SiteLink[]
  datetimeFormat: string
}

function assertString(value: unknown, key: keyof SiteConfig): string {
  if (typeof value !== 'string') {
    throw new Error(`site.config.js field "${key}" must be a string.`)
  }

  return value
}

function assertNumber(value: unknown, key: keyof SiteConfig): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`site.config.js field "${key}" must be a number.`)
  }

  return value
}

function assertStringArray(value: unknown, key: keyof SiteConfig): string[] {
  if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
    throw new Error(`site.config.js field "${key}" must be a string array.`)
  }

  return value
}

function isSiteLink(item: unknown): item is SiteLink {
  return (
    typeof item === 'object' &&
    item !== null &&
    'name' in item &&
    'link' in item &&
    typeof item.name === 'string' &&
    typeof item.link === 'string'
  )
}

function assertLinks(value: unknown): SiteLink[] {
  if (!Array.isArray(value) || !value.every(isSiteLink)) {
    throw new Error('site.config.js field "links" must be an array of { name, link } objects.')
  }

  return value
}

export function readSiteConfig(config: Record<string, unknown> = rawSiteConfig): SiteConfig {
  return {
    userPrincipalName: assertString(config.userPrincipalName, 'userPrincipalName'),
    icon: assertString(config.icon, 'icon'),
    kvPrefix: assertString(config.kvPrefix, 'kvPrefix'),
    title: assertString(config.title, 'title'),
    baseDirectory: assertString(config.baseDirectory, 'baseDirectory'),
    maxItems: assertNumber(config.maxItems, 'maxItems'),
    googleFontSans: assertString(config.googleFontSans, 'googleFontSans'),
    googleFontMono: assertString(config.googleFontMono, 'googleFontMono'),
    googleFontLinks: assertStringArray(config.googleFontLinks, 'googleFontLinks'),
    footer: assertString(config.footer, 'footer'),
    protectedRoutes: assertStringArray(config.protectedRoutes, 'protectedRoutes'),
    email: assertString(config.email, 'email'),
    links: assertLinks(config.links),
    datetimeFormat: assertString(config.datetimeFormat, 'datetimeFormat'),
  }
}

export const siteConfig = readSiteConfig()

export function getSiteConfig(): SiteConfig {
  return siteConfig
}
