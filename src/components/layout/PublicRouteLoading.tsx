import { useEffect, useState, type ReactNode } from 'react'

type LoadingFont = 'pending' | 'ready' | 'fallback'

let koreanLoadingFont: LoadingFont = 'pending'
let koreanLoadingFontRequest: Promise<LoadingFont> | undefined

function prepareKoreanLoadingFont() {
  // Both public loading screens use the same choice for the life of the page.
  koreanLoadingFontRequest ??= new Promise<LoadingFont>((resolve) => {
    if (!document.fonts?.load) {
      resolve('fallback')
      return
    }

    const timeout = window.setTimeout(() => resolve('fallback'), 350)
    void document.fonts.load('400 1em "Gowun Batang Loading"').then(
      (faces) => resolve(faces.length > 0 ? 'ready' : 'fallback'),
      () => resolve('fallback'),
    ).finally(() => window.clearTimeout(timeout))
  }).then((result) => {
    koreanLoadingFont = result
    return result
  })

  return koreanLoadingFontRequest
}

export function PublicRouteLoading({
  language,
  brand,
  message,
  languageAction,
}: {
  language: 'ko' | 'en'
  brand: ReactNode
  message: ReactNode
  languageAction?: ReactNode
}) {
  const usesKorean = language === 'ko' || Boolean(languageAction)
  const [loadingFont, setLoadingFont] = useState(() => koreanLoadingFont)

  useEffect(() => {
    if (!usesKorean || loadingFont !== 'pending') return

    let mounted = true
    void prepareKoreanLoadingFont().then((font) => {
      if (mounted) setLoadingFont(font)
    })
    return () => { mounted = false }
  }, [loadingFont, usesKorean])

  return (
    <main
      className="route-loading-screen route-loading-screen--public"
      data-korean-font={usesKorean ? loadingFont : undefined}
      lang={language}
    >
      <div className="route-loading-screen__content">
        <div aria-hidden="true" className="route-loading-screen__mark">SMYC</div>
        <div aria-busy="true" className="route-loading-screen__copy" role="status">
          <span aria-hidden="true" className="route-loading-screen__spinner" />
          <p>{brand}</p>
          <strong>{message}</strong>
        </div>
        {languageAction}
      </div>
    </main>
  )
}
