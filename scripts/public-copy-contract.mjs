import ts from 'typescript'
import { createHash } from 'node:crypto'
import { cookJsx } from './public-copy-inventory.mjs'

/** Compare emitted JSX, removing only newly added explicit copy adapters. No runtime DOM rewriting. */
export function publicMarkupSource(source, file) {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const roots = []
  const collect = node => {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) { roots.push(node); return }
    ts.forEachChild(node, collect)
  }
  collect(tree)
  const normalized = roots.map(root => {
    const result = ts.transform(root, [context => {
      const visit = node => {
        if (ts.isJsxText(node)) return ts.factory.createJsxExpression(undefined, ts.factory.createStringLiteral(cookJsx(source.slice(node.getFullStart(), node.end))))
        if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(tree) === 'SiteCopy') {
          const props = Object.fromEntries(node.attributes.properties.filter(ts.isJsxAttribute).map(attr => [attr.name.getText(tree), attr.initializer]))
          if (props.id && ts.isStringLiteral(props.id) && props.id.text.includes('.fixed.') && props.fallback && ts.isJsxExpression(props.fallback)) return ts.factory.createJsxExpression(undefined, props.fallback.expression)
        }
        if (ts.isCallExpression(node) && node.expression.getText(tree) === 'copyText' && node.arguments.length === 3) return node.arguments[2]
        return ts.visitEachChild(node, visit, context)
      }
      return node => ts.visitNode(node, visit)
    }])
    const printed = ts.createPrinter({ removeComments: true }).printNode(ts.EmitHint.Unspecified, result.transformed[0], tree)
    result.dispose()
    const emitted = ts.transpileModule(`const value = ${printed}`, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, removeComments: true } }).outputText
    const emittedTree = ts.createSourceFile('render.js', emitted, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
    const strings = []
    const literals = node => { if (ts.isStringLiteral(node)) strings.push(node); ts.forEachChild(node, literals) }
    literals(emittedTree)
    let canonical = emitted
    for (const node of strings.sort((a, b) => b.pos - a.pos)) canonical = canonical.slice(0, node.getStart(emittedTree)) + JSON.stringify(node.text) + canonical.slice(node.end)
    return canonical
  })
  return normalized.join('\n')
}

export function publicMarkupFingerprint(source, file) {
  return createHash('sha256').update(publicMarkupSource(source, file)).digest('hex')
}
