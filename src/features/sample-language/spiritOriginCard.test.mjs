import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('English spirit origin card grows with translated or CMS-edited copy', async () => {
  const css = await readFile(new URL('./sample-english-layout.css', import.meta.url), 'utf8')
  const originCard = css.match(/html\[data-sample-language='en'\] \.public-shell \.spirit-heritage__origin-card\s*\{([^}]*)\}/)?.[1]

  assert.ok(originCard, 'English origin card requires a language-scoped rule')
  assert.match(originCard, /height:\s*auto/)
  assert.match(originCard, /min-height:\s*78px/)
  assert.match(originCard, /grid-template-columns:\s*auto minmax\(0,\s*1fr\)/)
})
