import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('translated tab labels force the sliding indicator to remeasure', async () => {
  const source = await readFile(new URL('./AnimatedSectionTabs.tsx', import.meta.url), 'utf8')
  assert.match(source, /tabLabelSignature\s*=\s*tabs\.map/)
  assert.match(source, /useLayoutEffect\([\s\S]*?tabLabelSignature[\s\S]*?\)/)
  assert.match(source, /resizeObserver\?\.observe\(activeTab\)/)
})
