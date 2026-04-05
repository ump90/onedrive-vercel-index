import type { Metadata } from 'next'

import siteConfig from '../../../config/site.config'
import DrivePageShell from '../../components/app/DrivePageShell'

export const metadata: Metadata = {
  title: siteConfig.title,
}

export default async function FolderPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params

  return <DrivePageShell pathSegments={path} />
}
