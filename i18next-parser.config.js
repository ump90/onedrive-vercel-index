const path = require('path')

const i18n = require('./i18n.config')

module.exports = {
  createOldCatalogs: false,
  defaultNamespace: 'common',
  defaultValue: (lng, _ns, key) => (lng === i18n.defaultLocale ? key : ''),
  keySeparator: false,
  namespaceSeparator: false,
  pluralSeparator: '——',
  contextSeparator: '——',
  lineEnding: 'lf',
  locales: i18n.locales,
  output: path.join(i18n.localePath, '$LOCALE/$NAMESPACE.json'),
  input: ['**/*.{ts,tsx}', '!**/node_modules/**'],
  sort: true,
}
