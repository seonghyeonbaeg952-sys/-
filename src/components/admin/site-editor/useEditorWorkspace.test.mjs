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

function harness() {
  const slots = [], effects = [], calls = []
  const failures = new Set()
  let cursor = 0, output, inFlight = 0, peak = 0, writes = 0
  const hooks = {
    useState(initial) { const i = cursor++; slots[i] ??= { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, next => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next }] },
    useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i] },
    useCallback(fn) { const i = cursor++; slots[i] ??= fn; return slots[i] },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || !deps.every((value, index) => Object.is(value, slots[i].deps[index]))) { slots[i] = { deps }; effects.push(() => { slots[i].cleanup = fn() }) } },
  }
  const api = {
    async loadEditorPage(page) {
      calls.push(page); inFlight++; peak = Math.max(peak, inFlight)
      await new Promise(resolve => setImmediate(resolve)); inFlight--
      return failures.has(page) ? { data: null, error: '검증용 연결 실패' } : { data: { page_key: page, version: 0, draft: model.emptySiteEditorDocument(), published: null, updated_at: '', published_at: null }, error: null }
    },
    async loadEditorRevisions() { return { data: [], error: null } },
    async saveEditorDraft() { writes++; throw new Error('read-only indexing must not save') },
    async publishEditorPage() { writes++; throw new Error('read-only indexing must not publish') },
    async restoreEditorRevision() { writes++; throw new Error('read-only indexing must not restore') },
  }
  const dependencies = { react: hooks, './editorSessionModel': sessionModel, '../../../lib/siteEditorModel': model, '../../../content/siteCopyCatalog': catalog, '../../../lib/siteEditorApi': api }
  const exported = {}
  vm.runInThisContext(`(function(exports, require) { ${code}\n})`)(exported, name => { assert.ok(dependencies[name], name); return dependencies[name] })
  const render = () => { cursor = 0; output = exported.useEditorWorkspace('notices'); for (const effect of effects.splice(0)) effect() }
  render()
  const settle = async () => { for (let i = 0; i < 4; i++) { await new Promise(resolve => setImmediate(resolve)); render() } }
  return { render, settle, calls, failures, get state() { return output }, get peak() { return peak }, get writes() { return writes }, dispose() { for (const slot of slots) slot?.cleanup?.() } }
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
