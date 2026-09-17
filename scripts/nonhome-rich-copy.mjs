import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { seen } from './public-copy-inventory.mjs'

const excluded = file => /\/(?:admin|site-editor|home|home-v4)\//.test(file) || /Home[^/]*\.tsx$/.test(file)
const files = [...seen].filter(file => file.endsWith('.tsx') && !excluded(file)).sort()
const apply = process.argv.includes('--apply')
const literal = node => node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null
const stats = []
const keys = new Set()

for (const file of files) {
  const source = readFileSync(file, 'utf8')
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const pages = new Set()
  const gatherPages = node => {
    if (ts.isCallExpression(node) && node.expression.getText(tree) === 'usePageCopy') pages.add(literal(node.arguments[0]))
    ts.forEachChild(node, gatherPages)
  }
  gatherPages(tree)
  const page = pages.size === 1 ? [...pages][0] : null
  const edits = []
  const copyInfo = node => {
    if (!ts.isCallExpression(node)) return null
    if (node.expression.getText(tree) === 't' && page && literal(node.arguments[0])) return { page, id: `${page}.${literal(node.arguments[0])}` }
    if (node.expression.getText(tree) === 'copyText' && node.arguments.length === 3) {
      const target = literal(node.arguments[0]), id = literal(node.arguments[1])
      if (target && target !== 'home' && id) return { page: target, id }
    }
    return null
  }
  const propsOf = node => Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute).map(attr => [attr.name.getText(tree), attr.initializer]))
  const excludedLeaf = node => {
    for (let current = node.parent; current; current = current.parent) {
      if (ts.isJsxElement(current)) {
        const tag = current.openingElement.tagName.getText(tree)
        if (['FormattedCopy', 'SiteCopy', 'option', 'textarea', 'title', 'style', 'script'].includes(tag)) return true
        const props = propsOf(current.openingElement)
        if (Object.hasOwn(props, 'hidden') && (!props.hidden || (ts.isJsxExpression(props.hidden) && props.hidden.expression?.kind === ts.SyntaxKind.TrueKeyword))) return true
        const className = literal(props.className)
        if (className && /(?:^|\s)(?:sr-only|[^\s]*__sr-only)(?:\s|$)/.test(className)) return true
      }
    }
    return false
  }
  const wrap = (node, info, child = `{${node.getText(tree)}}`, lineBreaks = false) => {
    const text = lineBreaks ? propsOf(node).text.expression.getText(tree) : node.getText(tree)
    edits.push({ start: node.getStart(tree), end: node.end,
      value: `<FormattedCopy page=${JSON.stringify(info.page)} id=${JSON.stringify(info.id)} text={${text}}${lineBreaks ? ' lineBreaks' : ''}>${child}</FormattedCopy>` })
    keys.add(info.id)
  }
  const renderedExpression = node => {
    const info = copyInfo(node)
    if (info) { wrap(node, info); return }
    if (ts.isConditionalExpression(node)) { renderedExpression(node.whenTrue); renderedExpression(node.whenFalse) }
    if (ts.isParenthesizedExpression(node)) renderedExpression(node.expression)
    if (ts.isBinaryExpression(node)) {
      if ([ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) renderedExpression(node.left)
      if ([ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(node.operatorToken.kind)) renderedExpression(node.right)
    }
  }
  const visit = node => {
    if ((ts.isJsxElement(node) && node.openingElement.tagName.getText(tree) === 'FormattedCopy')
      || (ts.isJsxSelfClosingElement(node) && ['FormattedCopy', 'SiteCopy'].includes(node.tagName.getText(tree)))) {
      const props = propsOf(ts.isJsxElement(node) ? node.openingElement : node)
      if (!excludedLeaf(node) && literal(props.page) && literal(props.page) !== 'home' && literal(props.id)) keys.add(literal(props.id))
      return
    }
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(tree) === 'CopyLines' && !excludedLeaf(node)) {
      const text = propsOf(node).text
      const info = text && ts.isJsxExpression(text) && text.expression ? copyInfo(text.expression) : null
      if (info) { wrap(node, info, node.getText(tree), true); return }
    }
    if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent)) && !excludedLeaf(node)) renderedExpression(node.expression)
    ts.forEachChild(node, visit)
  }
  visit(tree)
  if (!edits.length) continue
  let next = source
  for (const edit of edits.sort((a, b) => b.start - a.start)) next = next.slice(0, edit.start) + edit.value + next.slice(edit.end)
  if (!tree.statements.some(node => ts.isImportDeclaration(node) && node.moduleSpecifier.text.endsWith('/FormattedCopy'))) {
    const module = path.posix.relative(path.posix.dirname(file), 'src/components/site-editor/FormattedCopy')
    next = `import { FormattedCopy } from '${module.startsWith('.') ? module : `./${module}`}'\n${next}`
  }
  if (apply) writeFileSync(file, next)
  stats.push({ file, adapters: edits.length })
}

if (apply) {
  const content = `import { commonRichCopyKeys } from './siteCopyCommonCatalog'\nimport { computedRichCopyKeys } from './siteCopyOptionsCatalog'\nimport { conditionalRichCopyKeys } from './siteCopyConditionalCatalog'\nimport { displayRichCopyKeys } from './siteCopyDisplayCatalog'\n// Generated from explicit, statically keyed rendered leaves by scripts/nonhome-rich-copy.mjs.\n// Presence means at least one rich rendered leaf exists, not that every use of a key is styled.\nexport const NONHOME_RICH_COPY_KEYS: ReadonlySet<string> = new Set([\n${[...keys].sort().map(key => `  ${JSON.stringify(key)},`).join('\n')}\n])\n\nexport const richCopyKeys: ReadonlySet<string> = new Set([...NONHOME_RICH_COPY_KEYS, ...commonRichCopyKeys, ...computedRichCopyKeys, ...conditionalRichCopyKeys, ...displayRichCopyKeys])\n\nexport const RICH_COPY_LIMITATIONS = [\n  'HTML attributes, metadata, alternative text, placeholders and native option values stay plain strings.',\n  'String-only component props, computed keys and transformed or concatenated copy need a dedicated renderer before character formatting is supported.',\n  'A key reused in both visible copy and metadata styles only its explicit rich rendered leaves.',\n  'This inventory excludes home and home-v4 files, which maintain their own adapters, and screen-reader-only leaves.',\n] as const\n`
  writeFileSync('src/content/richCopyKeys.ts', content)
}
console.log(JSON.stringify({ files: stats, addedAdapters: stats.reduce((sum, entry) => sum + entry.adapters, 0), supportedKeys: keys.size }, null, 2))
