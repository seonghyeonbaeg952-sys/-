// Read-only source / in-memory controller audit. Never saves or publishes content.
import { mkdir, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { files, seen } from './public-copy-inventory.mjs'
import { exclusion } from './public-copy-adapter-plan.mjs'
import { expressionCopyInventory } from './public-copy-expressions.mjs'

const vite = await createServer({ configFile: false, logLevel: 'silent', server: { middlewareMode: true } })
try {
  const { siteCopyDefinitions, getSiteCopyDefaults } = await vite.ssrLoadModule('/src/content/siteCopyCatalog.ts')
  const { richCopyKeys } = await vite.ssrLoadModule('/src/content/richCopyKeys.ts')
  const { homeRichCopySourceKeys } = await vite.ssrLoadModule('/src/content/homeRichCopyKeys.ts')
  const { makeCanvasGrant, commitCanvasGrant } = await vite.ssrLoadModule('/src/components/admin/site-editor/editorCanvasController.ts')
  const { editSessionCopy, createEditorSession, validateEditorCopyFields } = await vite.ssrLoadModule('/src/components/admin/site-editor/editorSessionModel.ts')
  const { validateSiteEditorDocument } = await vite.ssrLoadModule('/src/lib/siteEditorModel.ts')
  const empty = () => ({ schemaVersion: 1, copy: {}, deviceCopy: {}, appearance: {} })
  const defaults = getSiteCopyDefaults()
  const rows = []
  for (const field of siteCopyDefinitions.filter(field => !/hero/i.test(field.section) && !/(^|\.)hero(\.|$)/i.test(field.key))) {
    const device = field.sourceDevice ?? 'desktop', scope = field.sourceDevice ?? 'desktop'
    const session = createEditorSession({ page_key: field.page, draft: empty(), published: null, version: 1, updated_at: '', published_at: null })
    const sample = field.inputType === 'boolean' ? field.defaultValue === 'true' ? 'false' : 'true'
      : field.inputType === 'number' ? String(field.min ?? (Number(field.defaultValue) || 1))
      : field.maxLength ? '검증'.slice(0, field.maxLength) : '문구 편집 검증'
    const changed = editSessionCopy(session, scope, field.key, sample)
    const copyError = validateSiteEditorDocument(changed.document) || validateEditorCopyFields(changed.document, [field])
    const expectsFont = richCopyKeys.has(field.key) || Boolean(field.sourceDevice && field.sourceKey && homeRichCopySourceKeys[field.sourceDevice].has(field.sourceKey))
    let font = '별도 텍스트 서식 미지원(옵션·속성·메타데이터 등)', error = copyError
    if (expectsFont && field.defaultValue.length) {
      const context = { editorPage: field.page, previewPage: field.page === 'common' ? 'home' : field.page,
        device, scope, documents: { [field.page]: empty() }, loadedOwners: new Set([field.page]), defaultsTrusted: true, defaults, baseDraftSequence: 1 }
      const text = defaults[field.key] ?? field.defaultValue
      const source = { ownerPage: field.page, scope, key: field.key, text }
      const block = { id: 'audit-copy', label: field.label, visibleText: text, revision: 1, capabilities: { format: true, replaceText: true },
        segments: [{ source, sourceStart: 0, sourceEnd: text.length, visibleStart: 0, visibleEnd: text.length, transform: 'exact' }] }
      const result = makeCanvasGrant(context, block, { editId: 'audit-edit', fieldVersionFactory: () => 'audit-version' })
      if (result.ok) {
        const committed = commitCanvasGrant(context, result.issued, [{ source: result.issued.grant.fields[0].source, fieldVersion: 'audit-version',
          edits: [{ start: 0, end: text.length, text, runs: [{ start: 0, end: text.length, style: { fontFamily: 'hahmlet', fontSize: 24 } }] }] }])
        font = committed.ok ? '글자·글꼴 편집 계약 통과' : '실패'
        if (!committed.ok) error = committed.message
      } else { font = '실패'; error = result.message }
    }
    rows.push({ page: field.page, key: field.key, section: field.section, label: field.label, scope, copy: copyError ? '실패' : '문구 수정 계약 통과', font, error })
  }
  const literals = files.flatMap(({ file, candidates }) => candidates.filter(candidate => !/HomeHero/.test(file)).map(candidate => ({ file, line: candidate.line, text: candidate.value, exception: exclusion(file, candidate) })))
  const expressions = expressionCopyInventory().filter(item => !/HomeHero/.test(item.file))
  const summary = { date: '2026-09-26', excluded: '홈 히어로', modules: seen.size, fields: rows.length,
    copyFailures: rows.filter(row => row.copy === '실패').length, fontContracts: rows.filter(row => row.font === '글자·글꼴 편집 계약 통과').length,
    fontFailures: rows.filter(row => row.font === '실패').length, literalExceptions: literals.length, unadaptedLiterals: literals.filter(row => !row.exception).length,
    expressionCandidates: expressions.length,
    limitation: '메모리 내 원문/서식 계약 및 소스 점검이다. 모든 브라우저 상태·CMS 본문·오류·모달을 실제로 클릭한 검증으로 간주하지 않는다.' }
  await mkdir('docs/audits', { recursive: true })
  await writeFile('docs/audits/2026-09-26-editor-copy-contract.json', JSON.stringify({ summary, rows, literals, expressions }, null, 2) + '\n')
  const clean = text => String(text ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')
  await writeFile('docs/audits/2026-09-26-editor-copy-contract.md', `# 홈페이지 문구 편집 항목별 점검\n\n홈 히어로 제외. 실제 데이터 저장·게시 없음.\n\n${summary.limitation}\n\n- 검사 항목: ${rows.length}개\n- 문구 수정 실패: ${summary.copyFailures}개\n- 글꼴 편집 계약 통과: ${summary.fontContracts}개\n- 글꼴 편집 계약 실패: ${summary.fontFailures}개\n\n| 화면 | 문구 | 문구 수정 | 글꼴 | 원문 키 |\n|---|---|---|---|---|\n${rows.map(row => `|${clean(row.page)}|${clean(row.label)}|${row.copy}|${row.font}|${row.key}|`).join('\n')}\n\n## 별도 관리/제외 원문\n\n${literals.map(row => `- ${row.file}:${row.line} — ${clean(row.text)} — ${row.exception ?? '미연결'}`).join('\n')}\n`)
  console.log(JSON.stringify(summary, null, 2))
  if (summary.copyFailures || summary.fontFailures || summary.unadaptedLiterals) process.exitCode = 1
} finally { await vite.close() }
