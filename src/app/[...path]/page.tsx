import AppDriveShell from '../../features/drive/AppDriveShell'
import { splitLocaleFromSegments } from '../../features/i18n/settings'

export const dynamic = 'force-dynamic'

export default async function PathPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params
  const { pathSegments } = splitLocaleFromSegments(path)

  return <AppDriveShell pathSegments={pathSegments} />
}
