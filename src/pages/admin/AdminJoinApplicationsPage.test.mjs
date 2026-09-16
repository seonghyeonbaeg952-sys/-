import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { pathToFileURL } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const dataModule = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const source = await readFile(new URL('./AdminJoinApplicationsPage.tsx', import.meta.url), 'utf8')
let { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
})
const imports = {
  react: pathToFileURL(require.resolve('react')).href,
  'react-dom': pathToFileURL(require.resolve('react-dom')).href,
  'react/jsx-runtime': pathToFileURL(require.resolve('react/jsx-runtime')).href,
  '../../components/admin/AdminCrudListPage': dataModule('export function AdminCrudListPage(){ return null }'),
  '../../components/common/Button': dataModule('export function Button(){ return null }'),
  '../../lib/storage': dataModule('export function getSignedStorageUrl(){ throw new Error("SSR must not request storage") }'),
}
outputText = outputText.replace(/^import ['"][^'"]+\.css['"];?\s*$/gm, '')
for (const [specifier, replacement] of Object.entries(imports)) {
  outputText = outputText.replaceAll(`'${specifier}'`, `'${replacement}'`).replaceAll(`"${specifier}"`, `"${replacement}"`)
}
const module = await import(dataModule(outputText))
const { AdminJoinApplicationsPage } = module
const props = AdminJoinApplicationsPage().props
const row = {
  id: 'fixture', form_version: 2, applicant_name: '지원자', birth_date: '2012-05-06',
  school: '모테트중학교 2학년', applicant_phone: '010-1000-2000', guardian_phone: '010-3000-4000',
  desired_parts: ['soprano', 'alto'], desired_part: null, motivation: '함께 노래하고 싶습니다.',
  email: null, guardian_name: 'legacy guardian sentinel', grade: 'legacy grade sentinel',
  gender: null, region: null, contact_time: null, choir_experience: null, lesson_experience: null,
  music_experience: null, awards: null, recommender_name: null, recommender_affiliation: null,
  recommender_reason: null, vision: null, photo_file_path: null, recommendation_file_path: null,
  privacy_agreed: true, created_at: '2026-09-08T00:00:00Z', status: 'new', is_archived: false, admin_notes: null,
}

test('v2 detail presents the seven submitted items first without showing uncollected legacy fields', () => {
  const html = renderToStaticMarkup(props.renderBeforeForm(row))
  const labels = [...html.matchAll(/<dt[^>]*>(.*?)<\/dt>/g)].map(match => match[1])
  assert.deepEqual(labels.slice(0, 7), ['이름', '생년월일', '학교·학년', '지원자 연락처', '보호자 연락처', '지원 파트', '지원 동기'])
  assert.ok(html.includes('소프라노, 알토'))
  assert.ok(!html.includes('legacy guardian sentinel'))
  assert.ok(!html.includes('legacy grade sentinel'))
  assert.ok(!html.includes('사진 파일 없음'))
  assert.ok(html.includes('개인정보 동의'))
  assert.ok(html.includes('관리자 메모/상태'))
})

test('legacy detail retains its old sections and the list still labels a single part in Korean', () => {
  const legacy = { ...row, form_version: undefined, desired_parts: null, desired_part: 'tenor' }
  const html = renderToStaticMarkup(props.renderBeforeForm(legacy))
  assert.ok(html.includes('legacy guardian sentinel'))
  assert.ok(html.includes('legacy grade sentinel'))
  assert.ok(html.includes('사진 파일 없음'))
  assert.ok(html.includes('추천서 없음'))
  const column = props.columns.find(column => column.header === '지원 파트')
  assert.equal(column.render(legacy), '테너')
  assert.equal(column.render({ ...row, desired_parts: ['bass', 'bass', 'custom-part'] }), '베이스, custom-part')
})

test('admin status updates retain a strict mutation whitelist', () => {
  assert.deepEqual(props.preparePayload({ status: 'contacted', admin_notes: '확인', is_archived: false,
    applicant_name: 'do not mutate', desired_parts: ['bass'] }),
  { status: 'contacted', admin_notes: '확인', is_archived: false })
  assert.equal(props.canCreate, false)
  assert.equal(props.canDelete, false)
  assert.equal(props.showVisibility, false)
  assert.equal(props.table, 'join_applications')
})

test('CMS status choices save against the observed live contract and archiving preserves the processing state', () => {
  const labels = { new: '신규', contacted: '연락 완료', audition_guided: '오디션 안내', on_hold: '보류', done: '처리 완료' }
  const field = props.fields.find(field => field.name === 'status')
  assert.deepEqual(field.options.map(option => option.value).sort(), Object.keys(labels).sort())
  const column = props.columns.find(column => column.header === '상태')
  for (const [status, label] of Object.entries(labels)) {
    assert.equal(column.render({ ...row, status }), label)
    const payload = props.preparePayload({ status, admin_notes: '메모', is_archived: true })
    assert.deepEqual(payload, { status, admin_notes: '메모', is_archived: true })
    assert.equal(props.validatePayload(payload), null)
  }
  for (const status of ['accepted','archived','in_review','rejected','invalid']) {
    assert.ok(props.validatePayload({ status, is_archived: false }))
  }
})

test('v2 list distinguishes uncollected fields from missing legacy answers', () => {
  const render = (header, record) => props.columns.find(column => column.header === header).render(record)
  const empty = { ...row, grade: null, gender: null }
  for (const header of ['학년', '성별', '사진 여부', '추천서 여부']) {
    assert.equal(render(header, empty), '—')
  }
  assert.equal(render('학교', empty), '모테트중학교 2학년')
  for (const form_version of [1, undefined]) {
    const legacy = { ...empty, form_version }
    assert.equal(render('학년', legacy), '미입력')
    assert.equal(render('성별', legacy), '미입력')
    assert.equal(render('사진 여부', legacy), '없음')
    assert.equal(render('추천서 여부', legacy), '없음')
    assert.equal(render('학년', { ...legacy, grade: '2학년' }), '2학년')
    assert.equal(render('성별', { ...legacy, gender: 'female' }), '여')
    assert.equal(render('사진 여부', { ...legacy, photo_file_path: 'private/photo.jpg' }), '있음')
    assert.equal(render('추천서 여부', { ...legacy, recommendation_file_path: 'private/recommendation.pdf' }), '있음')
  }
  assert.equal(render('사진 여부', { ...empty, photo_file_path: 'private/photo.jpg' }), '있음')
  assert.equal(render('추천서 여부', { ...empty, recommendation_file_path: 'private/recommendation.pdf' }), '있음')
})

test('the CMS detail offers a named print action without changing the saved application', () => {
  const before = structuredClone(row)
  const html = renderToStaticMarkup(props.renderBeforeForm(row))
  assert.match(html, /<button[^>]*>입단지원서 인쇄<\/button>/)
  assert.match(html, /저장된 지원서/)
  assert.deepEqual(row, before)
})

test('the print document preserves seven v2 answers, consent and receipt metadata without editable or internal controls', () => {
  assert.equal(typeof module.JoinApplicationPrintDocument, 'function', 'an application-only print document is required')
  const original = '  <script>unsafe()</script>\n첫 문단\n\n두 번째 문단  '
  const html = renderToStaticMarkup(module.JoinApplicationPrintDocument({ row: {
    ...row, motivation: original, submission_id: 'fixture-submission', join_info_id: 'fixture-guide', admin_notes: 'INTERNAL-NOT-FOR-PRINT',
  } }))
  const labels = [...html.matchAll(/<dt[^>]*>(.*?)<\/dt>/g)].map(match => match[1])
  assert.deepEqual(labels.slice(0, 7), ['이름', '생년월일', '학교·학년', '지원자 연락처', '보호자 연락처', '지원 파트', '지원 동기'])
  for (const text of ['지원자', '모테트중학교 2학년', '010-1000-2000', '010-3000-4000', '소프라노, 알토', '개인정보 동의', '접수일', 'fixture-submission', 'fixture-guide']) assert.ok(html.includes(text), text)
  assert.ok(html.includes('  &lt;script&gt;unsafe()&lt;/script&gt;\n첫 문단\n\n두 번째 문단  '))
  assert.doesNotMatch(html, /<script>|<button|<input|<select|<textarea|INTERNAL-NOT-FOR-PRINT|legacy guardian sentinel/)
})

test('the print document includes legacy answers and attachment references but never expiring signed URLs', () => {
  assert.equal(typeof module.JoinApplicationPrintDocument, 'function', 'an application-only print document is required')
  const legacy = { ...row, form_version: 1, email: 'fixture@example.invalid', region: '서울',
    choir_experience: 'yes', lesson_experience: 'no', contact_time: '오후', music_experience: '음악 경력 원문', awards: '수상 원문',
    recommender_name: '추천인', recommender_affiliation: '소속', recommender_reason: '추천 원문', vision: '비전 원문',
    photo_file_path: 'fixture/%EC%82%AC%EC%A7%84.jpg',
    recommendation_file_path: 'https://example.invalid/path/recommendation.pdf?token=DO-NOT-PRINT#fragment',
  }
  const html = renderToStaticMarkup(module.JoinApplicationPrintDocument({ row: legacy }))
  for (const text of ['legacy guardian sentinel', 'legacy grade sentinel', 'fixture@example.invalid', '서울', '음악 경력 원문', '수상 원문', '추천 원문', '비전 원문', '사진.jpg', 'recommendation.pdf']) assert.ok(html.includes(text), text)
  assert.doesNotMatch(html, /token=|DO-NOT-PRINT|https:\/\/example.invalid|첨부파일 링크를 준비/)
})

test('legacy attachment aliases remain referenced and very long motivation is not shortened when printed', () => {
  assert.equal(typeof module.JoinApplicationPrintDocument, 'function', 'an application-only print document is required')
  const motivation = ('긴 지원 동기\n\n').repeat(300) + '마지막 문장 확인'
  const html = renderToStaticMarkup(module.JoinApplicationPrintDocument({ row: {
    ...row, motivation, photo_url: 'https://example.invalid/photo-original.png?token=hidden', recommendation_path: 'fixture/reference-original.pdf',
  } }))
  assert.ok(html.includes(motivation))
  assert.ok(html.includes('photo-original.png'))
  assert.ok(html.includes('reference-original.pdf'))
  assert.doesNotMatch(html, /token=hidden/)
})
