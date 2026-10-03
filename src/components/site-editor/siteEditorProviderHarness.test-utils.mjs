import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { setImmediate as nextTurn } from 'node:timers/promises'
import vm from 'node:vm'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
const transpile = source => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText
const providerCode = transpile(await readFile(new URL('./SiteEditorProvider.tsx', import.meta.url), 'utf8'))
const viewportCode = transpile(await readFile(new URL('../home/useHomeResponsiveViewport.ts', import.meta.url), 'utf8'))

/** Controlled browser/transport only; provider, viewport hook, copy and rendered contexts are real. */
export async function createProviderHarness(vite, {
  path = '/spirit', children, language = 'ko', width = 1440, height = 900, coarsePointer = false,
  sourceApi = async () => ({ data: [], error: null }), englishApi = async () => ({ data: [], error: null }),
} = {}) {
  const slots = [], effects = [], events = new Map(), intervals = new Map()
  let cursor = 0, output, intervalId = 0
  const invalidations = { source: 0, english: 0, records: 0 }
  const addEventListener = (name, callback) => {
    if (!events.has(name)) events.set(name, new Set())
    events.get(name).add(callback)
  }
  const removeEventListener = (name, callback) => events.get(name)?.delete(callback)
  const win = { innerWidth: width, innerHeight: height, addEventListener, removeEventListener,
    matchMedia: () => ({ matches: coarsePointer, addEventListener() {}, removeEventListener() {} }),
    setInterval: fn => { intervals.set(++intervalId, fn); return intervalId }, clearInterval: id => intervals.delete(id),
  }
  win.parent = win
  const attributes = new Map()
  const doc = { hidden: false, addEventListener, removeEventListener,
    body: { dataset: {}, getAttribute: key => attributes.get(key) ?? null,
      setAttribute: (key, value) => attributes.set(key, value), removeAttribute: key => attributes.delete(key) },
  }
  const sameDependencies = (previous, next) => previous && next && next.length === previous.length && next.every((value, index) => Object.is(value, previous[index]))
  const hooks = {
    Activity: require('react').Activity,
    useState(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = { value: typeof initial === 'function' ? initial() : initial }
      return [slots[i].value, next => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next }]
    },
    useMemo(fn, deps) {
      const i = cursor++
      if (!sameDependencies(slots[i]?.deps, deps)) slots[i] = { deps, value: fn() }
      return slots[i].value
    },
    useCallback(fn, deps) { return hooks.useMemo(() => fn, deps) },
    useRef(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = { current: initial }
      return slots[i]
    },
    useEffect(fn, deps) {
      const i = cursor++
      if (!sameDependencies(slots[i]?.deps, deps)) {
        const previous = slots[i]
        slots[i] = { deps }
        effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn() })
      }
    },
  }
  const execute = (code, dependencies) => {
    const exported = {}
    vm.runInThisContext(`(function(exports, require, window, document) { ${code}\n})`)(exported,
      name => { assert.ok(name in dependencies, `Unexpected dependency: ${name}`); return dependencies[name] }, win, doc)
    return exported
  }
  const paths = {
    '../../lib/siteEditorPublication': '/src/lib/siteEditorPublication.ts',
    '../../lib/siteEditorModel': '/src/lib/siteEditorModel.ts',
    '../../lib/siteEditorPreview': '/src/lib/siteEditorPreview.ts',
    './useSiteEditor': '/src/components/site-editor/useSiteEditor.ts',
    './site-editor-public.css?inline': '/src/components/site-editor/site-editor-public.css?inline',
    './site-editor-fonts.css?inline': '/src/components/site-editor/site-editor-fonts.css?inline',
    './site-editor-text-styles.css?inline': '/src/components/site-editor/site-editor-text-styles.css?inline',
    './AddedTextBoxes': '/src/components/site-editor/AddedTextBoxes.tsx',
    '../../lib/siteEditorAddedBoxes': '/src/lib/siteEditorAddedBoxes.ts',
    '../../lib/editorSectionLabel': '/src/lib/editorSectionLabel.ts',
    './previewInteraction': '/src/components/site-editor/previewInteraction.ts',
    '../../features/sample-language/sampleEnglishDocuments': '/src/features/sample-language/sampleEnglishDocuments.ts',
    './siteEditorLanguagePresentation': '/src/components/site-editor/siteEditorLanguagePresentation.ts',
  }
  const dependencies = Object.fromEntries(await Promise.all(Object.entries(paths).map(async ([name, path]) => [name, await vite.ssrLoadModule(path)])))
  const languageModule = await vite.ssrLoadModule('/src/features/sample-language/useSampleLanguage.ts')
  const { translateEnglish } = await vite.ssrLoadModule('/src/features/sample-language/englishRegistry.ts')
  const url = new URL(path, 'https://test.invalid')
  let sample = { enabled: true, isSample: false, language, setLanguage() {},
    translate: language === 'en' ? translateEnglish : value => value,
    translateData: value => value, translateHome: value => value, href: value => value,
    retryContent: () => { invalidations.records++ }, contentLoading: false, contentError: false,
  }
  const provider = execute(providerCode, {
    ...dependencies, react: hooks, 'react/jsx-runtime': require('react/jsx-runtime'),
    'react-router': { useLocation: () => ({ pathname: url.pathname, search: url.search, hash: url.hash }), useNavigate: () => () => {} },
    '../../features/sample-language/useSampleLanguage': { ...languageModule, useSampleLanguage: () => sample },
    '../home/useHomeResponsiveViewport': execute(viewportCode, { react: hooks }),
    '../../lib/siteEditorApi': { loadPublicEditorPages: sourceApi, loadPublicSampleEnglishEditorPages: englishApi,
      invalidateEditorCache: () => { invalidations.source++ }, invalidateSampleEnglishEditorCache: () => { invalidations.english++ } },
  })
  const render = () => {
    cursor = 0
    output = provider.SiteEditorProvider({ children })
    effects.splice(0).forEach(effect => effect())
    return output
  }
  render()
  return {
    render, markup: () => renderToStaticMarkup(output), invalidations,
    get languageContext() { return output.props.value },
    get editorContext() { return output.props.children.props.value },
    async settle() { await nextTurn(); render() },
    focus() { for (const callback of events.get('focus') ?? []) callback() },
    setLanguage(next) { sample = { ...sample, language: next, translate: next === 'en' ? translateEnglish : value => value }; render() },
    destroy() { slots.forEach(slot => slot?.cleanup?.()); intervals.clear() },
  }
}
