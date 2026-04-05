import { useTranslation } from '../../i18n'

import FourOhFour from '../FourOhFour'
import Loading from '../Loading'
import DownloadButtonGroup from '../DownloadBtnGtoup'
import useFileContent from '../../utils/fetchOnMount'
import { DownloadBtnContainer, PreviewContainer } from './Containers'

const TextPreview = ({ file: _file, path }: { file: unknown; path: string }) => {
  const { t } = useTranslation()

  const { response: content, error, validating } = useFileContent(`/api/raw/?path=${path}`, path)
  if (error) {
    return (
      <PreviewContainer>
        <FourOhFour errorMsg={error} />
      </PreviewContainer>
    )
  }

  if (validating) {
    return (
      <>
        <PreviewContainer>
          <Loading loadingText={t('Loading file content...')} />
        </PreviewContainer>
        <DownloadBtnContainer>
          <DownloadButtonGroup path={path} />
        </DownloadBtnContainer>
      </>
    )
  }

  if (!content) {
    return (
      <>
        <PreviewContainer>
          <FourOhFour errorMsg={t('File is empty.')} />
        </PreviewContainer>
        <DownloadBtnContainer>
          <DownloadButtonGroup path={path} />
        </DownloadBtnContainer>
      </>
    )
  }

  return (
    <div>
      <PreviewContainer>
        <pre className="overflow-x-scroll p-0 text-sm md:p-3">{content}</pre>
      </PreviewContainer>
      <DownloadBtnContainer>
        <DownloadButtonGroup path={path} />
      </DownloadBtnContainer>
    </div>
  )
}

export default TextPreview
