'use client'

import type { Dispatch, SetStateAction } from 'react'
import type { OdDriveItem, OdSearchResult } from '../../types'

import { Dialog, DialogBackdrop, DialogPanel, Transition } from '@headlessui/react'
import { faFile, faFolder } from '@fortawesome/free-regular-svg-icons'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link'
import { Fragment, useEffect, useState } from 'react'

import siteConfig from '../../../config/site.config'
import { useTranslation } from '../i18n/client'

type ResolvedSearchItem = OdSearchResult[number] & {
  path: string
  description: string
}

function decodePath(path: string): string {
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

function mapAbsolutePath(path: string): string {
  const absolutePath = path.split(siteConfig.baseDirectory === '/' ? 'root:' : siteConfig.baseDirectory)

  return absolutePath.length > 1
    ? absolutePath[1]
        .split('/')
        .map(part => encodeURIComponent(decodeURIComponent(part)))
        .join('/')
    : ''
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : response.statusText

    throw new Error(message)
  }

  return response.json() as Promise<T>
}

function pathFromParentReference(path: string | undefined, name: string): string {
  if (!path) {
    return ''
  }

  return `${mapAbsolutePath(path)}/${encodeURIComponent(name)}`
}

async function resolveSearchItem(item: OdSearchResult[number]): Promise<ResolvedSearchItem> {
  const immediatePath = pathFromParentReference(item.parentReference?.path, item.name)

  if (immediatePath) {
    return {
      ...item,
      path: immediatePath,
      description: decodePath(immediatePath),
    }
  }

  const data = await fetchJson<OdDriveItem>(`/api/item/?id=${encodeURIComponent(item.id)}`)
  const remotePath = pathFromParentReference(data.parentReference.path, data.name)

  return {
    ...item,
    path: remotePath,
    description: remotePath ? decodePath(remotePath) : 'Path unavailable',
  }
}

function useDriveSearch(query: string) {
  const [results, setResults] = useState<ResolvedSearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const trimmedQuery = query.trim()

  useEffect(() => {
    if (!trimmedQuery) {
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError('')

      try {
        const data = await fetchJson<OdSearchResult>(`/api/search/?q=${encodeURIComponent(trimmedQuery)}`)
        const resolvedResults = await Promise.all(data.map(resolveSearchItem))

        if (!controller.signal.aborted) {
          setResults(resolvedResults)
        }
      } catch (searchError) {
        if (!controller.signal.aborted) {
          setError(searchError instanceof Error ? searchError.message : 'Search failed.')
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [trimmedQuery])

  return trimmedQuery ? { error, loading, results } : { error: '', loading: false, results: [] }
}

function SearchResultItem({ item, closeSearchBox }: { item: ResolvedSearchItem; closeSearchBox: () => void }) {
  const disabled = item.path === ''

  return (
    <Link
      href={item.path || '#'}
      className={`dark:hover:bg-gray-850 flex items-center space-x-4 border-b border-gray-400/30 px-4 py-2 hover:bg-gray-50 ${
        disabled ? 'pointer-events-none cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
      onClick={closeSearchBox}
    >
      <FontAwesomeIcon icon={item.folder ? faFolder : faFile} className="h-4 w-4 flex-shrink-0" />
      <div className="min-w-0">
        <div className="truncate text-sm leading-7 font-medium">{item.name}</div>
        <div className="truncate font-mono text-xs opacity-60">{item.description}</div>
      </div>
    </Link>
  )
}

export default function AppSearchModal({
  searchOpen,
  setSearchOpen,
}: {
  searchOpen: boolean
  setSearchOpen: Dispatch<SetStateAction<boolean>>
}) {
  const [query, setQuery] = useState('')
  const { error, loading, results } = useDriveSearch(query)
  const { t } = useTranslation()

  const closeSearchBox = () => {
    setSearchOpen(false)
    setQuery('')
  }

  return (
    <Transition appear show={searchOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[200] overflow-y-auto" onClose={closeSearchBox}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <DialogBackdrop className="fixed inset-0 bg-white/80 dark:bg-gray-800/80" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="my-12 inline-block w-full max-w-3xl transform overflow-hidden rounded-sm border border-gray-400/30 text-left shadow-xl transition-all">
              <Dialog.Title
                as="h3"
                className="flex items-center space-x-4 border-b border-gray-400/30 bg-gray-50 p-4 dark:bg-gray-800 dark:text-white"
              >
                <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />
                <input
                  type="text"
                  className="w-full bg-transparent focus:outline-none focus-visible:outline-none"
                  placeholder={t('Search ...')}
                  value={query}
                  autoFocus
                  onChange={event => setQuery(event.target.value)}
                />
              </Dialog.Title>
              <div
                className="max-h-[80vh] overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900 dark:text-white"
                onClick={closeSearchBox}
              >
                {loading && <div className="px-4 py-12 text-center text-sm font-medium">{t('Loading ...')}</div>}
                {error && (
                  <div className="px-4 py-12 text-center text-sm font-medium">
                    {t('Error: {{message}}', { message: error })}
                  </div>
                )}
                {!loading && !error && query.trim() && results.length === 0 && (
                  <div className="px-4 py-12 text-center text-sm font-medium">{t('Nothing here.')}</div>
                )}
                {!loading &&
                  !error &&
                  results.map(result => (
                    <SearchResultItem key={result.id} item={result} closeSearchBox={closeSearchBox} />
                  ))}
              </div>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
