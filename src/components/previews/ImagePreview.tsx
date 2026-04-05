import type { OdFileObject } from '../../types'

import { FC } from 'react'

import { PreviewContainer, DownloadBtnContainer } from './Containers'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import { getStoredToken } from '../../utils/protectedRouteHandler'

const ImagePreview: FC<{ file: OdFileObject; path: string }> = ({ file, path }) => {
  const hashedToken = getStoredToken(path)

  return (
    <>
      <PreviewContainer>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="mx-auto"
          src={`/api/raw/?path=${path}${hashedToken ? `&odpt=${hashedToken}` : ''}`}
          alt={file.name}
          width={file.image?.width}
          height={file.image?.height}
        />
      </PreviewContainer>
      <DownloadBtnContainer>
        <DownloadButtonGroup path={path} />
      </DownloadBtnContainer>
    </>
  )
}

export default ImagePreview
