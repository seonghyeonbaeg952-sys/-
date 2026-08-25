import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(
  'C:/Users/seong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.emulateMedia({ reducedMotion: 'reduce' })
await page.goto('http://127.0.0.1:5175/spirit', { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)

const geometry = await page.evaluate(() => {
  const groups = {
    hero: {
      section: '.spirit-heritage__hero',
      items: [
        '.spirit-heritage__display-title',
        '.spirit-heritage__eyebrow--hero',
        '.spirit-heritage__hero-photo',
        '.spirit-heritage__hero-heading--desktop',
        '.spirit-heritage__reading-stroke',
        '.spirit-heritage__hero-body',
        '.spirit-heritage__origin-card',
      ],
    },
    lineage: {
      section: '.spirit-heritage__lineage',
      items: [
        '.spirit-heritage__section-shell',
        '.spirit-heritage__eyebrow',
        '.spirit-heritage__lineage-title',
        '.spirit-heritage__lineage-title > p',
        '.spirit-heritage__lineage-title h2',
        '.spirit-heritage__lineage-title h2 span',
        '.spirit-heritage__lineage-rule',
        '.spirit-heritage__lineage-lead',
        '.spirit-heritage__heritage-photo',
        '.spirit-heritage__lineage-track',
        '.spirit-heritage__timeline-curve',
        '.spirit-heritage__milestone',
        '.spirit-heritage__milestone-dot',
        '.spirit-heritage__milestone-year',
        '.spirit-heritage__milestone-copy',
      ],
    },
    motet: {
      section: '.spirit-heritage__motet',
      items: [
        '.spirit-heritage__backdrop-word',
        '.spirit-heritage__motet-grid',
        '.spirit-heritage__motet-title-block',
        '.spirit-heritage__motet-title-block > .spirit-heritage__eyebrow',
        '.spirit-heritage__motet-prelude',
        '.spirit-heritage__motet-title',
        '.spirit-heritage__motet-title h2',
        '.spirit-heritage__vertical-stroke',
        '.spirit-heritage__motet-glass',
        '.spirit-heritage__calligraphic-note',
        '.spirit-heritage__motet-body',
        '.spirit-heritage__quote-card',
        '.spirit-heritage__quote-card blockquote',
      ],
    },
    manifesto: {
      section: '.spirit-heritage__manifesto',
      items: [
        '.spirit-heritage__manifesto-heading',
        '.spirit-heritage__manifesto-heading h2',
        '.spirit-heritage__manifesto-heading small',
        '.spirit-heritage__manifesto-rule',
        '.spirit-heritage__manifesto-row',
        '.spirit-heritage__manifesto-number',
        '.spirit-heritage__manifesto-row h3',
        '.spirit-heritage__manifesto-row > p:last-child',
      ],
    },
    faith: {
      section: '.spirit-heritage__faith',
      items: [
        '.spirit-heritage__faith-grid',
        '.spirit-heritage__faith-title',
        '.spirit-heritage__faith-title h2',
        '.spirit-heritage__faith-watermark',
        '.spirit-heritage__faith-copy > p',
        '.spirit-heritage__scripture-card',
        '.spirit-heritage__scripture-card > p',
        '.spirit-heritage__scripture-card blockquote',
        '.spirit-heritage__scripture-card small',
      ],
    },
    values: {
      section: '.spirit-heritage__values',
      items: [
        '.spirit-heritage__values-grid',
        '.spirit-heritage__values-heading',
        '.spirit-heritage__values-heading h2',
        '.spirit-heritage__values-lead',
        '.spirit-heritage__tab-list',
        '.spirit-heritage__value-tab',
        '.spirit-heritage__value-panel',
        '.spirit-heritage__value-number',
        '.spirit-heritage__value-panel h3',
        '.spirit-heritage__value-panel > strong',
        '.spirit-heritage__value-panel > p:last-child',
      ],
    },
    community: {
      section: '.spirit-heritage__community',
      items: [
        '.spirit-heritage__community-heading',
        '.spirit-heritage__community-photo',
        '.spirit-heritage__voices',
        '.spirit-heritage__community-closing',
      ],
    },
    education: {
      section: '.spirit-heritage__education',
      items: [
        '.spirit-heritage__education-grid',
        '.spirit-heritage__education-label',
        '.spirit-heritage__education-title',
        '.spirit-heritage__education-lead',
        '.spirit-heritage__education-tabs',
        '.spirit-heritage__education-panel',
      ],
    },
    closing: {
      section: '.spirit-heritage__closing',
      items: [
        '.spirit-heritage__closing-card',
        '.spirit-heritage__closing-logo',
        '.spirit-heritage__closing-copy .spirit-heritage__eyebrow',
        '.spirit-heritage__closing-copy h2',
        '.spirit-heritage__closing-copy > p:not(.spirit-heritage__eyebrow)',
        '.spirit-heritage__closing-actions',
        '.spirit-heritage__one-voice',
      ],
    },
  }

  return Object.fromEntries(
    Object.entries(groups).map(([name, group]) => {
      const section = document.querySelector(group.section)
      const sectionRect = section.getBoundingClientRect()
      const items = group.items.flatMap((selector) =>
        [...section.querySelectorAll(selector)].map((element, index) => {
          const rect = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          return {
            selector,
            index,
            left: Math.round((rect.left - sectionRect.left) * 10) / 10,
            top: Math.round((rect.top - sectionRect.top) * 10) / 10,
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
          }
        }),
      )
      return [name, { width: sectionRect.width, height: sectionRect.height, items }]
    }),
  )
})

process.stdout.write(`${JSON.stringify(geometry, null, 2)}\n`)
await browser.close()
