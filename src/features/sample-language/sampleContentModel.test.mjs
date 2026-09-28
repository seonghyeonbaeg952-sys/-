import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-sample-content-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const { ENGLISH_CONTENT_FIELDS, applyEnglishContent, validateEnglishContent, samePublishedEnglishContent } = await vite.ssrLoadModule('/src/features/sample-language/sampleContentModel.ts')
const { daysInMonth, joinISODate, splitISODate, changeDatePart } = await vite.ssrLoadModule('/src/features/sample-language/sampleDateModel.ts')
const { SampleDateInput } = await vite.ssrLoadModule('/src/features/sample-language/SampleDateInput.tsx')
const { SampleLanguageContext } = await vite.ssrLoadModule('/src/features/sample-language/useSampleLanguage.ts')
const a = '11111111-1111-4111-8111-111111111111', b = '22222222-2222-4222-8222-222222222222'
const translated = (resource, record_id, published) => ({ resource, record_id, published, published_at: '2026-09-28T01:00:00Z' })

test('same Korean title on separate notices has independent English versions', () => {
  const source = [{ id: a, title: '같은 제목', content: '원문', is_visible: true }, { id: b, title: '같은 제목', content: '다른 내용', is_visible: true }]
  const copy = structuredClone(source)
  const result = applyEnglishContent(source, [translated('notices', a, { title: 'First' }), translated('notices', b, { title: 'Second' })], 'notices')
  assert.deepEqual(result.map(row => row.title), ['First', 'Second'])
  assert.equal(result[0].content, '원문')
  assert.deepEqual(source, copy)
})
test('unchanged English publication polling does not refresh the page data or restart its motion', () => {
  const rows = [translated('notices', a, { title: 'English' })]
  assert.equal(samePublishedEnglishContent(rows, structuredClone(rows)), true)
  assert.equal(samePublishedEnglishContent(rows, []), false)
  assert.equal(samePublishedEnglishContent(rows, [{ ...rows[0], published_at: '2026-09-28T01:01:00Z' }]), false)
  assert.equal(samePublishedEnglishContent(rows, [{ ...rows[0], record_id: b }]), false)
})
test('notice/concert detail and home lists use the same stable record version', () => {
  const record = { id: a, title: '원문', is_visible: true, date: '2026-09-28', category: 'regular' }
  const versions = [translated('concerts', a, { title: 'Concert', program: 'First work\nSecond work', performers: 'Choir\nPianist' })]
  assert.equal(applyEnglishContent(record, versions, `concert:${a}`).title, 'Concert')
  assert.equal(applyEnglishContent({ concerts: [record] }, versions, 'home').concerts[0].title, 'Concert')
  assert.deepEqual(applyEnglishContent(record, versions, 'concerts').program, ['First work', 'Second work'])
})
test('language media overrides keep source relationships and missing-image fallback', () => {
  const image = { id: a, title: '원문', image_url: '/original.jpg', image_alt: '원문', category: 'practice', concert_id: b, taken_at: '2026-09-28', is_visible: true }
  const versions = [translated('gallery', a, { title: 'Rehearsal', description: 'English description', image_url: '/english.jpg' })]
  for (const key of ['images', 'gallery', 'galleryImages']) {
    const result = applyEnglishContent({ [key]: [image] }, versions, 'gallery')[key][0]
    assert.equal(result.image_url, '/english.jpg'); assert.equal(result.image_alt, 'Rehearsal')
    for (const field of ['id', 'category', 'concert_id', 'taken_at']) assert.equal(result[field], image[field])
  }
  assert.equal(applyEnglishContent({ images: [image] }, [translated('gallery', a, { image_url: '' })], 'gallery').images[0].image_url, '/original.jpg')
})
test('unpublished, hidden, absent and wrong-resource records never override source', () => {
  const record = { id: a, title: '원문', is_visible: true }
  for (const versions of [[], [translated('notices', a, null)], [translated('gallery', a, { title: 'Wrong' })]]) assert.equal(applyEnglishContent(record, versions, `notice:${a}`).title, '원문')
  assert.equal(applyEnglishContent({ ...record, is_visible: false }, [translated('notices', a, { title: 'Hidden' })], `notice:${a}`).title, '원문')
})
test('all 18 public resource types accept their own fields and reject metadata/private fields', () => {
  assert.equal(Object.keys(ENGLISH_CONTENT_FIELDS).length, 18)
  for (const resource of Object.keys(ENGLISH_CONTENT_FIELDS)) {
    assert.equal(validateEnglishContent(resource, {}), null)
    for (const key of ['id', 'is_visible', 'category', 'contact_phone', 'record_id', 'display_order', 'related_concert_id', '__proto__']) assert.ok(validateEnglishContent(resource, { [key]: 'malicious' }), `${resource}:${key}`)
  }
  assert.ok(validateEnglishContent('contacts', { title: 'private' }))
  assert.ok(validateEnglishContent('notices', { title: '<img src=x onerror=alert(1)>' }))
  assert.ok(validateEnglishContent('gallery', { image_url: 'javascript:alert(1)' }))
  assert.ok(validateEnglishContent('videos', { youtube_url: 'https://youtube.com.evil.test/watch?v=x' }))
  assert.ok(validateEnglishContent('videos', { youtube_url: 'https://www.youtube.com/' }))
  assert.ok(validateEnglishContent('notices', { title: 'x'.repeat(10001) }))
})

test('operation settings have separate English display copy while private and structural values stay shared', () => {
  const expected = {
    site_settings: ['site_title', 'about_summary', 'address'],
    locations: ['place_name', 'address', 'transit_info', 'parking_info', 'image_alt', 'image_caption', 'image_url'],
    join_info: ['title', 'description', 'target', 'parts', 'audition_process', 'preparation', 'rehearsal_time', 'rehearsal_location'],
    support_settings: ['title', 'subtitle', 'description', 'message', 'bank_note', 'form_note', 'privacy_notice', 'print_note', 'submit_button_label', 'print_button_label', 'success_message', 'organization_name', 'footer_note'],
  }
  for (const [resource, fields] of Object.entries(expected)) {
    assert.deepEqual(ENGLISH_CONTENT_FIELDS[resource].map(field => field.name), fields)
    assert.equal(validateEnglishContent(resource, { [fields[0]]: 'English' }), null)
    for (const privateOrShared of ['bank_account_number', 'bank_account_holder', 'contact_email', 'phone', 'application_url', 'recruitment_ends_at', 'map_embed_url', 'is_visible', 'individual_amounts']) assert.ok(validateEnglishContent(resource, { [privateOrShared]: 'changed' }), `${resource}:${privateOrShared}`)
  }
  const source = { id: a, title: '입단', target: '청소년', application_url: '/join', recruitment_ends_at: '2026-12-31', is_visible: true }
  const joinResult = applyEnglishContent({ joinInfo: source }, [translated('join_info', a, { title: 'Join us', target: 'Young singers' })], 'join')
  assert.equal(joinResult.joinInfo.title, 'Join us')
  assert.equal(joinResult.joinInfo.target, 'Young singers')
  assert.equal(joinResult.joinInfo.application_url, '/join')
  assert.equal(joinResult.joinInfo.recruitment_ends_at, '2026-12-31')
  const pledge = { id: b, title: '후원약정', bank_account_number: 'original', is_visible: true }
  const result = applyEnglishContent({ supportSettings: pledge }, [translated('support_settings', b, { title: 'Support pledge' })], 'contact')
  assert.equal(result.supportSettings.title, 'Support pledge')
  assert.equal(result.supportSettings.bank_account_number, 'original')
})
test('an English YouTube video has its own thumbnail and no original-language thumbnail fallbacks', () => {
  const result = applyEnglishContent({ videos: [{ id: a, title: '원문', video_url: 'old', thumbnail_url: 'old.jpg', thumbnail_fallback_urls: ['fallback.jpg'] }] }, [translated('videos', a, { youtube_url: 'https://youtu.be/abcdefghijk' })], 'gallery')
  assert.equal(result.videos[0].video_url, 'https://youtu.be/abcdefghijk')
  assert.match(result.videos[0].thumbnail_url, /abcdefghijk/)
  assert.deepEqual(result.videos[0].thumbnail_fallback_urls, [])
})
test('Gregorian leap-year/month validation emits only complete ISO dates', () => {
  assert.equal(daysInMonth('2000', '2'), 29); assert.equal(daysInMonth('1900', '2'), 28); assert.equal(daysInMonth('2024', '2'), 29); assert.equal(daysInMonth('2026', '2'), 28)
  for (const value of ['2026-09-28', '2024-02-29', '2000-02-29']) assert.equal(joinISODate(splitISODate(value)), value)
  for (const parts of [{ year: '2026', month: '2', day: '29' }, { year: '20', month: '9', day: '28' }, { year: '0000', month: '1', day: '1' }, { year: '2026', month: '', day: '' }]) assert.equal(joinISODate(parts), '')
  assert.equal(changeDatePart(splitISODate('2026-01-31'), 'month', '2').day, '')
  assert.equal(changeDatePart(splitISODate('2024-02-29'), 'year', '202').day, '29', 'Editing an incomplete year must not prematurely discard a valid leap day')
})
test('English dates expose English segments; original and Korean sample keep native date markup', () => {
  const props = { id: 'birth', label: 'Date of birth', value: '2000-02-29', onChange() {}, className: 'support-pledge__input' }
  const context = language => ({ enabled: true, language, translate: x => x, translateData: x => x, translateHome: x => x, href: x => x, setLanguage() {} })
  const render = language => renderToStaticMarkup(createElement(SampleLanguageContext, { value: context(language) }, createElement(SampleDateInput, props)))
  const english = render('en')
  assert.match(english, /aria-label="Date of birth"/); assert.match(english, /February/); assert.match(english, />Month</); assert.match(english, />Day</); assert.match(english, />Year</)
  assert.doesNotMatch(english, /type="date"|연도|월|일/)
  assert.match(english, /pattern="\(\?!0000\)\[0-9\]\{4\}"/)
  assert.match(render('ko'), /type="date"/)
  assert.equal(renderToStaticMarkup(createElement(SampleDateInput, props)), '<input class="support-pledge__input" id="birth" type="date" value="2000-02-29"/>')
})
