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
test('only the four functional language-choice identities are fixed source exceptions', () => {
  const file = 'src/features/sample-language/SampleLanguageSwitch.tsx'
  for (const candidate of [
    { kind: 'text', value: '한국어' }, { kind: 'text', value: 'English' },
    { kind: 'text', value: 'KOR' }, { kind: 'text', value: 'ENG' },
  ]) assert.ok(exclusion(file, candidate))
  assert.equal(exclusion(file, { kind: 'text', value: 'New unchecked label' }), null)
  assert.equal(exclusion(file, { kind: 'attribute', attribute: 'title', value: 'English' }), null)
  assert.equal(exclusion('src/components/layout/Footer.tsx', { kind: 'text', value: 'EN' }), null)
})

test('verified sample language adapters retain the original JSX branch and expose original text, class and link mutations', () => {
  const original = 'function A(){return <section className="same"><p>{title}</p><a href="/join?section=contact#application">{count}개</a></section>}'
  const adapted = `import { useSampleLanguage } from '../features/sample-language/useSampleLanguage';
    import { workflowTextLanguage } from '../common/workflowCopy';
    function A(){const {enabled, language, translate, href: sampleHref}=useSampleLanguage(); const english=enabled && language === 'en';
    return <section className="same"><p lang={workflowTextLanguage(title, english)}>{translate(title)}</p><a href={sampleHref('/join?section=contact#application')}>{english ? 'English count' : <>{count}개</>}</a></section>}`
  const expected = publicMarkupFingerprint(original, 'fixture.tsx')
  assert.equal(publicMarkupFingerprint(adapted, 'fixture.tsx'), expected)
  for (const changed of [adapted.replace('translate(title)', 'translate(otherTitle)'), adapted.replace('className="same"', 'className="changed"'), adapted.replace('/join?section=contact#application', '/contact'), adapted.replace('{count}개', '{count}명')]) {
    assert.notEqual(publicMarkupFingerprint(changed, 'fixture.tsx'), expected)
  }
  assert.notEqual(publicMarkupFingerprint(adapted.replace("enabled && language === 'en'", "!enabled || language === 'en'"), 'fixture.tsx'), expected)
})

test('source-bound workflow templates retain interpolated values and the original date result', () => {
  const original = 'function A(){return <p title={`${record.title} 포스터`}>{dateLabel}</p>}'
  const adapted = `import { useSampleLanguage } from '../features/sample-language/useSampleLanguage';
    import { workflowCopy, workflowDate } from '../common/workflowCopy';
    function A(){const {enabled, language, translate}=useSampleLanguage(); const english=enabled && language === 'en';
    return <p title={workflowCopy(translate, '{title} 포스터', {title: record.title})}>{workflowDate(record.date, dateLabel, english)}</p>}`
  const expected = publicMarkupFingerprint(original, 'fixture.tsx')
  assert.equal(publicMarkupFingerprint(adapted, 'fixture.tsx'), expected)
  for (const changed of [adapted.replace('{title} 포스터', '{title} 사진'), adapted.replace('record.title}', 'record.other}'), adapted.replace('dateLabel, english', 'otherDate, english')]) {
    assert.notEqual(publicMarkupFingerprint(changed, 'fixture.tsx'), expected)
  }
  assert.notEqual(publicMarkupFingerprint(adapted.replace('useSampleLanguage()', 'someOtherHook()'), 'fixture.tsx'), expected)
})

test('the sample switch is absent from the original branch only when imported from its verified module', () => {
  const original = 'function A(){return <header><a href="/">Home</a><button>Join</button></header>}'
  const adapted = `import { SampleLanguageSwitch } from '../features/sample-language/SampleLanguageSwitch';
    function A(){return <header><a href="/">Home</a><SampleLanguageSwitch/><button>Join</button></header>}`
  const expected = publicMarkupFingerprint(original, 'fixture.tsx')
  assert.equal(publicMarkupFingerprint(adapted, 'fixture.tsx'), expected)
  assert.notEqual(publicMarkupFingerprint(adapted.replace('/sample-language/SampleLanguageSwitch', '/other/SampleLanguageSwitch'), 'fixture.tsx'), expected)
  assert.notEqual(publicMarkupFingerprint(adapted.replace('<SampleLanguageSwitch/>', '<SampleLanguageSwitch enabled/>'), 'fixture.tsx'), expected)
})

test('sample adapter audit does not erase a shadowed or reassigned translator', () => {
  const original = 'function A(){return items.map(translate => <p>{translate(title)}</p>)}'
  const hook = "import {useSampleLanguage} from '../features/sample-language/useSampleLanguage';"
  const captured = hook + 'function A(){const {translate}=useSampleLanguage();return items.map(translate => <p>{translate(title)}</p>)}'
  assert.equal(publicMarkupFingerprint(captured, 'fixture.tsx'), publicMarkupFingerprint(original, 'fixture.tsx'))
  const reassigned = hook + 'function A(){let {translate}=useSampleLanguage();translate=otherTranslator;return <p>{translate(title)}</p>}'
  assert.notEqual(publicMarkupFingerprint(reassigned, 'fixture.tsx'), publicMarkupFingerprint('function A(){return <p>{title}</p>}', 'fixture.tsx'))
})

test('the approved Reveal identity repair does not ignore list keys, artwork or other reveal props', () => {
  const file = 'src/components/home/FloatingInfoCards.tsx'
  const original = "import {Reveal} from '../common/Reveal'; function A(){return <div><li key={card.id}>{card.title}</li><Reveal key={card.title} variant=\"card-rise\"><img src=\"/art.svg\"/></Reveal></div>}"
  const adapted = original.replace('Reveal key={card.title}', 'Reveal key={card.id}')
  const expected = publicMarkupFingerprint(original, file)
  assert.equal(publicMarkupFingerprint(adapted, file), expected)
  for (const changed of [adapted.replace('li key={card.id}', 'li key={card.title}'), adapted.replace('variant="card-rise"', 'variant="changed"'), adapted.replace('/art.svg', '/other.svg'), adapted.replace('Reveal key={card.id}', 'Reveal key={card.other}')]) {
    assert.notEqual(publicMarkupFingerprint(changed, file), expected)
  }
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

test('the managed-photo boundary preserves intrinsic img markup while still detecting artwork and layout changes', () => {
  const original = 'function A(){return <img alt="Choir" className="portrait" src="/images/choir.webp" width={600}/> }'
  const managed = `import {SiteImage} from '../features/site-photos/SiteImage'; function A(){return <SiteImage alt="Choir" className="portrait" src="/images/choir.webp" width={600}/> }`
  const expected = publicMarkupFingerprint(original, 'fixture.tsx')
  assert.equal(publicMarkupFingerprint(managed, 'fixture.tsx'), expected)
  for (const change of [managed.replace('/images/choir.webp', '/images/other.webp'), managed.replace('portrait', 'changed'), managed.replace('width={600}', 'width={400}'), managed.replace('/site-photos/SiteImage', '/other/SiteImage')]) {
    assert.notEqual(publicMarkupFingerprint(change, 'fixture.tsx'), expected)
  }
})

test('explicit editorial source adapters preserve expression fallbacks without masking real public changes', () => {
  const original = 'function A() { return <p className="body">{value.body}</p> }'
  const adapted = 'function A() { return <p className="body"><SiteCopy page="spirit" id={`spirit.content.values.${index}.description`} fallback={value.body} /></p> }'
  const hash = publicMarkupFingerprint(original, 'fixture.tsx')
  assert.equal(publicMarkupFingerprint(adapted, 'fixture.tsx'), hash)
  assert.notEqual(publicMarkupFingerprint(adapted.replace('value.body', 'value.title'), 'fixture.tsx'), hash)
  assert.notEqual(publicMarkupFingerprint(adapted.replace('className="body"', 'className="changed"'), 'fixture.tsx'), hash)
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

test('explicit layout registration preserves native children and motion props without masking real markup changes', () => {
  const original = 'function A() { return <section><h1 id="title">One<br/>Two</h1><motion.p animate={{opacity:1}} style={{color:"red"}}>Body</motion.p></section> }'
  const adapted = 'function A() { return <section><EditableLayout id="page.title"><h1 id="title">One<br/>Two</h1></EditableLayout><EditableLayout id="page.description" nativeTag="p"><motion.p animate={{opacity:1}} style={{color:"red"}}>Body</motion.p></EditableLayout></section> }'
  const expected = publicMarkupFingerprint(original, 'fixture.tsx')
  assert.equal(publicMarkupFingerprint(adapted, 'fixture.tsx'), expected)
  for (const changed of [adapted.replace('id="title"', 'id="changed"'), adapted.replace('opacity:1', 'opacity:0'), adapted.replace('color:"red"', 'color:"blue"'), adapted.replace('One<br/>Two', 'One Two')]) {
    assert.notEqual(publicMarkupFingerprint(changed, 'fixture.tsx'), expected)
  }
})
test('image delivery quality hints do not mask changes to layout, fit, source or cropping', () => {
  const original = 'function A(){return <ImageTile src="/profile.jpg" width={640} height={800} objectFit="cover"/>}'
  const delivered = original.replace('objectFit="cover"', 'objectFit="cover" transform={{width:960,quality:100,resize:"contain"}}')
  const fingerprint = publicMarkupFingerprint(original, 'fixture.tsx')
  assert.equal(publicMarkupFingerprint(delivered, 'fixture.tsx'), fingerprint)
  for (const changed of [delivered.replace('width={640}', 'width={800}'), delivered.replace('/profile.jpg', '/other.jpg'),
    delivered.replace('objectFit="cover"', 'objectFit="contain"'), delivered.replace('resize:"contain"', 'resize:"cover"'),
    delivered.replace('quality:100', 'quality:100,height:400')]) assert.notEqual(publicMarkupFingerprint(changed, 'fixture.tsx'), fingerprint)
})
