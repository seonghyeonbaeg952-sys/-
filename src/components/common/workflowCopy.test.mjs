import assert from 'node:assert/strict'
import { test } from 'node:test'
import { workflowCopy, workflowDate, workflowRecruitmentPeriod, workflowTextLanguage } from './workflowCopy.ts'

const identity = value => value
const translations = {
  '{title} 포스터': 'Poster for {title}',
  '{start} ~ {end} (한국 시간)': '{start} – {end} (Korea time)',
  '{date}부터 (한국 시간)': 'From {date} (Korea time)',
  '{date}까지 (한국 시간)': 'Until {date} (Korea time)',
}
const translate = source => translations[source] ?? source

test('interpolation never translates or recursively interprets record titles and input values', () => {
  const title = '실제 제목 {date} <script> & 공연'
  assert.equal(workflowCopy(translate, '{title} 포스터', { title }), `Poster for ${title}`)
  assert.equal(workflowCopy(identity, '{title} 포스터', { title }), `${title} 포스터`)
  assert.equal(workflowCopy(identity, '{missing}', {}), '{missing}')
})

test('date localisation preserves calendar dates and the exact original-route result', () => {
  assert.equal(workflowDate('2026-09-19', '2026. 09. 19. (토)', false, true), '2026. 09. 19. (토)')
  assert.equal(workflowDate('2026-09-19', '원문', true, true), 'Sat, 19 Sept 2026')
  assert.equal(workflowDate('2026-02-31', 'Date to be confirmed', true), 'Date to be confirmed')
  assert.equal(workflowDate('invalid', '그대로', true), '그대로')
})

test('recruitment labels preserve dates, open boundaries and Korea-time meaning', () => {
  const source = '2026.09.01 10:00 ~ 2026.09.30 18:00 (한국 시간)'
  assert.equal(workflowRecruitmentPeriod(source, identity), source)
  assert.equal(workflowRecruitmentPeriod(source, translate), '2026.09.01 10:00 – 2026.09.30 18:00 (Korea time)')
  assert.equal(workflowRecruitmentPeriod('2026.09.01 10:00부터 (한국 시간)', translate), 'From 2026.09.01 10:00 (Korea time)')
  assert.equal(workflowRecruitmentPeriod('2026.09.30 18:00까지 (한국 시간)', translate), 'Until 2026.09.30 18:00 (Korea time)')
  assert.equal(workflowRecruitmentPeriod('', translate), '')
})

test('unknown Korean text is identified only in the English sample context', () => {
  assert.equal(workflowTextLanguage('공개된 실제 제목', true), 'ko')
  assert.equal(workflowTextLanguage('공개된 실제 제목', false), undefined)
  assert.equal(workflowTextLanguage('Reviewed English title', true), undefined)
})
