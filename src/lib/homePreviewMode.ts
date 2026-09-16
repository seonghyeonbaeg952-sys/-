type HomePreviewContext = {
  pathname: string
  search: string
  isEmbedded: boolean
}

export function getHomePreviewAuthOptions(context?: HomePreviewContext) {
  const isPublicHomePreview = Boolean(
    context?.isEmbedded &&
    context.pathname === '/' &&
    new URLSearchParams(context.search).get('home-cms-preview') === '1',
  )

  return {
    autoRefreshToken: !isPublicHomePreview,
    detectSessionInUrl: !isPublicHomePreview,
    persistSession: !isPublicHomePreview,
  }
}
