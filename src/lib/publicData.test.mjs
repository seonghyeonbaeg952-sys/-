import assert from 'node:assert/strict'
import { after, test } from 'node:test'

import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  root: process.cwd(),
  server: { middlewareMode: true },
})
const publicData = await vite.ssrLoadModule('/src/lib/publicData.ts')
const publicDataHooks = await vite.ssrLoadModule('/src/hooks/usePublicData.ts')

after(async () => {
  await vite.close()
})

function createConcert({
  date,
  id,
  isVisible = true,
  status = 'scheduled',
}) {
  return {
    apply_url: '',
    category: 'regular',
    created_at: '',
    date,
    description: '',
    id,
    is_visible: isVisible,
    location: '',
    performers: [],
    poster_url: '',
    program: [],
    status,
    ticket_url: '',
    time: '',
    title: id,
    updated_at: '',
  }
}

function success(data) {
  return { data, error: null }
}

function failure(error) {
  return { data: null, error }
}

function createHomeFallback(overrides = {}) {
  return {
    aboutSections: [],
    concerts: [],
    gallery: [],
    heroSlides: [],
    notices: [],
    popupNotices: [],
    posters: [],
    siteSettings: publicData.publicFallbacks.siteSettings,
    siteTexts: {},
    sponsors: [],
    videos: [],
    ...overrides,
  }
}

function createHomeResults(overrides = {}) {
  return {
    aboutSections: success([]),
    concerts: success([]),
    gallery: success([]),
    notices: success([]),
    popupNotices: success([]),
    posters: success([]),
    siteSettings: success(publicData.publicFallbacks.siteSettings),
    siteTexts: success([]),
    slides: success([]),
    sponsors: success([]),
    videos: success([]),
    ...overrides,
  }
}

test('formats the public date boundary in the Seoul time zone', () => {
  assert.equal(
    publicData.getSeoulDateString(new Date('2026-07-14T14:59:59.999Z')),
    '2026-07-14',
  )
  assert.equal(
    publicData.getSeoulDateString(new Date('2026-07-14T15:00:00.000Z')),
    '2026-07-15',
  )
})

test('filters upcoming concerts before sorting and limiting them', () => {
  const concerts = [
    createConcert({ date: '2026-07-14', id: 'past' }),
    createConcert({ date: '2026-07-15', id: 'cancelled', status: 'cancelled' }),
    createConcert({ date: '2026-07-16', id: 'hidden', isVisible: false }),
    createConcert({ date: '2026-07-18', id: 'later' }),
    createConcert({ date: '2026-07-15', id: 'today' }),
    createConcert({ date: '2026-07-17', id: 'next' }),
  ]

  const selected = publicData.selectUpcomingConcerts(concerts, {
    fromDate: '2026-07-15',
    limit: 2,
  })

  assert.deepEqual(
    selected.map((concert) => concert.id),
    ['today', 'next'],
  )
})

test('keeps successful home queries when another query fails', () => {
  const concert = createConcert({ date: '2026-07-15', id: 'live-concert' })
  const galleryImage = { id: 'live-gallery' }
  const result = publicDataHooks.resolveHomeData(
    createHomeResults({
      concerts: success([concert]),
      gallery: success([galleryImage]),
      notices: failure('공지사항을 불러오지 못했습니다.'),
    }),
    createHomeFallback(),
  )

  assert.equal(result.error, '공지사항을 불러오지 못했습니다.')
  assert.deepEqual(result.data.concerts, [concert])
  assert.deepEqual(result.data.gallery, [galleryImage])
  assert.deepEqual(result.data.notices, [])
})

test('keeps successful gallery collections when one collection fails', () => {
  const galleryImage = { id: 'live-gallery' }
  const poster = { id: 'live-poster' }
  const result = publicDataHooks.resolveGalleryData(
    {
      images: success([galleryImage]),
      posters: success([poster]),
      videos: failure('영상 목록을 불러오지 못했습니다.'),
    },
    { images: [], posters: [], videos: [] },
  )

  assert.equal(result.error, '영상 목록을 불러오지 못했습니다.')
  assert.deepEqual(result.data.images, [galleryImage])
  assert.deepEqual(result.data.posters, [poster])
  assert.deepEqual(result.data.videos, [])
})

test('preserves configured development fallbacks for failed collections', () => {
  const fallbackConcert = createConcert({ date: '2026-07-15', id: 'fallback' })
  const fallbackGallery = { id: 'fallback-gallery' }
  const fallbackNotice = { id: 'fallback-notice' }
  const result = publicDataHooks.resolveHomeData(
    createHomeResults({
      concerts: failure('공연 실패'),
      gallery: failure('갤러리 실패'),
      notices: failure('공지 실패'),
    }),
    createHomeFallback({
      concerts: [fallbackConcert],
      gallery: [fallbackGallery],
      notices: [fallbackNotice],
    }),
  )

  assert.deepEqual(result.data.concerts, [fallbackConcert])
  assert.deepEqual(result.data.gallery, [fallbackGallery])
  assert.deepEqual(result.data.notices, [fallbackNotice])
})
