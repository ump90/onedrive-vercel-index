'use client'

import type { ComponentType, CSSProperties, ReactNode } from 'react'
import type { Components } from 'react-markdown'
import type { OdFileObject } from '../../types'
import type { PlyrOptions, PlyrProps, PlyrSource } from 'plyr-react'

import { faCopy, faFile, faFileAudio, faFileImage, faFilePdf, faFileVideo } from '@fortawesome/free-regular-svg-icons'
import { faCheck, faDownload, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow, tomorrowNightEighties } from 'react-syntax-highlighter/dist/cjs/styles/hljs'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import FourOhFour from '../../components/FourOhFour'
import Loading, { LoadingIcon } from '../../components/Loading'
import { DownloadBtnContainer, PreviewContainer } from '../../components/previews/Containers'
import { formatModifiedDateTime, humanFileSize } from '../../utils/fileDetails'
import { getStoredToken } from '../auth/protected-route'
import { useTranslation } from '../i18n/client'
import { getExtension, getLanguageByFileName, getPreviewType, preview } from './preview-type'

type AppFilePreviewProps = {
  file: OdFileObject
  path: string
}

type FileTextState = {
  content: string
  error: string
  loading: boolean
}

const syntaxStyle = {
  dark: tomorrowNightEighties as Record<string, CSSProperties>,
  light: tomorrow as Record<string, CSSProperties>,
}

const Plyr = dynamic(() => import('plyr-react').then(mod => mod.default), {
  ssr: false,
  loading: () => <Loading loadingText="Loading player ..." />,
}) as ComponentType<PlyrProps>

function urlWithPath(
  endpoint: string,
  path: string,
  options?: { token?: string | null; proxy?: boolean; size?: string },
) {
  const params = new URLSearchParams({ path })

  if (options?.token) {
    params.set('odpt', options.token)
  }

  if (options?.proxy) {
    params.set('proxy', '1')
  }

  if (options?.size) {
    params.set('size', options.size)
  }

  return `${endpoint}?${params.toString()}`
}

function useBrowserOrigin() {
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    const timeout = window.setTimeout(() => setOrigin(window.location.origin), 0)

    return () => window.clearTimeout(timeout)
  }, [])

  return origin
}

function usePrefersDark() {
  const [prefersDark, setPrefersDark] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const syncTheme = () => setPrefersDark(mediaQuery.matches)

    syncTheme()
    mediaQuery.addEventListener('change', syncTheme)

    return () => mediaQuery.removeEventListener('change', syncTheme)
  }, [])

  return prefersDark
}

function useFileText(path: string): FileTextState {
  const [state, setState] = useState<FileTextState>({ content: '', error: '', loading: true })

  useEffect(() => {
    const controller = new AbortController()
    const token = getStoredToken(path)
    const url = urlWithPath('/api/raw/', path, { token, proxy: true })

    fetch(url, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText || 'Failed to load file content.'}`)
        }

        return response.text()
      })
      .then(content => setState({ content, error: '', loading: false }))
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setState({
          content: '',
          error: error instanceof Error ? error.message : 'Failed to load file content.',
          loading: false,
        })
      })

    return () => controller.abort()
  }, [path])

  return state
}

function joinMarkdownPath(parentPath: string, sourcePath: string): string {
  if (sourcePath.startsWith('/')) {
    return sourcePath
  }

  return `${parentPath.replace(/\/$/, '')}/${sourcePath}`.replace(/^\/?/, '/')
}

function PreviewActionButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode
  onClick: () => void
  title?: string
}) {
  return (
    <button
      className="dark:hover:bg-gray-850 flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:outline-hidden dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function PreviewActions({ path, rawUrl }: { path: string; rawUrl: string }) {
  const { t } = useTranslation()
  const origin = useBrowserOrigin()
  const [copied, setCopied] = useState(false)

  const copyRawLink = async () => {
    const rawLink = origin ? new URL(rawUrl, origin).toString() : rawUrl

    await navigator.clipboard.writeText(rawLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <DownloadBtnContainer>
      <div className="flex flex-wrap justify-center gap-2">
        <a
          className="dark:hover:bg-gray-850 flex items-center gap-2 rounded-sm border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:ring-2 focus:ring-blue-200 focus:outline-hidden dark:border-blue-500 dark:bg-gray-800 dark:text-blue-300"
          href={rawUrl}
          title={`${t('Download')} ${path}`}
        >
          <FontAwesomeIcon icon={faDownload} />
          <span>{t('Download')}</span>
        </a>
        <PreviewActionButton title={t('Copy direct link')} onClick={copyRawLink}>
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
          <span>{copied ? t('Copied') : t('Copy direct link')}</span>
        </PreviewActionButton>
        <a
          className="dark:hover:bg-gray-850 flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:ring-2 focus:ring-blue-200 focus:outline-hidden dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          href={rawUrl}
          target="_blank"
          rel="noreferrer"
          title={t('Open raw file')}
        >
          <FontAwesomeIcon icon={faExternalLinkAlt} />
          <span>{t('Open raw')}</span>
        </a>
      </div>
    </DownloadBtnContainer>
  )
}

function renderContentState(
  state: FileTextState,
  t: (key: string, options?: Record<string, unknown>) => string,
): ReactNode | null {
  if (state.error) {
    return <FourOhFour errorMsg={state.error} />
  }

  if (state.loading) {
    return <Loading loadingText={t('Loading file content...')} />
  }

  if (!state.content) {
    return <FourOhFour errorMsg={t('File is empty.')} />
  }

  return null
}

function ImagePreview({ file, path, rawUrl }: AppFilePreviewProps & { rawUrl: string }) {
  return (
    <>
      <PreviewContainer>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="mx-auto max-h-[80vh] max-w-full object-contain"
          src={rawUrl}
          alt={file.name}
          width={file.image?.width}
          height={file.image?.height}
        />
      </PreviewContainer>
      <PreviewActions path={path} rawUrl={rawUrl} />
    </>
  )
}

function TextPreview({ file, path, rawUrl }: AppFilePreviewProps & { rawUrl: string }) {
  const { t } = useTranslation()
  const textState = useFileText(path)
  const stateContent = renderContentState(textState, t)

  return (
    <>
      <PreviewContainer>
        {stateContent ?? (
          <pre className="max-h-[80vh] overflow-auto p-3 text-sm break-words whitespace-pre-wrap">
            {textState.content}
          </pre>
        )}
      </PreviewContainer>
      <PreviewActions path={path} rawUrl={rawUrl} />
    </>
  )
}

function CodePreview({ file, path, rawUrl }: AppFilePreviewProps & { rawUrl: string }) {
  const { t } = useTranslation()
  const textState = useFileText(path)
  const prefersDark = usePrefersDark()
  const stateContent = renderContentState(textState, t)

  return (
    <>
      <PreviewContainer>
        {stateContent ?? (
          <SyntaxHighlighter
            language={getLanguageByFileName(file.name)}
            style={prefersDark ? syntaxStyle.dark : syntaxStyle.light}
            customStyle={{ margin: 0, maxHeight: '80vh' }}
          >
            {textState.content}
          </SyntaxHighlighter>
        )}
      </PreviewContainer>
      <PreviewActions path={path} rawUrl={rawUrl} />
    </>
  )
}

function MarkdownPreview({ path, rawUrl }: AppFilePreviewProps & { rawUrl: string }) {
  const { t } = useTranslation()
  const textState = useFileText(path)
  const parentPath = path.substring(0, path.lastIndexOf('/')) || '/'
  const stateContent = renderContentState(textState, t)
  const token = getStoredToken(path)

  const components = useMemo<Components>(
    () => ({
      img: ({ alt, src, title, width, height, style }) => {
        const srcString = typeof src === 'string' ? src : ''
        const isAbsoluteUrl = srcString.includes('://') || srcString.startsWith('//') || srcString.startsWith('data:')
        const resolvedSrc = isAbsoluteUrl
          ? srcString
          : urlWithPath('/api/raw/', joinMarkdownPath(parentPath, srcString), { token })

        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={alt} src={resolvedSrc} title={title} width={width} height={height} style={style} />
        )
      },
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '')

        if (!match) {
          return (
            <code className={className} {...props}>
              {children}
            </code>
          )
        }

        return (
          <SyntaxHighlighter language={match[1]} style={syntaxStyle.dark} PreTag="div">
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        )
      },
    }),
    [parentPath, token],
  )

  return (
    <>
      <PreviewContainer>
        {stateContent ?? (
          <div className="markdown-body">
            {/* rehypeRaw intentionally preserves existing OneDrive Markdown HTML support; only trusted directory content should use this path. */}
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={components}
            >
              {textState.content}
            </ReactMarkdown>
          </div>
        )}
      </PreviewContainer>
      <PreviewActions path={path} rawUrl={rawUrl} />
    </>
  )
}

function PdfPreview({ path, rawUrl }: AppFilePreviewProps & { rawUrl: string }) {
  return (
    <>
      <div className="h-[80vh] w-full overflow-hidden rounded-sm border border-gray-900/10 bg-white shadow-sm dark:border-gray-500/30 dark:bg-gray-900">
        <iframe src={rawUrl} title={path} className="h-full w-full" />
      </div>
      <PreviewActions path={path} rawUrl={rawUrl} />
    </>
  )
}

function AudioPreview({ file, path, rawUrl }: AppFilePreviewProps & { rawUrl: string }) {
  const { t } = useTranslation()
  const [brokenThumbnail, setBrokenThumbnail] = useState(false)
  const token = getStoredToken(path)
  const thumbnailUrl = urlWithPath('/api/thumbnail/', path, { token, size: 'medium' })

  return (
    <>
      <PreviewContainer>
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex aspect-square w-full max-w-48 items-center justify-center overflow-hidden rounded-sm bg-gray-100 dark:bg-gray-700">
            {!brokenThumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="h-full w-full object-cover object-top"
                src={thumbnailUrl}
                alt=""
                onError={() => setBrokenThumbnail(true)}
              />
            ) : (
              <FontAwesomeIcon icon={faFileAudio} className="h-12 w-12 text-gray-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{file.name}</div>
            <div className="mt-1 text-sm text-gray-500">
              {t('Last modified:')} {formatModifiedDateTime(file.lastModifiedDateTime)}
            </div>
            <audio className="mt-5 w-full" src={rawUrl} controls preload="metadata" />
          </div>
        </div>
      </PreviewContainer>
      <PreviewActions path={path} rawUrl={rawUrl} />
    </>
  )
}

function FlvVideoPreview({ rawUrl, thumbnailUrl }: { rawUrl: string; thumbnailUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let destroyed = false
    let player: {
      attachMediaElement: (element: HTMLMediaElement) => void
      load: () => void
      destroy: () => void
    } | null = null

    import('mpegts.js')
      .then(({ default: mpegts }) => {
        if (!videoRef.current || destroyed) {
          return
        }

        if (!mpegts.isSupported()) {
          setError('FLV playback is not supported in this browser.')
          return
        }

        player = mpegts.createPlayer({ type: 'flv', url: rawUrl })
        player.attachMediaElement(videoRef.current)
        player.load()
      })
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Failed to load FLV player.'))

    return () => {
      destroyed = true
      player?.destroy()
    }
  }, [rawUrl])

  if (error) {
    return <FourOhFour errorMsg={error} />
  }

  return <video ref={videoRef} className="max-h-[80vh] w-full" poster={thumbnailUrl} controls preload="metadata" />
}

function VideoPreview({ file, path, rawUrl }: AppFilePreviewProps & { rawUrl: string }) {
  const token = getStoredToken(path)
  const thumbnailUrl = urlWithPath('/api/thumbnail/', path, { token, size: 'large' })
  const subtitlePath = `${path.substring(0, path.lastIndexOf('.'))}.vtt`
  const subtitleUrl = urlWithPath('/api/raw/', subtitlePath, { token })
  const extension = getExtension(file.name)
  const isFlv = extension === 'flv'

  const source: PlyrSource = {
    type: 'video',
    title: file.name,
    poster: thumbnailUrl,
    sources: [{ src: rawUrl, type: file.file?.mimeType ?? 'video/mp4' }],
    tracks: [{ kind: 'captions', label: 'Captions', src: subtitleUrl, default: true }],
  }
  const options: PlyrOptions = {
    ratio: `${file.video?.width ?? 16}:${file.video?.height ?? 9}`,
    fullscreen: { iosNative: true },
  }

  return (
    <>
      <PreviewContainer>
        {isFlv ? (
          <FlvVideoPreview rawUrl={rawUrl} thumbnailUrl={thumbnailUrl} />
        ) : (
          <Plyr source={source} options={options} />
        )}
      </PreviewContainer>
      <PreviewActions path={path} rawUrl={rawUrl} />
    </>
  )
}

function OfficeFallbackPreview({ file, path, rawUrl }: AppFilePreviewProps & { rawUrl: string }) {
  const { t } = useTranslation()
  const origin = useBrowserOrigin()
  const absoluteRawUrl = origin ? new URL(rawUrl, origin).toString() : ''
  const viewerUrl = absoluteRawUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteRawUrl)}`
    : ''

  return (
    <>
      <PreviewContainer>
        <div className="space-y-3">
          <div>
            <div className="font-medium">{file.name}</div>
            <div className="mt-1 text-sm text-gray-500">
              {t('Office preview uses the public Microsoft viewer when the raw link is reachable from the internet.')}
            </div>
          </div>
          {viewerUrl ? (
            <iframe
              src={viewerUrl}
              title={file.name}
              className="h-[70vh] w-full rounded-sm border border-gray-900/10 dark:border-gray-500/30"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-sm border border-gray-900/10 dark:border-gray-500/30">
              <LoadingIcon className="h-5 w-5 animate-spin" />
            </div>
          )}
        </div>
      </PreviewContainer>
      <PreviewActions path={path} rawUrl={rawUrl} />
    </>
  )
}

function DefaultDownloadPreview({ file, path, rawUrl }: AppFilePreviewProps & { rawUrl: string }) {
  const { t } = useTranslation()
  const icon = useMemo(() => {
    const previewType = getPreviewType(getExtension(file.name), { video: Boolean(file.video) })

    switch (previewType) {
      case preview.image:
        return faFileImage
      case preview.video:
        return faFileVideo
      case preview.audio:
        return faFileAudio
      case preview.pdf:
        return faFilePdf
      default:
        return faFile
    }
  }, [file])

  return (
    <>
      <PreviewContainer>
        <div className="items-start gap-8 px-5 py-4 md:flex">
          <div className="rounded-sm border border-gray-900/10 px-8 py-20 text-center dark:border-gray-500/30">
            <FontAwesomeIcon icon={icon} className="h-12 w-12 text-gray-500" />
            <div className="mt-6 max-w-40 text-sm font-medium break-words">{file.name}</div>
          </div>
          <div className="mt-5 min-w-0 flex-1 space-y-4 md:mt-0">
            <div>
              <div className="py-1 text-xs font-medium tracking-widest text-gray-500 uppercase">
                {t('Last modified')}
              </div>
              <div>{formatModifiedDateTime(file.lastModifiedDateTime)}</div>
            </div>
            <div>
              <div className="py-1 text-xs font-medium tracking-widest text-gray-500 uppercase">{t('File size')}</div>
              <div>{humanFileSize(file.size)}</div>
            </div>
            <div>
              <div className="py-1 text-xs font-medium tracking-widest text-gray-500 uppercase">{t('MIME type')}</div>
              <div>{file.file?.mimeType ?? t('Unavailable')}</div>
            </div>
          </div>
        </div>
      </PreviewContainer>
      <PreviewActions path={path} rawUrl={rawUrl} />
    </>
  )
}

export default function AppFilePreview({ file, path }: AppFilePreviewProps) {
  const token = getStoredToken(path)
  const rawUrl = urlWithPath('/api/raw/', path, { token })
  const previewType = getPreviewType(getExtension(file.name), { video: Boolean(file.video) })

  switch (previewType) {
    case preview.image:
      return <ImagePreview file={file} path={path} rawUrl={rawUrl} />
    case preview.text:
      return <TextPreview file={file} path={path} rawUrl={rawUrl} />
    case preview.code:
      return <CodePreview file={file} path={path} rawUrl={rawUrl} />
    case preview.markdown:
      return <MarkdownPreview file={file} path={path} rawUrl={rawUrl} />
    case preview.pdf:
      return <PdfPreview file={file} path={path} rawUrl={rawUrl} />
    case preview.audio:
      return <AudioPreview file={file} path={path} rawUrl={rawUrl} />
    case preview.video:
      return <VideoPreview file={file} path={path} rawUrl={rawUrl} />
    case preview.office:
      return <OfficeFallbackPreview file={file} path={path} rawUrl={rawUrl} />
    default:
      return <DefaultDownloadPreview file={file} path={path} rawUrl={rawUrl} />
  }
}
