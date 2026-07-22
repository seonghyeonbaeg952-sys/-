export const COLOR_SAMPLE_BASENAME = '/sample'

export function isColorSamplePath(pathname: string) {
  return (
    pathname === COLOR_SAMPLE_BASENAME ||
    pathname.startsWith(`${COLOR_SAMPLE_BASENAME}/`)
  )
}

export function getColorSampleHref(href: string) {
  if (
    typeof window === 'undefined' ||
    !href.startsWith('/') ||
    href.startsWith('//') ||
    !isColorSamplePath(window.location.pathname) ||
    isColorSamplePath(href)
  ) {
    return href
  }

  return `${COLOR_SAMPLE_BASENAME}${href}`
}
