import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import vm from 'node:vm'
import * as React from 'react'
import ts from 'typescript'

const projectRoot = fileURLToPath(new URL('../../../', import.meta.url))
const nodeRequire = createRequire(import.meta.url)
const pathFor = relative => resolve(projectRoot, relative)
const moduleCache = new Map()
let currentLoad

// Execute the actual page JSX, content normalization, flow wrapper and retry UI.
// Replace network/browser-motion hooks and unrelated large child sections only:
// this is a page-layout/interaction contract, not a CSS or Supabase integration test.
const boundaries = new Map([
  [pathFor('src/hooks/usePublicData.ts'), { useHomeData: () => currentLoad.homeData }],
  [pathFor('src/components/home/useHomeResponsiveViewport.ts'), { useHomeResponsiveViewport: () => currentLoad.viewport }],
  [pathFor('src/components/site-editor/useSiteEditor.ts'), { useSiteEditor: () => ({ documents: {}, copy: (_page, _key, fallback) => fallback }) }],
  [pathFor('src/features/sample-language/useSampleLanguage.ts'), { useSampleLanguage: () => ({ translateHome: content => content }) }],
  [pathFor('src/hooks/useHomeFlowProgress.ts'), { useHomeFlowProgress() {} }],
  [pathFor('src/hooks/useHomeMotionDirector.ts'), { useHomeMotionDirector() {} }],
])

for (const [folder, names] of [
  ['src/components/common', ['SeoHead', 'StaffFlowRail', 'TransitionLink']],
  ['src/components/home', [
    'AboutPreview', 'FloatingInfoCards', 'GalleryPreview', 'HomeHeroIntroOverlay',
    'HomeHeroSlideshow', 'HomePopupManager', 'HomeSpiritScoreBook', 'JoinCTA',
    'JoinOpenScoreCTA', 'PerformanceNewsPreview', 'ScrollScoreBookReveal',
    'ResponsiveHomeScore', 'SponsorQuietMarquee', 'SupportLetterFold',
  ]],
]) {
  for (const name of names) boundaries.set(pathFor(`${folder}/${name}.tsx`), { [name]: () => null })
}

function loadProductionModule(path) {
  if (boundaries.has(path)) return boundaries.get(path)
  if (moduleCache.has(path)) return moduleCache.get(path).exports
  const raw = readFileSync(path, 'utf8')
  const module = { exports: {} }
  moduleCache.set(path, module)
  const source = ts.transpileModule(raw, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    structuredClone,
    window: { location: { origin: 'https://layout-regression.invalid' } },
    require(specifier) {
      if (specifier === 'react') return {
        ...React,
        useMemo: factory => factory(),
        useCallback: callback => callback,
        useRef: initial => ({ current: initial }),
      }
      if (!specifier.startsWith('.')) return nodeRequire(specifier)
      const base = resolve(dirname(path), specifier)
      for (const extension of ['', '.ts', '.tsx']) {
        try { return loadProductionModule(`${base}${extension}`) }
        catch (error) { if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error }
      }
      throw new Error(`Cannot resolve production dependency: ${specifier}`)
    },
  }, { filename: path })
  return module.exports
}

const { mockSiteSettings } = loadProductionModule(pathFor('src/constants/mockData.ts'))
const { HomePage } = loadProductionModule(pathFor('src/pages/public/HomePage.tsx'))

// Resolve real function components and fragments into native host nodes while
// retaining event handlers, so the real retry Button can be activated below.
function renderHostTree(element) {
  if (element == null || typeof element === 'boolean') return []
  if (Array.isArray(element)) return element.flatMap(renderHostTree)
  if (typeof element !== 'object') return [element]
  if (element.type === React.Fragment) return renderHostTree(element.props.children)
  if (typeof element.type === 'function') return renderHostTree(element.type(element.props))
  assert.equal(typeof element.type, 'string', 'Resolve the actual JSX to native host elements')
  return [{ type: element.type, props: element.props, children: renderHostTree(element.props.children) }]
}

function find(nodes, predicate) {
  return nodes.flatMap(node => typeof node === 'object'
    ? [...(predicate(node) ? [node] : []), ...find(node.children, predicate)]
    : [])
}

const hasClass = (node, name) => node.props.className?.split(/\s+/).includes(name)
const text = node => node.children.map(child => typeof child === 'object' ? text(child) : child).join('')

function renderPage({ error, viewport, mode }) {
  let retries = 0
  currentLoad = {
    viewport,
    homeData: {
      data: {
        aboutSections: [], concerts: [], gallery: [], heroSlides: [], joinInfo: null,
        notices: [], posters: [], popupNotices: [], siteSettings: mockSiteSettings,
        siteTexts: {}, sponsors: [], videos: [],
      },
      error: error ? 'The public content request failed' : null,
      loading: false,
      refetch: () => { retries++ },
    },
  }
  return {
    nodes: renderHostTree(React.createElement(HomePage, {
      mode,
      joinPresentation: 'open-score',
      performancePresentation: 'figma-template-carousel',
    })),
    retries: () => retries,
  }
}

for (const viewport of ['desktop', 'tablet', 'mobile']) {
  for (const mode of ['default', 'section-flow-sample']) {
    for (const error of [false, true]) {
      test(`${viewport}/${mode}/${error ? 'request failure' : 'success'}: the following plane directly closes over the intro`, () => {
        const page = renderPage({ error, viewport, mode })
        const root = find(page.nodes, node => hasClass(node, 'home-flow-root'))[0]
        assert.ok(root, 'Render the actual HomeFlowProvider wrapper')
        const introIndex = root.children.findIndex(node => typeof node === 'object' && hasClass(node, 'home-intro-real-sample'))
        assert.ok(introIndex >= 0)
        const following = root.children[introIndex + 1]
        assert.ok(following && hasClass(following, 'home-flow-body'), 'An error block outside the following plane adds scroll distance and releases the sticky hero before full coverage')
        const headings = find(following.children, node => node.type === 'h2')
        const buttons = find(following.children, node => node.type === 'button')
        if (!error) {
          assert.equal(headings.length, 0, 'A successful request must not show the error card')
          assert.equal(buttons.length, 0, 'A successful request must not offer a stale retry action')
          return
        }
        assert.equal(headings.length, 1, 'The actual ErrorState stays visible inside the closing plane')
        assert.ok(text(headings[0]).trim().length > 0, 'The failure has a readable heading')
        assert.equal(buttons.length, 1, 'Retain the real retry Button inside the error card')
        assert.ok(text(buttons[0]).trim().length > 0, 'The retry action has an accessible name')
        assert.equal(page.retries(), 0)
        buttons[0].props.onClick()
        assert.equal(page.retries(), 1, 'Activating the actual retry Button invokes the failed loader refetch')
      })
    }
  }
}
