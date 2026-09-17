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

test('rich-copy adapters preserve the original child expression, elements and line-break component', () => {
  const original = 'function A() { return <section><h1>{t("title")}</h1><p><CopyLines text={t("description")} /></p><b>{ready ? t("yes") : t("no")}</b></section> }'
  const adapted = 'function A() { return <section><h1>{<FormattedCopy page="notices" id="notices.title" text={t("title")}>{t("title")}</FormattedCopy>}</h1><p><FormattedCopy page="notices" id="notices.description" text={t("description")} lineBreaks><CopyLines text={t("description")} /></FormattedCopy></p><b>{ready ? <FormattedCopy page="notices" id="notices.yes" text={t("yes")}>{t("yes")}</FormattedCopy> : t("no")}</b></section> }'
  const expected = publicMarkupFingerprint(original, 'example.tsx')
  assert.equal(publicMarkupFingerprint(adapted, 'example.tsx'), expected)
  assert.notEqual(publicMarkupFingerprint(adapted.replace('<CopyLines text={t("description")} />', '<i>{t("description")}</i>'), 'example.tsx'), expected)
  assert.notEqual(publicMarkupFingerprint(adapted.replace('>{t("title")}</FormattedCopy>', '>{t("other")}</FormattedCopy>'), 'example.tsx'), expected)
})

test('home copy adapters and unused range metadata preserve default JSX while keeping real style changes detectable', () => {
  const original = 'function A() { return <section><h1>{title}</h1>{lines.map((line) => <HomeDisplayTitleText accents={accents} text={line} />)}<CollectivePortrait summary={summary} /></section> }'
  const adapted = 'function A() { return <section><h1><HomeCopy sourceKey="home.title" text={title} /></h1>{lines.map((line, index) => <HomeDisplayTitleText accents={accents} text={line} sourceKey="home.title" fullText={title} offset={offsets[index]} />)}<CollectivePortrait summary={summary} sourceParagraphs={paragraphs} /></section> }'
  const expected = publicMarkupFingerprint(original, 'example.tsx')
  assert.equal(publicMarkupFingerprint(adapted, 'example.tsx'), expected)
  assert.notEqual(publicMarkupFingerprint(adapted.replace('accents={accents}', 'accents={otherAccents}'), 'example.tsx'), expected)
  assert.notEqual(publicMarkupFingerprint(adapted.replace('text={line}', 'text={otherLine}'), 'example.tsx'), expected)
  assert.notEqual(publicMarkupFingerprint(adapted.replace('summary={summary}', 'summary={otherSummary}'), 'example.tsx'), expected)
})

test('explicit navigation label identities and footer source metadata preserve default children without masking link changes', () => {
  const original = 'function A() { return <nav><a href={link.href}>{copy("common", navigationCopyKey(link.href), link.label)}</a><FooterLinkGroup title={title} links={links} /></nav> }'
  const adapted = 'function A() { return <nav><a href={link.href}>{copy("common", navigationLabelKey(link.href, link.label), link.label)}</a><FooterLinkGroup title={title} links={links} titleCopyKey="common.footer.explore" /></nav> }'
  const expected = publicMarkupFingerprint(original, 'example.tsx')
  assert.equal(publicMarkupFingerprint(adapted, 'example.tsx'), expected)
  assert.notEqual(publicMarkupFingerprint(adapted.replace('href={link.href}', 'href="/other"'), 'example.tsx'), expected)
  assert.notEqual(publicMarkupFingerprint(adapted.replace(', link.label)}</a>', ', otherLabel)}</a>'), 'example.tsx'), expected)
})

test('public render dependency graph does not eagerly include the CMS catalogue or admin layout', () => {
  assert.equal(seen.has('src/content/siteCopyCatalog.ts'), false, 'Visitors do not need the editor catalogue')
  const app = ts.createSourceFile('App.tsx', readFileSync('src/App.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const adminImports = app.statements.filter(ts.isImportDeclaration).filter(node => node.moduleSpecifier.text.includes('/admin/'))
  assert.equal(adminImports.length, 0, 'CMS routes must cross a lazy boundary')
})
