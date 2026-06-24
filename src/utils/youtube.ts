export function extractYouTubeId(value: string | null | undefined) {
  if (!value?.trim()) {
    return ''
  }

  const trimmedValue = value.trim()

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
