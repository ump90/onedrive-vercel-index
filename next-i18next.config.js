const path = require('path')

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['de-DE', 'en', 'es', 'zh-CN', 'hi', 'id', 'tr-TR', 'zh-TW']
  },
  localePath: typeof window === 'undefined' ? path.resolve('./public/locales') : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  keySeparator: false,
  namespaceSeparator: false,
  pluralSeparator: '——',
  contextSeparator: '——'
}
