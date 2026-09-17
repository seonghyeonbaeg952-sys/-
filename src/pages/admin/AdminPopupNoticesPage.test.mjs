import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const paths = {
  page: './AdminPopupNoticesPage.tsx',
  list: '../../components/admin/AdminCrudListPage.tsx',
  form: '../../components/admin/AdminRecordForm.tsx',
  field: '../../components/admin/AdminFormField.tsx',
}
const code = file => ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText
const sources = Object.fromEntries(Object.entries(paths).map(([name, file]) => [name, code(file)]))

function harness(initialData = null) {
  const writes = [], focused = [], cache = {}
  let current, list, form
  const react = {
    createElement: require('react').createElement,
    useId: () => 'popup-form',
    useState(initial) {
      const slot = current.cursor++, state = current.slots
      if (!(slot in state)) state[slot] = typeof initial === 'function' ? initial() : initial
      return [state[slot], next => { state[slot] = typeof next === 'function' ? next(state[slot]) : next }]
    },
    useRef(initial) { const slot = current.cursor++; return current.slots[slot] ??= { current: initial } },
    useMemo: fn => fn(), useCallback: fn => fn, useEffect() {},
  }
  const crud = {
    rows: initialData ? [initialData] : [], isLoading: false, isMutating: false, error: null,
    message: null, pageIndex: 0, hasNextPage: false,
    createItem: async payload => { writes.push({ operation: 'create', payload }); return { data: { id: 'created' }, error: null } },
    updateItem: async (id, payload) => { writes.push({ operation: 'update', id, payload }); return { data: { id }, error: null } },
    reload() {}, previousPage() {}, nextPage() {},
  }
  const imports = {
    react, 'react/jsx-runtime': require('react/jsx-runtime'),
    '../../hooks/useCrudList': { useCrudList: () => crud },
    '../../hooks/useDebouncedValue': { useDebouncedValue: value => value },
    '../../hooks/useUnsavedChangesGuard': { useUnsavedChangesGuard() {} },
    '../../lib/cms': { cleanPayload: payload => Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)), getRecordTitle: row => row.title },
    '../../lib/intakeModel': { isSignaturePng: () => false },
    '../../utils/classNames': { classNames: (...values) => values.filter(Boolean).join(' ') },
  }
  function load(name) {
    if (cache[name]) return cache[name]
    const exports = {}
    cache[name] = exports
    vm.runInNewContext(sources[name] ?? code(`../../lib/${name}.ts`), {
      exports, window: { requestAnimationFrame: fn => fn() },
      document: { getElementById: id => ({ focus: () => focused.push(id) }) },
      require: path => {
        if (path in imports) return imports[path]
        const component = path.slice(path.lastIndexOf('/') + 1)
        if (component === 'AdminCrudListPage') return load('list')
        if (component === 'AdminRecordForm') return load('form')
        if (component === 'AdminFormField') return load('field')
        if (component === 'popupNoticeDates') return load(component)
        return { [component]: component }
      },
    })
    return exports
  }
  function find(predicate, node) {
    if (!node || typeof node !== 'object') return []
    return [predicate(node) ? node : null, ...[node.props?.children ?? null].flat(Infinity)
      .flatMap(child => find(predicate, child))].filter(Boolean)
  }
  function render(instance) { current = instance; current.cursor = 0; instance.tree = instance.component(instance.props); return instance.tree }
  const page = load('page').AdminPopupNoticesPage()
  list = { component: page.type, props: page.props, slots: [] }
  render(list)
  if (initialData) find(node => node.type === 'AdminTable', list.tree)[0].props.onEdit(initialData)
  else find(node => node.type === 'AdminPageTitle', list.tree)[0].props.action.props.onClick()
  render(list)
  const recordForm = find(node => node.type === load('form').AdminRecordForm, list.tree)[0]
  form = { component: recordForm.type, props: recordForm.props, slots: [] }
  render(form)
  return {
    writes, focused,
    change(name, value) { find(node => node.props?.name === name, form.tree)[0].props.onChange({ target: { value } }); render(form) },
    field(name) {
      const field = find(node => node.props?.name === name, form.tree)[0]
      return { props: field.props, tree: field.type(field.props) }
    },
    async submit() { await form.tree.props.onSubmit({ preventDefault() {} }); render(form); render(list) },
    find,
  }
}

test('reversed popup dates stop create and update before persistence and identify the end field', async () => {
  for (const row of [null, { id: 'existing-popup', title: '기존 팝업', starts_on: '2026-09-18', ends_on: '2026-09-20' }]) {
    const h = harness(row)
    h.change('title', '공연 안내')
    h.change('starts_on', '2026-09-18')
    h.change('ends_on', '2026-09-17')
    await h.submit()
    assert.equal(h.writes.length, 0, 'invalid date ranges must not reach Supabase')
    const end = h.field('ends_on')
    assert.match(end.props.error, /종료일.*시작일/)
    assert.equal(end.props.value, '2026-09-17', 'a rejected attempt must keep the entered date')
    const input = h.find(node => node.type === 'input', end.tree)[0]
    assert.equal(input.props['aria-invalid'], true)
    assert.ok(input.props['aria-describedby'].includes('popup-form-ends_on-error'))
    assert.equal(h.focused.at(-1), 'popup-form-ends_on')
  }
})

test('correcting either boundary clears the displayed date-range error and saves the chosen dates', async () => {
  const h = harness()
  h.change('title', '공연 안내')
  h.change('starts_on', '2026-09-18'); h.change('ends_on', '2026-09-17')
  await h.submit()
  assert.equal(h.writes.length, 0)
  h.change('starts_on', '2026-09-17')
  assert.equal(h.field('ends_on').props.error, undefined)
  await h.submit()
  assert.equal(h.writes.length, 1)
  assert.equal(h.writes[0].payload.starts_on, '2026-09-17')
  assert.equal(h.writes[0].payload.ends_on, '2026-09-17')
})

test('same-day, ordered and open popup periods preserve date-only values and nullable endpoints', async () => {
  for (const [start, end, expectedStart, expectedEnd] of [
    ['2026-09-17', '2026-09-17', '2026-09-17', '2026-09-17'],
    ['2026-12-31', '2027-01-01', '2026-12-31', '2027-01-01'],
    ['', '2026-09-17', null, '2026-09-17'],
    ['2026-09-17', '', '2026-09-17', null],
    ['', '', null, null],
    ['2028-02-29', '2028-03-01', '2028-02-29', '2028-03-01'],
  ]) {
    const h = harness({ id: 'existing-popup', title: '기간 안내', starts_on: '2026-01-01', ends_on: '2026-12-31' })
    h.change('starts_on', start); h.change('ends_on', end)
    await h.submit()
    assert.equal(h.writes.length, 1)
    assert.equal(h.writes[0].operation, 'update')
    assert.equal(h.writes[0].payload.starts_on, expectedStart)
    assert.equal(h.writes[0].payload.ends_on, expectedEnd)
  }
})

test('malformed calendar dates do not become open popup boundaries or silently roll into another month', async () => {
  for (const field of ['starts_on', 'ends_on']) {
    for (const value of ['2026-02-29', '2026-09-31', '2026-13-01', '0000-01-01', '2026-9-1', '2026-09-17T00:00:00Z', 'invalid']) {
      const h = harness()
      h.change('title', '공연 안내'); h.change(field, value)
      await h.submit()
      assert.equal(h.writes.length, 0, `${field}: ${value}`)
      assert.ok(h.field(field).props.error)
      assert.equal(h.field(field).props.value, value)
    }
  }
})
