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
  'react/jsx-runtime': pathToFileURL(require.resolve('react/jsx-runtime')).href,
  '../../components/admin/AdminCrudListPage': dataModule('export function AdminCrudListPage(){ return null }'),
  '../../components/common/Button': dataModule('export function Button(){ return null }'),
  '../../lib/storage': dataModule('export function getSignedStorageUrl(){ throw new Error("SSR must not request storage") }'),
}
for (const [specifier, replacement] of Object.entries(imports)) {
  outputText = outputText.replaceAll(`'${specifier}'`, `'${replacement}'`).replaceAll(`"${specifier}"`, `"${replacement}"`)
}
const { AdminJoinApplicationsPage } = await import(dataModule(outputText))
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
