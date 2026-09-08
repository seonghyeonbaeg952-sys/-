import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('./joinRecruitment.ts', import.meta.url), 'utf8')
  .catch(error => { if (error.code === 'ENOENT') return 'export {}'; throw error })
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
})
const model = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const call = (name, ...args) => {
  assert.equal(typeof model[name], 'function', `${name} must be implemented`)
  return model[name](...args)
}
const start = '2026-09-08T00:00:00.000Z'
const end = '2026-09-30T09:00:00.000Z'
const period = { recruitment_starts_at: start, recruitment_ends_at: end }

test('an unconfigured or blank period stays open without inventing a season label', () => {
  for (const info of [{}, { recruitment_starts_at: null, recruitment_ends_at: null },
    { recruitment_starts_at: '', recruitment_ends_at: '  ' }]) {
    assert.deepEqual(call('getJoinRecruitment', info, new Date(start)), {
      status: 'unconfigured', label: '', periodLabel: '', canApply: true, nextChangeAt: null,
    })
  }
})

test('configured recruitment starts inclusively and ends exclusively with its next boundary', () => {
  for (const [now, status, canApply, nextChangeAt] of [
    ['2026-09-07T23:59:59.999Z', 'before', false, 1788825600000],
    [start, 'open', true, 1790758800000],
    ['2026-09-30T08:59:59.999Z', 'open', true, 1790758800000],
    [end, 'closed', false, null],
  ]) {
    const result = call('getJoinRecruitment', period, new Date(now))
    assert.equal(result.status, status)
    assert.equal(result.canApply, canApply)
    assert.equal(result.nextChangeAt, nextChangeAt)
  }
})

test('start-only and end-only periods keep their unbounded side open', () => {
  assert.equal(call('getJoinRecruitment', { recruitment_starts_at: start }, new Date(start)).canApply, true)
  assert.equal(call('getJoinRecruitment', { recruitment_starts_at: start }, new Date(end)).nextChangeAt, null)
  assert.equal(call('getJoinRecruitment', { recruitment_ends_at: end }, new Date(start)).canApply, true)
  assert.equal(call('getJoinRecruitment', { recruitment_ends_at: end }, new Date(end)).status, 'closed')
})

test('invalid or reversed periods fail closed instead of silently becoming perpetual recruitment', () => {
  for (const info of [
    { recruitment_starts_at: 'not a date' },
    { recruitment_ends_at: '2026-02-30T12:00:00Z' },
    { recruitment_starts_at: '2026-09-08T09:00' },
    { recruitment_starts_at: end, recruitment_ends_at: start },
    { recruitment_starts_at: start, recruitment_ends_at: start },
  ]) {
    const result = call('getJoinRecruitment', info, new Date(start))
    assert.equal(result.status, 'invalid')
    assert.equal(result.canApply, false)
    assert.equal(result.nextChangeAt, null)
    assert.ok(call('validateJoinRecruitmentPeriod', info))
  }
})

test('period display uses Seoul dates and times even across a UTC date boundary', () => {
  const result = call('getJoinRecruitment', {
    recruitment_starts_at: '2026-12-31T15:00:00Z',
    recruitment_ends_at: '2027-01-02T00:30:00Z',
  }, new Date('2027-01-01T00:00:00Z'))
  assert.equal(result.periodLabel, '2027.01.01 00:00 ~ 2027.01.02 09:30 (한국 시간)')
  assert.equal(call('getJoinRecruitment', { recruitment_starts_at: start }, new Date(start)).periodLabel,
    '2026.09.08 09:00부터 (한국 시간)')
  assert.equal(call('getJoinRecruitment', { recruitment_ends_at: end }, new Date(start)).periodLabel,
    '2026.09.30 18:00까지 (한국 시간)')
})

test('datetime-local inputs are always interpreted as Seoul, never the operator device timezone', () => {
  assert.equal(call('toSeoulDateTimeLocal', '2026-09-08T00:15:00Z'), '2026-09-08T09:15')
  assert.equal(call('toSeoulDateTimeLocal', '2026-12-31T15:00:00Z'), '2027-01-01T00:00')
  assert.equal(call('fromSeoulDateTimeLocal', '2026-09-08T09:15'), '2026-09-08T00:15:00.000Z')
  assert.equal(call('fromSeoulDateTimeLocal', '2027-01-01T00:00'), '2026-12-31T15:00:00.000Z')
  assert.equal(call('fromSeoulDateTimeLocal', '2028-02-29T23:59'), '2028-02-29T14:59:00.000Z')
})

test('empty date fields clear a boundary and invalid calendar values are rejected', () => {
  assert.equal(call('fromSeoulDateTimeLocal', ''), null)
  assert.equal(call('fromSeoulDateTimeLocal', null), null)
  assert.equal(call('toSeoulDateTimeLocal', null), '')
  for (const value of ['2026-02-29T09:00', '2026-09-31T12:00', '2026-09-08T24:00',
    '2026-09-08', '2026-09-08T09:00Z', 'nonsense']) {
    assert.equal(call('fromSeoulDateTimeLocal', value), null)
  }
})

test('valid offset timestamps and cleared fields pass period validation', () => {
  assert.equal(call('validateJoinRecruitmentPeriod', {}), null)
  assert.equal(call('validateJoinRecruitmentPeriod', period), null)
  assert.equal(call('getJoinRecruitment', {
    recruitment_starts_at: '2026-09-08T09:00:00+09:00',
    recruitment_ends_at: '2026-09-30T18:00:00+09:00',
  }, new Date(start)).status, 'open')
  assert.equal(call('getJoinRecruitment', period, new Date('invalid')).status, 'invalid')
})

test('admin preparation converts Seoul fields but preserves seconds when an existing boundary is unchanged', () => {
  assert.deepEqual(call('prepareJoinRecruitmentPeriod', {
    recruitment_starts_at: '2026-09-08T09:15', recruitment_ends_at: '',
  }), { recruitment_starts_at: '2026-09-08T00:15:00.000Z', recruitment_ends_at: null })
  assert.deepEqual(call('prepareJoinRecruitmentPeriod', {
    recruitment_starts_at: '2026-09-08T09:15', recruitment_ends_at: '',
  }, { recruitment_starts_at: '2026-09-08T00:15:37.125Z', recruitment_ends_at: null }),
  { recruitment_starts_at: '2026-09-08T00:15:37.125Z', recruitment_ends_at: null })
})

test('blank period fields do not break legacy-schema content edits and malformed input remains rejectable', () => {
  assert.deepEqual(call('prepareJoinRecruitmentPeriod', {
    recruitment_starts_at: '', recruitment_ends_at: '',
  }, {}), {})
  const invalid = call('prepareJoinRecruitmentPeriod', { recruitment_starts_at: '2026-02-30T09:00' })
  assert.ok(call('validateJoinRecruitmentPeriod', invalid))
})
