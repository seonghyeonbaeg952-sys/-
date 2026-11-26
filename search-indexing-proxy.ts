import { next } from '@vercel/functions'
import deployment from './vercel.json' with { type: 'json' }

const publicHomepage = 'https://seoulmotetyouthchoir.com/'
const supportedSearchAgent = /(?:^|[\s;(])(?:Googlebot|Google-InspectionTool|Yeti|Daum)\/[\d.]+(?=$|[\s;)])/
const limitedSearchPreview = 'noimageindex, max-image-preview: none, max-video-preview: 0, max-snippet: 80'
const homepageFontPreload = deployment.headers
  .find(rule => rule.source === '/')
  ?.headers.find(header => header.key === 'Link')?.value
const homepageLinks = [homepageFontPreload, `<${publicHomepage}>; rel="canonical"`].filter(Boolean).join(', ')

export default function searchIndexingProxy(request: Request) {
  const url = new URL(request.url)
  const isHomepage = url.href === publicHomepage
  const isPageFetch = request.method === 'GET' || request.method === 'HEAD'
  const allowsIndexing = isHomepage && isPageFetch &&
    supportedSearchAgent.test(request.headers.get('user-agent') ?? '')

  // The visible page is the same for everyone. Only the indexing directive varies.
  return next({
    headers: {
      'X-Robots-Tag': allowsIndexing ? limitedSearchPreview : 'noindex',
      'Vary': 'User-Agent',
      'Cache-Control': 'private, no-store',
      ...(isHomepage && { Link: homepageLinks }),
    },
  })
}
