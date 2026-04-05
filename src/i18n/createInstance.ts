import { createInstance, type InitOptions } from 'i18next'
import { initReactI18next } from 'react-i18next'

import { defaultLocale, locales, type AppLocale } from './config'
import { resources } from './resources'

export function createI18nInstance(locale: AppLocale) {
  const instance = createInstance()
  const options: InitOptions = {
    lng: locale,
    fallbackLng: defaultLocale,
    supportedLngs: [...locales],
    defaultNS: 'common',
    ns: ['common'],
    resources,
    initAsync: false,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    keySeparator: false,
    nsSeparator: false,
    pluralSeparator: '——',
    contextSeparator: '——',
  }

  instance.use(initReactI18next).init(options)

  return instance
}
