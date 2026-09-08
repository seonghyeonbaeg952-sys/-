const { chromium } = require('C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')

const baseUrl = 'http://127.0.0.1:5175/about?section=overview'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1536, height: 900 } })

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)

  const layerAudit = await page.evaluate(() => {
    const caption = document.querySelector('.about-overview__glass-caption')
    const figure = document.querySelector('.about-overview__intro-figure')
    const image = document.querySelector('.about-overview__intro-image')
    const intro = document.querySelector('.about-overview__intro')
    const selector = document.querySelector('.about-overview-nav')

    if (!(caption && figure && image && intro && selector)) {
      return { error: 'required overview elements are missing' }
    }

    const rect = (element) => {
      const value = element.getBoundingClientRect()
      return {
        bottom: Math.round(value.bottom + window.scrollY),
        height: Math.round(value.height),
        left: Math.round(value.left),
        right: Math.round(value.right),
        top: Math.round(value.top + window.scrollY),
        width: Math.round(value.width),
      }
    }

    const captionRect = caption.getBoundingClientRect()
    const captionStyle = getComputedStyle(caption)
    const figureStyle = getComputedStyle(figure)
    const imageStyle = getComputedStyle(image)
    const introRect = intro.getBoundingClientRect()
    const selectorRect = selector.getBoundingClientRect()
    const centerX = captionRect.left + captionRect.width / 2
    const centerY = captionRect.top + captionRect.height / 2

    return {
      caption: rect(caption),
      captionInsideSection: captionRect.bottom <= introRect.bottom,
      captionLayerAtCenter: document
        .elementsFromPoint(centerX, centerY)
        .slice(0, 4)
        .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
      captionOpacity: captionStyle.opacity,
      captionVisibility: captionStyle.visibility,
      figure: rect(figure),
      figureClipPath: figureStyle.clipPath,
      figureOverflow: figureStyle.overflow,
      image: rect(image),
      imageOverflow: imageStyle.overflow,
      intro: rect(intro),
      selector: rect(selector),
      selectorBelowHeader: selectorRect.top >= 72,
    }
  })

  await page.evaluate(() => window.scrollTo({ behavior: 'instant', top: 430 }))
  await page.waitForTimeout(250)
  await page.screenshot({ path: 'output/playwright/about-caption-layer.png' })

  const valueButtons = page.locator('.about-overview__spirit-values button')
  await valueButtons.first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(700)

  const clickStates = []
  for (let index = 0; index < 4; index += 1) {
    await valueButtons.nth(index).click()
    clickStates.push(
      await valueButtons.evaluateAll((buttons) =>
        buttons.map((button) => ({
          active: button.classList.contains('is-active'),
          pressed: button.getAttribute('aria-pressed'),
          title: button.querySelector('h3')?.textContent?.trim(),
        })),
      ),
    )
  }

  await valueButtons.first().focus()
  await page.keyboard.press('ArrowDown')
  const keyboardState = await valueButtons.evaluateAll((buttons) => ({
    activeIndex: buttons.findIndex((button) => button.classList.contains('is-active')),
    focusedIndex: buttons.findIndex((button) => button === document.activeElement),
    pressedCount: buttons.filter((button) => button.getAttribute('aria-pressed') === 'true').length,
  }))

  await page.screenshot({ path: 'output/playwright/about-spirit-interaction.png' })

  const interactionAudit = {
    clickStates,
    keyboardState,
    oneActiveAfterEveryClick: clickStates.every(
      (state, activeIndex) =>
        state.filter((item) => item.active && item.pressed === 'true').length === 1 &&
        state[activeIndex]?.active === true,
    ),
  }

  console.log(JSON.stringify({ interactionAudit, layerAudit }, null, 2))
  await browser.close()
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
