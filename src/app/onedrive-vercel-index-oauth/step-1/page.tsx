import type { Metadata } from 'next'

import { OAuthStep1 } from '../../../features/auth/OAuthSetup'
import { getApiConfig } from '../../../lib/config/api'
import { getSiteConfig } from '../../../lib/config/site'

const siteConfig = getSiteConfig()

export const metadata: Metadata = {
  title: `OAuth Step 1 - ${siteConfig.title}`,
}

export default function OAuthStep1Page() {
  const apiConfig = getApiConfig()

  return (
    <OAuthStep1
      apiConfigRows={[
        { label: 'CLIENT_ID', value: apiConfig.clientId },
        { label: 'CLIENT_SECRET*', value: apiConfig.obfuscatedClientSecret },
        { label: 'REDIRECT_URI', value: apiConfig.redirectUri },
        { label: 'Auth API URL', value: apiConfig.authApi },
        { label: 'Drive API URL', value: apiConfig.driveApi },
        { label: 'API Scope', value: apiConfig.scope },
      ]}
      siteIcon={siteConfig.icon}
      siteTitle={siteConfig.title}
    />
  )
}
