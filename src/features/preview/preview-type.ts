export const preview = {
  markdown: 'markdown',
  image: 'image',
  text: 'text',
  pdf: 'pdf',
  code: 'code',
  video: 'video',
  audio: 'audio',
  office: 'ms-office',
  epub: 'epub',
  url: 'url',
} as const

export type PreviewType = (typeof preview)[keyof typeof preview]

export const extensions: Record<string, PreviewType> = {
  gif: preview.image,
  jpeg: preview.image,
  jpg: preview.image,
  png: preview.image,
  webp: preview.image,

  md: preview.markdown,
  markdown: preview.markdown,
  mdown: preview.markdown,

  pdf: preview.pdf,

  doc: preview.office,
  docx: preview.office,
  ppt: preview.office,
  pptx: preview.office,
  xls: preview.office,
  xlsx: preview.office,

  c: preview.code,
  cpp: preview.code,
  js: preview.code,
  jsx: preview.code,
  java: preview.code,
  sh: preview.code,
  cs: preview.code,
  py: preview.code,
  css: preview.code,
  html: preview.code,
  ts: preview.code,
  tsx: preview.code,
  rs: preview.code,
  vue: preview.code,
  json: preview.code,
  yml: preview.code,
  yaml: preview.code,
  toml: preview.code,

  txt: preview.text,
  vtt: preview.text,
  srt: preview.text,
  log: preview.text,
  diff: preview.text,

  mp4: preview.video,
  flv: preview.video,
  webm: preview.video,
  m3u8: preview.video,
  mkv: preview.video,
  mov: preview.video,
  avi: preview.video,

  mp3: preview.audio,
  m4a: preview.audio,
  aac: preview.audio,
  wav: preview.audio,
  ogg: preview.audio,
  oga: preview.audio,
  opus: preview.audio,
  flac: preview.audio,

  epub: preview.epub,

  url: preview.url,
}

export function getRawExtension(fileName: string): string {
  return fileName.slice(((fileName.lastIndexOf('.') - 1) >>> 0) + 2)
}

export function getExtension(fileName: string): string {
  return getRawExtension(fileName).toLowerCase()
}

export function getPreviewType(extension: string, flags?: { video?: boolean }): PreviewType | undefined {
  let previewType = extensions[extension]

  if (!previewType) {
    return undefined
  }

  if (extension === 'ts' && flags?.video) {
    previewType = preview.video
  }

  return previewType
}

export function getLanguageByFileName(filename: string): string {
  const extension = getExtension(filename)

  switch (extension) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'rs':
      return 'rust'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'sh':
      return 'shell'
    case 'cs':
      return 'csharp'
    case 'py':
      return 'python'
    case 'yml':
      return 'yaml'
    default:
      return extension
  }
}
