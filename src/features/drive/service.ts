import type {
  OdAPIResponse,
  OdDriveItem,
  OdFileNavigationItem,
  OdFileObject,
  OdFolderChildren,
  OdFolderObject,
  OdImageFile,
  OdSearchResult,
  OdThumbnail,
  OdVideoFile,
} from '../../types'

import { getApiConfig } from '../../lib/config/api'
import { getSiteConfig } from '../../lib/config/site'
import { graphGet } from '../../lib/graph/client'
import { encodeDrivePath, extractNextPageToken, itemPath, sanitiseSearchQuery } from './path'

type DownloadUrlResponse = {
  id: string
  size?: number
  '@microsoft.graph.downloadUrl'?: string
}

type DriveItemIdentity = {
  id: string
  name: string
  size: number
  lastModifiedDateTime: string
  file?: OdFileObject['file']
  folder?: OdFolderChildren['folder']
  image?: OdImageFile
  video?: OdVideoFile
}

type ThumbnailSize = 'large' | 'medium' | 'small'

const driveItemSelect = 'name,size,id,lastModifiedDateTime,folder,file,video,image'

function parentPathForFile(path: string): string {
  const parentPath = path.substring(0, path.lastIndexOf('/'))

  return parentPath || '/'
}

function fileNavigationItem(parentPath: string, item: Pick<DriveItemIdentity, 'name'>): OdFileNavigationItem {
  return { name: item.name, path: itemPath(parentPath, item.name) }
}

async function getFileNavigation({
  accessToken,
  cleanPath,
  currentFileName,
}: {
  accessToken: string
  cleanPath: string
  currentFileName: string
}): Promise<OdAPIResponse['fileNavigation']> {
  const parentPath = parentPathForFile(cleanPath)
  const parentRequestPath = encodeDrivePath(parentPath)
  const parentRequestUrl = `${getApiConfig().driveApi}/root${parentRequestPath}`
  const isRoot = parentRequestPath === ''
  let next = ''
  const files: OdFileNavigationItem[] = []

  do {
    const folderData = await graphGet<OdFolderObject>(`${parentRequestUrl}${isRoot ? '' : ':'}/children`, accessToken, {
      params: {
        select: driveItemSelect,
        $top: getSiteConfig().maxItems,
        ...(next ? { $skipToken: next } : {}),
      },
    })

    const sortedFiles = folderData.value
      .filter(item => item.file && item.name !== '.password')
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

    files.push(...sortedFiles.map(item => fileNavigationItem(parentPath, item)))

    next = extractNextPageToken(folderData['@odata.nextLink']) ?? ''
  } while (next)

  const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
  const currentIndex = sortedFiles.findIndex(item => item.name === currentFileName)

  if (currentIndex === -1) {
    return undefined
  }

  return { previous: sortedFiles[currentIndex - 1], next: sortedFiles[currentIndex + 1] }
}

export async function getDrivePathResponse({
  cleanPath,
  accessToken,
  next = '',
  sort = '',
}: {
  cleanPath: string
  accessToken: string
  next?: string
  sort?: string
}): Promise<OdAPIResponse> {
  const requestPath = encodeDrivePath(cleanPath)
  const requestUrl = `${getApiConfig().driveApi}/root${requestPath}`
  const isRoot = requestPath === ''

  const identityData = await graphGet<DriveItemIdentity>(requestUrl, accessToken, {
    params: {
      select: driveItemSelect,
    },
  })

  if (identityData.folder) {
    const folderData = await graphGet<OdFolderObject>(`${requestUrl}${isRoot ? '' : ':'}/children`, accessToken, {
      params: {
        select: driveItemSelect,
        $top: getSiteConfig().maxItems,
        ...(next ? { $skipToken: next } : {}),
        ...(sort ? { $orderby: sort } : {}),
      },
    })

    const nextPage = extractNextPageToken(folderData['@odata.nextLink'])

    return nextPage ? { folder: folderData, next: nextPage } : { folder: folderData }
  }

  return {
    file: identityData as OdFileObject,
    fileNavigation: await getFileNavigation({ accessToken, cleanPath, currentFileName: identityData.name }),
  }
}

export async function getRawDownloadInfo({
  cleanPath,
  accessToken,
}: {
  cleanPath: string
  accessToken: string
}): Promise<DownloadUrlResponse> {
  return graphGet<DownloadUrlResponse>(`${getApiConfig().driveApi}/root${encodeDrivePath(cleanPath)}`, accessToken, {
    params: {
      select: 'id,size,@microsoft.graph.downloadUrl',
    },
  })
}

export async function getThumbnailUrl({
  cleanPath,
  accessToken,
  size,
}: {
  cleanPath: string
  accessToken: string
  size: ThumbnailSize
}): Promise<string | null> {
  const requestPath = encodeDrivePath(cleanPath)
  const requestUrl = `${getApiConfig().driveApi}/root${requestPath}`
  const isRoot = requestPath === ''
  const data = await graphGet<{ value?: OdThumbnail[] }>(`${requestUrl}${isRoot ? '' : ':'}/thumbnails`, accessToken)

  return data.value && data.value.length > 0 ? data.value[0][size].url : null
}

export async function searchDriveItems({
  accessToken,
  query,
}: {
  accessToken: string
  query: string
}): Promise<OdSearchResult> {
  if (!query) {
    return []
  }

  const searchRootPath = encodeDrivePath('/')
  const encodedPath = searchRootPath === '' ? searchRootPath : `${searchRootPath}:`
  const searchApi = `${getApiConfig().driveApi}/root${encodedPath}/search(q='${sanitiseSearchQuery(query)}')`
  const data = await graphGet<{ value: OdSearchResult }>(searchApi, accessToken, {
    params: {
      select: 'id,name,file,folder,parentReference',
      top: getSiteConfig().maxItems,
    },
  })

  return data.value
}

export async function getDriveItemById({ accessToken, id }: { accessToken: string; id: string }): Promise<OdDriveItem> {
  return graphGet<OdDriveItem>(`${getApiConfig().driveApi}/items/${id}`, accessToken, {
    params: {
      select: 'id,name,parentReference',
    },
  })
}
