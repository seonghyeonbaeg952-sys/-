import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const roots = [
  'src/pages/sample/HomeV4SamplePage.tsx', 'src/components/layout/PublicLayout.tsx',
  ...['AboutPage', 'SpiritPage', 'ConcertsPage', 'ConcertDetailPage', 'NoticesPage', 'NoticeDetailPage', 'GalleryPage', 'JoinPage', 'ContactPage', 'NotFoundPage'].map(name => `src/pages/public/${name}.tsx`),
]
const excluded = new Set([
  'src/pages/public/HomeMotionBenchmarkPage.tsx', 'src/pages/public/HomeHeroIntroSamplePage.tsx',
  'src/pages/public/SpiritHeroSamplePage.tsx',
])
const seen = new Set()
const files = []
const textAttributes = /^(?:alt|title|description|label|eyebrow|placeholder|aria-label|aria-description|aria-roledescription|aria-valuetext|(?:[a-zA-Z]+)(?:Label|Title|Description|Message|Placeholder))$/
const hasWords = value => /[\p{L}]/u.test(value)

function cookJsx(raw) {
  const code = ts.transpileModule(`const value = <span>${raw}</span>`, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX } }).outputText
  const tree = ts.createSourceFile('cooked.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  let text = ''
  const visit = node => {
    if (ts.isPropertyAssignment(node) && node.name.getText(tree) === 'children' && ts.isStringLiteral(node.initializer)) text = node.initializer.text
    ts.forEachChild(node, visit)
  }
  visit(tree)
  return text
}

function ownerOf(node) {
  let current = node.parent
  while (current) {
    if (ts.isFunctionDeclaration(current) && current.name && /^[A-Z]/.test(current.name.text) && current.body) return current
    if ((ts.isArrowFunction(current) || ts.isFunctionExpression(current)) && ts.isBlock(current.body)
      && ts.isVariableDeclaration(current.parent) && ts.isIdentifier(current.parent.name) && /^[A-Z]/.test(current.parent.name.text)) return current
    current = current.parent
  }
  return null
}

function alreadyManaged(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isJsxSelfClosingElement(current) && ['SiteCopy', 'CopyLines'].includes(current.tagName.getText())) return true
    if (ts.isJsxElement(current) && current.openingElement.tagName.getText() === 'FieldLabel') return true
    if (ts.isCallExpression(current) && /^(?:copy|editorCopy|copyText|t)$/.test(current.expression.getText())) return true
  }
  return false
}

function inspect(file) {
  if (seen.has(file) || !existsSync(file) || excluded.has(file)) return
  seen.add(file)
  const source = readFileSync(file, 'utf8')
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const imports = []
  const candidates = []
  const visit = node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.startsWith('.')) imports.push(node.moduleSpecifier.text)
    if (!alreadyManaged(node)) {
      if (ts.isJsxText(node)) {
        const value = cookJsx(source.slice(node.getFullStart(), node.end))
        if (hasWords(value)) candidates.push({ kind: 'text', start: node.getFullStart(), end: node.end, value, line: tree.getLineAndCharacterOfPosition(node.pos).line + 1 })
      }
      if (ts.isJsxAttribute(node) && textAttributes.test(node.name.getText(tree)) && node.initializer && ts.isStringLiteral(node.initializer) && hasWords(node.initializer.text)) {
        const owner = ownerOf(node)
        candidates.push({ kind: 'attribute', attribute: node.name.getText(tree), start: node.initializer.getStart(tree), end: node.initializer.end, value: node.initializer.text, line: tree.getLineAndCharacterOfPosition(node.pos).line + 1, owner: owner?.name?.text ?? null })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  if (file.endsWith('.tsx') && !file.includes('/admin/') && !file.includes('/site-editor/') && candidates.length) files.push({ file, count: candidates.length, candidates })
  for (const relative of imports) {
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), relative))
    const resolved = [base, `${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`].find(candidate => existsSync(candidate))
    if (resolved && /\.tsx?$/.test(resolved)) inspect(resolved)
  }
}

for (const root of roots) inspect(root)
export { files, roots, excluded, seen, cookJsx, ownerOf }
const requested = process.argv.find(argument => argument.startsWith('--file='))?.slice(7)
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/public-copy-inventory.mjs')) console.log(JSON.stringify(requested ? files.filter(item => item.file.includes(requested)) : {
  roots, excluded: [...excluded], modules: seen.size,
  files: files.map(({ file, count }) => ({ file, count })), total: files.reduce((sum, item) => sum + item.count, 0),
}, null, 2))
