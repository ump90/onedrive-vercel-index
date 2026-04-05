import axios from 'axios'
import useSWR, { SWRResponse } from 'swr'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { useAsync } from 'react-async-hook'
import useConstant from 'use-constant'
import { useTranslation } from '../i18n'

import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { OdDriveItem, OdSearchResult } from '../types'
import { LoadingIcon } from './Loading'

import { getFileIcon } from '../utils/getFileIcon'
import { fetcher } from '../utils/fetchWithSWR'
import siteConfig from '../../config/site.config'
import { debugLog } from '../utils/debugLog'
import { prefixPathWithLocale } from '../i18n/routing'

/**
 * Extract the searched item's path in field 'parentReference' and convert it to the
 * absolute path represented in onedrive-vercel-index
 *
 * @param path Path returned from the parentReference field of the driveItem
 * @returns The absolute path of the driveItem in the search result
 */
function mapAbsolutePath(path: string): string {
  // path is in the format of '/drive/root:/path/to/file', if baseDirectory is '/' then we split on 'root:',
  // otherwise we split on the user defined 'baseDirectory'
  const absolutePath = path.split(siteConfig.baseDirectory === '/' ? 'root:' : siteConfig.baseDirectory)
  // path returned by the API may contain #, by doing a decodeURIComponent and then encodeURIComponent we can
  // replace URL sensitive characters such as the # with %23
  return absolutePath.length > 1 // solve https://github.com/spencerwooo/onedrive-vercel-index/issues/539
    ? absolutePath[1]
        .split('/')
        .map(p => encodeURIComponent(decodeURIComponent(p)))
        .join('/')
    : ''
}

/**
 * Implements a debounced search function that returns a promise that resolves to an array of
 * search results.
 *
 * @returns A react hook for a debounced async search of the drive
 */
function useDriveItemSearch() {
  const [query, setQuery] = useState('')
  const searchDriveItem = async (q: string) => {
    const { data } = await axios.get<OdSearchResult>(`/api/search/?q=${q}`)

    // Map parentReference to the absolute path of the search result
    data.map(item => {
      item['path'] =
        'path' in item.parentReference
          ? // OneDrive International have the path returned in the parentReference field
            `${mapAbsolutePath(item.parentReference.path)}/${encodeURIComponent(item.name)}`
          : // OneDrive for Business/Education does not, so we need extra steps here
            ''
    })

    return data
  }

  const debouncedDriveItemSearch = useConstant(() => AwesomeDebouncePromise(searchDriveItem, 1000))
  const results = useAsync(async () => {
    if (query.length === 0) {
      return []
    } else {
      return debouncedDriveItemSearch(query)
    }
  }, [query])

  return {
    query,
    setQuery,
    results,
  }
}

function SearchResultItemTemplate({
  driveItem,
  driveItemPath,
  itemDescription,
  disabled,
  locale,
}: {
  driveItem: OdSearchResult[number]
  driveItemPath: string
  itemDescription: string
  disabled: boolean
  locale?: string
}) {
  return (
    <Link
      href={prefixPathWithLocale(driveItemPath, locale)}
      className={`dark:hover:bg-gray-850 flex items-center space-x-4 border-b border-gray-400/30 px-4 py-1.5 hover:bg-gray-50 ${
        disabled ? 'pointer-events-none cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <FontAwesomeIcon icon={driveItem.file ? getFileIcon(driveItem.name) : ['far', 'folder']} />
      <div>
        <div className="text-sm leading-8 font-medium">{driveItem.name}</div>
        <div
          className={`truncate overflow-hidden font-mono text-xs opacity-60 ${
            itemDescription === 'Loading ...' && 'animate-pulse'
          }`}
        >
          {itemDescription}
        </div>
      </div>
    </Link>
  )
}

function SearchResultItemLoadRemote({ result, locale }: { result: OdSearchResult[number]; locale?: string }) {
  const { data, error }: SWRResponse<OdDriveItem, { status: number; message: any }> = useSWR(
    [`/api/item/?id=${result.id}`],
    fetcher,
  )

  const { t } = useTranslation()

  if (error) {
    return (
      <SearchResultItemTemplate
        driveItem={result}
        driveItemPath={''}
        itemDescription={typeof error.message?.error === 'string' ? error.message.error : JSON.stringify(error.message)}
        disabled={true}
        locale={locale}
      />
    )
  }
  if (!data) {
    return (
      <SearchResultItemTemplate
        driveItem={result}
        driveItemPath={''}
        itemDescription={t('Loading ...')}
        disabled={true}
        locale={locale}
      />
    )
  }

  const driveItemPath = `${mapAbsolutePath(data.parentReference.path)}/${encodeURIComponent(data.name)}`
  return (
    <SearchResultItemTemplate
      driveItem={result}
      driveItemPath={driveItemPath}
      itemDescription={decodeURIComponent(driveItemPath)}
      disabled={false}
      locale={locale}
    />
  )
}

function SearchResultItem({ result, locale }: { result: OdSearchResult[number]; locale?: string }) {
  if (result.path === '') {
    // path is empty, which means we need to fetch the parentReference to get the path
    return <SearchResultItemLoadRemote result={result} locale={locale} />
  } else {
    // path is not an empty string in the search result, such that we can directly render the component as is
    const driveItemPath = decodeURIComponent(result.path)
    return (
      <SearchResultItemTemplate
        driveItem={result}
        driveItemPath={result.path}
        itemDescription={driveItemPath}
        disabled={false}
        locale={locale}
      />
    )
  }
}

export default function SearchModal({
  searchOpen,
  setSearchOpen,
  locale,
}: {
  searchOpen: boolean
  setSearchOpen: Dispatch<SetStateAction<boolean>>
  locale?: string
}) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery, results } = useDriveItemSearch()

  const { t } = useTranslation()

  useEffect(() => {
    debugLog('search-modal-state', {
      searchOpen,
      query,
      loading: results.loading,
      hasError: Boolean(results.error),
      resultCount: results.result?.length ?? null,
      locale,
    })
  }, [locale, query, results.error, results.loading, results.result, searchOpen])

  const closeSearchBox = () => {
    setSearchOpen(false)
    setQuery('')
  }

  useEffect(() => {
    if (!searchOpen) {
      return
    }

    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setSearchOpen(false)
        setQuery('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.documentElement.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [searchOpen, setQuery, setSearchOpen])

  if (!searchOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[200] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-box-title"
      onClick={closeSearchBox}
    >
      <div aria-hidden="true" className="fixed inset-0 bg-black/10 dark:bg-black/30" />
      <div className="min-h-screen px-4 py-12 text-center">
        <div
          className="relative inline-block w-full max-w-3xl overflow-hidden rounded border border-gray-400/30 bg-white text-left shadow-xl dark:bg-gray-900 dark:text-white"
          onClick={event => event.stopPropagation()}
        >
          <div className="flex items-center space-x-4 border-b border-gray-400/30 bg-gray-50 p-4 dark:bg-gray-800">
            <FontAwesomeIcon icon="search" className="h-4 w-4" />
            <h3 id="search-box-title" className="sr-only">
              {t('Search ...')}
            </h3>
            <input
              ref={searchInputRef}
              type="text"
              id="search-box"
              className="w-full bg-transparent focus:outline-none focus-visible:outline-none"
              placeholder={t('Search ...')}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button
              type="button"
              className="rounded-lg bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
              onClick={closeSearchBox}
            >
              ESC
            </button>
          </div>
          <div className="max-h-[80vh] overflow-x-hidden overflow-y-scroll bg-white dark:bg-gray-900">
            {results.loading && (
              <div className="px-4 py-12 text-center text-sm font-medium">
                <LoadingIcon className="svg-inline--fa mr-2 inline-block h-4 w-4 animate-spin" />
                <span>{t('Loading ...')}</span>
              </div>
            )}
            {results.error && (
              <div className="px-4 py-12 text-center text-sm font-medium">
                {t('Error: {{message}}', { message: results.error.message })}
              </div>
            )}
            {results.result && (
              <>
                {results.result.length === 0 ? (
                  <div className="px-4 py-12 text-center text-sm font-medium">{t('Nothing here.')}</div>
                ) : (
                  results.result.map(result => <SearchResultItem key={result.id} result={result} locale={locale} />)
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
