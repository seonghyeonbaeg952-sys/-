import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

// Consume the stylesheet actually imported by the public shell, not an
// unconnected design fixture. These are CSS contract checks, not browser QA.
const layoutUrl = new URL('../components/layout/PublicLayout.tsx', import.meta.url)
const layout = await readFile(layoutUrl, 'utf8')
const styleImport = [...layout.matchAll(/import ['"]([^'"]+\.css)['"]/g)]
  .find(([, path]) => path.endsWith('/public-scrollbar.css'))?.[1]
const css = styleImport ? await readFile(new URL(styleImport, layoutUrl), 'utf8') : ''

function parseRules(source, conditions = []) {
  const rules = []
  const text = source.replace(/\/\*[\s\S]*?\*\//g, '')
  let start = 0
  while (start < text.length) {
    const open = text.indexOf('{', start)
    if (open < 0) break
    let end = open + 1
    let depth = 1
    for (; end < text.length && depth; end++) {
      if (text[end] === '{') depth++
      if (text[end] === '}') depth--
    }
    assert.equal(depth, 0, 'Stylesheet blocks must be balanced')
    const header = text.slice(start, open).trim()
    const body = text.slice(open + 1, end - 1)
    if (header.startsWith('@')) rules.push(...parseRules(body, [...conditions, header]))
    else {
      const declarations = Object.fromEntries(body.split(';').filter(value => value.trim()).map(value => {
        const separator = value.indexOf(':')
        assert.ok(separator > 0, `Invalid declaration: ${value}`)
        return [value.slice(0, separator).trim(), value.slice(separator + 1).trim()]
      }))
      for (const selector of header.split(',')) rules.push({ selector: selector.trim(), conditions, declarations })
    }
    start = end
  }
  return rules
}

const rules = parseRules(css)
const desktop = { width: 1440, hover: 'hover', pointer: 'fine', forcedColors: 'none', webkit: true, publicShell: true, preview: false }

function conditionMatches(condition, environment) {
  if (condition.startsWith('@media ')) {
    return [...condition.matchAll(/\(([-\w]+):\s*([^()]+)\)/g)].every(([, feature, value]) => {
      if (feature === 'min-width') return environment.width >= Number.parseFloat(value)
      if (feature === 'hover') return environment.hover === value
      if (feature === 'pointer') return environment.pointer === value
      if (feature === 'forced-colors') return environment.forcedColors === value
      assert.fail(`Unmodelled media feature: ${feature}`)
    })
  }
  assert.match(condition, /^@supports (not )?selector\(::-webkit-scrollbar\)$/)
  return condition.includes('not ') ? !environment.webkit : environment.webkit
}

function selectorMatches(selector, environment, target) {
  // Model only the small selector vocabulary used by this stylesheet; reject
  // broadened selectors rather than silently assuming they are safely scoped.
  assert.ok(selector.startsWith('html'), 'Scrollbar rules must target the document root, not every scroller')
  selector = selector.slice(4)
  let scoped = false
  while (selector.startsWith(':has(') || selector.startsWith(':not(:has(')) {
    const negative = selector.startsWith(':not(')
    const open = negative ? 10 : 5
    const end = selector.indexOf(')', open)
    const query = selector.slice(open, end)
    const found = query === ".public-shell[data-public-theme='white-orange']"
      ? environment.publicShell
      : query === '.site-editor-preview-banner' ? environment.preview : assert.fail(`Unknown scope: ${query}`)
    scoped ||= query.startsWith('.public-shell') && !negative
    if (negative ? found : !found) return false
    selector = selector.slice(end + (negative ? 2 : 1))
  }
  assert.ok(scoped, 'Viewport customization must be scoped to the public shell')
  assert.ok(selector === '' || selector === ' > body' || selector === '::-webkit-scrollbar' || /^::-webkit-scrollbar(?:-track|-thumb)?:vertical(?::hover|:active)?$/.test(selector), `Unexpected scroll target: ${selector}`)
  if (target === 'body') return selector === ' > body'
  if (target === 'nested') return false
  return selector === target
}

function styleFor(target = '', environment = desktop) {
  const declarations = {}
  for (const rule of rules) {
    if (rule.conditions.every(condition => conditionMatches(condition, environment)) && selectorMatches(rule.selector, environment, target)) {
      Object.assign(declarations, rule.declarations)
    }
  }
  const variables = target ? styleFor('', environment) : declarations
  return Object.fromEntries(Object.entries(declarations).map(([property, value]) =>
    [property, value.replace(/var\((--[-\w]+)\)/g, (_, name) => variables[name] ?? assert.fail(`Missing token: ${name}`))]))
}

function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(value => Number.parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
}

function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a)
  return (values[0] + 0.05) / (values[1] + 0.05)
}

test('Chrome custom rendering can start before a scrollbar has an orientation or state', () => {
  // Blink's CheckScrollbarPseudoClass returns false without a scrollbar. Only
  // orientation-qualified rules cannot bootstrap the custom scrollbar style.
  const initialStyle = styleFor('::-webkit-scrollbar')
  assert.equal(initialStyle['background-color'], '#fcfaf5', 'An unqualified scrollbar declaration must enable custom rendering')
  assert.equal(initialStyle.height, undefined, 'Do not resize horizontal scrollbars')
})

test('approved B geometry: 12px native rail surrounds an 8px rounded thumb', () => {
  const rail = styleFor('::-webkit-scrollbar:vertical')
  const track = styleFor('::-webkit-scrollbar-track:vertical')
  const thumb = styleFor('::-webkit-scrollbar-thumb:vertical')
  assert.equal(Number.parseFloat(rail.width), 12)
  assert.equal(track['background-color'], '#fcfaf5')
  assert.equal(thumb['background-color'], '#68665f')
  assert.equal(Number.parseFloat(rail.width) - 2 * Number.parseFloat(thumb.border), 8)
  assert.equal(thumb['background-clip'], 'padding-box')
  assert.ok(Number.parseFloat(thumb['border-radius']) >= 6)
  assert.ok(contrast(thumb['background-color'], track['background-color']) >= 3)
  assert.equal(thumb.height, undefined, 'Thumb length must remain browser-controlled')
})

for (const state of ['hover', 'active']) {
  test(`${state}: thumb darkens without changing rail or thumb geometry`, () => {
    const base = styleFor('::-webkit-scrollbar-thumb:vertical')
    const stateStyle = styleFor(`::-webkit-scrollbar-thumb:vertical:${state}`)
    assert.equal(stateStyle['background-color'], '#17171a')
    assert.ok(contrast(stateStyle['background-color'], '#fcfaf5') > contrast(base['background-color'], '#fcfaf5'))
    assert.deepEqual(Object.keys(stateStyle), ['background-color'])
  })
}

test('standard scrollbar fallback uses B colors while preserving the platform width', () => {
  const environment = { ...desktop, webkit: false }
  assert.equal(styleFor('', environment)['scrollbar-color'], '#68665f #fcfaf5')
  assert.equal(styleFor('', environment)['scrollbar-width'], 'auto')
  assert.equal(styleFor('body', environment)['scrollbar-color'], 'auto', 'Inherited color must not recolor nested scrollbars')
  assert.deepEqual(styleFor('::-webkit-scrollbar:vertical', environment), {})
  assert.equal(styleFor()['scrollbar-color'], undefined, 'Standard color must not override WebKit thumb states')
})

for (const [name, overrides] of [
  ['390px mobile', { width: 390 }],
  ['768px tablet', { width: 768 }],
  ['touch input', { pointer: 'coarse' }],
  ['no-hover input', { hover: 'none' }],
  ['high contrast', { forcedColors: 'active' }],
  ['CMS admin', { publicShell: false }],
  ['CMS preview iframe', { preview: true }],
]) {
  test(`${name}: keeps system scrollbar colors, width and controls`, () => {
    for (const webkit of [true, false]) {
      const environment = { ...desktop, ...overrides, webkit }
      for (const target of ['', 'body', '::-webkit-scrollbar', '::-webkit-scrollbar:vertical', '::-webkit-scrollbar-thumb:vertical']) {
        assert.deepEqual(styleFor(target, environment), {})
      }
    }
  })
}

test('nested scroll areas have no overrides and scroll behavior is never restyled', () => {
  assert.deepEqual(styleFor('nested'), {})
  assert.ok(rules.length > 0, 'Public layout must load the approved scrollbar stylesheet')
  const allowed = new Set(['scrollbar-color', 'scrollbar-width', 'width', 'background-color', 'background-clip', 'border', 'border-radius'])
  for (const { declarations } of rules) {
    for (const property of Object.keys(declarations)) {
      assert.ok(property.startsWith('--public-scrollbar-') || allowed.has(property), `Do not modify layout or scrolling: ${property}`)
    }
  }
})
