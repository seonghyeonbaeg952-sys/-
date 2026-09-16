import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const intakeModule = ts.transpileModule(await readFile(new URL('../../lib/intakeModel.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const intakeModel = await import(`data:text/javascript;base64,${Buffer.from(intakeModule).toString('base64')}`)
const settings = {
  id: 'fixture', title: '원본 약정서 제목', subtitle: '원본 부제', description: '설명 원문\n둘째 줄',
  message: '약정 본문 원문\n빠짐없이 남길 문장', individual_amounts: [10000, 20000], corporate_amounts: [100000, 200000],
  allow_custom_amount: true, bank_name: '테스트은행', bank_account_number: 'fixture-only-account', bank_account_holder: '',
  bank_note: '계좌 안내 원문', enable_online_submission: true, form_note: '작성 안내 원문', privacy_notice: '개인정보 안내 원문',
  print_note: '인쇄 안내 원문', print_button_label: '약정서 인쇄', submit_button_label: '약정서 보내기', success_message: '접수 완료 원문',
  contact_phone: '02-000-0000', contact_email: 'fixture@example.test', homepage_url: 'https://example.test', organization_name: '원본 기관명',
  footer_note: '하단 안내 원문', is_visible: true, updated_at: '2026-09-16T00:00:00Z',
}

async function loadForm(overrides = {}, submit = async () => ({ data: true, error: null }), editorCopy = {}) {
  const slots = []
  let cursor = 0
  const writes = []
  const requests = []
  const react = {
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial } },
    useMemo: compute => compute(), useEffect() {},
  }
  const source = await readFile(new URL('./SupportPledgeForm.tsx', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const exports = {}
  const imports = {
    react, 'react/jsx-runtime': require('react/jsx-runtime'),
    '../../lib/publicData': { createSupportPledge: async (payload, requestId, settingsId) => { writes.push(payload); requests.push({ requestId, settingsId }); return submit(payload) } },
    '../../lib/intakeModel': intakeModel,
    '../../constants/spiritContent': { supportSpiritCopy: { title: '후원 제목', body: '후원 본문', notice: '후원 안내', eyebrow: 'SUPPORT' }, donorCareItems: [], supportMethodItems: [] },
    '../site-editor/useSiteEditor': { useSiteEditor: () => ({ copy: (_page, key, fallback) => Object.hasOwn(editorCopy, key) ? editorCopy[key] : fallback }) },
    '../common/Button': { Button: 'button' }, '../common/StaffLines': { StaffLines: 'StaffLines' }, '../common/Spirit': { SpiritRibbon: 'SpiritRibbon' },
  }
  const sandbox = { exports, require: name => {
    if (name.endsWith('.css')) return {}
    assert.ok(name in imports, `unexpected dependency: ${name}`)
    return imports[name]
  }, Date, setTimeout, clearTimeout }
  vm.runInNewContext(compiled, sandbox)
  let tree
  function render() {
    cursor = 0
    tree = exports.SupportPledgeForm({ settings: { ...settings, ...overrides }, siteSettings: { phone: 'fallback', email: 'fallback' } })
  }
  function find(predicate, node = tree) {
    if (!node || typeof node !== 'object') return []
    return [predicate(node) ? node : null, ...[node.props?.children ?? null].flat(Infinity).flatMap(child => find(predicate, child))].filter(Boolean)
  }
  function readText(node) {
    if (node == null || typeof node === 'boolean') return ''
    if (typeof node !== 'object') return String(node)
    if (Array.isArray(node)) return node.map(readText).join('\n')
    return readText(node.props?.children)
  }
  const text = (node = tree) => readText(node)
  function field(id, value) { const node = find(n => n.props?.id === id)[0]; assert.ok(node, `missing input: ${id}`); node.props.onChange({ target: { value } }); render() }
  function consent(checked) { find(n => n.props?.type === 'checkbox')[0].props.onChange({ target: { checked } }); render() }
  function click(label) { const node = find(n => n.type === 'button' && text(n) === label)[0]; assert.ok(node, `missing action: ${label}`); const result = node.props.onClick?.(); render(); return result }
  async function submitForm() { await find(n => n.type === 'form')[0].props.onSubmit({ preventDefault() {} }); render() }
  render()
  return { find, text, field, consent, click, submitForm, render, writes, requests }
}

test('editor copy changes the chosen donor label without replacing legal text or submitting a pledge', async () => {
  const form = await loadForm({}, undefined, { 'contact.pledge.support-name': '후원자 성명' })
  const label = form.find(node => typeof node.type === 'function' && node.props?.htmlFor === 'support-name')[0]
  assert.ok(label)
  assert.equal(form.text(label.type(label.props)), '후원자 성명')
  assert.ok(form.text().includes(settings.privacy_notice))
  assert.ok(form.text().includes(settings.message))
  assert.equal(form.writes.length, 0)
})

function fillRequired(form) {
  form.field('support-name', ' 김테스트 ')
  form.field('support-phone', ' 010-0000-0000 ')
  form.field('support-email', ' fixture@example.test ')
  form.consent(true)
}

test('first submit previews all original donor fields and never writes before explicit confirmation', async () => {
  const form = await loadForm()
  fillRequired(form)
  form.field('support-gender', 'female')
  form.field('support-birth-date', '1990-05-01')
  form.field('support-address', '서울 테스트 주소\n상세 주소')
  form.field('support-depositor', '입금자 원문')
  form.field('support-pledge-date', '2026-09-16')
  form.field('support-signer-name', '서명자 원문')
  await form.submitForm()
  assert.equal(form.writes.length, 0, 'reviewing must not submit personal data')
  const review = form.find(n => n.props?.['aria-label'] === '후원약정 작성 내용 확인')[0]
  assert.ok(review)
  for (const value of ['김테스트', '010-0000-0000', 'fixture@example.test', '여', '1990-05-01', '서울 테스트 주소\n상세 주소', '입금자 원문', '2026-09-16', '서명자 원문', '동의함']) assert.ok(form.text(review).includes(value), value)
  await form.click('약정서 보내기')
  form.render()
  assert.deepEqual(JSON.parse(JSON.stringify(form.writes)), [{ address: '서울 테스트 주소\n상세 주소', amount: 10000, birth_date: '1990-05-01', custom_amount: null, depositor: '입금자 원문', email: 'fixture@example.test', gender: 'female', member_type: 'individual', name: '김테스트', phone: '010-0000-0000', pledge_date: '2026-09-16', privacy_agreed: true, signature_image_url: null, signer_name: '서명자 원문', website: '' }])
  assert.ok(form.text().includes('접수 완료 원문'))
})

test('changing reviewed fields requires a fresh review and rapid repeated confirmations cannot duplicate the write', async () => {
  let finish
  let deferSubmission = false
  const form = await loadForm({}, () => deferSubmission ? new Promise(resolve => { finish = resolve }) : Promise.resolve({ data: true, error: null }))
  fillRequired(form)
  await form.submitForm()
  assert.equal(form.writes.length, 0)
  form.click('수정하기')
  form.field('support-name', '변경 이름')
  assert.equal(form.find(n => n.props?.['aria-label'] === '후원약정 작성 내용 확인').length, 0)
  await form.submitForm()
  const action = form.find(n => n.type === 'button' && form.text(n) === '약정서 보내기')[0]
  deferSubmission = true
  const first = action.props.onClick()
  const second = action.props.onClick()
  assert.equal(form.writes.length, 1)
  assert.equal(form.writes[0].name, '변경 이름')
  finish({ data: true, error: null })
  await Promise.all([first, second])
})

test('submission exceptions show a recoverable error while retaining the reviewed data', async () => {
  const form = await loadForm({}, async () => { throw new Error('network failed') })
  fillRequired(form)
  await form.submitForm()
  await form.click('약정서 보내기')
  form.render()
  assert.ok(form.find(n => n.props?.role === 'alert').length)
  assert.ok(form.text().includes('김테스트'))
  assert.equal(form.find(n => n.type === 'button' && form.text(n) === '약정서 보내기')[0].props.disabled, false)
})

test('ambiguous submission retries reuse their identity; changing answers creates a new request tied to the same guide', async () => {
  const form = await loadForm({}, async () => ({ data: null, error: 'Uncertain network result' }))
  fillRequired(form)
  await form.submitForm()
  await form.click('약정서 보내기')
  form.render()
  await form.click('약정서 보내기')
  form.render()
  assert.match(form.requests[0].requestId ?? '', /^[0-9a-f-]{36}$/)
  assert.equal(form.requests[1].requestId, form.requests[0].requestId)
  assert.equal(form.requests[0].settingsId, 'fixture')
  form.click('수정하기')
  form.field('support-name', '수정한 이름')
  await form.submitForm()
  await form.click('약정서 보내기')
  assert.notEqual(form.requests[2].requestId, form.requests[0].requestId)
})

test('explicitly starting a new pledge creates a new receipt even for identical answers', async () => {
  const form = await loadForm()
  fillRequired(form)
  await form.submitForm()
  await form.click('약정서 보내기')
  form.render()
  await form.click('새 약정서 작성')
  fillRequired(form)
  await form.submitForm()
  await form.click('약정서 보내기')
  assert.equal(form.requests.length, 2)
  assert.notEqual(form.requests[1].requestId, form.requests[0].requestId)
})

test('original CMS text, all input fields, privacy agreement and signature remain printable; incomplete account stays hidden', async () => {
  const form = await loadForm()
  const print = form.find(n => n.props?.className?.includes('support-pledge-print-area'))[0]
  for (const key of ['title', 'subtitle', 'description', 'message', 'form_note', 'privacy_notice', 'print_note', 'organization_name', 'footer_note']) assert.ok(form.text(print).includes(settings[key]), key)
  assert.ok(!form.text().includes('fixture-only-account'))
  assert.ok(!form.text().includes('테스트은행'))
  for (const id of ['support-name', 'support-gender', 'support-birth-date', 'support-phone', 'support-email', 'support-depositor', 'support-address', 'support-pledge-date', 'support-signer-name']) assert.equal(form.find(n => n.props?.id === id).length, 1, id)
  assert.equal(form.find(n => n.type === 'canvas').length, 1)
  assert.ok(form.text(print).includes('개인정보 수집 및 이용에 동의합니다.'))
  const fullAccount = await loadForm({ bank_account_holder: '원본 예금주' })
  for (const value of ['fixture-only-account', '테스트은행', '원본 예금주', '계좌 안내 원문']) assert.ok(fullAccount.text().includes(value), value)
})

test('custom corporate amount and the original signature bitmap reach the payload without an external write', async () => {
  const form = await loadForm()
  fillRequired(form)
  form.click('기업회원')
  const custom = form.find(n => n.type === 'input' && n.props?.type === 'radio' && n.props.value === 'custom')[0]
  custom.props.onChange()
  form.render()
  form.field('support-custom-amount', '170000')
  const canvas = form.find(n => n.type === 'canvas')[0]
  const drawn = []
  const context = { beginPath() {}, arc() {}, fill() {}, moveTo(x, y) { drawn.push([x, y]) }, lineTo(x, y) { drawn.push([x, y]) }, stroke() {} }
  canvas.props.ref.current = { width: 900, height: 220, getBoundingClientRect: () => ({ left: 0, top: 0, width: 450, height: 110 }), getContext: () => context, toDataURL: () => 'data:image/png;base64,fixture-signature' }
  const event = { clientX: 30, clientY: 20, pointerId: 1, preventDefault() {}, currentTarget: { setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {} } }
  canvas.props.onPointerDown(event)
  canvas.props.onPointerMove({ ...event, clientX: 90, clientY: 50 })
  canvas.props.onPointerUp(event)
  form.render()
  assert.deepEqual(drawn, [[60, 40], [180, 100]], 'signature coordinates scale to the original canvas')
  await form.submitForm()
  assert.equal(form.find(n => n.type === 'img' && n.props?.alt === '작성한 인/서명')[0].props.src, 'data:image/png;base64,fixture-signature')
  await form.click('약정서 보내기')
  assert.equal(form.writes[0].member_type, 'corporate')
  assert.equal(form.writes[0].amount, 170000)
  assert.equal(form.writes[0].custom_amount, 170000)
  assert.equal(form.writes[0].signature_image_url, 'data:image/png;base64,fixture-signature')
})

test('clearing a signature removes the bitmap while preserving the separately entered signer name', async () => {
  const form = await loadForm()
  fillRequired(form)
  form.field('support-signer-name', '서명자')
  const canvas = form.find(n => n.type === 'canvas')[0]
  const context = { clearRect() {}, beginPath() {}, arc() {}, fill() {} }
  canvas.props.ref.current = { width: 900, height: 220, getBoundingClientRect: () => ({ left: 0, top: 0, width: 900, height: 220 }), getContext: () => context, toDataURL: () => 'data:image/png;base64,old-signature' }
  const event = { clientX: 20, clientY: 20, pointerId: 2, preventDefault() {}, currentTarget: { setPointerCapture() {}, hasPointerCapture: () => false } }
  canvas.props.onPointerDown(event)
  canvas.props.onPointerUp(event)
  form.render()
  form.click('지우기')
  await form.submitForm()
  assert.equal(form.find(n => n.type === 'img' && n.props?.alt === '작성한 인/서명').length, 0)
  await form.click('약정서 보내기')
  assert.equal(form.writes[0].signature_image_url, null)
  assert.equal(form.writes[0].signer_name, '서명자')
})

test('closed online submission, missing consent and invalid amount never proceed to review or submission', async () => {
  for (const scenario of ['closed', 'consent', 'amount']) {
    const form = await loadForm(scenario === 'closed' ? { enable_online_submission: false } : {})
    fillRequired(form)
    if (scenario === 'consent') form.consent(false)
    if (scenario === 'amount') {
      form.find(n => n.type === 'input' && n.props?.value === 'custom')[0].props.onChange()
      form.render()
      form.field('support-custom-amount', '-5')
    }
    await form.submitForm()
    assert.equal(form.writes.length, 0)
    assert.equal(form.find(n => n.props?.['aria-label'] === '후원약정 작성 내용 확인').length, 0)
    assert.equal(form.find(n => n.props?.role === 'alert').length, 1)
  }
})
