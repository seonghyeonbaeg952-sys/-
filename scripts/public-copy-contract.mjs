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
        if (ts.isJsxElement(node) && ['FormattedCopy', 'HomeCopy'].includes(node.openingElement.tagName.getText(tree))) {
          const children = node.children.filter(child => !ts.isJsxText(child) || cookJsx(source.slice(child.getFullStart(), child.end)))
          if (children.length === 1) {
            const child = children[0]
            const expressionPosition = !ts.isJsxElement(node.parent) && !ts.isJsxFragment(node.parent)
            return visit(expressionPosition && ts.isJsxExpression(child) ? child.expression : child)
          }
        }
        if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(tree) === 'HomeCopy') {
          const text = node.attributes.properties.find(attr => ts.isJsxAttribute(attr) && attr.name.getText(tree) === 'text')?.initializer
          if (text && ts.isJsxExpression(text) && text.expression) {
            return ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent)
              ? ts.factory.createJsxExpression(undefined, visit(text.expression)) : visit(text.expression)
          }
        }
        if (ts.isJsxAttribute(node) && ['sourceKey', 'fullText', 'offset'].includes(node.name.getText(tree))
          && ts.isJsxSelfClosingElement(node.parent.parent) && node.parent.parent.tagName.getText(tree) === 'HomeDisplayTitleText') return undefined
        if (ts.isJsxAttribute(node) && node.name.getText(tree) === 'sourceParagraphs'
          && ts.isJsxSelfClosingElement(node.parent.parent) && node.parent.parent.tagName.getText(tree) === 'CollectivePortrait') return undefined
        if (ts.isArrowFunction(node) && /<(?:HomeCopy|HomeDisplayTitleText)\b/.test(node.getText(tree))) {
          const normalized = ts.visitEachChild(node, visit, context)
          const used = new Set()
          const collectIdentifiers = child => { if (ts.isIdentifier(child)) used.add(child.text); ts.forEachChild(child, collectIdentifiers) }
          collectIdentifiers(normalized.body)
          const parameters = [...normalized.parameters]
          // Extra map callback positions exist only to locate a formatted slice.
          while (parameters.length > 1 && ts.isIdentifier(parameters.at(-1).name) && !used.has(parameters.at(-1).name.text)) parameters.pop()
          return ts.factory.updateArrowFunction(normalized, normalized.modifiers, normalized.typeParameters, parameters, normalized.type, normalized.equalsGreaterThanToken, normalized.body)
        }
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
