import AppDriveShell from '../../features/drive/AppDriveShell'

export const dynamic = 'force-dynamic'

export default async function PathPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params

  return <AppDriveShell pathSegments={path} />
}
