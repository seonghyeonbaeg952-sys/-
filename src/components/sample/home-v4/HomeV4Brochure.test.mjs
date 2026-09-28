import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('./HomeV4PerformanceCarousel.tsx', import.meta.url), 'utf8')
const css = await readFile(new URL('./HomeV4PerformanceCarousel.css', import.meta.url), 'utf8')
const englishCss = await readFile(new URL('../../../features/sample-language/sample-english-layout.css', import.meta.url), 'utf8')

test('opened three-panel brochure has distinct note, programme and guide content in both languages', () => {
  const interior = component.slice(component.indexOf('className="motion-program-spread'), component.indexOf('</div>\n      </div>\n    </div>', component.indexOf('className="motion-program-spread')))
  assert.match(interior, /motion-program-note-title/)
  assert.match(interior, /motion-program-repertoire/)
  assert.match(interior, /motion-program-guide-copy/)
  assert.match(interior, /motion-program-folio/g)
  assert.match(interior, /english \? 'Programme notes'/)
  assert.match(interior, /english \? '관람 안내'|english \? 'Visitor guide'/)
  assert.doesNotMatch(interior.match(/motion-program-panel-left[\s\S]*?motion-program-panel-center/)?.[0] ?? '', /<h4><ConcertTitle title=\{concert\.title\}/)
})

test('brochure paper treatment is shared by Korean and English and long CMS notes stay reachable', () => {
  assert.match(css, /\.motion-program-panel\s*\{[\s\S]*?overflow-y:\s*auto/)
  assert.match(css, /\.motion-program-folio\s*\{/)
  assert.doesNotMatch(englishCss, /html\[data-sample-language='en'\][^\n]*\.home-v4-current-program \.motion-program-panel/)
})
