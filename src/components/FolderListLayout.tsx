import type { OdFolderChildren } from '../types'

import Link from 'next/link'
import { FC, useState, useMemo } from 'react'
import { useClipboard } from 'use-clipboard-copy'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTranslation } from 'next-i18next'

type SortBy = 'name' | 'lastModifiedDateTime' | 'size'
type SortOrder = 'asc' | 'desc'

// Natural sort comparison for file names (handles numbers correctly: 1, 2, 10 instead of 1, 10, 2)
const naturalCompare = (a: string, b: string): number => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
}

const SortIndicator: FC<{ column: SortBy; currentSort: SortBy; order: SortOrder }> = ({ column, currentSort, order }) => {
  if (column !== currentSort) {
    return <FontAwesomeIcon icon="sort" className="ml-1 text-gray-400" size="xs" />
  }
  return (
    <FontAwesomeIcon
      icon={order === 'asc' ? 'sort-up' : 'sort-down'}
      className="ml-1"
      size="xs"
    />
  )
}

import { getBaseUrl } from '../utils/getBaseUrl'
import { humanFileSize, formatModifiedDateTime } from '../utils/fileDetails'

import { Downloading, Checkbox, ChildIcon, ChildName } from './FileListing'
import { getStoredToken } from '../utils/protectedRouteHandler'

const FileListItem: FC<{ fileContent: OdFolderChildren }> = ({ fileContent: c }) => {
  return (
    <div className="grid cursor-pointer grid-cols-10 items-center space-x-2 px-3 py-2.5">
      <div className="col-span-10 flex items-center space-x-2 truncate md:col-span-6" title={c.name}>
        <div className="w-5 flex-shrink-0 text-center">
          <ChildIcon child={c} />
        </div>
        <ChildName name={c.name} folder={Boolean(c.folder)} />
      </div>
      <div className="col-span-3 hidden flex-shrink-0 font-mono text-sm text-gray-700 dark:text-gray-500 md:block">
        {formatModifiedDateTime(c.lastModifiedDateTime)}
      </div>
      <div className="col-span-1 hidden flex-shrink-0 truncate font-mono text-sm text-gray-700 dark:text-gray-500 md:block">
        {humanFileSize(c.size)}
      </div>
    </div>
  )
}

const FolderListLayout = ({
  path,
  folderChildren,
  selected,
  toggleItemSelected,
  totalSelected,
  toggleTotalSelected,
  totalGenerating,
  handleSelectedDownload,
  folderGenerating,
  handleSelectedPermalink,
  handleFolderDownload,
  toast,
}) => {
  const clipboard = useClipboard()
  const hashedToken = getStoredToken(path)

  const { t } = useTranslation()

  // Sorting state
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Handle column header click
  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new sort column with default ascending order
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // Sort folder children
  const sortedChildren = useMemo(() => {
    const sorted = [...folderChildren].sort((a: OdFolderChildren, b: OdFolderChildren) => {
      // Folders always come first
      if (a.folder && !b.folder) return -1
      if (!a.folder && b.folder) return 1

      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = naturalCompare(a.name, b.name)
          break
        case 'lastModifiedDateTime':
          comparison = new Date(a.lastModifiedDateTime).getTime() - new Date(b.lastModifiedDateTime).getTime()
          break
        case 'size':
          comparison = a.size - b.size
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [folderChildren, sortBy, sortOrder])

  // Get item path from item name
  const getItemPath = (name: string) => `${path === '/' ? '' : path}/${encodeURIComponent(name)}`

  return (
    <div className="rounded bg-white shadow-sm dark:bg-gray-900 dark:text-gray-100">
      <div className="grid grid-cols-12 items-center space-x-2 border-b border-gray-900/10 px-3 dark:border-gray-500/30">
        <div
          className="col-span-12 cursor-pointer select-none py-2 text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 md:col-span-6"
          onClick={() => handleSort('name')}
        >
          {t('Name')}
          <SortIndicator column="name" currentSort={sortBy} order={sortOrder} />
        </div>
        <div
          className="col-span-3 hidden cursor-pointer select-none text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 md:block"
          onClick={() => handleSort('lastModifiedDateTime')}
        >
          {t('Last Modified')}
          <SortIndicator column="lastModifiedDateTime" currentSort={sortBy} order={sortOrder} />
        </div>
        <div
          className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-widest text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 md:block"
          onClick={() => handleSort('size')}
        >
          {t('Size')}
          <SortIndicator column="size" currentSort={sortBy} order={sortOrder} />
        </div>
        <div className="hidden text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 md:block">
          {t('Actions')}
        </div>
        <div className="hidden text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 md:block">
          <div className="hidden p-1.5 text-gray-700 dark:text-gray-400 md:flex">
            <Checkbox
              checked={totalSelected}
              onChange={toggleTotalSelected}
              indeterminate={true}
              title={t('Select files')}
            />
            <button
              title={t('Copy selected files permalink')}
              className="cursor-pointer rounded p-1.5 hover:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white dark:hover:bg-gray-600 disabled:dark:text-gray-600 disabled:hover:dark:bg-gray-900"
              disabled={totalSelected === 0}
              onClick={() => {
                clipboard.copy(handleSelectedPermalink(getBaseUrl()))
                toast.success(t('Copied selected files permalink.'))
              }}
            >
              <FontAwesomeIcon icon={['far', 'copy']} size="lg" />
            </button>
            {totalGenerating ? (
              <Downloading title={t('Downloading selected files, refresh page to cancel')} style="p-1.5" />
            ) : (
              <button
                title={t('Download selected files')}
                className="cursor-pointer rounded p-1.5 hover:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white dark:hover:bg-gray-600 disabled:dark:text-gray-600 disabled:hover:dark:bg-gray-900"
                disabled={totalSelected === 0}
                onClick={handleSelectedDownload}
              >
                <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} size="lg" />
              </button>
            )}
          </div>
        </div>
      </div>

      {sortedChildren.map((c: OdFolderChildren) => (
        <div
          className="grid grid-cols-12 transition-all duration-100 hover:bg-gray-100 dark:hover:bg-gray-850"
          key={c.id}
        >
          <Link
            href={`${path === '/' ? '' : path}/${encodeURIComponent(c.name)}`}
            passHref
            className="col-span-12 md:col-span-10"
          >
            <FileListItem fileContent={c} />
          </Link>

          {c.folder ? (
            <div className="hidden p-1.5 text-gray-700 dark:text-gray-400 md:flex">
              <span
                title={t('Copy folder permalink')}
                className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => {
                  clipboard.copy(`${getBaseUrl()}${`${path === '/' ? '' : path}/${encodeURIComponent(c.name)}`}`)
                  toast(t('Copied folder permalink.'), { icon: '👌' })
                }}
              >
                <FontAwesomeIcon icon={['far', 'copy']} />
              </span>
              {folderGenerating[c.id] ? (
                <Downloading title={t('Downloading folder, refresh page to cancel')} style="px-1.5 py-1" />
              ) : (
                <span
                  title={t('Download folder')}
                  className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => {
                    const p = `${path === '/' ? '' : path}/${encodeURIComponent(c.name)}`
                    handleFolderDownload(p, c.id, c.name)()
                  }}
                >
                  <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
                </span>
              )}
            </div>
          ) : (
            <div className="hidden p-1.5 text-gray-700 dark:text-gray-400 md:flex">
              <span
                title={t('Copy raw file permalink')}
                className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => {
                  clipboard.copy(
                    `${getBaseUrl()}/api/raw/?path=${getItemPath(c.name)}${hashedToken ? `&odpt=${hashedToken}` : ''}`
                  )
                  toast.success(t('Copied raw file permalink.'))
                }}
              >
                <FontAwesomeIcon icon={['far', 'copy']} />
              </span>
              <a
                title={t('Download file')}
                className="cursor-pointer rounded px-1.5 py-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                href={`/api/raw/?path=${getItemPath(c.name)}${hashedToken ? `&odpt=${hashedToken}` : ''}`}
              >
                <FontAwesomeIcon icon={['far', 'arrow-alt-circle-down']} />
              </a>
            </div>
          )}
          <div className="hidden p-1.5 text-gray-700 dark:text-gray-400 md:flex">
            {!c.folder && !(c.name === '.password') && (
              <Checkbox
                checked={selected[c.id] ? 2 : 0}
                onChange={() => toggleItemSelected(c.id)}
                title={t('Select file')}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default FolderListLayout
