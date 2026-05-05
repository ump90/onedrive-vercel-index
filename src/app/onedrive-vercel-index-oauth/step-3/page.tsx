import type { Metadata } from 'next'

import { OAuthStep3, type OAuthStep3Result } from '../../../features/auth/OAuthSetup'
import { requestTokenWithAuthCode } from '../../../features/auth/oauth'
import { getApiConfig } from '../../../lib/config/api'
import { getSiteConfig } from '../../../lib/config/site'

type OAuthStep3PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const siteConfig = getSiteConfig()

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `OAuth Step 3 - ${siteConfig.title}`,
}

function firstSearchParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
}

async function getOAuthStep3Result(authCode: string): Promise<OAuthStep3Result> {
  if (!authCode) {
    return {
      description: 'Where is the auth code? Did you follow step 2 you silly donut?',
      error: 'No auth code present',
      ok: false,
    }
  }

  const response = await requestTokenWithAuthCode(authCode)

  if ('error' in response) {
    return {
      description: response.errorDescription,
      error: response.error,
      errorUri: response.errorUri,
      ok: false,
    }
  }

  return {
    accessToken: response.accessToken,
    expiryTime: Number.parseInt(response.expiryTime, 10),
    ok: true,
    refreshToken: response.refreshToken,
  }
}

export default async function OAuthStep3Page({ searchParams }: OAuthStep3PageProps) {
  const params = await searchParams
  const result = await getOAuthStep3Result(firstSearchParam(params.authCode))
  const profileApi = getApiConfig().driveApi.replace('/drive', '')

  return (
    <OAuthStep3
      profileApi={profileApi}
      result={result}
      siteIcon={siteConfig.icon}
      siteTitle={siteConfig.title}
      userPrincipalName={siteConfig.userPrincipalName}
    />
  )
}
