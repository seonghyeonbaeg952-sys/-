import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const css = await readFile(new URL('../../pages/sample/HomeV4SamplePage.css', import.meta.url), 'utf8')
const root = ".public-shell-home-sample-v4[data-design-candidate='home-v4']"

// Read the actual desktop declarations, then calculate their used geometry.
// A fixed offset or fixed track width must fail the symmetry checks below.
function declarations(selector) {
  const wanted = `${root} ${selector}`
  const result = {}
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!selectors.split(',').some(value => value.trim().replace(/\s+/g, ' ') === wanted)) continue
    for (const declaration of body.split(';')) {
      const separator = declaration.indexOf(':')
      if (separator < 0) continue
      result[declaration.slice(0, separator).trim()] = declaration.slice(separator + 1).trim()
    }
  }
  assert.ok(Object.keys(result).length, `Missing production style for ${selector}`)
  return result
}

function length(value, containingWidth) {
  if (value === '0') return 0
  if (value?.endsWith('%')) return Number.parseFloat(value) * containingWidth / 100
  assert.match(value ?? '', /^-?[\d.]+px$/, `Unsupported length: ${value}`)
  return Number.parseFloat(value)
}

function horizontalPosition(style, containingWidth, usedWidth) {
  return style.left && style.left !== 'auto'
    ? length(style.left, containingWidth)
    : containingWidth - length(style.right, containingWidth) - usedWidth
}

function geometry(layoutWidth) {
  const steps = declarations('.join-open-score__steps')
  const width = length(steps.width, layoutWidth)
  const left = horizontalPosition(steps, layoutWidth, width)
  const track = steps['grid-template-columns'].match(/^repeat\(4,\s*(.+)\)$/)?.[1]
  assert.ok(track, 'The four-step score must have four tracks')
  const trackWidth = track.includes('1fr') ? width / 4 : length(track, width)
  const rail = declarations('.join-open-score__steps::before')
  const railWidth = length(rail.width, width)
  const railLeft = left + horizontalPosition(rail, width, railWidth)
  const dot = declarations('.join-open-score__step-dot')
  const dotWidth = length(dot.width, trackWidth)
  const dotTranslation = dot.transform === 'translateX(-50%)' ? -dotWidth / 2 : 0
  const centers = Array.from({ length: 4 }, (_, index) =>
    left + index * trackWidth + length(dot.left, trackWidth) + dotTranslation + dotWidth / 2)
  return { centers, left, width, trackWidth, railLeft, railRight: railLeft + railWidth, railWidth }
}

for (const layoutWidth of [1080, 1280]) {
  test(`${layoutWidth}px score: four nodes are symmetric with equal edge spacing`, () => {
    const { centers, railLeft, railRight } = geometry(layoutWidth)
    assert.equal((centers[0] + centers[3]) / 2, (railLeft + railRight) / 2, 'Node group is off-center')
    assert.equal(centers[0] - railLeft, railRight - centers[3], 'Rail end margins must match')
    assert.equal(centers[1] - centers[0], centers[2] - centers[1])
    assert.equal(centers[2] - centers[1], centers[3] - centers[2])
    assert.ok(centers.every(center => center > railLeft && center < railRight))
  })

  test(`${layoutWidth}px score: decorative caps stay at the original rail edges`, () => {
    const { left, width, trackWidth, railLeft, railRight } = geometry(layoutWidth)
    const start = declarations('.join-open-score__step:first-child::before')
    const end = declarations('.join-open-score__steps::after')
    const startWidth = length(start.width, trackWidth)
    const endWidth = length(end.width, width)
    assert.equal(left + horizontalPosition(start, trackWidth, startWidth), railLeft)
    assert.equal(left + horizontalPosition(end, width, endWidth) + endWidth, railRight)
    assert.equal(railLeft, 0, 'The existing rail origin must not shift with the nodes')
    assert.equal(railRight, layoutWidth)
  })
}

test('step headings and descriptions share the node center instead of a translated text center', () => {
  for (const selector of ['.join-open-score__step h4', '.join-open-score__step p']) {
    const style = declarations(selector)
    assert.ok(style.margin.includes('auto'), 'Text must be centered in its own track')
    assert.ok(!style.transform || style.transform === 'none', `${selector} is offset from its node`)
  }
})

test('the admission CTAs are compact without dropping below a usable touch height', () => {
  const button = declarations('.join-open-score .join-open-score__cta')
  const primary = declarations('.join-open-score .join-open-score__cta--primary')
  const secondary = declarations('.join-open-score .join-open-score__cta--secondary')
  const height = length(button.height, 1080)
  assert.ok(height >= 44 && height <= 50, 'Keep the button compact but easy to activate')
  assert.ok(length(primary.width, 1080) <= 240)
  assert.ok(length(secondary.width, 1080) <= 228)
})

for (const layoutWidth of [1080, 1280]) {
  test(`${layoutWidth}px compact CTA pair remains centered through its reveal animation`, () => {
    const actions = declarations('.join-open-score__actions')
    const primary = declarations('.join-open-score .join-open-score__cta--primary')
    const secondary = declarations('.join-open-score .join-open-score__cta--secondary')
    const width = length(primary.width, layoutWidth) + length(secondary.width, layoutWidth) + length(actions.gap, layoutWidth)
    const translation = actions.translate ? length(actions.translate.split(' ')[0], width) : 0
    const left = horizontalPosition(actions, layoutWidth, width) + translation
    assert.equal(left + width / 2, layoutWidth / 2)
    assert.ok(left >= 0 && left + width <= layoutWidth)
  })
}
