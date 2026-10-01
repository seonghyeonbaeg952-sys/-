export function videoArtworkSources(youtubeId: string, customUrl = ''): string[] {
  const id = youtubeId.trim()
  const automatic = /^[a-zA-Z0-9_-]{11}$/.test(id) ? [
    `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
    `https://img.youtube.com/vi/${id}/sddefault.jpg`,
    `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
  ] : []
  return [...new Set([customUrl.trim(), ...automatic].filter(Boolean))]
}
