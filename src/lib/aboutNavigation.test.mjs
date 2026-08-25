import assert from 'node:assert/strict'
import { after, test } from 'node:test'

import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  root: process.cwd(),
  server: { middlewareMode: true },
})
const navigation = await vite.ssrLoadModule('/src/constants/navigation.ts')
const aboutPage = await vite.ssrLoadModule('/src/pages/public/AboutPage.tsx')

after(async () => {
  await vite.close()
})

test('keeps the merged spirit content out of the About submenu', () => {
  const aboutMenu = navigation.publicNavigation.find(
    (item) => item.href === '/about',
  )

  assert.ok(aboutMenu)
  assert.equal(
    aboutMenu.children?.some((item) => item.href === '/about?section=spirit'),
    false,
  )
})

test('links to the spirit anchor inside the merged overview', () => {
  const spiritMenu = navigation.publicNavigation.find(
    (item) => item.href === '/spirit',
  )
  const mergedOverviewLink = spiritMenu?.children?.find(
    (item) => item.label === '소개 안에서 보기',
  )

  assert.equal(mergedOverviewLink?.href, '/about?section=overview#spirit')
})

test('opens the choir overview and spirit content as one selection', () => {
  assert.equal(typeof aboutPage.resolveAboutSectionView, 'function')

  assert.deepEqual(aboutPage.resolveAboutSectionView('overview'), {
    activeSection: 'overview',
    shouldShowOverview: true,
    shouldShowSpirit: true,
  })
  assert.deepEqual(aboutPage.resolveAboutSectionView('spirit'), {
    activeSection: 'overview',
    shouldShowOverview: true,
    shouldShowSpirit: true,
  })
})

test('does not expose a separate spirit tab in the About selector', () => {
  assert.equal(
    aboutPage.aboutSectionTabs.some(
      (tab) => tab.value === 'spirit' || tab.href.includes('section=spirit'),
    ),
    false,
  )
})
