import AppDriveShell from '../features/drive/AppDriveShell'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return <AppDriveShell pathSegments={[]} />
}
