import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('support navigation preserves the selected language on every internal link and redirect', async () => {
  const source = await readFile(new URL('./ContactPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /navigation\.map\(item => <TransitionLink/)
  assert.match(source, /contact-atelier__back[^>]*to=/)
  assert.doesNotMatch(source, /<Link\b/)
  assert.match(source, /<Navigate replace to=\{routeLanguageHref\(/)
})
