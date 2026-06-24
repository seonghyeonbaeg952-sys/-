const ALLOWED_MAP_HOSTS = [
  'map.naver.com',
  'naver.me',
  'map.kakao.com',
  'kakao.com',
  'daum.net',
  'kko.to',
] as const

const EMBEDDABLE_MAP_HOSTS = ['map.naver.com', 'map.kakao.com'] as const

export type MapProvider = 'kakao' | 'naver' | 'unknown'

export type MapAction = {
  href: string
  label: string
  provider: Exclude<MapProvider, 'unknown'>
}

export type MapActions = {
  buttons: MapAction[]
  embedSrc?: string
  status: 'buttons' | 'embed' | 'empty'
}

export type MapActionInput = {
  address?: string | null
  embedUrl?: string | null
  kakaoMapUrl?: string | null
  naverMapUrl?: string | null
}

function hostnameMatches(hostname: string, allowedHost: string) {
  return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`)
}

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim())
}

export function createNaverSearchUrl(address: string): string | null {
  const normalizedAddress = address.trim()

  if (!normalizedAddress) {
    return null
  }

  return `https://map.naver.com/p/search/${encodeURIComponent(normalizedAddress)}`
}

export function createKakaoSearchUrl(address: string): string | null {
  const normalizedAddress = address.trim()

  if (!normalizedAddress) {
    return null
  }

  return `https://map.kakao.com/link/search/${encodeURIComponent(normalizedAddress)}`
}

export function normalizeMapUrl(url: string): string | null {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) {
    return null
  }

  const normalizedUrl = /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`

  try {
    const parsedUrl = new URL(normalizedUrl)

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return null
    }

    return parsedUrl.toString()
  } catch {
    return null
  }
}

export function isAllowedMapUrl(url: string): boolean {
  const normalizedUrl = normalizeMapUrl(url)

  if (!normalizedUrl) {
    return false
  }

  const hostname = new URL(normalizedUrl).hostname.toLowerCase()

  return ALLOWED_MAP_HOSTS.some((allowedHost) =>
    hostnameMatches(hostname, allowedHost),
  )
}

export function getMapProvider(url: string): MapProvider {
  const normalizedUrl = normalizeMapUrl(url)

  if (!normalizedUrl) {
    return 'unknown'
  }

  const hostname = new URL(normalizedUrl).hostname.toLowerCase()

  if (hostnameMatches(hostname, 'map.naver.com') || hostnameMatches(hostname, 'naver.me')) {
    return 'naver'
  }

  if (
    hostnameMatches(hostname, 'map.kakao.com') ||
    hostnameMatches(hostname, 'kakao.com') ||
    hostnameMatches(hostname, 'daum.net') ||
    hostnameMatches(hostname, 'kko.to')
  ) {
    return 'kakao'
  }

  return 'unknown'
}

export function isLikelyEmbeddableMapUrl(url: string): boolean {
  const normalizedUrl = normalizeMapUrl(url)

  if (!normalizedUrl || !isAllowedMapUrl(normalizedUrl)) {
    return false
  }

  const parsedUrl = new URL(normalizedUrl)
  const hostname = parsedUrl.hostname.toLowerCase()
  const pathname = parsedUrl.pathname.toLowerCase()
  const search = parsedUrl.search.toLowerCase()
  const isEmbeddableHost = EMBEDDABLE_MAP_HOSTS.some((allowedHost) =>
    hostnameMatches(hostname, allowedHost),
  )

  return (
    isEmbeddableHost &&
    (pathname.includes('embed') ||
      pathname.includes('/v5/') ||
      search.includes('embed') ||
      search.includes('output=embed'))
  )
}

function createButton(
  provider: Exclude<MapProvider, 'unknown'>,
  href: string,
): MapAction {
  return {
    href,
    label: provider === 'naver' ? '네이버지도에서 보기' : '카카오맵에서 보기',
    provider,
  }
}

export function getMapActions(input: MapActionInput): MapActions {
  const buttons: MapAction[] = []
  const normalizedEmbedUrl = hasValue(input.embedUrl)
    ? normalizeMapUrl(input.embedUrl ?? '')
    : null
  const embedSrc =
    normalizedEmbedUrl && isLikelyEmbeddableMapUrl(normalizedEmbedUrl)
      ? normalizedEmbedUrl
      : undefined

  const normalizedNaverUrl = hasValue(input.naverMapUrl)
    ? normalizeMapUrl(input.naverMapUrl ?? '')
    : null
  const normalizedKakaoUrl = hasValue(input.kakaoMapUrl)
    ? normalizeMapUrl(input.kakaoMapUrl ?? '')
    : null
  const naverHref =
    normalizedNaverUrl && isAllowedMapUrl(normalizedNaverUrl)
      ? normalizedNaverUrl
      : createNaverSearchUrl(input.address ?? '')
  const kakaoHref =
    normalizedKakaoUrl && isAllowedMapUrl(normalizedKakaoUrl)
      ? normalizedKakaoUrl
      : createKakaoSearchUrl(input.address ?? '')

  if (naverHref) {
    buttons.push(createButton('naver', naverHref))
  }

  if (kakaoHref) {
    buttons.push(createButton('kakao', kakaoHref))
  }

  if (embedSrc) {
    return { buttons, embedSrc, status: 'embed' }
  }

  return {
    buttons,
    status: buttons.length > 0 ? 'buttons' : 'empty',
  }
}
