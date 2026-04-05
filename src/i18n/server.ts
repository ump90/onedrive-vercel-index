import { getPreferredLocale } from './config'

type RequestLike = {
  headers?: {
    cookie?: string
    'accept-language'?: string | string[]
  }
}

export function getI18nServerProps(req?: RequestLike | null) {
  return {
    initialLocale: getPreferredLocale(req?.headers?.cookie, req?.headers?.['accept-language']),
  }
}
