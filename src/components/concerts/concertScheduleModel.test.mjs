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

let concertScheduleModel = null
let loadError = null

try {
  concertScheduleModel = await vite.ssrLoadModule(
    '/src/components/concerts/concertScheduleModel.ts',
  )
} catch (error) {
  loadError = error
}

after(async () => {
  await vite.close()
})

test('concert dates retain a full readable date and weekday, independent of local timezone', () => {
  assert.equal(concertScheduleModel.getConcertDateLabel('2026-09-19'), '2026. 09. 19. (토)')
  assert.equal(concertScheduleModel.getConcertDateLabel('2024-02-29'), '2024. 02. 29. (목)')
})

test('missing or impossible concert dates never roll over to a different calendar day', () => {
  for (const input of ['', null, undefined, '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-09-00', 'not a date']) {
    assert.equal(concertScheduleModel.getConcertDateLabel(input), '날짜 미정', String(input))
  }
})

test('concert schedule model module is available', () => {
  assert.ok(concertScheduleModel, loadError?.message)
})

test(
  'CMS rows are classified by Seoul date and sorted without mutating source order',
  { skip: !concertScheduleModel },
  () => {
    const source = [
      {
        category: 'other',
        date: '2026-11-30',
        id: 'later',
        is_visible: true,
        location: '',
        status: 'scheduled',
        time: '',
        title: '시안3',
      },
      {
        category: 'other',
        date: '2026-08-31',
        id: 'stale-upcoming',
        is_visible: true,
        location: '',
        status: 'scheduled',
        time: '',
        title: '시안4',
      },
      {
        category: 'regular',
        date: '2026-09-19',
        id: 'next',
        is_visible: true,
        location: '세라믹 팔레스홀',
        status: 'open',
        time: '오후 7시',
        title: '제12회 정기연주회',
      },
      {
        category: 'special',
        date: '2026-12-01',
        id: 'cancelled',
        is_visible: true,
        location: '',
        status: 'cancelled',
        time: '',
        title: '취소 공연',
      },
      {
        category: 'other',
        date: '2026-10-30',
        id: 'hidden',
        is_visible: false,
        location: '',
        status: 'scheduled',
        time: '',
        title: '숨김 공연',
      },
    ]
    const originalIds = source.map((concert) => concert.id)

    const schedule = concertScheduleModel.buildConcertSchedule(
      source,
      '2026-09-01',
    )

    assert.deepEqual(
      schedule.upcoming.map((concert) => concert.id),
      ['next', 'later'],
    )
    assert.deepEqual(
      schedule.past.map((concert) => concert.id),
      ['cancelled', 'stale-upcoming'],
    )
    assert.equal(schedule.featured?.id, 'next')
    assert.deepEqual(source.map((concert) => concert.id), originalIds)
  },
)

test(
  'search, category and year filters are composable and ignore surrounding whitespace',
  { skip: !concertScheduleModel },
  () => {
    const concerts = [
      {
        category: 'regular',
        date: '2026-09-19',
        id: 'match',
        is_visible: true,
        location: '세라믹 팔레스홀',
        status: 'scheduled',
        time: '',
        title: '제12회 정기연주회',
      },
      {
        category: 'invited',
        date: '2025-05-03',
        id: 'other',
        is_visible: true,
        location: '예술의전당',
        status: 'closed',
        time: '',
        title: '초청연주',
      },
    ]

    const filtered = concertScheduleModel.filterConcerts(concerts, {
      category: 'regular',
      query: '  세라믹  ',
      year: '2026',
    })

    assert.deepEqual(filtered.map((concert) => concert.id), ['match'])
    assert.equal(
      concertScheduleModel.filterConcerts(concerts, {
        category: 'all',
        query: '',
        year: 'all',
      }).length,
      2,
    )
  },
)

test(
  'nullable metadata has readable fallbacks and unsafe CMS action URLs are rejected',
  { skip: !concertScheduleModel },
  () => {
    assert.equal(
      concertScheduleModel.getConcertMetaLine({ location: '', time: '' }),
      '시간 미정 · 장소 추후 안내',
    )
    assert.equal(
      concertScheduleModel.getConcertMetaLine({
        location: '세라믹 팔레스홀',
        time: '오후 7시',
      }),
      '오후 7시 · 세라믹 팔레스홀',
    )
    assert.equal(
      concertScheduleModel.getSafeHttpUrl('javascript:alert(1)'),
      null,
    )
    assert.equal(concertScheduleModel.getSafeHttpUrl('data:text/html,x'), null)
    assert.equal(
      concertScheduleModel.getSafeHttpUrl('https://tickets.example.com/show'),
      'https://tickets.example.com/show',
    )
  },
)
