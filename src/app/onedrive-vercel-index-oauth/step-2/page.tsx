import type { Metadata } from 'next'

import siteConfig from '../../../../config/site.config'
import OAuthStep2Page from '../../../components/oauth/OAuthStep2Page'

export const metadata: Metadata = {
  title: `OAuth Step 2 - ${siteConfig.title}`,
}

export default function OAuthStep2Route() {
  return <OAuthStep2Page />
}
