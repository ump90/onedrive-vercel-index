import type { Metadata } from 'next'

import { OAuthStep2 } from '../../../features/auth/OAuthSetup'
import { generateAuthorisationUrl } from '../../../features/auth/oauth'
import { getApiConfig } from '../../../lib/config/api'
import { getSiteConfig } from '../../../lib/config/site'

const siteConfig = getSiteConfig()

export const metadata: Metadata = {
  title: `OAuth Step 2 - ${siteConfig.title}`,
}

export default function OAuthStep2Page() {
  return (
    <OAuthStep2
      oAuthUrl={generateAuthorisationUrl()}
      redirectUri={getApiConfig().redirectUri}
      siteIcon={siteConfig.icon}
      siteTitle={siteConfig.title}
    />
  )
}
