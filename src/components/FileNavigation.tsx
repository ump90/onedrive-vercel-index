import { FC, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import useSWR from 'swr'

import { fetcher } from '../utils/fetchWithSWR'
import { getStoredToken } from '../utils/protectedRouteHandler'
import { getPreviewType } from '../utils/getPreviewType'
import { getExtension } from '../utils/getFileIcon'

// Natural sort for file names
const naturalCompare = (a: string, b: string): number => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

const FileNavigation: FC = () => {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get current file path and parent folder path
  const currentPath = router.asPath.split('?')[0]
  const pathParts = currentPath.split('/').filter(Boolean)

  // Handle locale prefix (e.g., /zh-CN/path/to/file)
  const locales = ['zh-CN', 'zh-TW', 'en', 'de-DE', 'es', 'hi', 'id', 'tr-TR']
  const hasLocale = locales.includes(pathParts[0])

  // Get the actual path without locale
  const actualPathParts = hasLocale ? pathParts.slice(1) : pathParts
  const fileName = decodeURIComponent(actualPathParts[actualPathParts.length - 1] || '')
  const parentPathParts = actualPathParts.slice(0, -1)
  const apiParentPath = '/' + parentPathParts.join('/')

  const hashedToken = getStoredToken(currentPath)

  // Fetch sibling files from parent folder
  const { data, error } = useSWR(
    mounted && fileName ? [`/api/?path=${apiParentPath}`, hashedToken] : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Get sibling files (same type as current file)
  const [prevFile, setPrevFile] = useState<string | null>(null)
  const [nextFile, setNextFile] = useState<string | null>(null)

  useEffect(() => {
    if (!data || !('folder' in data) || !fileName) return

    const currentExtension = getExtension(fileName)
    const currentPreviewType = getPreviewType(currentExtension)

    // Filter files with same preview type and sort naturally
    const siblingFiles = data.folder.value
      .filter((item: any) => {
        if (item.folder) return false
        const ext = getExtension(item.name)
        const previewType = getPreviewType(ext)
        return previewType === currentPreviewType
      })
      .sort((a: any, b: any) => naturalCompare(a.name, b.name))

    // Find current file index
    const currentIndex = siblingFiles.findIndex((item: any) => item.name === fileName)

    if (currentIndex > 0) {
      setPrevFile(siblingFiles[currentIndex - 1].name)
    } else {
      setPrevFile(null)
    }

    if (currentIndex >= 0 && currentIndex < siblingFiles.length - 1) {
      setNextFile(siblingFiles[currentIndex + 1].name)
    } else {
      setNextFile(null)
    }
  }, [data, fileName])

  // Build navigation path (preserve locale prefix)
  const buildPath = useCallback(
    (targetFileName: string) => {
      const prefix = hasLocale ? `/${pathParts[0]}` : ''
      const parentPath = '/' + parentPathParts.join('/')
      return `${prefix}${parentPath}/${encodeURIComponent(targetFileName)}`
    },
    [hasLocale, pathParts, parentPathParts]
  )

  const navigateTo = useCallback(
    (targetFileName: string) => {
      router.push(buildPath(targetFileName))
    },
    [router, buildPath]
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'ArrowLeft' && prevFile) {
        navigateTo(prevFile)
      } else if (e.key === 'ArrowRight' && nextFile) {
        navigateTo(nextFile)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevFile, nextFile, navigateTo])

  // Don't render until mounted (hydration safety)
  if (!mounted) return null

  // Don't render if loading or error
  if (error || !data) return null

  // Don't render if no navigation available
  if (!prevFile && !nextFile) return null

  const buttonClass =
    'fixed top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 dark:bg-gray-800/80 dark:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100'

  return (
    <>
      {/* Previous button */}
      <button
        className={`${buttonClass} left-4`}
        onClick={() => prevFile && navigateTo(prevFile)}
        disabled={!prevFile}
        title={prevFile ? `Previous: ${prevFile}` : 'No previous file'}
        aria-label="Previous file"
      >
        <FontAwesomeIcon icon="arrow-left" size="lg" />
      </button>

      {/* Next button */}
      <button
        className={`${buttonClass} right-4`}
        onClick={() => nextFile && navigateTo(nextFile)}
        disabled={!nextFile}
        title={nextFile ? `Next: ${nextFile}` : 'No next file'}
        aria-label="Next file"
      >
        <FontAwesomeIcon icon="arrow-right" size="lg" />
      </button>
    </>
  )
}

export default FileNavigation
