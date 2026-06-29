export function extractYouTubeId(value: string | null | undefined) {
  if (!value?.trim()) {
    return ''
  }

  const trimmedValue = value.trim()
  const rawIdPattern = /^[a-zA-Z0-9_-]{11}$/

  if (rawIdPattern.test(trimmedValue)) {
    return trimmedValue
  }

  try {
    const url = new URL(trimmedValue)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      return url.pathname.split('/').filter(Boolean)[0] ?? ''
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname.startsWith('/watch')) {
        return url.searchParams.get('v') ?? ''
      }

      if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/').filter(Boolean)[1] ?? ''
      }
    }
  } catch {
    return ''
  }

  return ''
}

export function getYouTubeEmbedUrl(value: string | null | undefined) {
  const videoId = extractYouTubeId(value)

  if (!videoId) {
    return ''
  }

  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
}
