import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'

test('editor consumers can express drafts, nullable publication, revisions and catalog metadata with strict page/device/font types', () => {
  const entry = fileURLToPath(new URL('./__site_editor_contract__.ts', import.meta.url))
  const source = `
    import type { EditorDevice, EditorPageId, EditorFont, EditorAppearance, SiteEditorDocument,
      SiteEditorDocuments, SiteEditorPageRecord, SiteEditorRevision, SiteCopyDefinition } from './siteEditor'
    const device: EditorDevice = 'mobile'
    const page: EditorPageId = 'concert-detail'
    const font: EditorFont = 'gothic-a1'
    const appearance: EditorAppearance = { fontFamily: font, h1Size: 48, headingColor: '#10233F' }
    const document: SiteEditorDocument = { schemaVersion: 1, copy: {}, deviceCopy: { [device]: {} }, appearance: { shared: appearance } }
    const documents: SiteEditorDocuments = { [page]: document }
    const record: SiteEditorPageRecord = { page_key: page, draft: document, published: null, version: 0, updated_at: '', published_at: null }
    const revision: SiteEditorRevision = { id: 'revision', page_key: page, document, published_at: '2026-09-17T00:00:00Z' }
    const field: SiteCopyDefinition = { key: 'home.title', page: 'home', section: 'hero', label: '제목', defaultValue: '기존 문구',
      multiline: true, inputType: 'number', sourceKey: 'home.hero.title', sourceDevice: 'desktop', min: 1, max: 100, maxLength: 10000 }
    // @ts-expect-error unknown pages cannot cross the typed boundary
    const badPage: EditorPageId = 'admin'
    // @ts-expect-error device override spelling must be explicit
    const badDevice: EditorDevice = 'phone'
    // @ts-expect-error external font URLs are not selectable fonts
    const badFont: EditorFont = 'https://external.invalid/font.css'
    // @ts-expect-error the document version is a literal protocol contract
    const badVersion: SiteEditorDocument = { schemaVersion: 2, copy: {}, deviceCopy: {}, appearance: {} }
    void [documents, record, revision, field, badPage, badDevice, badFont, badVersion]
  `
  const options = { strict: true, noEmit: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, types: [] }
  const host = ts.createCompilerHost(options)
  const originalGetSourceFile = host.getSourceFile.bind(host)
  host.getSourceFile = (name, languageVersion, ...rest) => path.resolve(name) === path.resolve(entry)
    ? ts.createSourceFile(name, source, languageVersion, true)
    : originalGetSourceFile(name, languageVersion, ...rest)
  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([entry], options, host))
  assert.equal(diagnostics.length, 0, diagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n'))
})
