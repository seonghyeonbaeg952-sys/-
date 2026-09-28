import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { after, test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const source = await readFile(new URL('./AdminCrudListPage.tsx', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-admin-english-status-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const guidance = await vite.ssrLoadModule('/src/features/sample-language/sampleContentGuidance.ts')
const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333']

function harness(statusResult = { data: { [ids[1]]: 'draft', [ids[2]]: 'published' }, error: null }) {
  const rows = ids.map((id, index) => ({ id, title: `공지 ${index + 1}`, is_visible: true }))
  const slots = [], effects = []
  let cursor = 0, tree
  const react = {
    useCallback: fn => fn,
    useMemo: fn => fn(),
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value }] },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((value, index) => value !== slots[i][index])) { slots[i] = deps; effects.push(fn) } },
  }
  const crud = { rows, error: null, message: null, isLoading: false, isMutating: false, pageIndex: 0, hasNextPage: false, reload() {}, previousPage() {}, nextPage() {} }
  const dependencies = {
    react, 'react/jsx-runtime': require('react/jsx-runtime'),
    '../../lib/cms': { getRecordTitle: row => row.title },
    '../../hooks/useDebouncedValue': { useDebouncedValue: value => value },
    '../../hooks/useCrudList': { useCrudList: () => crud },
    '../../hooks/useUnsavedChangesGuard': { useUnsavedChangesGuard() {} },
    '../common/Button': { Button: 'button' }, '../common/Card': { Card: 'card' },
    './AdminModal': { AdminModal: 'modal' }, './AdminPageTitle': { AdminPageTitle: 'page-title' },
    './AdminRecordForm': { AdminRecordForm: 'record-form' }, './AdminTable': { AdminTable: 'table' },
    './AdminToolbar': { AdminToolbar: 'toolbar' }, './DeleteConfirmDialog': { DeleteConfirmDialog: 'delete-dialog' },
    './AdminEnglishContentForm': { AdminEnglishContentForm: 'english-form' },
    '../../features/sample-language/sampleContentModel': { isSampleContentResource: value => value === 'notices' },
    '../../features/sample-language/sampleContentGuidance': guidance,
    '../../features/sample-language/sampleContentApi': { loadEnglishContentStates: async () => statusResult },
  }
  const exports = {}
  vm.runInNewContext(code, { exports, require: name => { assert.ok(name in dependencies, name); return dependencies[name] } })
  const render = () => { cursor = 0; tree = exports.AdminCrudListPage({ columns: [{ header: '제목', value: 'title' }], fields: [], table: 'notices', title: '공지' }); effects.splice(0).forEach(fn => fn()); return tree }
  const find = (predicate, node = tree) => !node || typeof node !== 'object' ? [] : [predicate(node) ? node : null, ...[node.props?.children, node.props?.action].flat(Infinity).flatMap(child => find(predicate, child ?? null))].filter(Boolean)
  const settle = async () => { await Promise.resolve(); await Promise.resolve(); render() }
  render()
  return { render, settle, find, get table() { return find(node => node.type === 'table')[0] }, get filter() { return find(node => node.type === 'select' && node.props?.['aria-label'] === '현재 페이지 영문 상태')[0] } }
}

test('CMS page lists missing English versions without hiding draft or published entries from the source data', async () => {
  const h = harness(); await h.settle()
  assert.ok(h.filter, 'the current-page translation filter must be present')
  h.filter.props.onChange({ target: { value: 'missing' } }); h.render()
  assert.deepEqual(h.table.props.rows.map(row => row.id), [ids[0]])
  h.filter.props.onChange({ target: { value: 'all' } }); h.render()
  assert.deepEqual(h.table.props.rows.map(row => row.id), ids)
})

test('failed status loading keeps all rows available rather than calling them untranslated', async () => {
  const h = harness({ data: null, error: '네트워크 오류' }); await h.settle()
  assert.deepEqual(h.table.props.rows.map(row => row.id), ids)
  assert.equal(h.filter?.props.disabled, true)
})
