import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { files, seen } from './public-copy-inventory.mjs'
import ts from 'typescript'
import { exclusion } from './public-copy-adapter-plan.mjs'
import { publicMarkupFingerprint } from './public-copy-contract.mjs'

test('visitor JSX labels have explicit editor adapters or a documented source exception', () => {
  const remaining = files.flatMap(({ file, candidates }) => candidates.filter(candidate => !exclusion(file, candidate)).map(candidate => `${file}:${candidate.line} ${candidate.value}`))
  assert.deepEqual(remaining, [], 'These fixed visitor strings still cannot be edited')
})
test('default-markup verification ignores explicit copy adapters but detects layout, text and link changes', () => {
  const original = 'function A() { return <h1 className="same" title="한글">Original <a href="/join">Join</a></h1> }'
  const adapted = 'function A() { return <h1 className="same" title={copyText("common","common.fixed.title","한글")}>{copyText("common","common.fixed.a","Original ")}<a href="/join">{copyText("common","common.fixed.b","Join")}</a></h1> }'
  const hash = publicMarkupFingerprint(original, 'example.tsx')
  assert.equal(publicMarkupFingerprint(adapted, 'example.tsx'), hash)
  for (const changed of [adapted.replace('className="same"', 'className="changed"'), adapted.replace('href="/join"', 'href="/other"'), adapted.replace('Original ', 'Other ')]) assert.notEqual(publicMarkupFingerprint(changed, 'example.tsx'), hash)
})
test('adding copy adapters preserves every existing JSX default in the captured source set', () => {
  const baseline = JSON.parse(readFileSync(new URL('../docs/public-copy-default-baseline.json', import.meta.url), 'utf8'))
  for (const [file, fingerprint] of Object.entries(baseline)) assert.equal(publicMarkupFingerprint(readFileSync(file, 'utf8'), file), fingerprint, file)
})

test('public render dependency graph does not eagerly include the CMS catalogue or admin layout', () => {
  assert.equal(seen.has('src/content/siteCopyCatalog.ts'), false, 'Visitors do not need the editor catalogue')
  const app = ts.createSourceFile('App.tsx', readFileSync('src/App.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const adminImports = app.statements.filter(ts.isImportDeclaration).filter(node => node.moduleSpecifier.text.includes('/admin/'))
  assert.equal(adminImports.length, 0, 'CMS routes must cross a lazy boundary')
})
