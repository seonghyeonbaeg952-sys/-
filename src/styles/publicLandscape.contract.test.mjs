import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = name => readFile(new URL(`./${name}`, import.meta.url), 'utf8')

test('short landscape viewports put the spirit introduction into document flow', async () => {
  const css = await read('spirit-heritage.css')
  const landscape = css.slice(css.indexOf('/* Short landscape viewport'))
  assert.match(landscape, /@media \(orientation: landscape\) and \(max-width: 1365px\) and \(max-height: 820px\)/)
  assert.match(landscape, /\.spirit-heritage__hero-inner\s*\{[^}]*display:\s*flex/)
  assert.match(landscape, /\.spirit-heritage__hero-body,\s*\.spirit-heritage__origin-card\s*\{[^}]*position:\s*relative/)
  assert.match(landscape, /\.spirit-heritage__origin-card\s*\{[^}]*height:\s*auto/)
})

test('public tablet layouts remain active at 1180px landscape instead of switching to desktop', async () => {
  const tabletCss = [
    'about-overview.css', 'conductor-profile.css', 'accompanist-profiles.css',
    'concerts-page.css', 'concert-detail.css', 'notices-page.css',
    'gallery-page.css', 'join-page.css', 'join-application.css',
    'contact-page.css', 'footer-utility.css',
  ]
  for (const name of tabletCss) {
    assert.match(await read(name), /@media[^{}]*\(max-width:\s*1365px\)/, name)
  }
  for (const name of ['history-cue-sheet.css', 'members-archive.css']) {
    assert.match(await read(name), /@media\s*\(min-width:\s*1366px\)/, name)
  }
})

test('landscape tablet headings, join actions and home orbit may grow without text clipping', async () => {
  const [about, join, orbit] = await Promise.all(['about-overview.css', 'home-join-open-score.css', 'home-spirit-chorus-orbit.css'].map(read))
  for (const css of [about, join, orbit]) assert.match(css, /@media \(orientation: landscape\)/)
  assert.match(about, /\.about-overview__intro-stage[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\)/)
  assert.match(join, /\.join-open-score__layout[\s\S]*?min-height:\s*0/)
  assert.match(orbit, /\.home-spirit-chorus-orbit\s*\{[^}]*--orbit-size:/)
})
