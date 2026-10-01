import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

const vite = await createServer({ configFile: false, appType: 'custom', cacheDir: 'node_modules/.vite-sample-language-test', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const load = path => vite.ssrLoadModule(`/src/${path}`)
const model = await load('features/sample-language/sampleLanguageModel.ts')
const { englishEntries, translateEnglish: t } = await load('features/sample-language/englishRegistry.ts')
const { sampleEnglishDocuments } = await load('features/sample-language/sampleEnglishDocuments.ts')
const { sampleEnglishDefinitions, sampleEnglishPreviewPath } = await load('features/sample-language/sampleEnglishEditor.ts')
const { siteCopyDefinitions } = await load('content/siteCopyCatalog.ts')
const { emptySiteEditorDocument, validateSiteEditorDocument, resolveEditorCopy } = await load('lib/siteEditorModel.ts')
const { mapHomeContentCopy, resolveHomeEditorContent } = await load('lib/homeEditorOverrides.ts')
const { getSiteEditorPage, getPreviewNavigationTarget, getPreviewPageIntent, isSiteEditorPreview } = await load('lib/siteEditorPreview.ts')
const { SampleLanguageContext } = await load('features/sample-language/useSampleLanguage.ts')
const { SiteEditorContext } = await load('components/site-editor/useSiteEditor.ts')
const { SampleLanguageSwitch } = await load('features/sample-language/SampleLanguageSwitch.tsx')
const { SiteCopy } = await load('components/site-editor/SiteCopy.tsx')
const { HomeDisplayTitleText } = await load('components/home/HomeDisplayTitleText.tsx')
const source = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
const nonce = '11111111-1111-4111-8111-111111111111'
const context = (language = 'en') => ({ enabled: true, language, setLanguage() {}, translate: language === 'en' ? t : value => value,
  translateData: value => model.translateDisplayData(value, t), translateHome: value => value, href: href => model.sampleLanguageHref(href, language) })
const render = (child, language = 'en') => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SampleLanguageContext, { value: context(language) }, child)))

test('published Spirit heading variants stay entirely English when Korean CMS wording changes', () => {
  assert.equal(t('음악을', 'spirit.faithSection.text1'), 'Our approach')
  assert.equal(t(' 대하는 태도가', 'spirit.faithSection.text2'), ' to music ')
  assert.equal(t('함께 만들어 갈', 'spirit.closingCta.text1'), 'Join')
  assert.equal(t('참여해 주세요.', 'spirit.closingCta.text4'), 'with us.')
  assert.equal(t('서로 다른 ', 'spirit.motetMeaning.text2'), 'Different ')
  assert.equal(t('하나의 음악을', 'spirit.motetMeaning.text5'), 'one piece of music')
  assert.equal(t('합창을 통해 경험하는', 'spirit.educationSection.text1'), 'Through choral singing:')
})

test('English CMS preview uses the promoted public route, not the old sample route', () => {
  assert.equal(sampleEnglishPreviewPath('/spirit'), '/spirit?lang=en')
})

test('Korean and English CMS canvases retain their own language across section and route links', () => {
  assert.equal(model.editorLanguageHref('/spirit?lang=en#spirit-overview', 'ko'), '/spirit?lang=ko#spirit-overview')
  assert.equal(model.editorLanguageHref('/sample/about?section=conductor&lang=ko', 'en'), '/about?section=conductor&lang=en')
  assert.equal(model.editorLanguageHref('/contact?section=support#support', 'ko'), '/contact?section=support&lang=ko#support')
})

test('English Join secondary action names dates and steps within a compact button', () => {
  const label = t('모집 일정·절차 확인')
  assert.match(label, /dates/i)
  assert.match(label, /steps/i)
  assert.ok(Array.from(label).length <= 24, label)
})

test('home About English title and body keep complete thoughts on each intended line', () => {
  assert.equal(
    t('함께 빚어가는 화음,\n다음 세대의 노래'),
    'Harmony made together,\na song for the next generation.',
  )
  const first = t('서로 듣고 하나의 음악을 만들며\n음악성과 인성, 공동체의 가치를 배웁니다.')
  const second = t('함께 살아갈 줄 아는 다음 세대를 키웁니다.')
  assert.equal(first, 'We listen and sing together, building musicianship, character and community.')
  assert.equal(second, 'We help the next generation learn to live and grow together.')
  assert.ok(first.length < 90)
  assert.ok(second.length < 90)
})

test('high-visibility English sample headings use short, complete phrases', () => {
  const score = t('서로 다른 목소리가 만나\n하나의 음악을 완성합니다.')
  assert.equal(score, 'Different voices meet,\none song takes shape.')
  assert.ok(score.split('\n').every(line => line.length <= 26))
  const orbit = t('함께 듣고 노래하며,\n작품의 깊이와\n공동체의 가치를\n다음 세대에 이어갑니다.')
  assert.equal(orbit, 'We listen and sing.\nWe share music’s depth\nand a sense of community\nwith the next generation.')
  assert.ok(orbit.split('\n').every(line => line.length <= 27))
  assert.equal(t('합창음악의 위대한 힘으로,'), 'Through choral music,')
  assert.equal(t('사람과 사회를 세웁니다.'), 'people and communities grow.')
  assert.equal(t('교회음악의 바른 이상을'), 'Church music’s ideals')
  assert.equal(t('모테트라는 이름에는\n정통 합창음악의 뿌리가 담겨 있습니다.'),
    'Motet reflects the roots\nof classical choral music.')
  assert.doesNotMatch(t('후원은 청소년 합창교육과 공연 활동을 지원합니다'), /\n/)
})

test('list and contact descriptions let English wrap naturally instead of keeping Korean line breaks', () => {
  for (const sourceText of [
    '입단 안내부터 공연 소식까지,\n서울모테트청소년합창단의 공식 소식을 전합니다.',
    '공연과 연습, 함께한 순간들을\n사진과 영상으로 만나보세요.',
    '후원과 공연 의뢰,\n합창단에 전하고 싶은 이야기를 기다립니다.',
    '후원, 공연 의뢰, 일반 문의를 남겨 주세요.\n담당자가 확인한 뒤 입력하신 이메일로 답변드립니다.',
    '후원은 청소년 합창교육과\n공연 활동을 지원합니다.',
  ]) assert.doesNotMatch(t(sourceText), /\n/, sourceText)
  assert.equal(t('노래를 잘하는 아이보다\n함께 듣고 성장할 준비가 된 아이를 기다립니다.'),
    'You don’t need a polished voice.\nCome ready to listen and grow.')
})

test('long English prose never inherits a forced mid-sentence Korean break', () => {
  for (const sourceText of [
    '혼자 부르면 소리입니다. 함께 들으면 화음이 됩니다.\n서로를 들을 때, 공동체가 됩니다.',
    '합창은 발성, 악보 읽기,\n협업 태도를 함께 배우는 교육입니다.',
    '지휘자는 소리를 맞추는 사람이 아니라,\n공동체가 하나의 방향을 바라보게 하는 교육자입니다.',
    '반주자는 노래의 뒤에 머무는 사람이 아니라,\n청소년의 호흡과 성장을 함께 지지하는 동행자입니다.',
    '정직한 음악을 함께 부르고,\n그 울림을 다음 세대에 전합니다.',
    '보호자 연락으로 일정 안내\n사진·개인정보 동의는 별도',
    '합창 경험이 많지 않아도 괜찮습니다.\n함께 배우려는 마음이면 충분합니다.\n발성과 음역에 맞는 파트와 과정을 안내합니다.',
    '공연과 음악적 만남 속에서 배우고 성장합니다.\n함께 만든 시간과 음악을 만나보세요.',
    '포스터를 누르면 원본을 크게 볼 수 있습니다.\n모집 및 공연 안내를 확인해 보세요.',
    '현재 공개된 후원사 정보가 없습니다.\n후원사 정보는 공개 동의된 내용만 소개합니다.',
    '후원 문의가 접수되었습니다.\n담당자가 확인 후 입력하신 이메일로 안내드리겠습니다.',
    '문의가 접수되었습니다.\n담당자가 확인 후 입력하신 이메일로 답변을 보내드립니다.',
  ]) assert.doesNotMatch(t(sourceText), /\n/, sourceText)
})

test('unpublished Spirit copybook phrases also flow naturally if their exact source appears later', () => {
  for (const sourceText of [
    '전통을 배우고 부르는 데서 나아가\n오늘의 청소년이 삶으로 이어가도록 합니다.',
    '혼자 부르면 한 사람의 소리입니다.\n서로 듣고 맞추면 화음이 됩니다.\n함께 책임질 때 공동체가 됩니다.',
    '입단은 함께 배우고 노래하며 성장하는 시작입니다.\n후원은 청소년의 배움과 성장을 오래 이어 가는 동행입니다.',
  ]) assert.doesNotMatch(t(sourceText), /\n/, sourceText)
})

test('the English copybook has no long forced line except an intentional paragraph break', () => {
  const awkward = englishEntries.filter(entry => !entry.target.includes('\n\n') &&
    entry.target.split('\n').length > 1 && entry.target.split('\n').some(line => line.length > 32))
  assert.deepEqual(awkward.map(entry => entry.source), [])
})

test('01 — original routes ignore language parameters and remembered English', () => {
  for (const path of ['/', '/spirit', '/about', '/join', '/contact', '/admin/editor', '/sample-other']) {
    assert.equal(model.resolveSampleLanguage(path, '?lang=en', 'en'), 'ko')
  }
})
test('02 — only sample visitor paths activate; CMS remains excluded', () => {
  for (const path of ['/sample', '/sample/', '/sample/spirit', '/sample/concerts/abc']) assert.equal(model.resolveSampleLanguage(path, '?lang=en'), 'en')
  for (const path of ['/sample/admin', '/sample/admin/editor']) assert.equal(model.resolveSampleLanguage(path, '?lang=en', 'en'), 'ko')
})
test('03 — Korean default, explicit URL wins, malformed language falls back safely', () => {
  assert.equal(model.resolveSampleLanguage('/sample/', ''), 'ko')
  assert.equal(model.resolveSampleLanguage('/sample/', '?lang=ko', 'en'), 'ko')
  assert.equal(model.resolveSampleLanguage('/sample/', '?lang=en', 'ko'), 'en')
  for (const value of ['EN', '', 'ja', '<script>']) assert.equal(model.resolveSampleLanguage('/sample/', `?lang=${encodeURIComponent(value)}`, 'en'), 'ko')
})
test('04 — remembered preference is sample-only; unknown storage values are rejected', () => {
  assert.equal(model.resolveSampleLanguage('/sample/', '', 'en'), 'en')
  for (const value of [undefined, null, {}, 'de', true]) assert.equal(model.resolveSampleLanguage('/sample/', '', value), 'ko')
})
test('05 — switch keeps search filters, sections and anchors', () => {
  const next = model.languageLocation({ pathname: '/gallery', search: '?tab=photos&category=practice', hash: '#archive' }, 'en')
  assert.equal(next, '/gallery?tab=photos&category=practice&lang=en#archive')
  assert.equal(model.languageLocation({ pathname: '/join', search: '?lang=en&section=contact', hash: '#application' }, 'ko'), '/join?lang=ko&section=contact#application')
})
test('06 — back and forward URL snapshots resolve independently', () => {
  assert.deepEqual(['?lang=ko', '?lang=en', '?lang=ko', '?lang=en'].map(search => model.resolveSampleLanguage('/sample/', search, 'en')), ['ko', 'en', 'ko', 'en'])
})
test('07 — locale switch does not remount page tree or change form/record identities', async () => {
  const provider = await readFile(new URL('./SampleLanguageProvider.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(provider, /key=\{(?:language|preference)/)
  assert.match(provider, /preventScrollReset: true/)
  const record = { id: 'id', title: '공연', category: '공연', part: '소프라노', image_url: '/한글.png', date: '2026-09-19', phone: '010-1234-1234', is_visible: true }
  const next = model.translateDisplayData(record, t)
  assert.notEqual(next.title, record.title)
  for (const key of Object.keys(record).filter(key => key !== 'title')) assert.equal(next[key], record[key])
  assert.equal(record.title, '공연')
  const links = { primary_cta_href: '/join?ref=모집', secondary_cta_href: '/spirit', button_href: '#이동', published_date: '2026-09-19', extra_link: '/join?ref=모집' }
  assert.equal(model.translateDisplayData(links, () => 'Must never replace this structural value'), links)
})
test('08 — all native sample links stay in sample; external and CMS links stay intact', () => {
  assert.equal(model.sampleLanguageHref('/join?section=contact#application', 'en'), '/sample/join?section=contact&lang=en#application')
  assert.equal(model.sampleLanguageHref('/sample/spirit', 'ko'), '/sample/spirit?lang=ko')
  for (const href of ['https://example.com', '//example.com', 'mailto:a@b.test', 'tel:123', '/admin/editor', '#same']) assert.equal(model.sampleLanguageHref(href, 'en'), href)
})
test('09 — compact language trigger exposes a label and expanded state', () => {
  const html = render(createElement(SampleLanguageSwitch))
  assert.match(html, /aria-expanded="false"/)
  assert.match(html, /aria-label="Language: English"/)
  assert.match(html, /ENG/)
  assert.equal(renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SampleLanguageSwitch))), '')
})
test('10 — source match prevents stale and contextually wrong translations', () => {
  assert.equal(t('새로운 미번역 공지 123'), '새로운 미번역 공지 123')
  assert.equal(t('지금 바뀐 제목', 'home.current.about.title'), '지금 바뀐 제목')
  assert.equal(t('선택', 'contact.optional'), 'Optional')
  assert.notEqual(t('선택'), 'Optional')
  const translate = model.createTranslationLookup([{ source: '첫', target: 'The ' }, { source: '둘', target: 'next word' }])
  assert.equal(translate('첫') + translate('둘'), 'The next word')
})
test('11 — home device copy translation preserves object geometry, identity and source', () => {
  for (const device of ['mobile', 'tablet', 'desktop']) {
    const original = resolveHomeEditorContent({}, {}, device)
    const snapshot = structuredClone(original)
    const translated = mapHomeContentCopy(original, device, (_key, sourceKey, value) => t(value, sourceKey))
    assert.notEqual(translated.joinLetter.ctaLabel, original.joinLetter.ctaLabel)
    assert.deepEqual(original, snapshot)
    assert.equal(translated.heroSupplement.ctaHref, original.heroSupplement.ctaHref)
    assert.deepEqual(translated.quickActions.items.map(item => [item.id, item.href, item.displayOrder]), original.quickActions.items.map(item => [item.id, item.href, item.displayOrder]))
    assert.equal(translated.scoreBook.leftPage.titleLines.length, original.scoreBook.leftPage.titleLines.length)
  }
})
test('12 — original title accents keep their DOM and translated accents retain roles', () => {
  const ko = createElement(HomeDisplayTitleText, { text: '함께 노래', sourceKey: 'home.current.about.title', accents: [{ role: 'emphasis', term: '노래' }] })
  assert.equal(render(ko, 'ko'), '함께 <span class="home-type-accent home-type-accent--emphasis">노래</span>')
  const en = createElement(HomeDisplayTitleText, { text: 'A song', sourceKey: 'home.current.about.title', accents: [{ role: 'emphasis', term: '노래' }] })
  assert.equal(render(en), 'A <span class="home-type-accent home-type-accent--emphasis">song</span>')
  const headline = createElement(HomeDisplayTitleText, { text: 'Harmony made together,', sourceKey: 'home.current.about.title', accents: [
    { role: 'quiet', term: '함께 빚어가는' }, { role: 'emphasis', term: '화음' },
  ] })
  assert.match(render(headline), /home-type-accent--emphasis">Harmony<\/span>/)
})
test('13 — English CMS inherits page appearance but never Korean copy or text movement', () => {
  const ko = { ...emptySiteEditorDocument(), copy: { title: '원본' }, appearance: { desktop: { h1Size: 55 } }, textLayouts: { desktop: { title: { width: 90 } } }, textStyles: { shared: { title: { text: '원본', runs: [{ start: 0, end: 1, style: { fontSize: 70 } }] } } } }
  const en = { ...emptySiteEditorDocument(), copy: { title: 'English' }, appearance: { desktop: { h1Size: 50 } } }
  const result = sampleEnglishDocuments({ home: ko }, { home: en })
  assert.equal(result.home.copy.title, 'English')
  assert.equal(result.home.appearance.desktop.h1Size, 50)
  assert.equal(result.home.textLayouts?.desktop?.title, undefined)
  assert.equal(result.home.textStyles, undefined)
  assert.equal(ko.copy.title, '원본')
  assert.equal(validateSiteEditorDocument(result.home), null)
})
test('13b — an added Korean text box never appears or changes in the English workspace', () => {
  const ko = { ...emptySiteEditorDocument(), copy: { 'home.box.fixture.text': '한글 전용 문구', 'home.box.fixture.anchor': 'home-responsive-about' } }
  const result = sampleEnglishDocuments({ home: ko }, { home: emptySiteEditorDocument() })
  assert.deepEqual(result.home.copy, {})
})
test('14 — English override resolves independently for each page/device', () => {
  const en = { home: { ...emptySiteEditorDocument(), copy: { title: 'Shared' }, deviceCopy: { mobile: { title: 'Mobile' } } } }
  assert.equal(resolveEditorCopy(en, 'home', 'title', 'Fallback', 'mobile'), 'Mobile')
  assert.equal(resolveEditorCopy(en, 'home', 'title', 'Fallback', 'desktop'), 'Shared')
  assert.equal(resolveEditorCopy(en, 'spirit', 'title', 'Fallback', 'desktop'), 'Fallback')
})
test('15 — sample preview protocol accepts visitor routes, never CMS/external or mismatched pages', () => {
  assert.equal(getSiteEditorPage('/sample/about', '?section=accompanist'), 'accompanist')
  assert.equal(getSiteEditorPage('/sample/admin/editor'), null)
  assert.equal(isSiteEditorPreview({ pathname: '/sample/join', search: `?lang=en&site-editor-preview=${nonce}`, isEmbedded: true }), true)
  assert.equal(getPreviewNavigationTarget('https://evil.test/sample/join', 'https://site.test/sample/join', nonce, 'join'), null)
  const base = `https://site.test/sample/join?lang=en&site-editor-preview=${nonce}`
  assert.equal(getPreviewNavigationTarget('/join?section=contact#application', base, nonce, 'join'), `/sample/join?section=contact&lang=en&site-editor-preview=${nonce}#application`)
  assert.deepEqual(getPreviewPageIntent('/sample/gallery?tab=videos&lang=en', base), { page: 'gallery', path: '/gallery?tab=videos&lang=en' })
  assert.equal(sampleEnglishPreviewPath('/contact?section=support#support'), '/contact?section=support&lang=en#support')
})
test('16 — missing translations are labelled Korean without affecting original markup', () => {
  const child = createElement(SiteCopy, { page: 'notices', id: 'notices.new', fallback: '새로운 원문' })
  assert.equal(render(child), '<smyc-copy lang="ko">새로운 원문</smyc-copy>')
  assert.equal(render(child, 'ko'), '새로운 원문')
  const overridden = createElement(SiteEditorContext, { value: { copy: () => 'Edited English', documents: {}, device: 'desktop', isPreview: false } }, child)
  assert.equal(render(overridden), 'Edited English')
})
test('17 — every current Korean catalogue default has a reviewed matching translation', () => {
  const fields = siteCopyDefinitions.filter(field => (!field.inputType || ['text', 'textarea'].includes(field.inputType)) && /[가-힣]/.test(field.defaultValue))
  const missing = fields.filter(field => t(field.defaultValue, field.sourceKey ?? field.key) === field.defaultValue)
  assert.deepEqual(missing.map(field => [field.page, field.key, field.defaultValue]), [])
  assert.ok(fields.length >= 1000)
  const duplicateKeys = sampleEnglishDefinitions.map(field => field.key).filter((key, index, all) => all.indexOf(key) !== index)
  assert.deepEqual(duplicateKeys, [])
  for (const entry of englishEntries) {
    assert.ok(entry.target.trim())
    assert.deepEqual(entry.target.match(/\{[a-zA-Z_]+\}/g) ?? [], entry.source.match(/\{[a-zA-Z_]+\}/g) ?? [])
  }
})
test('18 — text controls keep minimum touch targets and no original global CSS overrides', async () => {
  const css = await readFile(new URL('./sample-language.css', import.meta.url), 'utf8')
  assert.doesNotMatch(css, /min-width:\s*(?:[1-3]\d|4[0-3])px/)
  assert.match(css, /min-height: 44px/)
  assert.match(css, /html\[data-sample-language='en'\]/)
  assert.doesNotMatch(css, /(?:^|\n)(?:\.public-shell|body|:root)\s/)
  assert.doesNotMatch(css, /white-space:\s*nowrap|text-overflow:\s*ellipsis/)
})
test('19 — English CMS baseline does not expose structural editing or collide with content identity', () => {
  assert.ok(sampleEnglishDefinitions.every(field => !field.inputType || ['text', 'textarea'].includes(field.inputType)))
  assert.equal(model.sampleContentKey('same  copy'), model.sampleContentKey('same copy'))
  assert.notEqual(model.sampleContentKey('new copy'), model.sampleContentKey('old copy'))
  assert.match(model.sampleContentKey('원문'), /^sample\.content\.[a-f0-9]{16}$/)
})
test('20 — original route shares the language provider while admin and publication endpoints stay separate', async () => {
  const app = await source('App.tsx')
  assert.match(app, /<SampleLanguageProvider isSample=\{isColorSample\}>/)
  assert.doesNotMatch(app, /import .*englishRegistry/)
  const provider = await source('components/site-editor/SiteEditorProvider.tsx')
  assert.match(provider, /if \(!isEnglish \|\| !page\) return/)
  assert.match(provider, /loadPublicSampleEnglishEditorPages/)
  assert.match(provider, /sample-english-published/)
  assert.match(provider, /!isEnglish && hasPreview/)
})
