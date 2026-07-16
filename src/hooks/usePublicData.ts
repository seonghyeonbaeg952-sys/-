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
import type { AboutSectionRow, SiteTextRow } from '../types/cms'
import { hasSupabaseConfig } from '../lib/supabase'

type PublicDataState<TData> = {
  data: TData
  error: string | null
  isLoading: boolean
}

type PublicDataLoaderState<TData> = PublicDataState<TData> & {
  cacheKey: string | undefined
}

type PublicDataHookResult<TData> = PublicDataState<TData> & {
  refetch: () => void
}

type PublicDataLoadResult<TData> =
  | PublicDataResult<TData>
  | { data: TData; error: string }

const PUBLIC_DATA_CACHE_TTL_MS = 60_000

type PublicDataCacheEntry = {
  expiresAt: number
  result: PublicDataResult<unknown>
}

const publicDataCache = new Map<string, PublicDataCacheEntry>()
const publicDataRequests = new Map<
  string,
  Promise<PublicDataLoadResult<unknown>>
>()
let publicDataCacheVersion = 0

export function invalidatePublicDataCache() {
  publicDataCacheVersion += 1
  publicDataCache.clear()
  publicDataRequests.clear()
}

function getCachedPublicData<TData>(cacheKey: string) {
  const cached = publicDataCache.get(cacheKey)

  if (!cached) {
    return null
  }

  if (cached.expiresAt <= Date.now()) {
    publicDataCache.delete(cacheKey)
    return null
  }

  return cached.result as PublicDataResult<TData>
}

function createPublicDataLoaderState<TData>(
  fallbackData: TData,
  cacheKey: string | undefined,
): PublicDataLoaderState<TData> {
  const cached = cacheKey ? getCachedPublicData<TData>(cacheKey) : null

  return {
    cacheKey,
    data: cached?.data ?? fallbackData,
    error: cached?.error ?? null,
    isLoading: !cached,
  }
}

function loadPublicData<TData>(
  cacheKey: string | undefined,
  loader: () => Promise<PublicDataLoadResult<TData>>,
) {
  if (!cacheKey) {
    return loader()
  }

  const inFlightRequest = publicDataRequests.get(cacheKey)

  if (inFlightRequest) {
    return inFlightRequest as Promise<PublicDataLoadResult<TData>>
  }

  const requestVersion = publicDataCacheVersion
  const request = loader()
    .then((result) => {
      if (
        requestVersion === publicDataCacheVersion
        && !result.error
        && result.data !== null
      ) {
        publicDataCache.set(cacheKey, {
          expiresAt: Date.now() + PUBLIC_DATA_CACHE_TTL_MS,
          result: result as PublicDataResult<unknown>,
        })
      }

      return result
    })
    .finally(() => {
      if (publicDataRequests.get(cacheKey) === request) {
        publicDataRequests.delete(cacheKey)
      }
    })

  publicDataRequests.set(
    cacheKey,
    request as Promise<PublicDataLoadResult<unknown>>,
  )

  return request
}

function usePublicLoader<TData>(
  fallbackData: TData,
  loader: () => Promise<PublicDataLoadResult<TData>>,
  cacheKey?: string,
): PublicDataHookResult<TData> {
  const [reloadToken, setReloadToken] = useState(0)
  const [state, setState] = useState<PublicDataLoaderState<TData>>(() =>
    createPublicDataLoaderState(fallbackData, cacheKey),
  )

  const refetch = useCallback(() => {
    if (cacheKey) {
      publicDataCache.delete(cacheKey)
    }

    setReloadToken((current) => current + 1)
  }, [cacheKey])

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      const cached = cacheKey ? getCachedPublicData<TData>(cacheKey) : null

      if (cached) {
        setState({
          cacheKey,
          data: cached.data ?? fallbackData,
          error: cached.error,
          isLoading: false,
        })
        return
      }

      setState((current) =>
        current.cacheKey === cacheKey
          ? { ...current, isLoading: true }
          : {
              cacheKey,
              data: fallbackData,
              error: null,
              isLoading: true,
            },
      )

      try {
        const result = await loadPublicData(cacheKey, loader)

        if (!isMounted) {
          return
        }

        setState({
          cacheKey,
          data: result.data ?? fallbackData,
          error: result.error,
          isLoading: false,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setState((current) => ({
          cacheKey,
          data: current.cacheKey === cacheKey ? current.data : fallbackData,
          error:
            error instanceof Error
              ? error.message
              : '공개 데이터를 불러오지 못했습니다.',
          isLoading: false,
        }))
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [cacheKey, fallbackData, loader, reloadToken])

  const visibleState =
    state.cacheKey === cacheKey
      ? state
      : createPublicDataLoaderState(fallbackData, cacheKey)

  return {
    data: visibleState.data,
    error: visibleState.error,
    isLoading: visibleState.isLoading,
    refetch,
  }
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

type HomeDataQueryResults = {
  aboutSections: PublicDataResult<AboutSectionRow[]>
  concerts: PublicDataResult<Concert[]>
  gallery: PublicDataResult<GalleryImage[]>
  notices: PublicDataResult<Notice[]>
  popupNotices: PublicDataResult<PopupNotice[]>
  posters: PublicDataResult<Poster[]>
  siteSettings: PublicDataResult<SiteSettings | null>
  siteTexts: PublicDataResult<SiteTextRow[]>
  slides: PublicDataResult<HeroSlide[]>
  sponsors: PublicDataResult<Sponsor[]>
  videos: PublicDataResult<VideoItem[]>
}

type GalleryDataQueryResults = {
  images: PublicDataResult<GalleryImage[]>
  posters: PublicDataResult<Poster[]>
  videos: PublicDataResult<VideoItem[]>
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
  concerts: [],
  gallery: [],
  heroSlides: [],
  notices: [],
}

const homeInitialData = hasSupabaseConfig
  ? liveHomeInitialData
  : homeFallbackData

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

const liveGalleryInitialData: PublicGalleryData = {
  images: [],
  posters: [],
  videos: [],
}

const galleryInitialData = hasSupabaseConfig
  ? liveGalleryInitialData
  : galleryFallbackData

const concertsInitialData: Concert[] = hasSupabaseConfig
  ? []
  : publicFallbacks.concerts

const noticesInitialData: Notice[] = hasSupabaseConfig
  ? []
  : publicFallbacks.notices

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

export function resolveHomeData(
  results: HomeDataQueryResults,
  fallbackData: HomeData,
): PublicDataLoadResult<HomeData> {
  const siteTextRows = results.siteTexts.data ?? []
  const error = combineErrors([
    results.siteSettings,
    results.slides,
    results.popupNotices,
    results.concerts,
    results.notices,
    results.gallery,
    results.videos,
    results.posters,
    results.aboutSections,
    results.sponsors,
    results.siteTexts,
  ])

  const data = {
    aboutSections: results.aboutSections.data ?? fallbackData.aboutSections,
    concerts: results.concerts.data ?? fallbackData.concerts,
    gallery: results.gallery.data ?? fallbackData.gallery,
    heroSlides: results.slides.data ?? fallbackData.heroSlides,
    notices: results.notices.data ?? fallbackData.notices,
    popupNotices: results.popupNotices.data ?? fallbackData.popupNotices,
    posters: results.posters.data ?? fallbackData.posters,
    siteSettings: results.siteSettings.data ?? fallbackData.siteSettings,
    siteTexts: createSiteTextMap(siteTextRows, {
      includeDefaults: siteTextRows.length === 0,
    }),
    sponsors: results.sponsors.data ?? fallbackData.sponsors,
    videos: results.videos.data ?? fallbackData.videos,
  }

  return error ? { data, error } : { data, error: null }
}

export function resolveGalleryData(
  results: GalleryDataQueryResults,
  fallbackData: PublicGalleryData,
): PublicDataLoadResult<PublicGalleryData> {
  const data = {
    images: results.images.data ?? fallbackData.images,
    posters: results.posters.data ?? fallbackData.posters,
    videos: results.videos.data ?? fallbackData.videos,
  }
  const error = combineErrors([results.images, results.videos, results.posters])

  return error ? { data, error } : { data, error: null }
}

export function useHomeData() {
  const loader = useCallback(async (): Promise<PublicDataLoadResult<HomeData>> => {
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
      getPublicConcerts({ limit: 6, upcomingOnly: true }),
      getPublicNotices({ limit: 3 }),
      getPublicGalleryImages({ limit: 6 }),
      getPublicVideos({ limit: 6 }),
      getPublicPosters({ limit: 6 }),
      getPublicAboutSections(),
      getPublicSponsors({ homeOnly: true, limit: 8 }),
      getPublicSiteTexts(),
    ])
    return resolveHomeData(
      {
        aboutSections,
        concerts,
        gallery,
        notices,
        popupNotices,
        posters,
        siteSettings,
        siteTexts,
        slides,
        sponsors,
        videos,
      },
      homeInitialData,
    )
  }, [])

  return usePublicLoader(homeInitialData, loader, 'home')
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

  return usePublicLoader(spiritFallbackData, loader, 'spirit')
}

export function useAboutData() {
  const loader = useCallback(() => getPublicAboutData(), [])

  return usePublicLoader(aboutFallbackData, loader, 'about')
}

export function useConcertsData() {
  const loader = useCallback(() => getPublicConcerts(), [])

  return usePublicLoader(concertsInitialData, loader, 'concerts')
}

export function useConcertDetailData(id: string | undefined) {
  const fallbackData = useMemo(() => {
    if (!id || hasSupabaseConfig) {
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

  return usePublicLoader(fallbackData, loader, id ? `concert:${id}` : undefined)
}

export function useNoticesData() {
  const loader = useCallback(() => getPublicNotices(), [])

  return usePublicLoader(noticesInitialData, loader, 'notices')
}

export function useNoticeDetailData(id: string | undefined) {
  const fallbackData = useMemo(() => {
    if (!id || hasSupabaseConfig) {
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

  return usePublicLoader(fallbackData, loader, id ? `notice:${id}` : undefined)
}

export function useGalleryData() {
  const loader = useCallback(async (): Promise<PublicDataLoadResult<PublicGalleryData>> => {
    const [images, videos, posters] = await Promise.all([
      getPublicGalleryImages(),
      getPublicVideos(),
      getPublicPosters(),
    ])
    return resolveGalleryData(
      { images, posters, videos },
      galleryInitialData,
    )
  }, [])

  return usePublicLoader(galleryInitialData, loader, 'gallery')
}

export function useJoinData() {
  const loader = useCallback(() => getPublicJoinData(), [])

  return usePublicLoader(joinFallbackData, loader, 'join')
}

export function useContactData() {
  const loader = useCallback(() => getPublicContactData(), [])

  return usePublicLoader(contactFallbackData, loader, 'contact')
}

