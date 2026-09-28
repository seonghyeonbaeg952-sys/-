import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const sessionModel = await vite.ssrLoadModule('/src/components/admin/site-editor/editorSessionModel.ts')
const model = await vite.ssrLoadModule('/src/lib/siteEditorModel.ts')
const catalog = await vite.ssrLoadModule('/src/content/siteCopyCatalog.ts')
const code = ts.transpileModule(await readFile(new URL('./useEditorWorkspace.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

function harness({ storageScope, copyDefinitions, mutable = false } = {}) {
  const slots = [], effects = [], calls = [], apiCalls = []
  const records = new Map()
  const failures = new Set()
  let cursor = 0, output, inFlight = 0, peak = 0, writes = 0
  const hooks = {
    useState(initial) { const i = cursor++; slots[i] ??= { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, next => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next }] },
    useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i] },
    useCallback(fn) { const i = cursor++; slots[i] ??= fn; return slots[i] },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || !deps.every((value, index) => Object.is(value, slots[i].deps[index]))) { slots[i] = { deps }; effects.push(() => { slots[i].cleanup = fn() }) } },
  }
  const api = {
    async loadEditorPage(page, scope) {
      apiCalls.push({ kind: 'load', page, scope })
      calls.push(page); inFlight++; peak = Math.max(peak, inFlight)
      await new Promise(resolve => setImmediate(resolve)); inFlight--
      const record = records.get(page) ?? { page_key: page, version: 0, draft: model.emptySiteEditorDocument(), published: null, updated_at: '', published_at: null }
      records.set(page, record)
      return failures.has(page) ? { data: null, error: '검증용 연결 실패' } : { data: record, error: null }
    },
    async loadEditorRevisions(page, scope) { apiCalls.push({ kind: 'history', page, scope }); return { data: [], error: null } },
    async saveEditorDraft(page, document, version, scope) {
      writes++; if (!mutable) throw new Error('read-only indexing must not save')
      apiCalls.push({ kind: 'save', page, document: structuredClone(document), version, scope })
      const record = { ...records.get(page), draft: structuredClone(document), version: version + 1 }
      records.set(page, record); return { data: record, error: null }
    },
    async publishEditorPage(page, version, scope) {
      writes++; if (!mutable) throw new Error('read-only indexing must not publish')
      apiCalls.push({ kind: 'publish', page, version, scope })
      const record = { ...records.get(page), published: structuredClone(records.get(page).draft), version: version + 1 }
      records.set(page, record); return { data: record, error: null }
    },
    async restoreEditorRevision(id, version, scope) {
      writes++; if (!mutable) throw new Error('read-only indexing must not restore')
      apiCalls.push({ kind: 'restore', id, version, scope })
      const record = { ...records.get('notices'), draft: model.emptySiteEditorDocument(), version: version + 1 }
      records.set('notices', record); return { data: record, error: null }
    },
  }
  const dependencies = { react: hooks, './editorSessionModel': sessionModel, '../../../lib/siteEditorModel': model, '../../../content/siteCopyCatalog': catalog, '../../../lib/siteEditorApi': api }
  const exported = {}
  vm.runInThisContext(`(function(exports, require) { ${code}\n})`)(exported, name => { assert.ok(dependencies[name], name); return dependencies[name] })
  const render = () => { cursor = 0; output = exported.useEditorWorkspace('notices', storageScope, copyDefinitions); for (const effect of effects.splice(0)) effect() }
  render()
  const settle = async () => { for (let i = 0; i < 4; i++) { await new Promise(resolve => setImmediate(resolve)); render() } }
  return { render, settle, calls, apiCalls, failures, get state() { return output }, get peak() { return peak }, get writes() { return writes }, dispose() { for (const slot of slots) slot?.cleanup?.() } }
}

test('cross-page indexing loads at most three concurrently and never overwrites an unsaved session', async t => {
  const p = harness(); t.after(p.dispose); await p.settle()
  p.state.edit('notices', current => sessionModel.editSessionCopy(current, 'desktop', 'notices.title', '작성 중인 공지'))
  p.render()
  const missing = await p.state.loadForSearch(); p.render()
  assert.deepEqual(missing, [])
  assert.equal(Object.keys(p.state.sessions).length, 15)
  assert.equal(p.state.sessions.notices.document.deviceCopy.desktop['notices.title'], '작성 중인 공지')
  assert.equal(p.calls.filter(page => page === 'notices').length, 1)
  assert.ok(p.peak <= 3)
  assert.equal(p.writes, 0)
})

test('failed search pages remain unavailable and a retry requests only missing pages', async t => {
  const p = harness(); t.after(p.dispose); await p.settle(); p.failures.add('join')
  assert.deepEqual(await p.state.loadForSearch(), ['join']); p.render()
  assert.equal(p.state.sessions.join, undefined)
  const count = p.calls.length; p.failures.clear()
  assert.deepEqual(await p.state.loadForSearch(), []); p.render()
  assert.deepEqual(p.calls.slice(count), ['join'])
  assert.equal(p.writes, 0)
})

test('the original workspace remains the default for reads and saved drafts', async t => {
  const p = harness({ mutable: true }); t.after(p.dispose); await p.settle()
  p.state.edit('notices', current => sessionModel.editSessionCopy(current, 'desktop', 'notices.title', '기존 홈페이지 공지'))
  p.render()
  assert.equal(await p.state.save(), true); p.render()
  assert.ok(p.apiCalls.every(call => call.scope === 'original'))
  assert.equal(p.apiCalls.find(call => call.kind === 'save').document.deviceCopy.desktop['notices.title'], '기존 홈페이지 공지')
  assert.equal(p.state.message, '초안을 임시저장했습니다. 공개 홈페이지는 바뀌지 않았습니다.')
})

test('English reads, indexing, saves, publication and restoration all stay in the sample workspace', async t => {
  const p = harness({ storageScope: 'sample-english', mutable: true }); t.after(p.dispose); await p.settle()
  p.state.edit('notices', current => sessionModel.editSessionCopy(current, 'desktop', 'notices.title', 'Choir news'))
  p.render()
  await p.state.loadForSearch(); p.render()
  assert.equal(p.state.session.document.deviceCopy.desktop['notices.title'], 'Choir news')
  assert.equal(await p.state.publish(), false, 'unsaved English input must be saved first')
  assert.equal(p.writes, 0)
  assert.equal(await p.state.save(), true); p.render()
  assert.match(p.state.message, /영어 버전 초안/)
  assert.equal(await p.state.publish(), true); p.render()
  assert.match(p.state.message, /영어 버전에 게시/)
  const revision = { id: '11111111-1111-4111-8111-111111111111', page_key: 'notices', document: model.emptySiteEditorDocument(), published_at: '2026-09-28T00:00:00Z' }
  assert.equal(await p.state.restore(revision), true); p.render()
  assert.match(p.state.message, /이전 영어 버전 게시본/)
  assert.ok(p.apiCalls.every(call => call.scope === 'sample-english'))
  assert.deepEqual(p.apiCalls.filter(call => ['save', 'publish', 'restore'].includes(call.kind)).map(call => [call.kind, call.version]), [['save', 0], ['publish', 1], ['restore', 2]])
})

test('workspace validation uses the supplied English field limits before saving', async t => {
  const field = catalog.siteCopyDefinitions.find(item => item.key === 'notices.title')
  const p = harness({ storageScope: 'sample-english', mutable: true, copyDefinitions: [{ ...field, defaultValue: 'News', maxLength: 8 }] })
  t.after(p.dispose); await p.settle()
  p.state.edit('notices', current => sessionModel.editSessionCopy(current, 'desktop', 'notices.title', 'Too long for this field'))
  p.render()
  assert.equal(await p.state.save(), false); p.render()
  assert.match(p.state.error, /8자/)
  assert.equal(p.writes, 0)
  p.state.edit('notices', current => sessionModel.editSessionCopy(current, 'desktop', 'notices.title', 'Our news'))
  p.render()
  assert.equal(await p.state.save(), true); p.render()
  assert.equal(p.apiCalls.find(call => call.kind === 'save').scope, 'sample-english')
})
