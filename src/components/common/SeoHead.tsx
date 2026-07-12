import { useEffect } from 'react'

type JsonLdEntry = Record<string, unknown>

type SeoHeadProps = {
  description: string
  image?: string
  jsonLd?: JsonLdEntry | JsonLdEntry[]
  noIndex?: boolean
  path?: string
  title: string
  type?: 'article' | 'website'
}

const siteName = '서울모테트청소년합창단'
const defaultDescription =
  '서울모테트청소년합창단의 합창교육, 공연 일정, 활동 기록과 입단 안내를 확인하세요.'
const defaultImagePath = '/images/brand/smyc-symbol-transparent.png'

function normalizeDescription(value: string) {
  const normalizedValue = value.replace(/\s+/g, ' ').trim() || defaultDescription

  return normalizedValue.length > 180
    ? `${normalizedValue.slice(0, 177).trimEnd()}...`
    : normalizedValue
}

function toAbsoluteUrl(value: string, origin: string) {
  try {
    const url = new URL(value, origin)

    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.toString()
      : new URL(defaultImagePath, origin).toString()
  } catch {
    return new URL(defaultImagePath, origin).toString()
  }
}

export function SeoHead({
  description,
  image,
  jsonLd,
  noIndex = false,
  path,
  title,
  type = 'website',
}: SeoHeadProps) {
  useEffect(() => {
    const origin = window.location.origin
    const canonicalUrl = toAbsoluteUrl(path || window.location.pathname, origin)
    const imageUrl = toAbsoluteUrl(image || defaultImagePath, origin)
    const pageTitle = title.includes(siteName) ? title : `${title} | ${siteName}`
    const pageDescription = normalizeDescription(description)
    const originalTitle = document.title
    const restorers: Array<() => void> = []

    const setMeta = (
      attribute: 'name' | 'property',
      key: string,
      value: string,
    ) => {
      const selector = `meta[${attribute}="${key}"]`
      let element = document.head.querySelector<HTMLMetaElement>(selector)
      const wasCreated = !element
      const previousValue = element?.content

      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, key)
        document.head.append(element)
      }

      element.content = value
      restorers.push(() => {
        if (wasCreated) {
          element?.remove()
        } else if (element && previousValue !== undefined) {
          element.content = previousValue
        }
      })
    }

    const setCanonical = () => {
      let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      const wasCreated = !element
      const previousValue = element?.href

      if (!element) {
        element = document.createElement('link')
        element.rel = 'canonical'
        document.head.append(element)
      }

      element.href = canonicalUrl
      restorers.push(() => {
        if (wasCreated) {
          element?.remove()
        } else if (element && previousValue !== undefined) {
          element.href = previousValue
        }
      })
    }

    document.title = pageTitle
    setMeta('name', 'description', pageDescription)
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
    setMeta('property', 'og:title', pageTitle)
    setMeta('property', 'og:description', pageDescription)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:image', imageUrl)
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', pageTitle)
    setMeta('name', 'twitter:description', pageDescription)
    setMeta('name', 'twitter:image', imageUrl)
    setCanonical()

    const structuredDataScript = document.createElement('script')

    if (jsonLd) {
      structuredDataScript.id = 'smyc-route-structured-data'
      structuredDataScript.type = 'application/ld+json'
      structuredDataScript.textContent = JSON.stringify(jsonLd)
      document.head.querySelector(`#${structuredDataScript.id}`)?.remove()
      document.head.append(structuredDataScript)
    }

    return () => {
      document.title = originalTitle
      structuredDataScript.remove()
      restorers.reverse().forEach((restore) => restore())
    }
  }, [description, image, jsonLd, noIndex, path, title, type])

  return null
}
