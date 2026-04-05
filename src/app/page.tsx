import type { Metadata } from 'next'

import siteConfig from '../../config/site.config'
import DrivePageShell from '../components/app/DrivePageShell'

export const metadata: Metadata = {
  title: siteConfig.title,
}

export default function HomePage() {
  return <DrivePageShell />
}
