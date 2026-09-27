import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(await readFile(new URL('./ArchivePageStack.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText
const photo = {
  id: 'published-photo', title: '합창단 기록', image_url: '/choir.jpg', image_alt: '합창단',
  taken_at: '2026-09-01', created_at: '2026-09-01T00:00:00Z', display_order: 1, is_visible: true,
}
const flushPromises = () => new Promise(resolve => setImmediate(resolve))

// Execute the real component and its effects with a deterministic clock and
// DOM boundary. No browser automation, React renderer package or live CMS writes.
function mount({ reduced = false } = {}) {
  const slots = [], effects = [], frames = new Map(), timers = new Map(), nodes = new Map(), observers = []
  let cursor = 0, clock = 0, serial = 0, dirty = false, tree
  let props = { buttonLabel: '갤러리 보기', description: '기록 소개', eyebrow: 'ARCHIVE', images: [photo], posters: [], videos: [] }
  const query = { matches: reduced, listeners: new Set(),
    addEventListener(_type, callback) { this.listeners.add(callback) },
    removeEventListener(_type, callback) { this.listeners.delete(callback) },
  }
  const react = {
    useState(initial) {
      const index = cursor++
      slots[index] ??= { value: typeof initial === 'function' ? initial() : initial }
      const slot = slots[index]
      slot.set ??= next => {
        const value = typeof next === 'function' ? next(slot.value) : next
        if (!Object.is(value, slot.value)) { slot.value = value; dirty = true }
      }
      return [slot.value, slot.set]
    },
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial } },
    useMemo(callback, deps) {
      const index = cursor++, slot = slots[index]
      if (!slot || deps.some((value, i) => !Object.is(value, slot.deps[i]))) slots[index] = { value: callback(), deps }
      return slots[index].value
    },
    useCallback(callback, deps) { return this.useMemo(() => callback, deps) },
    useEffect(callback, deps) {
      const index = cursor++, slot = slots[index]
      if (!slot || deps.some((value, i) => !Object.is(value, slot.deps[i]))) {
        effects.push(() => { slot?.cleanup?.(); slots[index] = { deps, cleanup: callback() } })
      }
    },
  }
  // Imported hook calls are unbound, just like React's exports.
  react.useCallback = (callback, deps) => react.useMemo(() => callback, deps)
  function node(key) {
    if (!nodes.has(key)) nodes.set(key, {
      dataset: { id: key },
      style: { values: new Map(), setProperty(name, value) { this.values.set(name, value) }, getPropertyValue(name) { return this.values.get(name) } },
      classList: { add() {}, remove() {} },
      querySelector(selector) {
        if (selector === 'img') return { complete: true, naturalWidth: 1200, naturalHeight: 800 }
        if (selector === 'canvas') return { getContext: () => null }
        throw new Error(`Unexpected DOM query ${selector}`)
      },
    })
    return nodes.get(key)
  }
  const jsx = (type, nextProps, key) => ({ type, props: nextProps, key })
  const dependencies = {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    '../site-editor/useSiteEditor': { useSiteEditor: () => ({ copy: (_page, _id, fallback) => fallback }) },
    '../../constants/homeTypography': { HOME_TITLE_LINE_ROLES: { archive: ['base', 'emphasis', 'base'] } },
    '../../lib/homeCopySlices': { splitHomeCopyLines: text => text.split('\n').map(text => ({ text, offset: 0 })) },
  }
  for (const path of ['../site-editor/FormattedCopy', './HomeCopy', '../common/EmptyState', '../common/TransitionLink', './ImageTile']) {
    dependencies[path] = new Proxy({}, { get: (_target, name) => name })
  }
  const module = { exports: {} }
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require(name) { assert.ok(Object.hasOwn(dependencies, name), `Unexpected import ${name}`); return dependencies[name] },
    performance: { now: () => clock },
    window: {
      innerHeight: 1000, matchMedia: () => query,
      requestAnimationFrame(callback) { const id = ++serial; frames.set(id, callback); return id },
      cancelAnimationFrame(id) { frames.delete(id) },
      setTimeout(callback) { const id = ++serial; timers.set(id, callback); return id },
      clearTimeout(id) { timers.delete(id) },
      addEventListener() {}, removeEventListener() {},
    },
    IntersectionObserver: class {
      constructor(callback) { this.callback = callback; this.active = true; observers.push(this) }
      observe() {}
      disconnect() { this.active = false }
    },
  })
  function visit(value, fn) {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) { value.forEach(item => visit(item, fn)); return }
    fn(value)
    visit(value.props?.children, fn)
  }
  function render() {
    cursor = 0; dirty = false
    tree = module.exports.ArchivePageStack(props)
    visit(tree, element => {
      const ref = element.props?.ref
      if (!ref) return
      const key = element.type === 'section' ? 'section'
        : element.props['data-id'] ?? (element.props['data-record'] ? `wrap-${element.props['data-record']}` : element.props.className)
      const target = node(key)
      if (typeof ref === 'function') ref(target)
      else ref.current = target
    })
    effects.splice(0).forEach(effect => effect())
  }
  function settle() {
    for (let count = 0; dirty; count++) { assert.ok(count < 10, 'Unexpected render loop'); render() }
  }
  function frame(elapsed = 16) {
    clock += elapsed
    const callbacks = [...frames.values()]; frames.clear()
    callbacks.forEach(callback => callback(clock))
    settle()
  }
  render()
  return {
    nodes,
    get tree() { return tree },
    frame,
    async ready() { await flushPromises(); settle(); frame() },
    show() {
      observers.filter(observer => observer.active).forEach(observer => observer.callback([{
        isIntersecting: true, intersectionRatio: 0.6, boundingClientRect: { top: 100 },
      }]))
      const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); settle()
    },
    refresh() { props = { ...props, images: props.images.map(item => ({ ...item })) }; render(); settle() },
    select(placement) {
      visit(tree, element => { if (element.props?.['data-id'] === placement) element.props.onClick() })
      settle()
    },
    preference(matches) { query.matches = matches; query.listeners.forEach(callback => callback()); settle(); frame() },
    cleanup() { slots.forEach(slot => slot?.cleanup?.()) },
  }
}

function assertFinished(harness) {
  const section = [...harness.nodes.values()].find(value => value.style.getPropertyValue('--motion') !== undefined)
  assert.equal(section.style.getPropertyValue('--motion'), '1.0000', 'Completed animation must not reset to the latent stage')
  assert.equal(section.style.getPropertyValue('--copy-reveal'), '1.0000', 'Headline must remain sharp after scrolling/rerendering')
  for (const placement of ['photo', 'poster', 'video']) {
    assert.equal(harness.nodes.get(placement).style.getPropertyValue('--fallback-reveal'), '1.0000', `${placement} must stay fully developed`)
    assert.equal(harness.nodes.get(placement).style.getPropertyValue('--fallback-mask-left'), '100.00%')
  }
  assert.equal(harness.tree.props['aria-busy'], false)
  const footer = harness.tree.props.children.find(child => child?.props?.className === 'archive__footer')
  assert.equal(footer.props.children[0].props.children, 'ARCHIVE')
}

test('completed exposure stays sharp across 20 parent refreshes after scrolling', async () => {
  const h = mount()
  try {
    await h.ready(); h.show(); h.frame(3600); await h.ready(); assertFinished(h)
    for (let iteration = 0; iteration < 20; iteration++) {
      h.refresh(); await h.ready(); assertFinished(h)
    }
  } finally { h.cleanup() }
})

test('an in-progress exposure retains its position when gallery props refresh', async () => {
  const h = mount()
  try {
    await h.ready(); h.show(); h.frame(1800)
    h.refresh(); await h.ready()
    const section = [...h.nodes.values()].find(value => value.style.getPropertyValue('--motion') !== undefined)
    assert.ok(Number(section.style.getPropertyValue('--motion')) >= 0.5, 'A refresh must not rewind an active sequence')
    h.frame(1800); await h.ready(); assertFinished(h)
  } finally { h.cleanup() }
})

test('expanding and closing a record preserves its completed exposure after a refresh', async () => {
  const h = mount()
  try {
    await h.ready(); h.show(); h.frame(3600); await h.ready()
    h.select('photo'); h.refresh(); await h.ready(); assertFinished(h)
    assert.ok(h.tree.props.className.includes('is-focused'))
    h.select('photo'); await h.ready(); assertFinished(h)
    assert.ok(!h.tree.props.className.includes('is-focused'))
  } finally { h.cleanup() }
})

test('turning reduced motion on and off never rewinds the fully visible content', async () => {
  const h = mount({ reduced: true })
  try {
    await h.ready(); h.preference(true); assertFinished(h)
    h.preference(false); await h.ready(); assertFinished(h)
    h.refresh(); await h.ready(); assertFinished(h)
  } finally { h.cleanup() }
})
