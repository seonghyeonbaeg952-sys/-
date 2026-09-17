import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const defaults = {
  blockLabel: '소개 제목', selection: { blockId: 'about-title', start: 2, end: 4, revision: 3 },
  summary: { style: { fontFamily: 'gothic-a1', fontSize: 32, color: '#68233a' }, canUndo: true, canRedo: false, composing: false, dirty: true },
  active: true, busy: false,
}
const fixture = `import React from 'react'; import { createRoot } from 'react-dom/client';
import { EditorCanvasToolbar } from '/src/components/admin/site-editor/EditorCanvasToolbar.tsx';
import '/src/styles/admin-workspace.css';
const root = createRoot(document.getElementById('root'));
let props = ${JSON.stringify(defaults)};
window.toolbarEvents = [];
window.setToolbarProps = (next) => { props = { ...props, ...next }; render(); };
function render() { root.render(<main className="admin-shell"><EditorCanvasToolbar {...props}
  onBegin={() => window.toolbarEvents.push(['begin'])}
  onFormat={patch => window.toolbarEvents.push(['format', patch])}
  onAction={action => window.toolbarEvents.push(['action', action])} /></main>); }
render();`
const vite = await createServer({
  configFile: false, appType: 'custom', logLevel: 'silent',
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'canvas-toolbar-fixture',
    resolveId(id) { if (id === '/__toolbar_fixture.tsx') return id },
    load(id) { if (id === '/__toolbar_fixture.tsx') return fixture },
    configureServer(server) { server.middlewares.use((req, res, next) => {
      if (req.url !== '/__canvas-toolbar-test') return next()
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end('<!doctype html><html lang="ko"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Canvas toolbar test</title></head><body style="margin:0"><div id="root"></div><script type="module" src="/__toolbar_fixture.tsx"></script></body></html>')
    }) },
  }],
})
after(() => vite.close())
await vite.listen()
const exists = await access(new URL('./EditorCanvasToolbar.tsx', import.meta.url)).then(() => true, () => false)
const module = exists ? await vite.ssrLoadModule('/src/components/admin/site-editor/EditorCanvasToolbar.tsx') : {}
function render(overrides = {}) {
  assert.equal(typeof module.EditorCanvasToolbar, 'function', 'the real canvas toolbar must be implemented')
  return renderToStaticMarkup(createElement(module.EditorCanvasToolbar, { ...defaults, onBegin() {}, onFormat() {}, onAction() {}, ...overrides }))
}

test('inactive toolbar guides canvas selection without exposing formatting controls', () => {
  const html = render({ active: false, blockLabel: null, selection: null, summary: null })
  assert.match(html, /홈페이지에서/)
  assert.doesNotMatch(html, /type="number"|aria-pressed|글자 편집<\/button>/)
  assert.match(render({ active: false }), /글자 편집<\/button>/)
  assert.doesNotMatch(html, /role="dialog"/)
})

test('active text editing exposes a labelled nonmodal floating panel without requesting focus', () => {
  const html = render()
  assert.match(html, /role="dialog"/)
  assert.match(html, /aria-modal="false"/)
  assert.match(html, /aria-labelledby="[^"]+"/)
  assert.match(html, /글꼴 편집 창 이동/)
  assert.match(html, /창 왼쪽 배치/)
  assert.match(html, /창 오른쪽 배치/)
  assert.match(html, /창 위치 초기화/)
  assert.match(html, /서식 창 접기/)
  assert.doesNotMatch(html, /autofocus|aria-modal="true"/i)
})

test('finish and undo remain outside optional formatting disclosures', () => {
  const html = render().replace(/<details\b[\s\S]*?<\/details>/g, '')
  assert.match(html, /편집 마침<\/button>/)
  assert.match(html, /실행 취소<\/button>/)
  assert.match(html, /다시 실행<\/button>/)
})

test('mixed selection remains mixed and collapsed selection disables formatting instead of widening its scope', () => {
  const html = render({ summary: { ...defaults.summary, style: { fontFamily: 'mixed', fontSize: 'mixed', fontWeight: 'mixed', color: 'mixed' } } })
  assert.match(html, /글꼴: 혼합/)
  assert.match(html, /placeholder="혼합"/)
  assert.match(html, /aria-pressed="mixed"/)
  const collapsed = render({ selection: { ...defaults.selection, end: 2 } })
  assert.match(collapsed, /<fieldset[^>]*disabled=""/)
  assert.match(collapsed, /바꿀 글자를 선택/)
})

test('composition and pending actions explain why editing controls are unavailable', () => {
  assert.match(render({ summary: { ...defaults.summary, composing: true } }), /한글 입력을 마친/)
  assert.match(render({ busy: true }), /반영하고/)
  assert.match(render({ busy: true }), /aria-busy="true"/)
})

test('secondary editing actions are inside a closed disclosure rather than competing with finish', () => {
  const html = render()
  assert.match(html, /<details[^>]*>[\s\S]*더 많은 서식[\s\S]*서식 복사[\s\S]*이번 편집 되돌리기/)
  assert.doesNotMatch(html, /<details[^>]*\sopen(?:=|>)/)
  assert.match(html, /편집 마침<\/button>/)
  assert.doesNotMatch(html, /Ctrl\+Enter/)
})

const browserModule = process.env.SMYC_PLAYWRIGHT_MODULE
test('real browser keeps selected-range commands, validates values and refuses mixed format copying', { skip: !browserModule }, async () => {
  const { chromium } = await import(browserModule)
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.setDefaultTimeout(10000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${vite.resolvedUrls.local[0]}__canvas-toolbar-test`)
    assert.equal(await page.title(), 'Canvas toolbar test')
    assert.equal(await page.locator('vite-error-overlay').count(), 0)
    await page.getByRole('button', { name: '굵게', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.toolbarEvents), [['format', { fontWeight: 700 }]])
    await page.getByRole('button', { name: /^글꼴:/ }).click()
    for (const name of ['기본 산세리프', '고딕 A1', '함렛', '아리따 부리', '고운 바탕', '그란디플로라']) {
      assert.equal(await page.getByRole('group', { name: '글꼴 선택' }).getByRole('button', { name, exact: false }).count(), 1)
    }
    await page.getByRole('group', { name: '글꼴 선택' }).getByRole('button', { name: '고운 바탕', exact: false }).click()
    assert.deepEqual(await page.evaluate(() => window.toolbarEvents.at(-1)), ['format', { fontFamily: 'gowun-batang' }])
    await page.getByRole('spinbutton', { name: '크기 (px)' }).fill('121')
    await page.getByRole('spinbutton', { name: '크기 (px)' }).press('Enter')
    assert.match(await page.getByRole('alert').innerText(), /10–120/)
    assert.equal(await page.evaluate(() => window.toolbarEvents.length), 2)
    await page.getByRole('spinbutton', { name: '크기 (px)' }).fill('45.5')
    await page.getByRole('spinbutton', { name: '크기 (px)' }).press('Enter')
    assert.deepEqual(await page.evaluate(() => window.toolbarEvents.at(-1)), ['format', { fontSize: 45.5 }])
    await page.locator('summary').filter({ hasText: '글자색' }).click()
    await page.getByRole('textbox', { name: 'HEX 색상' }).fill('red')
    await page.getByRole('button', { name: '색상 적용', exact: true }).click()
    assert.match(await page.getByRole('alert').innerText(), /HEX/)
    await page.getByRole('textbox', { name: 'HEX 색상' }).fill('#336699')
    await page.getByRole('button', { name: '색상 적용', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.toolbarEvents.at(-1)), ['format', { color: '#336699' }])
    await page.getByText('더 많은 서식', { exact: true }).click()
    await page.getByRole('button', { name: '서식 복사', exact: true }).click()
    await page.evaluate(() => window.setToolbarProps({ summary: { style: { fontSize: 20 }, canUndo: true, canRedo: false, composing: false, dirty: true } }))
    await page.getByRole('button', { name: '서식 붙이기', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.toolbarEvents.at(-1)), ['format', { fontFamily: 'gothic-a1', fontSize: 32, color: '#68233a' }])
    await page.evaluate(() => window.setToolbarProps({ summary: { style: { fontSize: 'mixed' }, canUndo: true, canRedo: false, composing: false, dirty: true } }))
    await page.getByRole('button', { name: '서식 복사', exact: true }).click()
    assert.match(await page.getByRole('alert').innerText(), /혼합/)
    await page.getByRole('button', { name: '서식 지우기', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.toolbarEvents.at(-1)), ['format', null])
    await page.getByRole('button', { name: '이번 편집 되돌리기', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.toolbarEvents.at(-1)), ['action', 'cancel'])
    await page.getByRole('button', { name: '편집 마침', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.toolbarEvents.at(-1)), ['action', 'finish'])
    await page.getByRole('button', { name: /^글꼴:/ }).click()
    await page.getByRole('group', { name: '글꼴 선택' }).getByRole('button', { name: '기본 서식', exact: false }).click()
    assert.equal(await page.evaluate(() => {
      const last = window.toolbarEvents.at(-1)
      return last[0] === 'format' && Object.hasOwn(last[1], 'fontFamily') && last[1].fontFamily === undefined
    }), true, 'choosing the inherited font must clear only the explicit font property')
    await page.locator('summary').filter({ hasText: '글자색' }).click()
    if (process.env.SMYC_TOOLBAR_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SMYC_TOOLBAR_SCREENSHOT_DIR}/smyc-toolbar-desktop.png` })
    assert.deepEqual(errors, [])
  } finally { await browser.close() }
})

test('real browser preserves popup Escape, disabled ranges, and 44px mobile controls without overflow', { skip: !browserModule }, async () => {
  const { chromium } = await import(browserModule)
  if (!vite.httpServer.listening) await vite.listen()
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    page.setDefaultTimeout(10000)
    await page.goto(`${vite.resolvedUrls.local[0]}__canvas-toolbar-test`)
    await page.getByRole('button', { name: /^글꼴:/ }).click()
    await page.keyboard.press('Escape')
    assert.equal(await page.getByRole('group', { name: '글꼴 선택' }).count(), 0)
    assert.deepEqual(await page.evaluate(() => window.toolbarEvents), [])
    await page.getByText('더 많은 서식', { exact: true }).click()
    await page.locator('summary').filter({ hasText: '글자색' }).click()
    const dimensions = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      small: [...document.querySelectorAll('button, input, summary')].filter(el => el.getClientRects().length && el.getBoundingClientRect().height < 44).map(el => el.textContent),
      paletteInside: (() => { const bounds = document.querySelector('.canvas-toolbar__color-panel').getBoundingClientRect(); return bounds.left >= 0 && bounds.right <= window.innerWidth })(),
    }))
    assert.deepEqual(dimensions, { overflow: false, small: [], paletteInside: true })
    await page.locator('summary').filter({ hasText: '글자색' }).press('Escape')
    if (process.env.SMYC_TOOLBAR_SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SMYC_TOOLBAR_SCREENSHOT_DIR}/smyc-toolbar-mobile.png` })
    await page.evaluate(() => window.setToolbarProps({ selection: { blockId: 'about-title', start: 2, end: 2, revision: 3 } }))
    await page.waitForFunction(() => document.querySelector('[aria-label="굵게"]').matches(':disabled'))
    assert.equal(await page.getByRole('button', { name: '굵게', exact: true }).isDisabled(), true)
    await page.getByRole('button', { name: '전체 글자 선택', exact: true }).click()
    assert.deepEqual(await page.evaluate(() => window.toolbarEvents), [['action', 'selectAll']])
  } finally { await browser.close() }
})
