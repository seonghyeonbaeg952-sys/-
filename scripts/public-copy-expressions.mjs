// Read-only inventory of direct JSX expression leaves missed by the JSX-text scan.
// This intentionally does not infer ownership of data, validation, or arbitrary helpers.
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { seen, ownerOf } from './public-copy-inventory.mjs'

export function findExpressionCopy(source, file) {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const found = []
  const managed = node => {
    for (let current = node.parent; current; current = current.parent) {
      if (ts.isJsxElement(current) && ['FormattedCopy', 'HomeCopy', 'SiteCopy', 'FieldLabel'].includes(current.openingElement.tagName.getText(tree))) return true
      if (ts.isCallExpression(current) && /^(copy|copyText|editorCopy|t)$/.test(current.expression.getText(tree))) return true
    }
    return false
  }
  const leaf = node => {
    if (!node || managed(node)) return
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (/[\p{L}]/u.test(node.text)) found.push({ value: node.text, start: node.getStart(tree), end: node.end, line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1, owner: ownerOf(node) })
    } else if (ts.isConditionalExpression(node)) { leaf(node.whenTrue); leaf(node.whenFalse) }
    else if (ts.isParenthesizedExpression(node)) leaf(node.expression)
    else if (ts.isBinaryExpression(node) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(node.operatorToken.kind)) leaf(node.right)
  }
  const visit = node => {
    if (ts.isJsxExpression(node) && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) leaf(node.expression)
    ts.forEachChild(node, visit)
  }
  visit(tree)
  return found
}

export function expressionCopyInventory() {
  return [...seen].filter(file => file.endsWith('.tsx') && !/\/(admin|site-editor|benchmark)\//.test(file))
    .flatMap(file => findExpressionCopy(readFileSync(file, 'utf8'), file).map(({ owner: _owner, ...candidate }) => ({ file, ...candidate })))
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/public-copy-expressions.mjs')) console.log(JSON.stringify(expressionCopyInventory(), null, 2))
