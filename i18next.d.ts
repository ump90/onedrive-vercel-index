import 'i18next'

declare module 'i18next' {
  interface CustomTypeOptions {
    // This is set to prevent i18next's t function to return null
    returnNull: false
  }
}
