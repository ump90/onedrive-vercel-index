import axios from 'axios'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { useAsync } from 'react-async-hook'
import useConstant from 'use-constant'
import { useTranslation } from '../i18n'

import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import type { OdSearchResult } from '../types'
import { LoadingIcon } from './Loading'

import { getFileIcon } from '../utils/getFileIcon'
import { prefixPathWithLocale } from '../i18n/routing'

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

function SearchResultItem({ result, locale }: { result: OdSearchResult[number]; locale?: string }) {
  const { t } = useTranslation()

  if (result.path === '') {
    return (
      <SearchResultItemTemplate
        driveItem={result}
        driveItemPath={''}
        itemDescription={t('Path unavailable')}
        disabled={true}
        locale={locale}
      />
    )
  }

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
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-labelledby="search-box-title">
      <div aria-hidden="true" className="absolute inset-0 bg-black/10 dark:bg-black/30" onClick={closeSearchBox} />
      <div className="relative flex min-h-full items-start justify-center p-4 pt-16 md:p-8 md:pt-20">
        <div
          className="flex max-h-[min(80vh,48rem)] w-full max-w-3xl flex-col overflow-hidden rounded border border-gray-400/30 bg-white text-left shadow-xl dark:bg-gray-900 dark:text-white"
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
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-white dark:bg-gray-900">
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
