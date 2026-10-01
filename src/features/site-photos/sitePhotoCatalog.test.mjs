import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import ts from 'typescript'
const source = await readFile(new URL('./sitePhotoCatalog.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { SITE_PHOTO_ASSETS, getSitePhotoAsset } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
test('each managed primary photo exists and legacy source aliases resolve unambiguously to its CMS slot', async () => {
  const sources = new Set()
  for (const asset of SITE_PHOTO_ASSETS) {
    await access(new URL(`../../../public${asset.sources[0]}`, import.meta.url))
    for (const src of asset.sources) {
      assert.ok(!sources.has(src), `Ambiguous managed source: ${src}`)
      sources.add(src)
      assert.equal(getSitePhotoAsset(src)?.key, asset.key)
    }
  }
})
test('current public raster images and standalone image decorations have a replacement slot', async () => {
  const root = new URL('../../../src/', import.meta.url)
  const pending = [root]
  const unknown = new Set()
  while (pending.length) {
    const dir = pending.pop()
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir)
      if (entry.isDirectory()) { if (!['admin', 'site-photos'].includes(entry.name)) pending.push(path); continue }
      if (!/\.(tsx?|css)$/.test(entry.name) || entry.name.includes('.test.')) continue
      // Demo seed artwork and administrator-only placeholder helpers are not
      // published production photos. Actual public render assets remain checked.
      if (entry.name === 'mockData.ts' || entry.name.endsWith('Fixtures.ts') || path.href.endsWith('/lib/cms.ts')) continue
      const text = await readFile(path, 'utf8')
      for (const match of text.matchAll(/['"](\/images\/[^'"\r\n]+\.(?:png|jpe?g|webp|svg|avif))['"]/g)) {
        if (!getSitePhotoAsset(match[1])) unknown.add(match[1])
      }
    }
  }
  assert.deepEqual([...unknown], [], 'Public images without a CMS replacement slot')
})
