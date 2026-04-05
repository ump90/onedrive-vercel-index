import { useTranslation } from '../../i18n'

import FourOhFour from '../FourOhFour'
import Loading from '../Loading'
import { DownloadButton } from '../DownloadBtnGtoup'
import useFileContent from '../../utils/fetchOnMount'
import { DownloadBtnContainer, PreviewContainer } from './Containers'

const parseDotUrl = (content: string): string | undefined => {
  return content
    .split('\n')
    .find(line => line.startsWith('URL='))
    ?.split('=')[1]
}

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
      <PreviewContainer>
        <Loading loadingText={t('Loading file content...')} />
      </PreviewContainer>
    )
  }

  if (!content) {
    return (
      <PreviewContainer>
        <FourOhFour errorMsg={t('File is empty.')} />
      </PreviewContainer>
    )
  }

  const dotUrl = parseDotUrl(content) ?? ''

  return (
    <div>
      <PreviewContainer>
        <pre className="overflow-x-scroll p-0 text-sm md:p-3">{content}</pre>
      </PreviewContainer>
      <DownloadBtnContainer>
        <div className="flex justify-center">
          <DownloadButton
            onClickCallback={() => window.open(dotUrl)}
            btnColor="blue"
            btnText={t('Open URL')}
            btnIcon="external-link-alt"
            btnTitle={t('Open URL{{url}}', { url: dotUrl ? ` ${dotUrl}` : '' })}
          />
        </div>
      </DownloadBtnContainer>
    </div>
  )
}

export default TextPreview
