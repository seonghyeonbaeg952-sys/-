import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { after, test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const vite = await createServer({ configFile: false, envDir: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const real = {}
for (const path of ['content/siteEditorCatalog', 'content/siteCopyCatalog', 'lib/siteEditorModel', 'lib/siteEditorTextStyles',
  'components/admin/site-editor/editorSessionModel', 'components/admin/site-editor/editorCanvasHistory', 'components/admin/site-editor/editorCanvasController',
  'components/admin/site-editor/editorUiOptions', 'components/admin/site-editor/editorCopyTools']) real[path.split('/').at(-1)] = await vite.ssrLoadModule(`/src/${path}.ts`)
const code = ts.transpileModule(await readFile(new URL('./AdminSiteEditorPage.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText
const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })

// The page, session edits, history and validators are real. Only React scheduling,
// route state, transport and child rendering are controlled native boundaries.
function page(document = empty()) {
  const slots = [], effects = [], events = new Map()
  let cursor = 0, tree, params = new URLSearchParams('page=notices'), saved = 0, activePage = 'notices'
  const sessions = { notices: real.editorSessionModel.createEditorSession({ page_key: 'notices', draft: document, published: document, version: 1, updated_at: '', published_at: '' }),
    join: real.editorSessionModel.createEditorSession({ page_key: 'join', draft: empty(), published: empty(), version: 1, updated_at: '', published_at: '' }) }
  const workspace = { get sessions() { return sessions }, get session() { return sessions[activePage] }, action: null,
    loading: false, message: null, error: null, revisions: [], historyLoading: false, historyError: null,
    edit(key, update) { sessions[key] = update(sessions[key]) }, save: async () => { saved++; return true },
    loadForSearch: async () => [], refresh: async () => {}, refreshHistory: async () => {}, publish: async () => true,
  }
  const exports = {}
  vm.runInThisContext(`(function(exports,require,window,requestAnimationFrame){${code}\n})`)(exports, name => {
    if (name === 'react') return {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value }] },
      useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i] },
      useMemo(fn) { cursor++; return fn() },
      useEffect(fn, deps) { const i = cursor++, old = slots[i]; if (!old || deps.some((value, j) => value !== old.deps[j])) effects.push(() => { old?.cleanup?.(); slots[i] = { deps, cleanup: fn() } }) },
    }
    if (name === 'react/jsx-runtime') return require(name)
    if (name === 'react-router') return { useSearchParams: () => [params, next => { params = next }] }
    const part = name.split('/').at(-1)
    if (real[part]) return real[part]
    if (part === 'useEditorWorkspace') return { useEditorWorkspace: target => { activePage = target; return workspace } }
    if (part === 'useUnsavedChangesGuard') return { useUnsavedChangesGuard: () => {} }
    if (part === 'publicData') return { getPublicSiteTexts: () => new Promise(() => {}) }
    if (name.endsWith('.css')) return {}
    return { [part]: part }
  }, { addEventListener(type, handler) { events.set(type, handler) }, removeEventListener(type, handler) { if (events.get(type) === handler) events.delete(type) } }, () => 0)
  const find = (predicate, node = tree, parents = []) => !node || typeof node !== 'object' ? [] : [
    ...(predicate(node) ? [{ node, parents }] : []), ...[node.props?.children ?? null].flat(Infinity).flatMap(child => find(predicate, child, [...parents, node])),
  ]
  function render() { cursor = 0; tree = exports.AdminSiteEditorPage({}); effects.splice(0).forEach(effect => effect()) }
  const component = name => find(node => node.type === name)[0]?.node
  const button = label => find(node => ['button', 'Button'].includes(node.type) && node.props.children === label)[0]?.node
  render()
  return { render, find, component, button, document: () => sessions.notices.document,
    start() { const callback = component('EditorCopyPanel').props.onCompositionChange; assert.equal(typeof callback, 'function'); callback(true); render() },
    type(text, runs = []) { component('EditorCopyPanel').props.onFormat('notices.title', text, runs); render() },
    end() { component('EditorCopyPanel').props.onCompositionChange(false); render() },
    saveShortcut() { events.get('keydown')?.({ key: 's', ctrlKey: true, preventDefault() {} }) },
    navigateQuery(value) { params = new URLSearchParams(`page=${value}`); render() },
    refreshCopy(key, value) {
      const current = sessions.notices, draft = structuredClone(current.baseline)
      draft.copy[key] = value
      sessions.notices = real.editorSessionModel.reconcileEditorSession(current, { ...current.record, draft, version: current.record.version + 1 })
      render()
    },
    saved: () => saved, route: () => params.get('page'),
  }
}

test('parent document undo treats the complete Korean composition as one edit while leaving the input enabled', () => {
  const p = page({ ...empty(), copy: { 'notices.title': '원문' } })
  p.start()
  for (const text of ['ㅎ', '하', '한']) p.type(text)
  const inputParents = p.find(node => node.type === 'EditorCopyPanel')[0].parents
  assert.equal(inputParents.some(node => node.type === 'fieldset' && node.props.disabled), false)
  assert.equal(p.button('최근 편집 실행 취소').props.disabled, true)
  p.end()
  assert.equal(p.button('최근 편집 실행 취소').props.disabled, false)
  p.button('최근 편집 실행 취소').props.onClick(); p.render()
  assert.equal(p.document().copy['notices.title'], '원문')
  assert.equal(p.document().deviceCopy.desktop?.['notices.title'], undefined)
  assert.equal(p.button('최근 편집 실행 취소').props.disabled, true)
  p.button('최근 편집 다시 실행').props.onClick(); p.render()
  assert.equal(p.document().deviceCopy.desktop['notices.title'], '한')
})

test('composition locks page, scope, global search, preview and save actions but unlocks after completion', () => {
  const p = page({ ...empty(), copy: { 'notices.title': '원문' } })
  p.start(); p.type('ㅎ')
  assert.equal(p.component('EditorGlobalCopySearch').props.disabled, true)
  assert.equal(p.component('EditorPreview').props.locked, true)
  assert.equal(p.component('EditorPreview').props.context.defaultsTrusted, false)
  const selectors = p.find(node => node.props?.className === 'site-editor__selectors')[0].node
  assert.equal(selectors.props.disabled, true)
  p.component('FilterSelect').props.onChange('join'); p.render()
  assert.equal(p.route(), 'notices')
  p.saveShortcut(); assert.equal(p.saved(), 0)
  assert.equal(p.button('임시저장').props.disabled, true)
  assert.equal(p.button('이 화면 게시').props.disabled, true)
  p.end(); assert.equal(p.component('EditorGlobalCopySearch').props.disabled, false)
  p.saveShortcut(); assert.equal(p.saved(), 1)
})

test('clearing inherited formatting creates an explicit empty device run override without altering shared styling', () => {
  const p = page({ ...empty(), copy: { 'notices.title': '원문' }, textStyles: { shared: {
    'notices.title': { text: '원문', runs: [{ start: 0, end: 2, style: { fontWeight: 700 } }] },
  } } })
  p.type('원문', [])
  assert.deepEqual(p.document().textStyles.desktop?.['notices.title'], { text: '원문', runs: [] })
  assert.deepEqual(p.document().textStyles.shared['notices.title'].runs, [{ start: 0, end: 2, style: { fontWeight: 700 } }])
})

test('plain text editing still avoids fabricating an empty formatting override', () => {
  const p = page({ ...empty(), copy: { 'notices.title': '원문' } })
  p.type('새 문구')
  assert.equal(p.document().textStyles, undefined)
})

test('cancelled composition does not materialize a device override or erase the existing redo branch', () => {
  const p = page({ ...empty(), copy: { 'notices.title': '원문' } })
  p.type('먼저 바꾼 문구')
  p.button('최근 편집 실행 취소').props.onClick(); p.render()
  p.start(); p.type('ㅎ'); p.type('원문'); p.end()
  assert.equal(p.document().deviceCopy.desktop?.['notices.title'], undefined)
  assert.equal(p.button('최근 편집 실행 취소').props.disabled, true)
  assert.equal(p.button('최근 편집 다시 실행').props.disabled, false)
  p.button('최근 편집 다시 실행').props.onClick(); p.render()
  assert.equal(p.document().deviceCopy.desktop['notices.title'], '먼저 바꾼 문구')
})

test('a server refresh completing during composition cannot be included in the local undo transaction', () => {
  const p = page({ ...empty(), copy: { 'notices.title': '원문' } })
  p.start(); p.type('한글')
  p.refreshCopy('notices.description', '다른 관리자가 저장한 내용')
  p.end()
  assert.equal(p.document().copy['notices.description'], '다른 관리자가 저장한 내용')
  assert.equal(p.document().deviceCopy.desktop['notices.title'], '한글')
  assert.equal(p.button('최근 편집 실행 취소').props.disabled, true, 'no full-document history entry may overwrite the refreshed server fields')
})

test('an external query change cannot unmount the composing page or strand its interaction lock', () => {
  const p = page({ ...empty(), copy: { 'notices.title': '원문' } })
  p.start(); p.type('ㅎ'); p.navigateQuery('join')
  assert.equal(p.component('EditorPreview').props.page, 'notices')
  p.type('한'); p.end()
  assert.equal(p.component('EditorPreview').props.page, 'join')
  assert.equal(p.component('EditorGlobalCopySearch').props.disabled, false)
  assert.equal(p.document().deviceCopy.desktop['notices.title'], '한')
})
