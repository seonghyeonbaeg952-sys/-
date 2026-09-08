import type { PublicGalleryData } from '../../lib/publicData'
import { extractYouTubeId, getYouTubeEmbedUrl } from '../../utils/youtube'

export type GalleryTab = 'photos' | 'videos' | 'posters'
export type GalleryLocation = { tab: GalleryTab; category: string; mediaId: string | null }

const categoryLabels: Record<string, string> = {
  archive: '아카이브', concert: '공연', event: '행사', practice: '연습',
}

export function getGalleryCategoryLabel(category: string) {
  const value = category.trim()
  return Object.hasOwn(categoryLabels, value) ? categoryLabels[value] : value || '아카이브'
}

export function getGalleryView(data: PublicGalleryData, category: string) {
  // Defense in depth; server queries and RLS remain the source of public access.
  const allImages = data.images.filter(item => item.is_visible)
  return {
    allImages,
    images: allImages.filter(item => category === 'all' || item.category === category),
    categories: Array.from(new Set(allImages.map(item => item.category)))
      .map(value => ({ value, label: getGalleryCategoryLabel(value) })),
    videos: data.videos.filter(item => item.is_visible),
    posters: data.posters.filter(item => item.is_visible),
  }
}

export function readGalleryLocation(params: URLSearchParams): GalleryLocation {
  const tab = params.get('tab')
  return {
    tab: tab === 'videos' || tab === 'posters' ? tab : 'photos',
    category: params.get('category')?.trim() || 'all',
    mediaId: params.get('media')?.trim() || null,
  }
}

export function updateGallerySearch(params: URLSearchParams, patch: Partial<GalleryLocation>) {
  const next = new URLSearchParams(params)
  if (patch.tab !== undefined) next.set('tab', patch.tab)
  if (patch.category !== undefined) {
    if (patch.category === 'all') next.delete('category')
    else next.set('category', patch.category)
  }
  if (patch.mediaId !== undefined) {
    if (patch.mediaId === null) next.delete('media')
    else next.set('media', patch.mediaId)
  }
  return next
}

export function getAdjacentMediaId(
  items: readonly { id: string }[],
  selectedId: string,
  direction: 'next' | 'previous',
) {
  if (items.length < 2) return null
  const index = items.findIndex(item => item.id === selectedId)
  if (index < 0) return null
  return items[(index + (direction === 'next' ? 1 : -1) + items.length) % items.length].id
}

function getStartSeconds(value: string | null) {
  if (!value) return 0
  if (/^\d{1,6}s?$/.test(value)) return Number.parseInt(value, 10)
  const parts = /^(?:(\d{1,6})h)?(?:(\d{1,6})m)?(?:(\d{1,6})s)?$/.exec(value)
  if (!parts) return 0
  return Number(parts[1] || 0) * 3600 + Number(parts[2] || 0) * 60 + Number(parts[3] || 0)
}

export function getGalleryVideoLinks(value: string) {
  const source = value.trim()
  const id = extractYouTubeId(source)
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return null
  let start = 0
  if (source !== id) {
    try {
      const url = new URL(source)
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null
      start = getStartSeconds(url.searchParams.get('t') ?? url.searchParams.get('start'))
    } catch {
      return null
    }
  }
  return {
    embed: `${getYouTubeEmbedUrl(id)}${start ? `?start=${start}` : ''}`,
    external: `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ''}`,
  }
}
