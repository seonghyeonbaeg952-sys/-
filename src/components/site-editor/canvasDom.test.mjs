import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

let dom = {}
try {
  const styleSource = await readFile(new URL('../../lib/siteEditorTextStyles.ts', import.meta.url), 'utf8')
  const styleCode = ts.transpileModule(styleSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  const styleUrl = `data:text/javascript;base64,${Buffer.from(styleCode).toString('base64')}`
  const source = await readFile(new URL('./canvasDom.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source.replaceAll("'../../lib/siteEditorTextStyles'", JSON.stringify(styleUrl)), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
  dom = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`)
} catch (error) { if (error.code !== 'ENOENT') throw error }
const text = value => ({ nodeType: 3, textContent: value, childNodes: [] })
const element = (name, ...children) => ({ nodeType: 1, nodeName: name.toUpperCase(), childNodes: children })

test('plain text reader preserves browser-created newlines and ignores placeholder br in an empty final line', () => {
  assert.equal(typeof dom.readCanvasPlainText, 'function')
  assert.equal(dom.readCanvasPlainText(element('div', text('첫 줄'), element('div', text('둘째')))), '첫 줄\n둘째')
  assert.equal(dom.readCanvasPlainText(element('div', text('첫 줄'), element('div', element('br')))), '첫 줄\n')
  assert.equal(dom.readCanvasPlainText(element('div', element('div', text('첫 줄')), element('div', element('br')), element('div', text('셋째')))), '첫 줄\n\n셋째')
})

test('plain text reader retains explicit br, spaces, emoji and styled inline nodes without emitting HTML', () => {
  assert.equal(typeof dom.readCanvasPlainText, 'function')
  const node = element('div', text('  서울 '), element('smyc-copy', text('👩‍🎤')), element('br'), text('합창  '))
  assert.equal(dom.readCanvasPlainText(node), '  서울 👩‍🎤\n합창  ')
})

function fixture(root, { fallbackRange = false } = {}) {
  const selected = { anchorNode: null, focusNode: null, anchorOffset: 0, focusOffset: 0, rangeCount: 0 }
  const select = (anchorNode, anchorOffset, focusNode, focusOffset) => Object.assign(selected, { anchorNode, anchorOffset, focusNode, focusOffset, rangeCount: 1 })
  const doc = {
    getSelection: () => selected,
    createRange: () => ({ setStart(node, offset) { this.start = { node, offset } }, setEnd(node, offset) { this.end = { node, offset } } }),
    createTextNode: value => attach(text(value)),
    createElement: name => attach(element(name)),
    createDocumentFragment: () => attach({ nodeType: 11, nodeName: '#document-fragment', childNodes: [] }),
  }
  selected.removeAllRanges = () => { selected.rangeCount = 0 }
  selected.addRange = range => select(range.start.node, range.start.offset, range.end.node, range.end.offset)
  if (!fallbackRange) selected.setBaseAndExtent = select
  function attach(node, parentNode = null) {
    node.parentNode = parentNode; node.ownerDocument = doc
    node.style ??= {}; node.attributes ??= {}
    node.setAttribute = (name, value) => { node.attributes[name] = value }
    node.appendChild = child => {
      if (child.nodeType === 11) for (const item of [...child.childNodes]) node.appendChild(item)
      else { attach(child, node); node.childNodes.push(child) }
      return child
    }
    node.replaceChildren = (...children) => { node.childNodes = []; children.forEach(child => node.appendChild(child)) }
    Object.defineProperty(node, 'innerHTML', { configurable: true, set() { throw new Error('HTML must never be parsed') } })
    node.childNodes.forEach(child => attach(child, node))
    return node
  }
  attach(root)
  const find = (name, node = root) => [node.nodeName === name ? node : null, ...node.childNodes.flatMap(child => find(name, child))].filter(Boolean)
  return { root, selected, select, find, doc }
}

test('the reader handles paragraph boundaries, inline tails, empty rows and trailing placeholder breaks consistently', () => {
  for (const [root, expected] of [
    [element('div', element('p', text('A')), element('p', text('B'))), 'A\nB'],
    [element('div', text('A'), element('div', text('B')), text('C')), 'A\nB\nC'],
    [element('div', element('div', element('br')), element('div', text('B'))), '\nB'],
    [element('div', text('A'), element('br'), element('br')), 'A\n'],
    [element('div', element('br')), ''],
    [element('div', element('div', text('A'), element('div', element('br'))), element('div', text('B'))), 'A\n\nB'],
  ]) assert.equal(dom.readCanvasPlainText(root), expected)
})

test('capture maps text and element child offsets through the same structural newlines as reading', () => {
  assert.equal(typeof dom.captureCanvasSelection, 'function')
  const a = text('A'), b = text('B'), c = text('C')
  const middle = element('div', b, element('br'), c), last = element('p', element('br'))
  const f = fixture(element('div', a, middle, last))
  assert.equal(dom.readCanvasPlainText(f.root), 'A\nB\nC\n')
  f.select(b, 0, c, 1)
  assert.deepEqual(dom.captureCanvasSelection(f.root), { start: 2, end: 5 })
  f.select(f.root, 1, middle, 0)
  assert.deepEqual(dom.captureCanvasSelection(f.root), { start: 1, end: 2 })
  f.select(c, 1, b, 0)
  assert.deepEqual(dom.captureCanvasSelection(f.root), { start: 2, end: 5 })
  f.select(last, 0, last, 0)
  assert.deepEqual(dom.captureCanvasSelection(f.root), { start: 6, end: 6 })
})

test('capture preserves UTF-16 positions across styled inline nodes and rejects outside selections', () => {
  const a = text('A'), emoji = text('😀'), b = text('B')
  const f = fixture(element('div', a, element('smyc-copy', emoji), b))
  f.select(emoji, 0, emoji, 2)
  assert.deepEqual(dom.captureCanvasSelection(f.root), { start: 1, end: 3 })
  f.select(emoji, 2, text('outside'), 1)
  assert.equal(dom.captureCanvasSelection(f.root), null)
  f.selected.rangeCount = 0
  assert.equal(dom.captureCanvasSelection(f.root), null)
})

test('restoration chooses DOM positions for the requested newline-aware offsets and clamps stale bounds', () => {
  assert.equal(typeof dom.restoreCanvasSelection, 'function')
  const a = text('A'), b = text('B')
  const f = fixture(element('div', a, element('div', b)))
  dom.restoreCanvasSelection(f.root, { start: 2, end: 3 })
  assert.equal(f.selected.anchorNode, b); assert.equal(f.selected.anchorOffset, 0)
  assert.equal(f.selected.focusNode, b); assert.equal(f.selected.focusOffset, 1)
  dom.restoreCanvasSelection(f.root, { start: -10, end: 100 })
  assert.deepEqual(dom.captureCanvasSelection(f.root), { start: 0, end: 3 })
  dom.restoreCanvasSelection(f.root, { start: 3, end: 0 })
  assert.equal(f.selected.anchorNode, b); assert.equal(f.selected.anchorOffset, 1)
  assert.equal(f.selected.focusNode, a); assert.equal(f.selected.focusOffset, 0)
  const before = { ...f.selected }
  assert.doesNotThrow(() => dom.restoreCanvasSelection(f.root, { start: NaN, end: 2 }))
  assert.equal(f.selected.anchorNode, before.anchorNode)
})

test('restoration works with an empty final line and the ordered Range fallback without global browser objects', () => {
  const last = element('div', element('br'))
  const f = fixture(element('div', text('A'), last), { fallbackRange: true })
  dom.restoreCanvasSelection(f.root, { start: 2, end: 2 })
  assert.deepEqual(dom.captureCanvasSelection(f.root), { start: 2, end: 2 })
  const empty = fixture(element('div'), { fallbackRange: true })
  dom.restoreCanvasSelection(empty.root, { start: 0, end: 0 })
  assert.deepEqual(dom.captureCanvasSelection(empty.root), { start: 0, end: 0 })
})

test('painting uses text nodes and all six allowed style properties while preserving exact spaces and line breaks', () => {
  assert.equal(typeof dom.paintCanvasText, 'function')
  const f = fixture(element('div', text('old')))
  dom.paintCanvasText(f.root, 'A😀\n B\n', [{ start: 1, end: 3, style: { fontFamily: 'hahmlet', fontSize: 32, color: '#123456', fontWeight: 700, fontStyle: 'italic', textDecoration: 'underline' } }])
  assert.equal(dom.readCanvasPlainText(f.root), 'A😀\n B\n')
  const styled = f.find('SMYC-COPY')
  assert.equal(styled.length, 1)
  assert.deepEqual(styled[0].style, { fontFamily: '"Hahmlet",serif', fontSize: '32px', color: '#123456', fontWeight: '700', fontStyle: 'italic', textDecoration: 'underline' })
  assert.equal(dom.readCanvasPlainText(styled[0]), '😀')
  dom.restoreCanvasSelection(f.root, { start: 4, end: 6 })
  assert.deepEqual(dom.captureCanvasSelection(f.root), { start: 4, end: 6 })
})

test('invalid formatting is discarded safely and HTML-looking copy is always painted as literal text', () => {
  const f = fixture(element('div'))
  dom.paintCanvasText(f.root, '<img src=x onerror=bad()>', [{ start: 0, end: 4, style: { background: 'url(bad)' } }])
  assert.equal(dom.readCanvasPlainText(f.root), '<img src=x onerror=bad()>')
  assert.equal(f.find('IMG').length, 0)
  assert.equal(f.find('SMYC-COPY').length, 0)
})

test('every text offset round-trips through native positions across block and break boundaries', () => {
  for (const root of [
    element('div', element('p', text('A')), element('p', element('br')), element('p', text('B'))),
    element('div', text('A'), element('br'), element('br')),
    element('div', element('div', text('A'), element('div', element('br'))), element('div', text('B'))),
    element('div', element('smyc-copy', text('A'), element('br')), element('smyc-copy', element('br'), text('B'))),
  ]) {
    const f = fixture(root)
    const value = dom.readCanvasPlainText(root)
    for (let offset = 0; offset <= value.length; offset += 1) {
      dom.restoreCanvasSelection(root, { start: offset, end: offset })
      assert.deepEqual(dom.captureCanvasSelection(root), { start: offset, end: offset }, `${JSON.stringify(value)} at ${offset}`)
    }
    assert.ok(f.selected.rangeCount)
  }
})

test('painting preserves blank lines when a formatting boundary falls on either side of a newline', () => {
  for (const value of ['', '\n', '\n\n', 'A\n', 'A\n\nB', '\r\n B\n']) {
    for (let split = 0; split <= value.length; split += 1) {
      const f = fixture(element('div'))
      const runs = split > 0 ? [{ start: 0, end: split, style: { fontWeight: 700 } }] : []
      dom.paintCanvasText(f.root, value, runs)
      assert.equal(dom.readCanvasPlainText(f.root), value, `${JSON.stringify(value)} split at ${split}`)
    }
  }
})
