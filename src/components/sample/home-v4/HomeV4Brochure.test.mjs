import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('./HomeV4PerformanceCarousel.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('./HomeV4PerformanceCarousel.css', import.meta.url), 'utf8')
const englishCss = await readFile(new URL('../../../features/sample-language/sample-english-layout.css', import.meta.url), 'utf8')

test('opened trifold has a cover, performance information and visitor guide in both languages', () => {
  const interior = component.slice(component.indexOf('className="motion-program-spread'), component.indexOf('</div>\n      </div>\n    </div>', component.indexOf('className="motion-program-spread')))
  assert.match(interior, /motion-program-cover-title/)
  assert.match(interior, /motion-program-date-number/)
  assert.match(interior, /motion-program-guide-copy/)
  assert.match(interior, /motion-program-folio/g)
  assert.match(interior, /english \? 'Concert programme'/)
  assert.match(interior, /english \? 'Visitor guide'/)
  assert.match(component, /english \? 'Open brochure' : '브로슈어 펼치기'/)
})

test('brochure has no nested vertical scrolling and links to the complete CMS record', () => {
  assert.doesNotMatch(css, /\.home-v4-current-program \.motion-program-panel\s*\{[^}]*overflow-y:\s*auto/)
  assert.match(css, /\.motion-program-folio\s*\{/)
  assert.match(component, /href=\{publicHref\(`\/concerts\/\$\{concert\.id\}`\)\}/)
  assert.doesNotMatch(englishCss, /html\[data-sample-language='en'\][^\n]*\.home-v4-current-program \.motion-program-panel/)
})

test('opened brochure leads with a documented archive photograph and restrained monochrome panels', () => {
  assert.match(component, /className="motion-program-cover-image"/)
  assert.match(component, /Choir rehearsal archive/)
  assert.doesNotMatch(component, /motion-program-staff/)
  assert.match(css, /\.motion-program-panel-right\s*\{[^}]*background:\s*#fff/)
  assert.doesNotMatch(css, /\.home-v4-architecture:has\(\.motion-program-book\[data-state='open'\]\)\s*\{\s*background:/)
  assert.match(css, /\.motion-program-book\[data-state='open'\][\s\S]*?height:\s*63%/)
})
