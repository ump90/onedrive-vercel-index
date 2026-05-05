const path = require('path')

const locales = ['de-DE', 'en', 'es', 'zh-CN', 'hi', 'id', 'tr-TR', 'zh-TW']

module.exports = {
  cookieName: 'NEXT_LOCALE',
  contextSeparator: '——',
  defaultLocale: 'en',
  keySeparator: false,
  localeLabels: {
    'de-DE': '🇩🇪 Deutsch',
    en: '🇬🇧 English',
    es: '🇪🇸 Español',
    'zh-CN': '🇨🇳 简体中文',
    hi: '🇮🇳 हिन्दी',
    id: '🇮🇩 Indonesia',
    'tr-TR': '🇹🇷 Türkçe',
    'zh-TW': '🇹🇼 繁體中文',
  },
  localePath: path.resolve('public/locales'),
  locales,
  namespaceSeparator: false,
  pluralSeparator: '——',
}
