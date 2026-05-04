'use client'

import type { OdAPIResponse, OdFileObject, OdFolderChildren, OdFolderObject } from '../../types'

import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faFile,
  faFileAudio,
  faFileImage,
  faFilePdf,
  faFileVideo,
  faFlag,
  faFolder,
} from '@fortawesome/free-regular-svg-icons'
import {
  faArrowRight,
  faChevronCircleDown,
  faDownload,
  faKey,
  faSearch,
  faSignOutAlt,
  faTh,
  faThList,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'

import siteConfig from '../../../config/site.config'
import Footer from '../../components/Footer'
import FourOhFour from '../../components/FourOhFour'
import Loading from '../../components/Loading'
import { DownloadBtnContainer, PreviewContainer } from '../../components/previews/Containers'
import { formatModifiedDateTime, humanFileSize } from '../../utils/fileDetails'
import useLocalStorage from '../../utils/useLocalStorage'
import {
  clearStoredTokens,
  getProtectedRouteTokenCookieNameForRoute,
  getStoredToken,
  matchProtectedRoute,
  setStoredToken,
} from '../auth/protected-route'
import { getPreviewType } from '../preview/preview-type'
import AppSearchModal from './AppSearchModal'
import { itemPath, pathSegmentsToPath } from './path'

export type AppDriveInitialError = {
  message: string
  status: number
}

type LayoutName = 'List' | 'Grid'

const layoutOptions: Array<{ name: LayoutName; icon: IconDefinition }> = [
  { name: 'List', icon: faThList },
  { name: 'Grid', icon: faTh },
]

function iconForItem(item: { name: string; folder?: unknown; image?: unknown; video?: unknown }): IconDefinition {
  if (item.folder) {
    return faFolder
  }

  const extension = item.name.split('.').pop()?.toLowerCase()
  const previewType = getPreviewType(extension ?? '', { video: Boolean(item.video) })

  switch (previewType) {
    case 'image':
      return faFileImage
    case 'video':
      return faFileVideo
    case 'audio':
      return faFileAudio
    case 'pdf':
      return faFilePdf
    default:
      return faFile
  }
}

function hasStoredProtectedToken() {
  if (typeof window === 'undefined') {
    return false
  }

  return siteConfig.protectedRoutes.some(route => {
    const hasLocalToken = Object.prototype.hasOwnProperty.call(localStorage, route)
    const cookieName = getProtectedRouteTokenCookieNameForRoute(route)
    const hasCookieToken = document.cookie
      .split(';')
      .map(cookie => cookie.trim())
      .some(cookie => cookie.startsWith(`${cookieName}=`))

    return hasLocalToken || hasCookieToken
  })
}

function subscribeStoredToken(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  window.addEventListener('storage', onStoreChange)
  window.addEventListener('local-storage', onStoreChange)

  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener('local-storage', onStoreChange)
  }
}

function AppNavbar() {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const tokenPresent = useSyncExternalStore(subscribeStoredToken, hasStoredProtectedToken, () => false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const clearTokens = () => {
    clearStoredTokens()
    router.refresh()
  }

  return (
    <div className="sticky top-0 z-[100] border-b border-gray-900/10 bg-white/80 backdrop-blur-sm dark:border-gray-500/30 dark:bg-gray-900">
      <AppSearchModal searchOpen={searchOpen} setSearchOpen={setSearchOpen} />

      <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 py-2">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 dark:text-white">
          <Image src={siteConfig.icon} alt="" width={24} height={24} priority />
          <span className="hidden font-bold sm:block">{siteConfig.title}</span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-2 text-gray-700 dark:text-white">
          <button
            className="flex h-8 min-w-0 flex-1 items-center justify-between gap-2 rounded-sm bg-gray-100 px-3 text-sm hover:opacity-80 dark:bg-gray-800 md:max-w-56"
            onClick={() => setSearchOpen(true)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <FontAwesomeIcon icon={faSearch} className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">Search ...</span>
            </span>
          </button>

          {tokenPresent && (
            <button
              className="flex h-8 w-8 items-center justify-center rounded-sm bg-gray-100 hover:opacity-80 dark:bg-gray-800"
              title="Logout"
              onClick={clearTokens}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="h-3 w-3" />
            </button>
          )}

          <Link
            className="flex h-8 items-center gap-2 rounded-sm bg-gray-100 px-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-white"
            href="/onedrive-vercel-index-oauth/step-1"
          >
            <FontAwesomeIcon icon={faKey} className="h-3 w-3" />
            <span className="hidden sm:inline">OAuth</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

function AppBreadcrumb({ pathSegments }: { pathSegments: string[] }) {
  if (pathSegments.length === 0) {
    return (
      <div className="text-sm text-gray-600 transition-all duration-75 hover:opacity-80 dark:text-gray-300">
        <Link href="/" className="flex items-center">
          <FontAwesomeIcon className="h-3 w-3" icon={faFlag} />
          <span className="ml-2 font-medium">Home</span>
        </Link>
      </div>
    )
  }

  return (
    <ol className="no-scrollbar inline-flex flex-row-reverse items-center gap-1 overflow-x-scroll text-sm text-gray-600 md:gap-3 dark:text-gray-300">
      {pathSegments
        .slice(0)
        .reverse()
        .map((segment, index) => (
          <li key={`${segment}-${index}`} className="flex flex-shrink-0 items-center">
            <FontAwesomeIcon className="h-3 w-3" icon={faArrowRight} />
            <Link
              href={`/${pathSegments
                .slice(0, pathSegments.length - index)
                .map(pathSegment => encodeURIComponent(pathSegment))
                .join('/')}`}
              className={`ml-1 transition-all duration-75 hover:opacity-70 md:ml-3 ${
                index === 0 ? 'pointer-events-none opacity-80' : ''
              }`}
            >
              {segment}
            </Link>
          </li>
        ))}
      <li className="flex-shrink-0 transition-all duration-75 hover:opacity-80">
        <Link href="/" className="flex items-center">
          <FontAwesomeIcon className="h-3 w-3" icon={faFlag} />
          <span className="ml-2 font-medium">Home</span>
        </Link>
      </li>
    </ol>
  )
}

function AppLayoutSwitch({ layout, setLayout }: { layout: LayoutName; setLayout: (layout: LayoutName) => void }) {
  return (
    <div className="flex flex-shrink-0 overflow-hidden rounded-sm border border-gray-900/10 bg-white text-sm text-gray-600 dark:border-gray-500/30 dark:bg-gray-900 dark:text-gray-300">
      {layoutOptions.map(option => (
        <button
          key={option.name}
          className={`flex h-8 w-9 items-center justify-center ${
            layout === option.name ? 'bg-blue-50 text-blue-700 dark:bg-blue-600/10 dark:text-blue-400' : ''
          }`}
          title={option.name}
          onClick={() => setLayout(option.name)}
        >
          <FontAwesomeIcon icon={option.icon} className="h-3 w-3" />
        </button>
      ))}
    </div>
  )
}

function AppAuth({ path }: { path: string }) {
  const authTokenPath = matchProtectedRoute(path)
  const [token, setToken] = useState('')

  const submitToken = () => {
    setStoredToken(path, token)
    window.location.reload()
  }

  return (
    <PreviewContainer>
      <div className="mx-auto flex max-w-sm flex-col space-y-4 md:my-10">
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">Enter Password</div>
        <p className="text-sm font-medium text-gray-500">
          This route is password protected. If you know the password, please enter it below.
        </p>
        {authTokenPath && <div className="truncate font-mono text-xs text-gray-500">{authTokenPath}</div>}
        <div className="flex items-center space-x-2">
          <input
            className="flex-1 rounded-sm border border-gray-600/10 p-2 font-mono focus:ring-3 focus:ring-blue-300 focus:outline-hidden dark:bg-gray-600 dark:text-white dark:focus:ring-blue-700"
            autoFocus
            type="password"
            placeholder="************"
            value={token}
            onChange={event => setToken(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === 'NumpadEnter') {
                submitToken()
              }
            }}
          />
          <button className="rounded-sm bg-blue-600 px-4 py-2 text-white hover:bg-blue-500" onClick={submitToken}>
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </div>
      </div>
    </PreviewContainer>
  )
}

function FolderItem({ child, path, layout }: { child: OdFolderChildren; path: string; layout: LayoutName }) {
  const href = itemPath(path, child.name)
  const icon = iconForItem(child)
  const [brokenThumbnail, setBrokenThumbnail] = useState(false)

  if (layout === 'Grid') {
    const hashedToken = getStoredToken(href)
    const thumbnailUrl = child.folder
      ? null
      : `/api/thumbnail/?path=${encodeURIComponent(href)}&size=medium${hashedToken ? `&odpt=${hashedToken}` : ''}`

    return (
      <Link href={href} className="group rounded-sm p-2 transition-all hover:bg-gray-100 dark:hover:bg-gray-850">
        <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-sm border border-gray-900/10 dark:border-gray-500/30">
          {thumbnailUrl && !brokenThumbnail ? (
            <Image
              className="object-cover object-top"
              src={thumbnailUrl}
              alt=""
              fill
              sizes="(min-width: 768px) 240px, 50vw"
              unoptimized
              onError={() => setBrokenThumbnail(true)}
            />
          ) : (
            <FontAwesomeIcon icon={icon} className="h-8 w-8 text-gray-500" />
          )}
        </div>
        <div className="mt-2 flex items-start justify-center gap-2 text-sm">
          <FontAwesomeIcon icon={icon} className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{child.name}</span>
        </div>
        <div className="mt-1 truncate text-center font-mono text-xs text-gray-500">
          {formatModifiedDateTime(child.lastModifiedDateTime)}
        </div>
      </Link>
    )
  }

  return (
    <div className="grid grid-cols-12 items-center transition-all hover:bg-gray-100 dark:hover:bg-gray-850">
      <Link href={href} className="col-span-12 grid grid-cols-10 items-center gap-2 px-3 py-2.5 md:col-span-10">
        <div className="col-span-10 flex items-center gap-2 truncate md:col-span-6">
          <span className="w-5 flex-shrink-0 text-center">
            <FontAwesomeIcon icon={icon} />
          </span>
          <span className="truncate">{child.name}</span>
        </div>
        <div className="col-span-3 hidden font-mono text-sm text-gray-500 md:block">
          {formatModifiedDateTime(child.lastModifiedDateTime)}
        </div>
        <div className="col-span-1 hidden font-mono text-sm text-gray-500 md:block">{humanFileSize(child.size)}</div>
      </Link>
      {!child.folder && (
        <a
          className="col-span-2 hidden px-3 py-2.5 text-gray-500 hover:text-gray-900 md:block dark:hover:text-white"
          href={`/api/raw/?path=${encodeURIComponent(href)}`}
          title="Download"
        >
          <FontAwesomeIcon icon={faDownload} />
        </a>
      )}
    </div>
  )
}

function FolderView({
  folderChildren,
  layout,
  path,
}: {
  folderChildren: OdFolderObject['value']
  layout: LayoutName
  path: string
}) {
  const sortedChildren = useMemo(() => {
    return [...folderChildren]
      .filter(child => child.name !== '.password')
      .sort((a, b) => {
        if (a.folder && !b.folder) return -1
        if (!a.folder && b.folder) return 1
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      })
  }, [folderChildren])

  return (
    <div className="rounded-sm bg-white shadow-sm dark:bg-gray-900 dark:text-gray-100">
      <div className="border-b border-gray-900/10 px-3 py-2 text-xs font-bold tracking-widest text-gray-600 uppercase dark:border-gray-500/30 dark:text-gray-400">
        {sortedChildren.length} item(s)
      </div>
      {layout === 'Grid' ? (
        <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-4">
          {sortedChildren.map(child => (
            <FolderItem key={child.id} child={child} path={path} layout={layout} />
          ))}
        </div>
      ) : (
        sortedChildren.map(child => <FolderItem key={child.id} child={child} path={path} layout={layout} />)
      )}
    </div>
  )
}

function FileView({ file, path }: { file: OdFileObject; path: string }) {
  const hashedToken = getStoredToken(path)
  const rawUrl = `/api/raw/?path=${encodeURIComponent(path)}${hashedToken ? `&odpt=${hashedToken}` : ''}`
  const previewType = getPreviewType(file.name.split('.').pop()?.toLowerCase() ?? '', { video: Boolean(file.video) })

  return (
    <>
      <PreviewContainer>
        <div className="rounded-sm border border-gray-900/10 px-8 py-20 text-center dark:border-gray-500/30">
          <FontAwesomeIcon icon={iconForItem(file)} className="h-14 w-14" />
          <div className="mx-auto mt-6 max-w-sm truncate text-sm font-medium">{file.name}</div>
          <div className="mt-2 font-mono text-xs text-gray-500">{previewType ?? 'download'}</div>
        </div>
      </PreviewContainer>
      <DownloadBtnContainer>
        <div className="flex justify-center">
          <a
            href={rawUrl}
            className="flex items-center gap-2 rounded-sm border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:border-blue-500 dark:bg-gray-800 dark:text-blue-300"
          >
            <FontAwesomeIcon icon={faDownload} />
            <span>Download</span>
          </a>
        </div>
      </DownloadBtnContainer>
    </>
  )
}

async function readDriveError(response: Response): Promise<AppDriveInitialError> {
  const body = await response.json().catch(() => null)

  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
    return { message: body.error, status: response.status }
  }

  return { message: response.statusText || 'Request failed.', status: response.status }
}

function AppDriveBrowser({
  initialError,
  initialResponse,
  layout,
  path,
}: {
  initialError?: AppDriveInitialError
  initialResponse?: OdAPIResponse
  layout: LayoutName
  path: string
}) {
  const router = useRouter()
  const [pages, setPages] = useState<OdAPIResponse[]>(() => (initialResponse ? [initialResponse] : []))
  const [error, setError] = useState<AppDriveInitialError | undefined>(initialError)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (error?.status === 403) {
      router.push('/onedrive-vercel-index-oauth/step-1')
    }
  }, [error?.status, router])

  const loadMore = async () => {
    const next = pages[pages.length - 1]?.next

    if (!next || loadingMore) {
      return
    }

    setLoadingMore(true)
    setError(undefined)

    try {
      const params = new URLSearchParams({ next, path })
      const hashedToken = getStoredToken(path)
      const response = await fetch(`/api/drive/?${params.toString()}`, {
        headers: hashedToken ? { 'od-protected-token': hashedToken } : {},
      })

      if (!response.ok) {
        throw await readDriveError(response)
      }

      const data = (await response.json()) as OdAPIResponse
      setPages(currentPages => [...currentPages, data])
    } catch (loadError) {
      setError(
        typeof loadError === 'object' && loadError !== null && 'status' in loadError && 'message' in loadError
          ? (loadError as AppDriveInitialError)
          : { message: 'Request failed.', status: 500 },
      )
    } finally {
      setLoadingMore(false)
    }
  }

  if (error) {
    if (error.status === 403) {
      return null
    }

    return error.status === 401 ? (
      <AppAuth path={path} />
    ) : (
      <PreviewContainer>
        <FourOhFour errorMsg={error.message} />
      </PreviewContainer>
    )
  }

  if (pages.length === 0) {
    return (
      <PreviewContainer>
        <Loading loadingText="Loading ..." />
      </PreviewContainer>
    )
  }

  const firstResponse = pages[0]

  if (!firstResponse) {
    return (
      <PreviewContainer>
        <FourOhFour errorMsg={`Cannot preview ${path}`} />
      </PreviewContainer>
    )
  }

  if (firstResponse.folder) {
    const folderChildren = pages.flatMap(response => response.folder?.value ?? [])
    const next = pages[pages.length - 1]?.next
    const onlyOnePage = !firstResponse.next

    return (
      <>
        <FolderView folderChildren={folderChildren} layout={layout} path={path} />
        {!onlyOnePage && (
          <div className="rounded-b bg-white dark:bg-gray-900 dark:text-gray-100">
            <button
              className={`flex w-full items-center justify-center space-x-2 p-3 disabled:cursor-not-allowed ${
                loadingMore || !next ? 'opacity-60' : 'hover:bg-gray-100 dark:hover:bg-gray-850'
              }`}
              onClick={loadMore}
              disabled={loadingMore || !next}
            >
              {loadingMore ? 'Loading ...' : next ? 'Load more' : 'No more files'}
              {!loadingMore && next && <FontAwesomeIcon icon={faChevronCircleDown} />}
            </button>
          </div>
        )}
      </>
    )
  }

  if (firstResponse.file) {
    return <FileView file={firstResponse.file} path={path} />
  }

  return (
    <PreviewContainer>
      <FourOhFour errorMsg={`Cannot preview ${path}`} />
    </PreviewContainer>
  )
}

export default function AppDriveClientShell({
  initialError,
  initialResponse,
  pathSegments,
}: {
  initialError?: AppDriveInitialError
  initialResponse?: OdAPIResponse
  pathSegments: string[]
}) {
  const path = pathSegmentsToPath(pathSegments)
  const [layout, setLayout] = useLocalStorage<LayoutName>('appPreferredLayout', 'List')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-gray-900">
      <main className="flex w-full flex-1 flex-col bg-gray-50 dark:bg-gray-800">
        <AppNavbar />
        <div className="mx-auto w-full max-w-5xl py-4 sm:p-4">
          <nav className="mb-4 flex items-center justify-between space-x-3 px-4 sm:px-0 sm:pl-1">
            <AppBreadcrumb pathSegments={pathSegments} />
            <AppLayoutSwitch layout={layout} setLayout={setLayout} />
          </nav>
          <AppDriveBrowser
            key={path}
            initialError={initialError}
            initialResponse={initialResponse}
            layout={layout}
            path={path}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
