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

let historyCueSheetModel = null
let loadError = null

try {
  historyCueSheetModel = await vite.ssrLoadModule(
    '/src/components/about/historyCueSheetModel.ts',
  )
} catch (error) {
  loadError = error
}

after(async () => {
  await vite.close()
})

test('history cue sheet model module is available', () => {
  assert.ok(historyCueSheetModel, loadError?.message)
})

test(
  'visible CMS records are ordered once and receive derived folio labels',
  { skip: !historyCueSheetModel },
  () => {
    const model = historyCueSheetModel.buildHistoryCueSheetModel([
      {
        content: '숨겨진 기록',
        display_order: 0,
        id: 'hidden',
        image_url: null,
        is_visible: false,
        month: null,
        title: '표시되면 안 됨',
        year: '2014',
      },
      {
        content: '유럽 초청연주 및 비전투어 기록',
        display_order: 2,
        id: 'tour',
        image_url: '/tour.jpg',
        is_visible: true,
        month: '07.31—08.09',
        title: '유럽 초청연주 및 비전투어',
        year: '2018',
      },
      {
        content: '창단 기록',
        display_order: 1,
        id: 'founded',
        image_url: null,
        is_visible: true,
        month: null,
        title: null,
        year: '2014',
      },
    ])

    assert.deepEqual(
      model.records.map((record) => record.id),
      ['founded', 'tour'],
    )
    assert.deepEqual(
      model.records.map((record) => record.folio),
      ['F01', 'F02'],
    )
    assert.equal(model.records[0].title, '2014년 활동 기록')
    assert.equal(model.records[0].month, null)
    assert.equal(model.records[0].imageUrl, null)
    assert.deepEqual(model.years, ['2014', '2018'])
    assert.equal(model.rangeLabel, '2014—2018')
    assert.equal(model.heroImageUrl, '/tour.jpg')
  },
)

test(
  'legacy descriptions and ISO dates are normalized without rendering null fields',
  { skip: !historyCueSheetModel },
  () => {
    const model = historyCueSheetModel.buildHistoryCueSheetModel([
      {
        date: '2015-11-28',
        description: '세라믹 팔레스홀',
        display_order: 1,
        id: 'legacy',
        is_visible: true,
        title: '제1회 정기연주회',
        year: 2015,
      },
    ])

    assert.equal(model.records[0].year, '2015')
    assert.equal(model.records[0].month, '11.28')
    assert.equal(model.records[0].content, '세라믹 팔레스홀')
    assert.equal(model.records[0].imageAlt, null)
  },
)

test(
  'record toggles are independent and do not mutate prior state',
  { skip: !historyCueSheetModel },
  () => {
    const original = new Set(['a'])
    const opened = historyCueSheetModel.toggleHistoryRecord(original, 'b')
    const closed = historyCueSheetModel.toggleHistoryRecord(opened, 'a')

    assert.deepEqual([...original], ['a'])
    assert.deepEqual([...opened], ['a', 'b'])
    assert.deepEqual([...closed], ['b'])
    assert.deepEqual(
      [...historyCueSheetModel.toggleAllHistoryRecords(new Set(), ['a', 'b'])],
      ['a', 'b'],
    )
    assert.deepEqual(
      [...historyCueSheetModel.toggleAllHistoryRecords(new Set(['a', 'b']), ['a', 'b'])],
      [],
    )
  },
)

test(
  'mouse preview temporarily overrides the selected year and restores it on leave',
  { skip: !historyCueSheetModel },
  () => {
    const years = ['2014', '2018', '2025']

    assert.equal(
      historyCueSheetModel.resolveActiveHistoryYear('2018', '2025', years),
      '2025',
    )
    assert.equal(
      historyCueSheetModel.resolveActiveHistoryYear('2018', null, years),
      '2018',
    )
    assert.equal(
      historyCueSheetModel.resolveActiveHistoryYear('2099', null, years),
      '2014',
    )
  },
)
