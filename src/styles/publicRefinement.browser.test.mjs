import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const browserModule = process.env.SMYC_PLAYWRIGHT_MODULE
const root = fileURLToPath(new URL('../../', import.meta.url))
const fixturePath = '/__public-surface-regression'
const handoffFixturePath = '/__home-handoff-regression'
const aboutFixturePath = '/__about-navigation-regression'
const styles = [
  '/src/styles/home-v6-fixes.css',
  '/src/styles/color-sample-theme.css',
  '/src/components/sample/home-v4/HomeV4SampleHeader.css',
  '/src/pages/sample/HomeV4SamplePage.css',
  '/src/styles/spirit-heritage.css',
  '/src/styles/about-overview.css',
  '/src/styles/accompanist-profiles.css',
  '/src/styles/concerts-page.css',
  '/src/styles/contact-page.css',
  '/src/styles/join-page.css',
  '/src/styles/home-tablet-figma.css',
  '/src/features/sample-language/sample-english-layout.css',
]

// An offline CSS fixture, not another public page or copied application state.
// Load the owning production styles; never contact Supabase or submit a form.
const fixture = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
${styles.map(href => `<link rel="stylesheet" href="${href}">`).join('\n')}
<!-- Mirror only the OptimizedImage Tailwind utility defaults; the production
     page-specific selectors must override them, as in the actual public app. -->
<style>*,*::before,*::after { box-sizing: border-box; } body { --font-sans-kr: 'Join Gothic A1', sans-serif; } .size-full { width: 100%; height: 100%; } .object-cover { object-fit: cover; }</style>
</head><body class="public-shell">
<div class="public-shell-home-sample-v4 color-sample-theme public-shell-home" data-design-candidate="home-v4" data-home-viewport="desktop">
  <div class="home-intro-real-sample" style="position:absolute;left:-10000px;width:100%"><section class="home-hero-section" style="height:100svh;min-height:0"><div class="home-hero-copy" data-intro-copy-probe></div></section><div class="home-intro-launch home-intro-launch--ready"><div class="home-intro-launch__field"></div><div class="home-intro-launch__wordmark">${['s','m','y','c'].map(letter => `<span class="home-intro-launch__word home-intro-launch__word--${letter}"><span class="home-intro-launch__tail">WORD</span></span>`).join('')}</div></div></div>
  <header class="home-v4-sample-header"><div class="home-v4-sample-header__bar"><button>메뉴 열기</button></div></header>
  <!-- The photo/scroll hero is absent in this isolated surface fixture. Give
       its following flow a visible origin without changing card sizing. -->
  <div class="home-flow-body" style="margin-top: 200px"><section class="home-quick-actions"><div class="mx-auto"><div class="home-quick-action-grid"><div class="reveal-motion">
    <a class="home-quick-action-card" href="#fixture-destination"><div class="home-quick-action-copy">
      <p class="home-quick-action-eyebrow">JOIN</p><h2>입단 안내</h2>
      <p>모집 대상, 연습 시간, 지원 절차를 확인합니다.</p>
    </div><div class="home-quick-action-link">입단 안내 보기<span>→</span></div></a>
  </div></div></div></section></div>
  <div class="route-loading-screen route-loading-screen--public"><div class="route-loading-screen__mark">SMYC</div><div class="route-loading-screen__copy">페이지 준비</div></div>
  <div class="home-hero-controls"><button class="home-hero-arrow">재생</button><button class="home-hero-arrow">다음</button></div>
</div>
<div class="spirit-heritage">
  <section class="spirit-heritage__hero"><div class="spirit-heritage__hero-veil"></div>
    <div class="spirit-heritage__hero-heading spirit-heritage__hero-heading--mobile"><p>함께 노래하며</p><p class="spirit-heritage__hero-promise"><span class="spirit-heritage__hero-promise-line">사랑과 나눔을<em>실천</em></span><span class="spirit-heritage__hero-promise-line">합니다.</span></p></div>
  </section>
  <section class="spirit-heritage__motet"><div class="spirit-heritage__motet-glass"><blockquote class="spirit-heritage__quote-card">함께 노래합니다.</blockquote></div></section>
  <div class="spirit-heritage__value-panel"></div><div class="spirit-heritage__education-panel"></div>
  <section class="spirit-heritage__closing"><div class="spirit-heritage__closing-glow" aria-hidden="true"></div><div class="spirit-heritage__closing-card"></div></section>
  <section class="spirit-heritage__community"><div class="spirit-heritage__section-shell"><div class="spirit-heritage__community-photo"><div><img class="size-full object-cover spirit-heritage__media-image" src="/images/home-v6/community-rehearsal.jpg" alt="공동체 사진 표시 검증" /></div></div></div></section>
</div>
<div class="about-overview"><div class="about-overview__spirit-stage"></div><section class="about-overview__intro"><div class="about-overview__shell about-overview__intro-stage"><figure class="about-overview__intro-figure"><div class="about-overview__intro-image"><img class="size-full object-cover about-overview__image-media" src="/images/about/smyc-europe-2018.webp" alt="단체 사진 표시 검증" /></div><figcaption class="about-overview__glass-caption"><span>SEOUL MOTET YOUTH CHOIR</span><strong>One community of voices.</strong></figcaption></figure></div></section></div>
<section class="accompanist-profile" lang="en"><div class="accompanist-profile__shell"><header class="accompanist-profile__intro"><div class="accompanist-profile__intro-copy"><h1>Accompanists</h1><p class="accompanist-profile__summary">Meet the two accompanists who work with the choir in rehearsals and performances, including their education and current work.</p></div><p class="accompanist-profile__display" aria-hidden="true">Accompanists.</p></header><div class="accompanist-profile__baseline"></div></div></section>
<div class="concerts-page"><div class="concerts-page__stage"><div class="concerts-page__stage-wash"></div><div class="concerts-page__poster-fallback"></div><a class="concerts-page__stage-link" href="#fixture-destination">Concert details</a></div></div>
<section class="contact-atelier" lang="en"><div class="contact-atelier__shell"><dl class="contact-atelier__amounts"><div><dt>Individual</dt><dd>Monthly support</dd></div><div><dt>Organisation</dt><dd>Monthly support</dd></div></dl></div></section>
<div class="join-guide"><section id="practice" class="join-guide__section">Rehearsal information</section></div>
</body></html>`

// Real scrollable containing blocks, not offscreen height probes. The following
// plane must cover the hero before its parent's sticky boundary can release it.
const handoffFixture = `<!doctype html><html><head><meta charset="utf-8">
${styles.map(href => `<link rel="stylesheet" href="${href}">`).join('\n')}
<style>html,body{margin:0;scroll-behavior:auto}*{box-sizing:border-box}</style>
</head><body><div class="public-shell-home-sample-v4 color-sample-theme public-shell-home" data-design-candidate="home-v4" data-home-viewport="desktop">
<div class="home-intro-real-sample"><section class="home-hero-section" style="height:100svh;min-height:0"></section></div>
<div class="home-flow-body" style="position:relative;min-height:200svh"></div>
</div></body></html>`

function aboutNavigationFixture(language) {
  const sections = ['all', 'overview', 'conductor', 'accompanist', 'members', 'history']
  const labels = language === 'en'
    ? ['All', 'About the Choir', 'Conductor', 'Accompanists', 'Members', 'History']
    : ['전체', '합창단 소개', '지휘자 소개', '반주자 소개', '단원 소개', '연혁']
  const tabs = `<div class="about-fixture-container"><div class="section-tabs-wrap"><nav aria-label="About sections"><div class="animated-section-tabs" data-tone="navy" role="tablist">
    <span aria-hidden="true" class="section-tabs-indicator"></span>
    ${sections.map((section, index) => `<a class="section-tab${section === 'accompanist' ? ' is-active' : ''}" href="/about?section=${section}" role="tab" aria-selected="${section === 'accompanist'}">${labels[index]}</a>`).join('')}
  </div></nav></div></div>`
  return `<!doctype html><html lang="${language}" data-sample-language="${language}"><head><meta charset="utf-8">
    ${['/src/styles/globals.css', '/src/styles/color-sample-theme.css', '/src/styles/about-overview.css', '/src/features/sample-language/sample-language.css'].map(href => `<link rel="stylesheet" href="${href}">`).join('\n')}
    <!-- Only the Container and Tailwind wrapper utilities are mirrored here.
         All tab layout, wrapping, typography and target sizing come from production CSS. -->
    <style>html,body{margin:0}*,*::before,*::after{box-sizing:border-box}.about-fixture-container{width:100%;max-width:1280px;margin-inline:auto;padding-inline:16px}.section-tabs-wrap{padding:12px;border:1px solid #f0d5c8;border-radius:14px}.about-fixture-reference{position:absolute;top:520px;inset-inline:0}@media(min-width:640px){.about-fixture-container{padding-inline:28px}}@media(min-width:1024px){.about-fixture-container{padding-inline:48px}}</style>
    </head><body class="public-shell color-sample-theme"><div class="about-overview-nav">${tabs}</div><div class="about-fixture-reference">${tabs}</div></body></html>`
}

function rgbChannels(value) {
  const numbers = value.match(/[\d.]+/g)?.map(Number) ?? []
  assert.ok(numbers.length >= 3, `Expected a computed RGB color, got ${value}`)
  return numbers
}

function contrastRatio(foreground, background) {
  const luminance = value => {
    const channels = rgbChannels(value).slice(0, 3).map(component => {
      const channel = component / 255
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  const a = luminance(foreground)
  const b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

function compositeOnPhoto(color, photoShade) {
  const [red, green, blue, alpha = 1] = rgbChannels(color)
  return `rgb(${[red, green, blue].map(channel => channel * alpha + photoShade * (1 - alpha)).join(', ')})`
}

test('public visual surfaces preserve restrained, legible navigation without decorative light effects', { skip: !browserModule }, async t => {
  const vite = await createServer({
    root,
    configFile: false,
    appType: 'custom',
    logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0 },
    plugins: [{
      name: 'offline-public-surface-fixture',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const path = request.url?.split('?')[0]
          if (path !== fixturePath && path !== handoffFixturePath && path !== aboutFixturePath) return next()
          response.setHeader('Content-Type', 'text/html; charset=utf-8')
          const language = new URL(request.url, 'http://localhost').searchParams.get('lang') === 'en' ? 'en' : 'ko'
          response.end(path === aboutFixturePath ? aboutNavigationFixture(language) : path === handoffFixturePath ? handoffFixture : fixture)
        })
      },
    }],
  })
  let browser
  try {
    await vite.listen()
    const { chromium } = await import(browserModule)
    browser = await chromium.launch({ headless: true, executablePath: process.env.SMYC_PLAYWRIGHT_EXECUTABLE })
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.goto(`${vite.resolvedUrls.local[0].replace(/\/$/, '')}${fixturePath}`)
    await page.locator('.home-quick-action-card').waitFor()
    await page.evaluate(() => document.fonts.ready)

    const readSurface = (selector, pseudo = null) => page.evaluate(({ selector, pseudo }) => {
      const element = document.querySelector(selector)
      if (!element) throw new Error(`Missing CSS fixture element: ${selector}`)
      const style = getComputedStyle(element, pseudo)
      return {
        backgroundImage: style.backgroundImage,
        backgroundColor: style.backgroundColor,
        backdropFilter: style.backdropFilter,
        boxShadow: style.boxShadow,
        borderTopWidth: style.borderTopWidth,
        borderRadius: style.borderRadius,
        filter: style.filter,
        pointerEvents: style.pointerEvents,
        animationName: style.animationName,
        color: style.color,
        outlineStyle: style.outlineStyle,
      }
    }, { selector, pseudo })

    await t.test('hero quick links keep separated translucent surfaces and AA text contrast in default, hover and keyboard states', async () => {
      const card = await readSurface('.home-quick-action-card')
      assert.equal(card.backgroundImage, 'none', 'Quick links must not reflect gradient light')
      const alpha = rgbChannels(card.backgroundColor)[3] ?? 1
      assert.ok(alpha > 0 && alpha < 1, 'The photograph must show through the neutral quick-link surface')
      assert.equal(card.backdropFilter, 'none')
      assert.equal(card.boxShadow, 'none')
      const gap = await page.locator('.home-quick-action-grid').evaluate(element => Number.parseFloat(getComputedStyle(element).columnGap))
      assert.ok(gap >= 16, 'Quick links need visible space between cards')
      for (const selector of ['.home-quick-action-eyebrow', '.home-quick-action-copy h2', '.home-quick-action-copy > p:last-child', '.home-quick-action-link']) {
        const text = await readSurface(selector)
        for (const photoShade of [0, 255]) {
          assert.ok(contrastRatio(text.color, compositeOnPhoto(card.backgroundColor, photoShade)) >= 4.5, `${selector} needs 4.5:1 contrast over dark and bright photo extremes`)
        }
      }
      for (const pseudo of ['::before', '::after']) {
        assert.equal((await readSurface('.home-quick-action-card', pseudo)).backgroundImage, 'none')
      }
      await page.locator('.home-quick-action-card').hover()
      assert.equal((await readSurface('.home-quick-action-card')).backgroundImage, 'none')
      await page.locator('.home-quick-action-card').focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
      assert.notEqual((await readSurface('.home-quick-action-card')).outlineStyle, 'none', 'Keyboard focus remains visible')
    })

    await t.test('spirit, overview, accompanist and concert decorative surfaces remain flat across desktop and mobile', async () => {
      const selectors = ['.spirit-heritage__hero-veil', '.spirit-heritage__motet', '.spirit-heritage__motet-glass', '.spirit-heritage__quote-card', '.spirit-heritage__value-panel', '.spirit-heritage__education-panel', '.about-overview__spirit-stage', '.accompanist-profile__baseline', '.concerts-page__stage-wash', '.concerts-page__poster-fallback']
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 })
        for (const selector of selectors) {
          assert.equal((await readSurface(selector)).backgroundImage, 'none', `${selector} at ${width}px must not use a decorative gradient`)
        }
      }
    })

    await t.test('long English quick-link copy stays clear of its action inside the shared hero band', async () => {
      await page.locator('.home-quick-action-copy h2').evaluate(element => { element.textContent = 'Support & Contact' })
      await page.locator('.home-quick-action-copy > p:last-child').evaluate(element => {
        element.textContent = 'Use our official enquiry form to discuss support or make a general enquiry.'
      })
      for (const width of [1366, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 })
        const bounds = await page.evaluate(() => {
          const card = document.querySelector('.home-quick-action-card')
          const copy = document.querySelector('.home-quick-action-copy > p:last-child')
          const action = document.querySelector('.home-quick-action-link')
          const band = document.querySelector('.home-quick-actions')
          return {
            copyBottom: copy.getBoundingClientRect().bottom,
            actionTop: action.getBoundingClientRect().top,
            actionBottom: action.getBoundingClientRect().bottom,
            cardBottom: card.getBoundingClientRect().bottom,
            bandBottom: band.getBoundingClientRect().bottom,
            scrollHeight: card.scrollHeight,
            clientHeight: card.clientHeight,
          }
        })
        assert.ok(bounds.copyBottom + 4 <= bounds.actionTop, `English copy needs breathing room at ${width}px`)
        assert.ok(bounds.actionBottom <= bounds.cardBottom - 8, `The quick-link action must not be clipped at ${width}px`)
        assert.ok(bounds.cardBottom <= bounds.bandBottom, `The whole card must fit in the hero band at ${width}px`)
        assert.ok(bounds.scrollHeight <= bounds.clientHeight + 1, `Quick-link content must fit at ${width}px`)
      }
    })

    await t.test('closing decoration is an outlined, noninteractive static circle rather than blurred lighting', async () => {
      const shape = await readSurface('.spirit-heritage__closing-glow')
      assert.equal(shape.filter, 'none')
      assert.equal(shape.backgroundImage, 'none')
      assert.equal(shape.borderTopWidth, '1px')
      assert.equal(shape.pointerEvents, 'none')
      assert.equal(shape.animationName, 'none')
      assert.equal(shape.borderRadius, '50%')
      for (const selector of ['.spirit-heritage__motet-glass', '.spirit-heritage__closing-card']) {
        assert.equal((await readSurface(selector)).backdropFilter, 'none')
      }
    })

    await t.test('public loading and shared navigation use flat surfaces without decorative glare', async () => {
      for (const pseudo of [null, '::after']) {
        assert.equal((await readSurface('.route-loading-screen--public', pseudo)).backgroundImage, 'none')
      }
      const header = await readSurface('.home-v4-sample-header')
      assert.equal(header.boxShadow, 'none')
      assert.equal(header.backdropFilter, 'none')
    })

    await t.test('mobile editorial headings keep real breathing room rather than colliding with accent text', async () => {
      await page.setViewportSize({ width: 390, height: 844 })
      const gaps = await page.evaluate(() => {
        const line = document.querySelector('.spirit-heritage__hero-promise-line')
        const range = document.createRange()
        range.selectNode(line.firstChild)
        const accent = line.querySelector('em')
        const title = document.querySelector('.accompanist-profile__intro h1')
        const display = document.querySelector('.accompanist-profile__display')
        return {
          accentGap: accent.getBoundingClientRect().left - range.getBoundingClientRect().right,
          title: title.getBoundingClientRect().toJSON(),
          display: display.getBoundingClientRect().toJSON(),
          displayHidden: getComputedStyle(display).display === 'none',
        }
      })
      assert.ok(gaps.accentGap >= 3, 'The Korean handwritten accent needs space from the preceding word')
      const title = gaps.title
      const display = gaps.display
      const separated = title.bottom + 8 <= display.top || display.bottom + 8 <= title.top || title.right + 8 <= display.left || display.right + 8 <= title.left
      assert.ok(gaps.displayHidden || separated, 'A decorative duplicate must not intersect the readable mobile title')
      assert.ok(title.width > 0 && title.height > 0, 'The semantic title remains visible')
    })

    await t.test('English support categories fit whole words on mobile while Korean keeps its compact amount rows', async () => {
      await page.setViewportSize({ width: 390, height: 844 })
      const labels = await page.locator('.contact-atelier__amounts dt').evaluateAll(elements => elements.map(element => {
        const range = document.createRange()
        range.selectNodeContents(element)
        return { text: element.textContent, lines: range.getClientRects().length, width: element.clientWidth, scrollWidth: element.scrollWidth }
      }))
      for (const label of labels) {
        assert.equal(label.lines, 1, `${label.text} should not split inside a word`)
        assert.ok(label.scrollWidth <= label.width + 1, `${label.text} must fit its column`)
      }
      await page.locator('.contact-atelier').evaluate(element => { element.lang = 'ko' })
      assert.equal(await page.locator('.contact-atelier__amounts > div').first().evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length), 2, 'Korean amount labels retain their existing two-column layout')
    })

    await t.test('the meaningful community photograph fits fully inside its existing frame', async () => {
      await page.setViewportSize({ width: 1180, height: 820 })
      const photo = page.locator('.spirit-heritage__community-photo img')
      await photo.evaluate(element => element.decode())
      assert.equal(await photo.evaluate(element => getComputedStyle(element).objectFit), 'contain', 'Do not crop community members through their eyes')
      assert.equal(await page.locator('.spirit-heritage__community-photo > div').evaluate(element => getComputedStyle(element).backgroundImage), 'none', 'A full-image fit must not expose the old gradient fallback behind the photo')
    })

    await t.test('the documentary overview photo keeps its natural ratio and its caption outside the image', async () => {
      for (const language of ['ko', 'en']) {
        await page.evaluate(language => {
          document.documentElement.lang = language
          document.documentElement.dataset.sampleLanguage = language
        }, language)
        for (const width of [390, 1180, 1440]) {
          await page.setViewportSize({ width, height: width === 390 ? 844 : 820 })
          const photo = page.locator('.about-overview__intro-image img')
          await photo.evaluate(element => element.decode())
          const geometry = await page.evaluate(() => {
            const image = document.querySelector('.about-overview__intro-image img')
            const caption = document.querySelector('.about-overview__glass-caption')
            const r = image.getBoundingClientRect()
            return { width: r.width, height: r.height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, fit: getComputedStyle(image).objectFit, imageBottom: r.bottom, captionTop: caption.getBoundingClientRect().top }
          })
          assert.equal(geometry.fit, 'contain', `${language} overview at ${width}px must keep the full group photo`)
          assert.ok(Math.abs(geometry.width / geometry.height - geometry.naturalWidth / geometry.naturalHeight) < 0.01, `${language} overview at ${width}px must follow the source photo ratio`)
          assert.ok(geometry.captionTop >= geometry.imageBottom + 8, `${language} overview at ${width}px caption must not cover people`)
        }
      }
    })

    await t.test('the startup retains its authored unfolding pace and hands off to the full hero fade', async () => {
      await page.setViewportSize({ width: 1440, height: 900 })
      const motion = await page.evaluate(() => {
        const timing = element => { const s = getComputedStyle(element); return { name: s.animationName, duration: parseFloat(s.animationDuration) * 1000, delay: parseFloat(s.animationDelay) * 1000, display: s.display } }
        return { field: timing(document.querySelector('.home-intro-launch__field')), mark: timing(document.querySelector('.home-intro-launch__wordmark')), words: [...document.querySelectorAll('.home-intro-launch__word')].map(timing), tails: [...document.querySelectorAll('.home-intro-launch__tail')].map(timing), copy: timing(document.querySelector('[data-intro-copy-probe]')) }
      })
      assert.equal(motion.field.name, 'home-intro-field-release')
      assert.equal(motion.copy.name, 'home-v4-hero-copy-intro-handoff')
      for (const part of [motion.field, motion.mark, motion.copy, ...motion.words, ...motion.tails]) {
        assert.notEqual(part.display, 'none', 'Retain the intro elements, not hidden substitute effects')
        assert.notEqual(part.name, 'none')
        assert.ok(part.duration > 0, 'Preserve genuine motion, not a zero-duration removal')
      }
      assert.ok(motion.field.duration + motion.field.delay >= 1300, 'Do not accelerate the visible intro to solve an unrelated waiting bug')
      assert.ok(motion.copy.duration >= 1400, 'Preserve the original hero copy fade')
      for (const part of [...motion.words, ...motion.tails]) assert.ok(part.duration + part.delay <= motion.mark.delay, 'Every word must finish unfolding before the mark fades')
      assert.ok(motion.copy.duration + motion.copy.delay >= motion.field.duration + motion.field.delay, 'The overlay completion must also account for the final hero-copy fade')
    })

    await t.test('the hero stays pinned until the following panel completely covers it, including reverse scrolling', async () => {
      const handoff = await browser.newPage()
      try {
        await handoff.goto(`${vite.resolvedUrls.local[0].replace(/\/$/, '')}${handoffFixturePath}`)
        for (const viewport of [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1200 }]) {
          await handoff.setViewportSize(viewport)
          const origin = await handoff.locator('.home-flow-body').evaluate(element => element.getBoundingClientRect().top + scrollY)
          for (const y of [origin - 400, origin - 100, origin, origin + 100, origin - 100]) {
            await handoff.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y)
            const bounds = await handoff.evaluate(() => ({ heroTop: document.querySelector('.home-hero-section').getBoundingClientRect().top, panelTop: document.querySelector('.home-flow-body').getBoundingClientRect().top }))
            if (bounds.panelTop > 0) assert.ok(Math.abs(bounds.heroTop) < 1, `At ${viewport.width}px, hero must not leave while ${bounds.panelTop}px of the panel ascent remains`)
            else assert.ok(Math.abs(bounds.heroTop - bounds.panelTop) < 1, 'Only after full coverage may the hidden hero leave its track')
          }
        }
      } finally { await handoff.close() }
      for (const viewport of [{ width: 1180, height: 820 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport)
        assert.doesNotMatch(await page.locator('.home-intro-real-sample .home-hero-section').evaluate(element => getComputedStyle(element).position), /sticky|fixed/, 'Do not introduce desktop pinning into tablet or phone modes')
      }
    })

    await t.test('reduced motion removes both the desktop pin and its negative panel overlap', async () => {
      const handoff = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
      try {
        await handoff.goto(`${vite.resolvedUrls.local[0].replace(/\/$/, '')}${handoffFixturePath}`)
        const bounds = await handoff.evaluate(() => {
          const hero = document.querySelector('.home-hero-section')
          const panel = document.querySelector('.home-flow-body')
          return { position: getComputedStyle(hero).position, heroBottom: hero.getBoundingClientRect().bottom, panelTop: panel.getBoundingClientRect().top }
        })
        assert.doesNotMatch(bounds.position, /sticky|fixed/, 'Reduced motion must not inherit an important desktop pin')
        assert.ok(bounds.panelTop >= bounds.heroBottom - 1, 'Without an intro track, the following plane must not cover the hero at scroll zero')
      } finally { await handoff.close() }
    })

    await t.test('tablet slideshow controls retain at least 44px physical targets without an inherited scale', async () => {
      await page.setViewportSize({ width: 1180, height: 820 })
      await page.locator('.public-shell-home-sample-v4').evaluate(element => { element.dataset.homeViewport = 'tablet' })
      const targets = await page.locator('.home-hero-controls button').evaluateAll(elements => elements.map(element => {
        const r = element.getBoundingClientRect()
        return { width: r.width, height: r.height }
      }))
      assert.ok(targets.length > 0)
      for (const target of targets) assert.ok(target.width >= 44 && target.height >= 44, 'A 44px control must not be scaled down below the project touch minimum')
    })

    await t.test('English tablet support category words fit their columns intact', async () => {
      await page.setViewportSize({ width: 1180, height: 820 })
      await page.locator('.contact-atelier').evaluate(element => { element.lang = 'en' })
      const labels = await page.locator('.contact-atelier__amounts dt').evaluateAll(elements => elements.map(element => {
        const range = document.createRange()
        range.selectNodeContents(element)
        return { text: element.textContent, lines: range.getClientRects().length, width: element.clientWidth, scrollWidth: element.scrollWidth }
      }))
      for (const label of labels) {
        assert.equal(label.lines, 1, `${label.text} must not split before its final letter`)
        assert.ok(label.scrollWidth <= label.width + 1)
      }
    })

    await t.test('the mobile accompanist divider follows the complete wrapped introduction', async () => {
      await page.setViewportSize({ width: 390, height: 844 })
      const bounds = await page.evaluate(() => ({ summaryBottom: document.querySelector('.accompanist-profile__summary').getBoundingClientRect().bottom, lineTop: document.querySelector('.accompanist-profile__baseline').getBoundingClientRect().top }))
      assert.ok(bounds.lineTop >= bounds.summaryBottom + 8, 'The introduction divider must not cut through the final sentence')
    })

    await t.test('mobile concert details keep a 44px target in portrait and landscape', async () => {
      for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
        await page.setViewportSize(viewport)
        const target = await page.locator('.concerts-page__stage-link').evaluate(element => element.getBoundingClientRect().toJSON())
        assert.ok(target.height >= 44, `Concert details needs a 44px target at ${viewport.width}px`)
      }
    })

    await t.test('short-landscape join anchors do not reserve the sticky-header offset twice', async () => {
      await page.setViewportSize({ width: 844, height: 390 })
      assert.ok(await page.locator('#practice').evaluate(element => Number.parseFloat(getComputedStyle(element).scrollMarginTop)) <= 24, 'Global scroll padding already accounts for the sticky header')
      await page.setViewportSize({ width: 390, height: 844 })
      assert.equal(await page.locator('#practice').evaluate(element => getComputedStyle(element).scrollMarginTop), '104px', 'Portrait anchor spacing remains unchanged')
    })

    await t.test('About navigation exposes all six choices without clipping in Korean and English', async () => {
      const about = await browser.newPage()
      try {
        for (const language of ['ko', 'en']) {
          await about.goto(`${vite.resolvedUrls.local[0].replace(/\/$/, '')}${aboutFixturePath}?lang=${language}`)
          await about.evaluate(() => document.fonts.ready)
          for (const width of [320, 390, 768, 1024, 1440]) {
            await about.setViewportSize({ width, height: 900 })
            const geometry = await about.locator('.about-overview-nav').evaluate(nav => {
              const list = nav.querySelector('.animated-section-tabs')
              const wrapper = nav.querySelector('.section-tabs-wrap').getBoundingClientRect()
              const listBounds = list.getBoundingClientRect()
              const tabs = [...list.querySelectorAll('.section-tab')].map(tab => {
                const bounds = tab.getBoundingClientRect()
                const range = document.createRange()
                range.selectNodeContents(tab)
                const text = range.getBoundingClientRect()
                const hit = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
                return {
                  label: tab.textContent,
                  bounds: bounds.toJSON(),
                  textFits: text.left >= bounds.left - 0.5 && text.right <= bounds.right + 0.5 && text.top >= bounds.top - 0.5 && text.bottom <= bounds.bottom + 0.5,
                  visible: bounds.left >= Math.max(0, wrapper.left, listBounds.left) - 0.5 && bounds.right <= Math.min(innerWidth, wrapper.right, listBounds.right) + 0.5 && bounds.top >= wrapper.top - 0.5 && bounds.bottom <= wrapper.bottom + 0.5,
                  operable: tab === hit || tab.contains(hit),
                }
              })
              const defaults = [...document.querySelectorAll('.about-fixture-reference .section-tab')].map(tab => {
                const bounds = tab.getBoundingClientRect()
                return { width: bounds.width, height: bounds.height }
              })
              return { tabs, defaults, scrollWidth: list.scrollWidth, clientWidth: list.clientWidth, pageWidth: document.documentElement.scrollWidth }
            })
            const context = `${language} About navigation at ${width}px`
            assert.equal(geometry.tabs.length, 6, context)
            assert.ok(geometry.scrollWidth <= geometry.clientWidth + 1, `${context} must not require horizontal scrolling`)
            assert.ok(geometry.pageWidth <= width + 1, `${context} must not cause page overflow`)
            for (const tab of geometry.tabs) {
              assert.ok(tab.visible && tab.operable, `${context}: ${tab.label} must be immediately visible and reachable`)
              assert.ok(tab.textFits, `${context}: ${tab.label} must not be cut off`)
              assert.ok(tab.bounds.width >= 44 && tab.bounds.height >= 44, `${context}: ${tab.label} needs a 44px target`)
            }
            for (let first = 0; first < geometry.tabs.length; first += 1) {
              for (let second = first + 1; second < geometry.tabs.length; second += 1) {
                const a = geometry.tabs[first].bounds, b = geometry.tabs[second].bounds
                assert.ok(Math.min(a.right, b.right) - Math.max(a.left, b.left) <= 0.5 || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 0.5, `${context}: choices must not overlap`)
              }
            }
            if (width >= 1024) {
              assert.equal(new Set(geometry.tabs.map(tab => tab.bounds.top)).size, 1, `${context} retains its desktop row`)
              assert.deepEqual(geometry.tabs.map(tab => ({ width: tab.bounds.width, height: tab.bounds.height })), geometry.defaults, `${context} retains the shared desktop tab dimensions`)
            }
          }
        }
      } finally { await about.close() }
    })
  } finally {
    await browser?.close()
    await vite.close()
  }
})
