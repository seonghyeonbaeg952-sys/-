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
  getPublicPopupNotices,
  getPublicSiteSettings,
  getPublicSiteTexts,
  getPublicSponsors,
  getPublicVideos,
  publicFallbacks,
  type PublicAboutData,
  type PublicContactData,
  type PublicDataResult,
  type PublicGalleryData,
  type PublicJoinData,
} from '../lib/publicData'
import { legacyAboutSections } from '../constants/legacyContent'
import { mockSupportSettings } from '../constants/mockData'
import { createSiteTextMap, type SiteTextMap } from '../utils/siteText'
import type {
  Concert,
  GalleryImage,
  HeroSlide,
  Notice,
  Poster,
  PopupNotice,
  SiteSettings,
  Sponsor,
  VideoItem,
} from '../types/content'
import type { AboutSectionRow } from '../types/cms'
import { hasSupabaseConfig } from '../lib/supabase'

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
  posters: Poster[]
  popupNotices: PopupNotice[]
  siteSettings: SiteSettings
  siteTexts: SiteTextMap
  sponsors: Sponsor[]
  videos: VideoItem[]
}

export type SpiritPageData = {
  aboutSections: AboutSectionRow[]
  heroSlides: HeroSlide[]
}

const homeFallbackData: HomeData = {
  aboutSections: legacyAboutSections,
  concerts: publicFallbacks.concerts,
  gallery: publicFallbacks.gallery,
  heroSlides: publicFallbacks.heroSlides,
  notices: publicFallbacks.notices,
  posters: [],
  popupNotices: [],
  siteSettings: publicFallbacks.siteSettings,
  siteTexts: {},
  sponsors: [],
  videos: [],
}

const spiritFallbackData: SpiritPageData = {
  aboutSections: legacyAboutSections,
  heroSlides: publicFallbacks.heroSlides,
}

const liveHomeInitialData: HomeData = {
  ...homeFallbackData,
  heroSlides: [],
}

const aboutFallbackData: PublicAboutData = {
  aboutSections: legacyAboutSections,
  accompanists: [],
  conductor: null,
  galleryImages: [],
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
  siteTexts: [],
  sponsors: [],
  supportSettings: mockSupportSettings,
}

function combineErrors(results: Array<{ error: string | null }>) {
  return results.find((result) => result.error)?.error ?? null
}

export function useHomeData() {
  const loader = useCallback(async (): Promise<PublicDataResult<HomeData>> => {
    const [
      siteSettings,
      slides,
      popupNotices,
      concerts,
      notices,
      gallery,
      videos,
      posters,
      aboutSections,
      sponsors,
      siteTexts,
    ] = await Promise.all([
      getPublicSiteSettings(),
      getPublicHeroSlides({ limit: 5 }),
      getPublicPopupNotices({ limit: 3 }),
      getPublicConcerts({ limit: 6 }),
      getPublicNotices({ limit: 3 }),
      getPublicGalleryImages({ limit: 6 }),
      getPublicVideos(),
      getPublicPosters(),
      getPublicAboutSections(),
      getPublicSponsors({ homeOnly: true, limit: 8 }),
      getPublicSiteTexts(),
    ])
    const error = combineErrors([
      siteSettings,
      slides,
      concerts,
      notices,
      gallery,
      videos,
      posters,
      sponsors,
    ])

    if (error) {
      return { data: null, error }
    }

    return {
      data: {
        concerts: concerts.data ?? publicFallbacks.concerts,
        aboutSections: aboutSections.data ?? legacyAboutSections,
        gallery: gallery.data ?? publicFallbacks.gallery,
        heroSlides: slides.data ?? publicFallbacks.heroSlides,
        notices: notices.data ?? publicFallbacks.notices,
        posters: posters.data ?? [],
        popupNotices: popupNotices.data ?? [],
        siteSettings: siteSettings.data ?? publicFallbacks.siteSettings,
        siteTexts: createSiteTextMap(siteTexts.data ?? []),
        sponsors: sponsors.data ?? [],
        videos: videos.data ?? [],
      },
      error: null,
    }
  }, [])

  return usePublicLoader(hasSupabaseConfig ? liveHomeInitialData : homeFallbackData, loader)
}

export function useSpiritPageData() {
  const loader = useCallback(async (): Promise<PublicDataResult<SpiritPageData>> => {
    const [aboutSections, slides] = await Promise.all([
      getPublicAboutSections(),
      getPublicHeroSlides({ limit: 1 }),
    ])
    const error = combineErrors([aboutSections, slides])

    if (error) {
      return { data: null, error }
    }

    return {
      data: {
        aboutSections: aboutSections.data ?? legacyAboutSections,
        heroSlides: slides.data ?? publicFallbacks.heroSlides,
      },
      error: null,
    }
  }, [])

  return usePublicLoader(spiritFallbackData, loader)
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

