import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  getPublicAboutData,
  getPublicAboutSections,
  getPublicConcertById,
  getPublicConcerts,
  getPublicContactData,
  getPublicGalleryImages,
  getPublicHeroSlides,
  getPublicJoinData,
  getPublicNoticeById,
  getPublicNotices,
  getPublicPosters,
  getPublicSiteSettings,
  getPublicVideos,
  publicFallbacks,
  type PublicAboutData,
  type PublicContactData,
  type PublicDataResult,
  type PublicGalleryData,
  type PublicJoinData,
} from '../lib/publicData'
import { legacyAboutSections } from '../constants/legacyContent'
import type {
  Concert,
  GalleryImage,
  HeroSlide,
  Notice,
  SiteSettings,
} from '../types/content'
import type { AboutSectionRow } from '../types/cms'

type PublicDataState<TData> = {
  data: TData
  error: string | null
  isLoading: boolean
}

type PublicDataHookResult<TData> = PublicDataState<TData> & {
  refetch: () => void
}

function usePublicLoader<TData>(
  fallbackData: TData,
  loader: () => Promise<PublicDataResult<TData>>,
): PublicDataHookResult<TData> {
  const [reloadToken, setReloadToken] = useState(0)
  const [state, setState] = useState<PublicDataState<TData>>({
    data: fallbackData,
    error: null,
    isLoading: true,
  })

  const refetch = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setState((current) => ({ ...current, isLoading: true }))

      const result = await loader()

      if (!isMounted) {
        return
      }

      setState({
        data: result.data ?? fallbackData,
        error: result.error,
        isLoading: false,
      })
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [fallbackData, loader, reloadToken])

  return { ...state, refetch }
}

export type HomeData = {
  aboutSections: AboutSectionRow[]
  concerts: Concert[]
  gallery: GalleryImage[]
  heroSlides: HeroSlide[]
  notices: Notice[]
  siteSettings: SiteSettings
}

const homeFallbackData: HomeData = {
  aboutSections: legacyAboutSections,
  concerts: publicFallbacks.concerts,
  gallery: publicFallbacks.gallery,
  heroSlides: publicFallbacks.heroSlides,
  notices: publicFallbacks.notices,
  siteSettings: publicFallbacks.siteSettings,
}

const aboutFallbackData: PublicAboutData = {
  aboutSections: legacyAboutSections,
  accompanist: null,
  conductor: null,
  history: [],
  location: null,
  members: [],
  siteSettings: publicFallbacks.siteSettings,
}

const galleryFallbackData: PublicGalleryData = {
  images: publicFallbacks.gallery,
  posters: [],
  videos: [],
}

const joinFallbackData: PublicJoinData = {
  faqs: [],
  joinInfo: null,
}

const contactFallbackData: PublicContactData = {
  location: null,
  siteSettings: publicFallbacks.siteSettings,
}

function combineErrors(results: Array<{ error: string | null }>) {
  return results.find((result) => result.error)?.error ?? null
}

export function useHomeData() {
  const loader = useCallback(async (): Promise<PublicDataResult<HomeData>> => {
    const [siteSettings, slides, concerts, notices, gallery, aboutSections] = await Promise.all([
      getPublicSiteSettings(),
      getPublicHeroSlides(),
      getPublicConcerts(),
      getPublicNotices(),
      getPublicGalleryImages(),
      getPublicAboutSections(),
    ])
    const error = combineErrors([
      siteSettings,
      slides,
      concerts,
      notices,
      gallery,
    ])

    if (error) {
      return { data: null, error }
    }

    return {
      data: {
        concerts: concerts.data ?? publicFallbacks.concerts,
        aboutSections: aboutSections.data ?? legacyAboutSections,
        gallery: gallery.data ?? publicFallbacks.gallery,
        heroSlides:
          slides.data && slides.data.length > 0
            ? slides.data
            : publicFallbacks.heroSlides,
        notices: notices.data ?? publicFallbacks.notices,
        siteSettings: siteSettings.data ?? publicFallbacks.siteSettings,
      },
      error: null,
    }
  }, [])

  return usePublicLoader(homeFallbackData, loader)
}

export function useAboutData() {
  const loader = useCallback(() => getPublicAboutData(), [])

  return usePublicLoader(aboutFallbackData, loader)
}

export function useConcertsData() {
  const loader = useCallback(() => getPublicConcerts(), [])

  return usePublicLoader(publicFallbacks.concerts, loader)
}

export function useConcertDetailData(id: string | undefined) {
  const fallbackData = useMemo(() => {
    if (!id) {
      return null
    }

    return publicFallbacks.concerts.find((concert) => concert.id === id) ?? null
  }, [id])

  const loader = useCallback(() => {
    if (!id) {
      return Promise.resolve({ data: null, error: null })
    }

    return getPublicConcertById(id)
  }, [id])

  return usePublicLoader(fallbackData, loader)
}

export function useNoticesData() {
  const loader = useCallback(() => getPublicNotices(), [])

  return usePublicLoader(publicFallbacks.notices, loader)
}

export function useNoticeDetailData(id: string | undefined) {
  const fallbackData = useMemo(() => {
    if (!id) {
      return null
    }

    return publicFallbacks.notices.find((notice) => notice.id === id) ?? null
  }, [id])

  const loader = useCallback(() => {
    if (!id) {
      return Promise.resolve({ data: null, error: null })
    }

    return getPublicNoticeById(id)
  }, [id])

  return usePublicLoader(fallbackData, loader)
}

export function useGalleryData() {
  const loader = useCallback(async (): Promise<PublicDataResult<PublicGalleryData>> => {
    const [images, videos, posters] = await Promise.all([
      getPublicGalleryImages(),
      getPublicVideos(),
      getPublicPosters(),
    ])
    const error = combineErrors([images, videos, posters])

    if (error) {
      return { data: null, error }
    }

    return {
      data: {
        images: images.data ?? publicFallbacks.gallery,
        posters: posters.data ?? [],
        videos: videos.data ?? [],
      },
      error: null,
    }
  }, [])

  return usePublicLoader(galleryFallbackData, loader)
}

export function useJoinData() {
  const loader = useCallback(() => getPublicJoinData(), [])

  return usePublicLoader(joinFallbackData, loader)
}

export function useContactData() {
  const loader = useCallback(() => getPublicContactData(), [])

  return usePublicLoader(contactFallbackData, loader)
}
