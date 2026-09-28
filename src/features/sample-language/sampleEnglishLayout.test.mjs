import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const css = (await readFile(new URL('./sample-english-layout.css', import.meta.url), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '')
const scope = "html[data-sample-language='en'] .public-shell "
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim().replace(/\s+/g, ' '), declarations: Object.fromEntries(body.split(';').filter(part => part.includes(':')).map(part => { const index = part.indexOf(':'); return [part.slice(0, index).trim(), part.slice(index + 1).trim()] })) }))
function expand(selector) {
  const match = /:is\(([^()]+)\)/.exec(selector)
  return match ? match[1].split(',').flatMap(item => expand(selector.slice(0, match.index) + item.trim() + selector.slice(match.index + match[0].length))) : selector.split(',').map(item => item.trim())
}
function style(target) {
  return Object.assign({}, ...rules.filter(rule => expand(rule.selector).includes(scope + target)).map(rule => rule.declarations))
}

test('every corrective rule is gated by the English sample, including desktop grid rules', () => {
  assert.ok(rules.length > 20)
  for (const rule of rules) for (const selector of expand(rule.selector)) assert.ok(selector.startsWith(scope) || selector.startsWith("html[data-sample-language='en'] .public-shell-home-sample-v4 "), selector)
  assert.doesNotMatch(css, /!important[^;]*(?:width|height)|text-overflow:\s*ellipsis/)
})
test('English score title, legend, staff, summary and actions participate in the same flow', () => {
  assert.equal(style('.motet-score-final-sheet-content').display, 'flex')
  for (const selector of ['.motet-score-final-sheet-content > h2', '.motet-score-voice-legend', '.motet-score-final-staff', '.motet-score-final-summary', '.motet-score-final-actions']) {
    assert.equal(style(selector).position, 'relative', selector)
    assert.equal(style(selector).inset, 'auto', selector)
    assert.equal(style(selector).height, undefined, `${selector} cannot constrain wrapped text height`)
  }
  assert.equal(style('.motet-score-final-sheet')['overflow-y'], 'auto', 'Unusually long editor copy must remain reachable')
})
test('score reveals retain the owning animation variables after removing absolute text offsets', () => {
  for (const [selector, variable] of [['.motet-score-final-sheet-content > h2', '--headline-y'], ['.motet-score-voice-legend', '--legend-reveal'], ['.motet-score-final-staff', '--staff-reveal'], ['.motet-score-final-summary', '--summary-reveal'], ['.motet-score-final-actions', '--actions-reveal']]) assert.ok(style(selector).transform.includes(variable), selector)
})
test('spirit title fragments grow with wrapped text instead of occupying fixed Korean line heights', () => {
  for (const selector of ['.spirit-heritage__faith-line', '.spirit-heritage__faith-title h2 .spirit-heritage__faith-line--last', '.spirit-heritage__values-line', '.spirit-heritage__education-line', '.spirit-heritage__manifesto-line', '.spirit-heritage__motet-line']) {
    assert.equal(style(selector).height, 'auto', selector)
    assert.equal(style(selector)['line-height'], 'inherit', selector)
    assert.equal(style(selector)['padding-left'], '0', selector)
  }
})
test('English spirit headlines wrap as whole phrases instead of forcing Korean fragment rows', () => {
  for (const selector of ['.spirit-heritage__motet-title h2', '.spirit-heritage__manifesto-heading h2', '.spirit-heritage__faith-title h2', '.spirit-heritage__values-heading h2', '.spirit-heritage__education-title h2', '.spirit-heritage__community-heading h2']) {
    assert.equal(style(selector).display, 'block', selector)
  }
  for (const selector of ['.spirit-heritage__motet-line', '.spirit-heritage__manifesto-line', '.spirit-heritage__faith-line', '.spirit-heritage__values-line', '.spirit-heritage__education-line', '.spirit-heritage__community-line']) {
    assert.equal(style(selector).display, 'inline', selector)
  }
})
test('the education description and motet quote follow their real title/body height', () => {
  for (const selector of ['.spirit-heritage__education-lead', '.spirit-heritage__motet-body', '.spirit-heritage__quote-card']) {
    assert.equal(style(selector).position, 'relative')
    assert.equal(style(selector).inset, 'auto')
  }
  assert.equal(style('.spirit-heritage__motet-glass').height, 'auto')
  assert.equal(style('.spirit-heritage__quote-card').height, 'auto')
})
test('English scripture and value panels can grow for their translated body copy', () => {
  assert.equal(style('.spirit-heritage__scripture-card').height, 'auto')
  for (const child of ['p', 'blockquote', 'small']) {
    assert.equal(style(`.spirit-heritage__scripture-card ${child}`).position, 'relative')
    assert.equal(style(`.spirit-heritage__scripture-card ${child}`).width, 'auto')
  }
  assert.equal(style('.spirit-heritage__value-panel').height, 'auto')
  assert.equal(style('.spirit-heritage__value-panel').overflow, 'visible')
})
test('about emphasised text wraps rather than disappearing under its reveal mask', () => {
  assert.equal(style('.about-overview__title-focus')['white-space'], 'normal')
  assert.equal(style('.about-overview__title-focus')['line-height'], 'inherit')
  assert.equal(style('.about-overview__title-mask').overflow, 'visible', 'English descenders such as the g in neighbours must not be clipped by the entrance mask')
  assert.equal(style('.about-overview__intro-copy').position, 'relative')
  assert.equal(style('.about-overview__intro-copy')['min-width'], '0')
})
test('English Join buttons remain compact while their labels wrap inside the pill', () => {
  assert.equal(style('.join-open-score__actions')['flex-wrap'], 'wrap')
  assert.equal(style('.join-open-score .join-open-score__cta > span:first-child')['white-space'], 'normal')
  assert.equal(style('.join-open-score .join-open-score__cta--secondary')['max-width'], '260px')
})
test('founding and education pictures occupy a grid row after their headings', () => {
  for (const [prefix, picture] of [['founding', 'founding-visual'], ['education', 'education-visual']]) {
    const parent = style(`.about-overview__${prefix}-stage`)
    assert.equal(parent.display, 'grid')
    const rows = [...parent['grid-template-areas'].matchAll(/'([^']+)'/g)].map(match => match[1].split(' '))
    assert.ok(rows.findIndex(row => row.includes('photo')) > rows.findIndex(row => row.includes('heading')))
    assert.equal(style(`.about-overview__${picture}`).position, 'relative')
    assert.equal(style(`.about-overview__${picture}`)['grid-area'], 'photo')
  }
})
test('orbit copy has a smaller English text box and the CTA sits after the stage; orbit objects are not redefined', () => {
  assert.match(style('.home-spirit-chorus-orbit__center').width, /72%/)
  const font = style('.home-spirit-chorus-orbit__headline')['font-size']
  assert.ok(Number(font.match(/,\s*([\d.]+)px\)$/)[1]) <= 28)
  assert.ok(Number.parseFloat(style('.home-spirit-chorus-orbit__action')['margin-top']) > 0)
  assert.doesNotMatch(css, /\.home-spirit-chorus-orbit__(?:ring|geometry|value\[|media)\s*\{/)
})
test('prominent English sample paragraphs avoid a stranded last word without changing Korean layout', () => {
  for (const selector of [
    '.home-about-portrait__copy > p', '.about-overview__intro-body',
    '.about-overview__founding-body', '.about-overview__spirit-body',
    '.spirit-heritage__motet-body', '.spirit-heritage__faith-lead',
    '.spirit-heritage__education-lead', '.join-open-score__description',
    '.notices-page__description', '.gallery-journal__description',
    '.contact-atelier__intro p', '.join-guide__description',
  ]) assert.equal(style(selector)['text-wrap'], 'pretty', selector)
})
