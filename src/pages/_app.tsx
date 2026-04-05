import '@fortawesome/fontawesome-svg-core/styles.css'

import '../styles/globals.css'
import '../styles/markdown-github.css'
import '../lib/fontawesome'

import type { AppProps } from 'next/app'
import AppProviders from '../components/providers/AppProviders'
import I18nProvider from '../i18n/provider'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppProviders>
      <I18nProvider locale={pageProps.initialLocale}>
        <Component {...pageProps} />
      </I18nProvider>
    </AppProviders>
  )
}
export default MyApp
