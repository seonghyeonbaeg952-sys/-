import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (relativePath) =>
  readFile(new URL(relativePath, import.meta.url), 'utf8')

const [
  pageSource,
  headerSource,
  megaMenuSource,
  mobileMenuSource,
  flowSource,
  cssSource,
] =
  await Promise.all([
    read('./HomeV4SamplePage.tsx'),
    read('../../components/sample/home-v4/HomeV4SampleHeader.tsx'),
    read('../../components/sample/home-v4/HomeV4SampleMegaMenu.tsx'),
    read('../../components/sample/home-v4/HomeV4SampleMobileMenu.tsx'),
    read('../public/HomeSectionFlowSamplePage.tsx'),
    read('./HomeV4SamplePage.css'),
  ])

test('V4 remains a production-home mirror with an isolated sample header', () => {
  assert.match(pageSource, /<HomeV4SampleHeader \/>/)
  assert.match(
    pageSource,
    /<HomeRoute aboutPresentation="collective-portrait" \/>/,
  )
  assert.match(pageSource, /<Footer \/>/)
  assert.match(pageSource, /data-sample-mirror="production-home"/)
  assert.match(pageSource, /data-surface-rule="rectilinear"/)
  assert.match(
    cssSource,
    /--home-v4-panel-ivory: #fffefa;/,
  )
  assert.match(
    cssSource,
    /\.join-open-score \{[\s\S]*--join-ivory: var\(--home-v4-panel-ivory\);/,
  )
  assert.match(
    cssSource,
    /:is\(\[data-flow-section='about'\], \[data-flow-section='join-letter'\]\) \{[\s\S]*background-color: var\(--home-v4-panel-ivory\) !important;/,
  )
  assert.match(
    cssSource,
    /@media \(min-width: 1024px\) \{[\s\S]*\.home-flow-body \{[\s\S]*--home-hero-handoff-start: clamp\(184px, 15vw, 208px\);[\s\S]*\.home-flow-body::before \{[\s\S]*background: var\(--home-v4-panel-ivory\) !important;/,
  )
})

test('desktop mega menu supports hover, pinned click, Escape, and focus return', () => {
  assert.match(headerSource, /setDesktopMenuPinned\(true\)/)
  assert.match(headerSource, /if \(!desktopMenuPinned\) \{[\s\S]*openDesktopMenu\(item\.href\)/)
  assert.match(headerSource, /onMouseLeave=\{scheduleDesktopClose\}/)
  assert.match(headerSource, /}, 160\)/)
  assert.match(headerSource, /event\.key !== 'Escape'/)
  assert.match(headerSource, /headerRef\.current\?\.contains/)
  assert.match(
    headerSource,
    /desktopTriggerRef\.current\?\.focus\(\)/,
  )
  assert.match(headerSource, /aria-controls=\{DESKTOP_MENU_ID\}/)
  assert.match(headerSource, /aria-expanded=\{isOpen\}/)
})

test('V4 header preserves the production header density and pill CTA contract', () => {
  assert.match(headerSource, /home-v4-sample-header__bar max-w-content/)
  assert.match(headerSource, /window\.matchMedia\('\(min-width: 1024px\)'\)/)
  assert.match(headerSource, /className="home-v4-sample-header__cta"/)
  assert.match(headerSource, /href="\/sample\/join"/)
  assert.match(
    headerSource,
    /className="home-v4-sample-header__cta"[\s\S]*입단 안내/,
  )
  assert.match(cssSource, /--home-v4-menu-content: 1024px/)
  assert.match(
    cssSource,
    /\.home-v4-sample-header__bar \{[\s\S]*max-width: 1280px;[\s\S]*min-height: 72px;[\s\S]*padding-inline: 48px;/,
  )
  assert.match(
    cssSource,
    /\.home-v4-sample-header__cta \{[\s\S]*min-height: 45px;[\s\S]*border-radius: 999px;/,
  )
  assert.match(
    cssSource,
    /\.home-v4-button \{[\s\S]*border-radius: 999px;/,
  )
})

test('mobile menu fills the viewport and lets every section expand into vertical rows', () => {
  assert.match(cssSource, /height: calc\(100dvh - 72px\)/)
  assert.match(
    cssSource,
    /\.home-v4-mobile-menu__accordion \{[\s\S]*display: grid;/,
  )
  assert.match(
    cssSource,
    /\.home-v4-mobile-menu__accordion > a \{[\s\S]*display: flex;[\s\S]*min-height: 44px;/,
  )
  assert.match(mobileMenuSource, /mobileMenuSections\.map/)
  assert.match(mobileMenuSource, /expandedSectionId/)
  assert.match(mobileMenuSource, /isExpanded \? '−' : '\+'/)
  assert.match(mobileMenuSource, /aria-controls=\{accordionId\}/)
  assert.match(mobileMenuSource, /aria-expanded=\{isExpanded\}/)
  assert.match(mobileMenuSource, /label: '공연·소식'/)
  assert.match(mobileMenuSource, /label: '갤러리'/)
  assert.match(mobileMenuSource, /label: '입단 안내'/)
  assert.match(mobileMenuSource, /label: '후원·문의'/)
  assert.doesNotMatch(mobileMenuSource, /↗/)
})

test('every public navigation category can open three editorial groups', () => {
  assert.match(headerSource, /publicNavigation\.slice\(1\)\.map/)
  assert.match(headerSource, /activeDesktopMenuHref === item\.href/)
  assert.match(megaMenuSource, /item: PublicNavigationItem/)
  assert.match(megaMenuSource, /code: '01'/)
  assert.match(megaMenuSource, /code: '02'/)
  assert.match(megaMenuSource, /code: '03'/)
  assert.match(
    megaMenuSource,
    /<nav[\s\S]*aria-label=\{`\$\{item\.label\} 상세 메뉴`\}/,
  )
  assert.match(megaMenuSource, /label: '모테트 정신'/)
  assert.match(megaMenuSource, /label: '활동과 기록'/)
  assert.match(
    megaMenuSource,
    /'\/spirit': \['합창단 정신', '핵심 가치', '교육 방향'\]/,
  )
  assert.match(
    megaMenuSource,
    /'\/concerts': \['공연 안내', '일정과 기록', '공지와 소식'\]/,
  )
  assert.match(
    megaMenuSource,
    /'\/gallery': \['갤러리', '사진과 영상', '포스터 기록'\]/,
  )
  assert.match(
    megaMenuSource,
    /'\/join': \['입단 안내', '지원 준비', '절차와 문의'\]/,
  )
  assert.match(
    megaMenuSource,
    /'\/contact': \['후원·문의', '후원 안내', '문의와 위치'\]/,
  )
  assert.doesNotMatch(megaMenuSource, /label: '주요 페이지'/)
  assert.doesNotMatch(megaMenuSource, /label: '세부 안내'/)
  assert.match(megaMenuSource, /toSampleHref/)
  assert.match(megaMenuSource, /<ul>/)
  assert.doesNotMatch(megaMenuSource, /role="dialog"/)
})

test('desktop surface is full-width, cardless, rectilinear, and responsive', () => {
  const menuBlock = cssSource.slice(
    cssSource.indexOf(
      ".public-shell-home-sample-v4[data-design-candidate='home-v4'] .home-v4-mega-menu {",
    ),
    cssSource.indexOf(
      ".public-shell-home-sample-v4[data-design-candidate='home-v4'] .home-v4-mobile-menu {",
    ),
  )

  assert.match(menuBlock, /right: 0/)
  assert.match(menuBlock, /left: 0/)
  assert.match(menuBlock, /border-radius: 0/)
  assert.match(menuBlock, /box-shadow: none/)
  assert.match(menuBlock, /grid-template-columns: repeat\(3/)
  assert.doesNotMatch(menuBlock, /border-radius: [1-9]/)
  assert.match(cssSource, /grid-template-columns: repeat\(2/)
  assert.match(cssSource, /prefers-reduced-motion: reduce/)
})

test('V4 shell does not override the production wave track box model', () => {
  const rootBlock = cssSource.slice(
    cssSource.indexOf(
      ".public-shell-home-sample-v4[data-design-candidate='home-v4'] {",
    ),
    cssSource.indexOf(
      ".public-shell-home-sample-v4[data-design-candidate='home-v4'] :focus-visible",
    ),
  )

  assert.doesNotMatch(rootBlock, /overflow-x:\s*clip/)
  assert.doesNotMatch(rootBlock, /box-sizing:\s*border-box/)
  assert.doesNotMatch(
    cssSource,
    /public-shell-home-sample-v4\[data-design-candidate='home-v4'\]\s+\*/,
  )
})

test('V4 finale wave settles the spirit panel before synchronized archive travel', () => {
  assert.match(
    cssSource,
    /@media \(min-width: 1024px\) \{[\s\S]*home-flow-sample-chunk--stage[\s\S]*home-flow-sample-chunk--finale[\s\S]*data-v4-hold-state='fixed'[\s\S]*@supports \(animation-timeline: view\(\)\)/,
  )
  assert.match(pageSource, /const V4_FINALE_HOLD_TOP = 96/)
  assert.match(pageSource, /data-v4-hold-state/)
  assert.match(pageSource, /sampleHeader\.getBoundingClientRect\(\)\.bottom/)
  assert.match(pageSource, /flowRoot\.style\.setProperty/)
  assert.match(pageSource, /window\.addEventListener\('pageshow', syncRestoredScroll\)/)
  assert.match(pageSource, /window\.setTimeout\(update, 240\)/)
  assert.match(pageSource, /window\.addEventListener\('scroll', update/)
  assert.match(pageSource, /const syncRestoredScroll = \(\) => \{[\s\S]*update\(\)/)
  assert.match(pageSource, /const fixedStart = trackTop - V4_FINALE_HOLD_TOP/)
  assert.doesNotMatch(pageSource, /fixedBeforeWave/)
  assert.match(
    cssSource,
    /home-flow-sample-chunk--stage \{[\s\S]*margin-top: calc\([\s\S]*clamp\(56px, 7vh, 72px\)/,
  )
  assert.match(
    cssSource,
    /home-flow-sample-chunk--finale \{[\s\S]*margin-top: calc\([\s\S]*clamp\(100px, 13vh, 140px\)/,
  )
  assert.match(
    cssSource,
    /home-flow-sample-hold-track--full\[data-v4-hold-state='fixed'\][\s\S]*position: fixed;[\s\S]*top: 96px;/,
  )
  assert.match(
    cssSource,
    /home-flow-sample-chunk--stage[\s\S]*--home-v4-stage-overtravel: clamp\(8px, 1vh, 12px\)[\s\S]*animation: home-v4-stage-wave-rise-extended[\s\S]*animation-range: entry 0% entry 100%/,
  )
  assert.match(
    cssSource,
    /@keyframes home-v4-stage-wave-rise-extended \{[\s\S]*translate: 0 var\(--home-v4-stage-overtravel-y\)/,
  )
  assert.match(
    cssSource,
    /home-flow-sample-chunk--finale[\s\S]*home-flow-sample-chunk__content[\s\S]*animation: home-v4-wave-rise-solid[\s\S]*animation-range: entry 0% entry 100%/,
  )
  assert.match(cssSource, /@keyframes home-v4-wave-rise-solid/)
  assert.doesNotMatch(
    cssSource,
    /data-v4-(?:stage|finale)-phase='rising'/,
  )
})

test('V4 keeps the Figma-height Join panel eligible for the first wave hold', () => {
  assert.match(
    flowSource,
    /const allowTallEditorialPanel =[\s\S]*data-design-candidate='home-v4'/,
  )
  assert.match(
    flowSource,
    /isEditorialPanel &&[\s\S]*!canHoldEditorialPanel &&[\s\S]*!allowTallEditorialPanel/,
  )
})

test('V4 mobile disables both wave transitions and returns panels to normal flow', () => {
  assert.match(
    cssSource,
    /@media \(max-width: 1023px\) \{[\s\S]*timeline-scope: none;[\s\S]*:is\(\.home-flow-sample-chunk--stage, \.home-flow-sample-chunk--finale\)[\s\S]*margin-top: 0;[\s\S]*view-timeline-name: none;/,
  )
  assert.match(
    cssSource,
    /:is\(\.home-flow-sample-chunk--stage, \.home-flow-sample-chunk--finale\)[\s\S]*\.home-flow-sample-chunk__surface \{[\s\S]*animation: none;[\s\S]*translate: none;/,
  )
  assert.match(
    cssSource,
    /\.home-flow-sample-chunk__edge \{[\s\S]*display: none !important;[\s\S]*visibility: hidden;/,
  )
  assert.match(
    cssSource,
    /home-flow-sample-chunk--finale[\s\S]*home-flow-sample-chunk__content \{[\s\S]*animation: none;[\s\S]*translate: none;/,
  )
})

test('rectilinear rule targets surfaces while preserving semantic dots', () => {
  const rectilinearBlock = cssSource.slice(
    cssSource.indexOf("[data-surface-rule='rectilinear']"),
    cssSource.indexOf('@keyframes home-v4-sample-menu-in'),
  )

  assert.match(rectilinearBlock, /\.home-quick-action-card/)
  assert.match(rectilinearBlock, /\.notice-program-notes/)
  assert.match(rectilinearBlock, /\.motion-program-panel/)
  assert.match(rectilinearBlock, /\.motet-score-cover/)
  assert.match(rectilinearBlock, /\.archive-folder-front/)
  assert.match(rectilinearBlock, /\.support-letter-card/)
  assert.doesNotMatch(rectilinearBlock, /\.rounded-pill/)
  assert.doesNotMatch(rectilinearBlock, /\.archive-inline-toggle/)
  assert.doesNotMatch(rectilinearBlock, /\.join-open-score__step-dot/)
  assert.doesNotMatch(rectilinearBlock, /\.home-hero-dot/)
})
