import type { OdThumbnail } from '../../types'

export type ThumbnailSize = 'large' | 'medium' | 'small'

export function thumbnailUrlFromThumbnails(thumbnails: OdThumbnail[] | undefined, size: ThumbnailSize): string {
  const thumbnail = thumbnails?.[0]

  return thumbnail?.[size]?.url ?? thumbnail?.large?.url ?? thumbnail?.medium?.url ?? thumbnail?.small?.url ?? ''
}
