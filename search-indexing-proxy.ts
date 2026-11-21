import { next } from '@vercel/functions'

const publicOrigin = 'https://seoulmotetyouthchoir.com'
const googleSearchAgent = /(?:^|[\s;(])(?:Googlebot|Google-InspectionTool)\/[\d.]+(?=$|[\s;)])/
const limitedSearchPreview = 'noimageindex, max-image-preview: none, max-video-preview: 0, max-snippet: 80'

export default function searchIndexingProxy(request: Request) {
  const url = new URL(request.url)
  const isHomepage = url.origin === publicOrigin && url.pathname === '/' && url.search === ''
  const isPageFetch = request.method === 'GET' || request.method === 'HEAD'
  const allowsIndexing = isHomepage && isPageFetch &&
    googleSearchAgent.test(request.headers.get('user-agent') ?? '')

  // The visible page is the same for everyone. Only the indexing directive varies.
  return next({
    headers: {
      'X-Robots-Tag': allowsIndexing ? limitedSearchPreview : 'noindex',
      'Vary': 'User-Agent',
      'Cache-Control': 'private, no-store',
    },
  })
}
