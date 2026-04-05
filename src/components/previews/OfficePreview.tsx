import type { OdFileObject } from '../../types'
import { FC, useEffect, useRef, useState } from 'react'

import Preview from 'preview-office-docs'

import DownloadButtonGroup from '../DownloadBtnGtoup'
import { DownloadBtnContainer } from './Containers'
import { getBaseUrl } from '../../utils/getBaseUrl'
import { getStoredToken } from '../../utils/protectedRouteHandler'

const OfficePreview: FC<{ file: OdFileObject; path: string }> = ({ file: _file, path }) => {
  const hashedToken = getStoredToken(path)

  const docContainer = useRef<HTMLDivElement>(null)
  const [docContainerWidth, setDocContainerWidth] = useState(600)

  const docUrl = encodeURIComponent(`${getBaseUrl()}/api/raw/?path=${path}${hashedToken ? `&odpt=${hashedToken}` : ''}`)

  useEffect(() => {
    setDocContainerWidth(docContainer.current ? docContainer.current.offsetWidth : 600)
  }, [])

  return (
    <div>
      <div className="overflow-scroll" ref={docContainer} style={{ maxHeight: '90vh' }}>
        <Preview url={docUrl} width={docContainerWidth.toString()} height="600" />
      </div>
      <DownloadBtnContainer>
        <DownloadButtonGroup path={path} />
      </DownloadBtnContainer>
    </div>
  )
}

export default OfficePreview
