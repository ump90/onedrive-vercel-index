import type { Metadata } from 'next'

import siteConfig from '../../../../config/site.config'
import OAuthStep3Page from '../../../components/oauth/OAuthStep3Page'
import { requestTokenWithAuthCode } from '../../../utils/oAuthHandler'

type OAuthStep3RouteProps = {
  searchParams: Promise<{
    authCode?: string | string[]
  }>
}

export const metadata: Metadata = {
  title: `OAuth Step 3 - ${siteConfig.title}`,
}

export default async function OAuthStep3Route({ searchParams }: OAuthStep3RouteProps) {
  const { authCode } = await searchParams
  const resolvedAuthCode = Array.isArray(authCode) ? authCode[0] : authCode

  if (!resolvedAuthCode) {
    return (
      <OAuthStep3Page
        error="No auth code present"
        description="Where is the auth code? Did you follow step 2 you silly donut?"
      />
    )
  }

  const response = await requestTokenWithAuthCode(resolvedAuthCode)

  if ('error' in response) {
    return (
      <OAuthStep3Page
        error={response.error}
        description={response.errorDescription}
        errorUri={response.errorUri}
      />
    )
  }

  return (
    <OAuthStep3Page
      error={null}
      expiryTime={Number.parseInt(response.expiryTime, 10) || 0}
      accessToken={response.accessToken}
      refreshToken={response.refreshToken}
    />
  )
}
