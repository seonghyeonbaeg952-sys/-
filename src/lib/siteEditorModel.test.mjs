import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'

let model = {}
try {
  const source = await readFile(new URL('./siteEditorModel.ts', import.meta.url), 'utf8')
  const styleSource = await readFile(new URL('./siteEditorTextStyles.ts', import.meta.url), 'utf8')
  const styles = ts.transpileModule(styleSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  const stylesUrl = `data:text/javascript;base64,${Buffer.from(styles).toString('base64')}`
  const layoutSource = await readFile(new URL('./siteEditorLayout.ts', import.meta.url), 'utf8')
  const layoutCode = ts.transpileModule(layoutSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl))
  const layoutUrl = `data:text/javascript;base64,${Buffer.from(layoutCode).toString('base64')}`
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll("'./siteEditorTextStyles'", JSON.stringify(stylesUrl)).replaceAll("'./siteEditorLayout'", JSON.stringify(layoutUrl))
  model = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })

test('empty documents are independent mutable drafts without changing the defaults', () => {
  assert.equal(typeof model.emptySiteEditorDocument, 'function')
  const first = model.emptySiteEditorDocument()
  first.copy.title = 'changed'
  first.deviceCopy.mobile = { title: 'mobile' }
  assert.deepEqual(model.emptySiteEditorDocument(), empty())
})

test('document validation preserves explicit empty strings, leading spaces and newlines', () => {
  assert.equal(typeof model.validateSiteEditorDocument, 'function')
  const value = { ...empty(), copy: { 'contact.title': '  후원\n문의  ', 'contact.empty': '' }, deviceCopy: { mobile: { 'contact.title': '\n' } } }
  const before = structuredClone(value)
  assert.equal(model.validateSiteEditorDocument(value), null)
  assert.deepEqual(value, before)
})

test('document validation rejects unknown structure and non-JSON prototype objects', () => {
  assert.equal(typeof model.validateSiteEditorDocument, 'function')
  for (const value of [null, [], false, { ...empty(), schemaVersion: 2 }, { ...empty(), extra: true },
    { schemaVersion: 1, copy: {}, appearance: {} }, { ...empty(), copy: [] },
    { ...empty(), deviceCopy: { phone: {} } }, { ...empty(), appearance: { phone: {} } },
    { ...empty(), appearance: { shared: { position: 'fixed' } } },
    { ...empty(), copy: { title: 1 } }, { ...empty(), deviceCopy: { mobile: null } },
    Object.assign(Object.create({ inherited: 'unsafe' }), empty()),
    { ...empty(), copy: JSON.parse('{"__proto__":"bad"}') },
    { ...empty(), copy: { 'contact.constructor.name': 'bad' } },
    { ...empty(), copy: { 'contact.prototype': 'bad' } },
    { ...empty(), copy: { 'contact title': 'bad' } },
    { ...empty(), copy: { ['a'.repeat(121)]: 'bad' } },
    { ...empty(), copy: { title: 'a'.repeat(10001) } },
    { ...empty(), copy: { title: '<script>alert(1)</script>' } },
    { ...empty(), copy: { title: '<IMG SRC=x onerror=bad>' } },
  ]) assert.notEqual(model.validateSiteEditorDocument(value), null)
})

test('document limits count UTF-8 bytes rather than JavaScript string length', () => {
  assert.equal(typeof model.validateSiteEditorDocument, 'function')
  const value = empty()
  for (let index = 0; index < 18; index++) value.copy[`text.${index}`] = '한'.repeat(9900)
  assert.ok(JSON.stringify(value).length < 524288)
  assert.notEqual(model.validateSiteEditorDocument(value), null)
  delete value.copy['text.17']
  assert.equal(model.validateSiteEditorDocument(value), null)
})

test('Unicode character limits align with stored characters and rejected accessors are never evaluated', () => {
  assert.equal(model.validateSiteEditorDocument({ ...empty(), copy: { title: '🎵'.repeat(10000) } }), null)
  assert.notEqual(model.validateSiteEditorDocument({ ...empty(), copy: { title: '🎵'.repeat(10001) } }), null)
  let reads = 0
  const copy = Object.defineProperty({}, 'title', { enumerable: true, get() { reads++; return 'unsafe getter' } })
  assert.notEqual(model.validateSiteEditorDocument({ ...empty(), copy }), null)
  assert.equal(reads, 0)
})

test('appearance accepts the supported font, numeric and HEX boundaries only', () => {
  assert.equal(typeof model.validateSiteEditorDocument, 'function')
  const bounds = { fontSize: [12, 32], h1Size: [20, 120], h2Size: [16, 80], h3Size: [14, 64], labelSize: [10, 24], lineHeight: [1.1, 2.4], letterSpacing: [-0.04, 0.2] }
  for (const [key, [min, max]] of Object.entries(bounds)) {
    for (const value of [min, max]) assert.equal(model.validateSiteEditorDocument({ ...empty(), appearance: { shared: { [key]: value } } }), null)
    for (const value of [min - 0.01, max + 0.01, NaN, Infinity, '16', null]) assert.notEqual(model.validateSiteEditorDocument({ ...empty(), appearance: { shared: { [key]: value } } }), null)
  }
  for (const font of ['system', 'gothic-a1', 'hahmlet', 'arita-buri', 'gowun-batang', 'grandiflora']) {
    assert.equal(model.validateSiteEditorDocument({ ...empty(), appearance: { tablet: { fontFamily: font, headingFontFamily: font } } }), null)
  }
  for (const weight of [300, 400, 500, 600, 700, 800, 900]) assert.equal(model.validateSiteEditorDocument({ ...empty(), appearance: { desktop: { fontWeight: weight } } }), null)
  for (const bad of [{ fontWeight: 350 }, { fontWeight: 1000 }, { fontFamily: 'url(evil)' }, { textColor: 'red' }, { textColor: '#11223344' }, { backgroundColor: '#fff;display:none' }]) {
    assert.notEqual(model.validateSiteEditorDocument({ ...empty(), appearance: { shared: bad } }), null)
  }
  assert.equal(model.validateSiteEditorDocument({ ...empty(), appearance: { shared: { textColor: '#fFe', headingColor: '#10233F' } } }), null)
})

test('device selection respects 390, 768 and 1024 viewport boundaries', () => {
  assert.equal(typeof model.getEditorDevice, 'function')
  for (const [width, expected] of [[390, 'mobile'], [767.9, 'mobile'], [768, 'tablet'], [1023.9, 'tablet'], [1024, 'desktop'], [1440, 'desktop']]) {
    assert.equal(model.getEditorDevice(width), expected)
  }
})

test('copy resolution uses only the selected page/device and preserves explicit blank overrides', () => {
  assert.equal(typeof model.resolveEditorCopy, 'function')
  const docs = { contact: { ...empty(), copy: { 'contact.title': '공통', 'contact.empty': '공통값' }, deviceCopy: { mobile: { 'contact.title': '모바일', 'contact.empty': '' }, desktop: { 'contact.title': 'PC' } } } }
  const before = structuredClone(docs)
  assert.equal(model.resolveEditorCopy(docs, 'contact', 'contact.title', '기존', 'mobile'), '모바일')
  assert.equal(model.resolveEditorCopy(docs, 'contact', 'contact.title', '기존', 'tablet'), '공통')
  assert.equal(model.resolveEditorCopy(docs, 'contact', 'contact.title', '기존', 'desktop'), 'PC')
  assert.equal(model.resolveEditorCopy(docs, 'contact', 'contact.empty', '기존', 'mobile'), '')
  assert.equal(model.resolveEditorCopy(docs, 'join', 'contact.title', '기존', 'mobile'), '기존')
  assert.equal(model.resolveEditorCopy(docs, 'contact', 'missing', '기존', 'mobile'), '기존')
  assert.deepEqual(docs, before)
})

test('no overrides generate no CSS and invalid runtime documents cannot inject CSS or copy', () => {
  assert.equal(typeof model.buildEditorCss, 'function')
  assert.equal(model.buildEditorCss({}, 'contact'), '')
  assert.equal(model.buildEditorCss({ contact: empty() }, 'contact'), '')
  assert.equal(model.buildEditorCss({ contact: { ...empty(), appearance: { shared: { textColor: '#fff;display:none' } } } }, 'contact'), '')
  assert.equal(model.buildEditorCss({}, 'admin"]{display:none}'), '')
  assert.equal(model.resolveEditorCopy({ contact: { ...empty(), copy: { title: '<b>unsafe</b>' } } }, 'contact', 'title', '기존', 'mobile'), '기존')
})

test('CSS merges common then page appearance per device and stays scoped to the public page', () => {
  assert.equal(typeof model.buildEditorCss, 'function')
  const docs = {
    common: { ...empty(), appearance: { shared: { textColor: '#111', fontSize: 14 }, mobile: { fontSize: 15 }, tablet: { textColor: '#222' } } },
    contact: { ...empty(), appearance: { shared: { fontSize: 16, h1Size: 40 }, mobile: { fontSize: 18, headingFontFamily: 'hahmlet' }, desktop: { textColor: '#333' } } },
  }
  const before = structuredClone(docs)
  const css = model.buildEditorCss(docs, 'contact')
  assert.match(css, /\[data-site-editor-page="contact"\]/)
  assert.match(css, /@media\s*\(max-width:\s*767(?:\.98)?px\)/)
  assert.match(css, /@media\s*\(min-width:\s*768px\)\s*and\s*\(max-width:\s*1023(?:\.98)?px\)/)
  assert.match(css, /@media\s*\(min-width:\s*1024px\)/)
  const mobile = css.slice(css.indexOf('@media'), css.indexOf('@media', css.indexOf('@media') + 1))
  assert.match(mobile, /font-size:18px/)
  assert.doesNotMatch(mobile, /font-size:15px/)
  assert.match(mobile, /font-family:[^;]*Hahmlet/)
  assert.match(css, /h1[^{}]*span/)
  assert.match(css, /input/)
  assert.match(css, /select/)
  assert.match(css, /font-size:40px/)
  assert.match(css, /color:#222/)
  assert.match(css, /color:#333/)
  assert.doesNotMatch(css, /:root|body\s*\{|@import|url\(/)
  assert.deepEqual(docs, before)
})

test('semantic labels, muted text and accents receive explicit role styles', () => {
  assert.equal(typeof model.buildEditorCss, 'function')
  const css = model.buildEditorCss({ join: { ...empty(), appearance: { shared: { labelSize: 12, mutedColor: '#777', accentColor: '#b90', backgroundColor: '#fff', lineHeight: 1.5, letterSpacing: -0.01, fontWeight: 500 } } } }, 'join')
  assert.match(css, /data-site-editor-role="label"/)
  assert.match(css, /data-site-editor-role="muted"/)
  assert.match(css, /data-site-editor-role="accent"/)
  assert.match(css, /background-color:#fff/)
  assert.match(css, /letter-spacing:-0.01em/)
  assert.match(css, /line-height:1.5/)
})

test('muted and accent overrides reach existing public semantic classes without requiring markup changes', () => {
  const css = model.buildEditorCss({ about: { ...empty(), appearance: { shared: { mutedColor: '#666', accentColor: '#abc' } } } }, 'about')
  for (const selector of ['[class*="__eyebrow"]', '.text-gold-warm', '.text-gold-ink']) {
    assert.ok(css.includes(`[data-site-editor-page="about"] ${selector}`), selector)
    assert.ok(css.includes(`${selector} :is(span,a,strong,em)`), `${selector} inner text`)
  }
  for (const selector of ['[class*="__description"]', '[class*="__summary"]', '[class*="__lead"]', '.text-text-muted']) {
    assert.ok(css.includes(`[data-site-editor-page="about"] ${selector}`), selector)
  }
  assert.equal(model.buildEditorCss({ about: empty() }, 'about'), '')
})
