import type { Metadata } from 'next'

import siteConfig from '../../../../config/site.config'
import OAuthStep1Page from '../../../components/oauth/OAuthStep1Page'

export const metadata: Metadata = {
  title: `OAuth Step 1 - ${siteConfig.title}`,
}

export default function OAuthStep1Route() {
  return <OAuthStep1Page />
}
