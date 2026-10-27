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

test('Spirit navigation points only to the four retained sections', () => {
  const spiritMenu = navigation.publicNavigation.find(
    (item) => item.href === '/spirit',
  )
  assert.deepEqual(spiritMenu.children.map(item => item.href), [
    '/spirit#spirit-overview', '/spirit#spirit-lineage', '/spirit#spirit-community', '/spirit#spirit-join',
  ])
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
