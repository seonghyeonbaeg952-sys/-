import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { readFile } from 'node:fs/promises'

import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  root: process.cwd(),
  server: { middlewareMode: true },
})
const navigation = await vite.ssrLoadModule('/src/constants/navigation.ts')
const aboutNavigation = await vite.ssrLoadModule('/src/lib/aboutNavigation.ts')

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

test('does not keep user-facing links to the legacy separate spirit query', async () => {
  const conductorProfileSource = await readFile(
    new URL('../components/about/ConductorProfileDocument.tsx', import.meta.url),
    'utf8',
  )

  assert.equal(conductorProfileSource.includes('to="/about?section=spirit"'), false)
})

test('opens the choir overview and spirit content as one selection', () => {
  assert.equal(typeof aboutNavigation.resolveAboutSectionView, 'function')

  assert.deepEqual(aboutNavigation.resolveAboutSectionView(null), {
    activeSection: 'overview',
    shouldShowOverview: true,
    shouldShowSpirit: true,
  })

  assert.deepEqual(aboutNavigation.resolveAboutSectionView('overview'), {
    activeSection: 'overview',
    shouldShowOverview: true,
    shouldShowSpirit: true,
  })
  assert.deepEqual(aboutNavigation.resolveAboutSectionView('spirit'), {
    activeSection: 'overview',
    shouldShowOverview: true,
    shouldShowSpirit: true,
  })
})

test('keeps the full About view available without making it the default route', () => {
  assert.deepEqual(aboutNavigation.resolveAboutSectionView('all'), {
    activeSection: 'all',
    shouldShowOverview: true,
    shouldShowSpirit: true,
  })

  assert.equal(
    aboutNavigation.aboutSectionTabs.find((tab) => tab.value === 'all')?.href,
    '/about?section=all',
  )
})

test('does not expose a separate spirit tab in the About selector', () => {
  assert.equal(
    aboutNavigation.aboutSectionTabs.some(
      (tab) => tab.value === 'spirit' || tab.href.includes('section=spirit'),
    ),
    false,
  )
})
