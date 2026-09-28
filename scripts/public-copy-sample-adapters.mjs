import ts from 'typescript'

const unknown = { known: false, sample: false }
const fixed = (value, sample = false) => ({ known: true, value, sample })
const isJsx = node => ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)
const inJsx = node => { for (let current = node.parent; current; current = current.parent) if (isJsx(current)) return true; return false }
const scopeOf = node => { for (let current = node.parent; current; current = current.parent) if (ts.isFunctionLike(current) || ts.isSourceFile(current)) return current }
const inlineDisplayAliases = {
  'src/components/about/ConductorProfileDocument.tsx': new Set(['displayedProfileImageAlt', 'displayedPerformanceImageAlt']),
  'src/components/join/JoinGuide.tsx': new Set(['guideDescription', 'partsText', 'processText', 'preparationText', 'rehearsalTime', 'rehearsalLocation']),
}
function tokens(code) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, true, ts.LanguageVariant.Standard, code)
  const result = []
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    result.push([token, token === ts.SyntaxKind.StringLiteral ? scanner.getTokenValue() : scanner.getTokenText()])
  }
  return JSON.stringify(result)
}

/** Specialise only the explicitly imported sample-language API to its original
 * route contract: disabled, Korean, identity translation and identity links.
 * The captured baseline is unchanged. Unrelated helpers and ordinary conditionals
 * remain visible to the markup fingerprint. */
export function originalSampleSource(input, file) {
  let source = input
  for (let pass = 0; pass < 12; pass++) {
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const imported = new Map()
    for (const statement of tree.statements.filter(ts.isImportDeclaration)) {
      if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
      const module = statement.moduleSpecifier.text
      for (const item of statement.importClause?.namedBindings?.elements ?? []) {
        if (!ts.isImportSpecifier(item)) continue
        imported.set(item.name.text, { name: item.propertyName?.text ?? item.name.text, module })
      }
    }
    const isImported = (name, original, suffix) => imported.get(name)?.name === original && imported.get(name)?.module.endsWith(suffix)
    const declarations = [], functions = new Map()
    const collect = node => {
      if (ts.isFunctionDeclaration(node) && node.name) functions.set(node.name.text, node)
      if (ts.isVariableDeclaration(node)) {
        const immutable = Boolean(node.parent.flags & ts.NodeFlags.Const)
        if (ts.isIdentifier(node.name)) declarations.push({ name: node.name.text, initializer: immutable ? node.initializer : undefined, scope: scopeOf(node), node })
        if (immutable && ts.isObjectBindingPattern(node.name) && node.initializer && ts.isCallExpression(node.initializer)
          && ts.isIdentifier(node.initializer.expression) && isImported(node.initializer.expression.text, 'useSampleLanguage', '/sample-language/useSampleLanguage')) {
          for (const item of node.name.elements) if (ts.isIdentifier(item.name)) declarations.push({
            name: item.name.text, api: item.propertyName?.getText(tree) ?? item.name.text, scope: scopeOf(node),
          })
        }
      }
      if (ts.isParameter(node) && ts.isIdentifier(node.name)) declarations.push({ name: node.name.text, scope: node.parent })
      ts.forEachChild(node, collect)
    }
    collect(tree)
    const binding = (name, node) => declarations.filter(item => item.name === name && item.scope && item.scope.pos <= node.pos && item.scope.end >= node.end)
      .sort((a, b) => (a.scope.end - a.scope.pos) - (b.scope.end - b.scope.pos))[0]
    const identity = (node, api) => ts.isIdentifier(node) && binding(node.text, node)?.api === api
    // A moved JSX alias is still the same source leaf. Expand the exact footer
    // adapter at its original element positions rather than hashing it twice.
    const footerLabel = file === 'src/components/layout/Footer.tsx' && declarations.find(item => item.name === 'adminLabel' && item.initializer && ts.isJsxElement(item.initializer)
      && item.initializer.openingElement.tagName.getText(tree) === 'FormattedCopy')
    if (footerLabel) {
      const references = []
      const findReferences = node => {
        if (ts.isJsxExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === footerLabel.name
          && ts.isJsxElement(node.parent)) references.push(node)
        ts.forEachChild(node, findReferences)
      }
      findReferences(tree)
      if (references.length) {
        const statement = footerLabel.node.parent.parent
        const edits = references.map(node => ({ start: node.getStart(tree), end: node.end, text: `\n            ${footerLabel.initializer.getText(tree)}\n          ` }))
        edits.push({ start: statement.getStart(tree), end: statement.end, text: '' })
        for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end)
        continue
      }
    }
    const valueOf = (node, visiting = new Set()) => {
      if (!node || visiting.has(node)) return unknown
      const next = new Set(visiting).add(node)
      if (ts.isParenthesizedExpression(node)) return valueOf(node.expression, next)
      if (node.kind === ts.SyntaxKind.TrueKeyword) return fixed(true)
      if (node.kind === ts.SyntaxKind.FalseKeyword) return fixed(false)
      if (node.kind === ts.SyntaxKind.NullKeyword) return fixed(null)
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return fixed(node.text)
      if (ts.isNumericLiteral(node)) return fixed(Number(node.text))
      if (ts.isIdentifier(node)) {
        if (node.text === 'undefined') return fixed(undefined)
        const declaration = binding(node.text, node)
        if (declaration?.api === 'enabled') return fixed(false, true)
        if (declaration?.api === 'language') return fixed('ko', true)
        return declaration?.initializer ? valueOf(declaration.initializer, next) : unknown
      }
      if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
        if (ts.isPropertyAccessExpression(node.operand) && node.operand.name.text === 'length') {
          const nonEmpty = nonEmptyArray(node.operand.expression)
          if (nonEmpty.known && nonEmpty.value) return fixed(false, nonEmpty.sample)
        }
        const operand = valueOf(node.operand, next)
        return operand.known ? fixed(!operand.value, operand.sample) : unknown
      }
      if (ts.isBinaryExpression(node)) {
        if (node.operatorToken.kind === ts.SyntaxKind.GreaterThanToken && ts.isPropertyAccessExpression(node.left) && node.left.name.text === 'length'
          && ts.isNumericLiteral(node.right) && node.right.text === '0') return nonEmptyArray(node.left.expression)
        const left = valueOf(node.left, next), right = valueOf(node.right, next)
        const sample = left.sample || right.sample
        if (node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
          if (left.known && !left.value || right.known && !right.value) return fixed(false, sample)
          if (left.known && right.known) return fixed(right.value, sample)
        }
        if (node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
          if (left.known && left.value || right.known && right.value) return fixed(true, sample)
          if (left.known && right.known) return fixed(right.value, sample)
        }
        if (left.known && right.known && node.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) return fixed(left.value === right.value, sample)
        if (left.known && right.known && node.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) return fixed(left.value !== right.value, sample)
      }
      if (ts.isConditionalExpression(node)) {
        const condition = valueOf(node.condition, next)
        if (condition.known) {
          const branch = valueOf(condition.value ? node.whenTrue : node.whenFalse, next)
          return { ...branch, sample: condition.sample || branch.sample }
        }
      }
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        if (isImported(node.expression.text, 'workflowTextLanguage', '/workflowCopy') && node.arguments.length === 2) {
          const english = valueOf(node.arguments[1], next)
          if (english.known && !english.value && english.sample) return fixed(undefined, true)
        }
        const local = binding(node.expression.text, node)?.initializer
        if (local && ts.isArrowFunction(local) && !local.modifiers?.some(item => item.kind === ts.SyntaxKind.AsyncKeyword) && !ts.isBlock(local.body)) return valueOf(local.body, next)
      }
      return unknown
    }
    // The profile keeps a non-empty approved fallback on original routes.
    // Retain the new empty states in the audit unless that fact can be proved
    // from every branch, including each `.length > 0` branch condition.
    const nonEmptyArray = (node, assumptions = new Set(), visiting = new Set()) => {
      if (!node || visiting.has(node)) return unknown
      const next = new Set(visiting).add(node)
      if (ts.isParenthesizedExpression(node)) return nonEmptyArray(node.expression, assumptions, next)
      if (ts.isAsExpression(node)) return nonEmptyArray(node.expression, assumptions, next)
      if (ts.isIdentifier(node)) {
        if (assumptions.has(node.text)) return fixed(true)
        const initializer = binding(node.text, node)?.initializer
        return initializer ? nonEmptyArray(initializer, assumptions, next) : unknown
      }
      if (ts.isArrayLiteralExpression(node)) {
        if (!node.elements.length) return fixed(false)
        const values = node.elements.map(item => ts.isSpreadElement(item) ? nonEmptyArray(item.expression, assumptions, next) : fixed(true))
        return values.some(item => item.known && item.value) ? fixed(true, values.some(item => item.sample)) : unknown
      }
      if (ts.isConditionalExpression(node)) {
        const condition = valueOf(node.condition)
        if (condition.known) {
          const selected = nonEmptyArray(condition.value ? node.whenTrue : node.whenFalse, assumptions, next)
          return { ...selected, sample: selected.sample || condition.sample }
        }
        const truthy = new Set(assumptions)
        if (ts.isBinaryExpression(node.condition) && node.condition.operatorToken.kind === ts.SyntaxKind.GreaterThanToken
          && ts.isPropertyAccessExpression(node.condition.left) && node.condition.left.name.text === 'length'
          && ts.isIdentifier(node.condition.left.expression) && ts.isNumericLiteral(node.condition.right) && node.condition.right.text === '0') truthy.add(node.condition.left.expression.text)
        const yes = nonEmptyArray(node.whenTrue, truthy, next), no = nonEmptyArray(node.whenFalse, assumptions, next)
        return yes.known && no.known && yes.value && no.value ? fixed(true, yes.sample || no.sample) : unknown
      }
      return unknown
    }
    const template = (pattern, values) => {
      if (ts.isConditionalExpression(pattern)) {
        const yes = template(pattern.whenTrue, values), no = template(pattern.whenFalse, values)
        return yes && no ? `${pattern.condition.getText(tree)} ? ${yes} : ${no}` : null
      }
      if (!ts.isStringLiteral(pattern) && !ts.isNoSubstitutionTemplateLiteral(pattern)) return null
      const escape = text => text.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${')
      let cursor = 0, result = '', count = 0
      for (const match of pattern.text.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)) {
        const replacement = values.get(match[1])
        if (!replacement) continue
        result += escape(pattern.text.slice(cursor, match.index)) + '${' + replacement.getText(tree) + '}'
        cursor = match.index + match[0].length
        count++
      }
      return count ? '`' + result + escape(pattern.text.slice(cursor)) + '`' : JSON.stringify(pattern.text)
    }
    const edits = []
    const add = (node, text) => edits.push({ start: node.getStart(tree), end: node.end, text })
    const visit = node => {
      if (ts.isJsxSelfClosingElement(node) && ts.isIdentifier(node.tagName)
        && isImported(node.tagName.text, 'SampleLanguageSwitch', '/sample-language/SampleLanguageSwitch') && !node.attributes.properties.length) {
        add(node, '')
        return
      }
      if (inJsx(node)) {
        if (file === 'src/components/home/FloatingInfoCards.tsx' && ts.isJsxAttribute(node) && node.name.getText(tree) === 'key'
          && ts.isJsxOpeningElement(node.parent.parent) && ts.isIdentifier(node.parent.parent.tagName)
          && isImported(node.parent.parent.tagName.text, 'Reveal', '/common/Reveal')
          && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression?.getText(tree) === 'card.id') {
          // Intentional identity repair: locale changes must not replay Reveal.
          // No element, destination, content or other key expression is ignored.
          add(node.initializer.expression, 'card.title'); return
        }
        if (ts.isIdentifier(node) && inlineDisplayAliases[file]?.has(node.text) && binding(node.text, node)?.initializer) {
          add(node, binding(node.text, node).initializer.getText(tree)); return
        }
        if (file === 'src/components/about/ConductorProfileDocument.tsx' && ts.isArrowFunction(node) && ts.isBlock(node.body) && node.body.statements.length === 2) {
          const [statement, returned] = node.body.statements
          const variable = ts.isVariableStatement(statement) && statement.declarationList.declarations.length === 1 ? statement.declarationList.declarations[0] : null
          if (variable && statement.declarationList.flags & ts.NodeFlags.Const && ts.isIdentifier(variable.name) && variable.initializer && ts.isCallExpression(variable.initializer)
            && identity(variable.initializer.expression, 'translate') && variable.initializer.arguments.length === 1 && ts.isIdentifier(variable.initializer.arguments[0])
            && ts.isReturnStatement(returned) && returned.expression && isJsx(returned.expression)) {
            let body = returned.expression.getText(tree)
            const replacements = []
            const replaceAlias = child => {
              if (ts.isIdentifier(child) && child.text === variable.name.text) replacements.push(child)
              ts.forEachChild(child, replaceAlias)
            }
            replaceAlias(returned.expression)
            for (const child of replacements.sort((a, b) => b.pos - a.pos)) {
              const start = returned.expression.getStart(tree)
              body = body.slice(0, child.getStart(tree) - start) + variable.initializer.arguments[0].getText(tree) + body.slice(child.end - start)
            }
            add(node, `(${node.parameters.map(item => item.getText(tree)).join(', ')}) => (${body})`); return
          }
        }
        if (ts.isConditionalExpression(node)) {
          const condition = valueOf(node.condition)
          if (condition.known && condition.sample) {
            let selected = condition.value ? node.whenTrue : node.whenFalse
            while (ts.isParenthesizedExpression(selected) && isJsx(selected.expression)) selected = selected.expression
            if (ts.isJsxFragment(selected) && ts.isJsxExpression(node.parent)) {
              add(node.parent, source.slice(selected.openingFragment.end, selected.closingFragment.pos))
            } else if (selected.kind === ts.SyntaxKind.NullKeyword && ts.isJsxExpression(node.parent) && isJsx(node.parent.parent)) {
              add(node.parent, '')
            } else add(node, selected.getText(tree))
            return
          }
        }
        if (ts.isJsxAttribute(node) && node.name.getText(tree) === 'lang' && node.initializer && ts.isJsxExpression(node.initializer)) {
          const value = valueOf(node.initializer.expression)
          if (value.known && value.sample && value.value === undefined) { add(node, ''); return }
        }
        if (ts.isCallExpression(node) && node.arguments.length) {
          if (identity(node.expression, 'translate') || identity(node.expression, 'href')) { add(node, node.arguments[0].getText(tree)); return }
          if (ts.isIdentifier(node.expression)) {
            const local = functions.get(node.expression.text)
            const returned = local?.body?.statements.length === 1 && ts.isReturnStatement(local.body.statements[0]) ? local.body.statements[0].expression : null
            if (file === 'src/pages/public/ContactPage.tsx' && node.expression.text === 'displaySupportAmounts' && node.arguments.length === 1) {
              const declaration = binding(node.expression.text, node)?.initializer
              const expected = "amounts.map(amount => workflowCopy(translate, '{amount}원', { amount: amount.toLocaleString('ko-KR') })).join(' · ')"
              const calls = []
              const find = child => { if (ts.isCallExpression(child)) calls.push(child); ts.forEachChild(child, find) }
              if (declaration) find(declaration)
              const interpolation = calls.find(call => ts.isIdentifier(call.expression) && isImported(call.expression.text, 'workflowCopy', '/workflowCopy'))
              if (declaration && ts.isArrowFunction(declaration) && tokens(declaration.body.getText(tree)) === tokens(expected)
                && interpolation && identity(interpolation.arguments[0], 'translate')) {
                add(node, `formatSupportAmounts(${node.arguments[0].getText(tree)})`); return
              }
            }
            if (file === 'src/components/contact/SupportPledgeForm.tsx' && node.expression.text === 'formatAmount' && node.arguments.length === 2 && identity(node.arguments[1], 'translate')
              && returned && tokens(returned.getText(tree)) === tokens("workflowCopy(translate, '월 {amount}원', { amount: amount.toLocaleString('ko-KR') })")
              && isImported('workflowCopy', 'workflowCopy', '/workflowCopy')) {
              add(node, `formatAmount(${node.arguments[0].getText(tree)})`); return
            }
            if (returned && !local.modifiers?.some(item => item.kind === ts.SyntaxKind.AsyncKeyword) && ts.isConditionalExpression(returned) && ts.isIdentifier(returned.condition) && ts.isIdentifier(returned.whenFalse)) {
              const conditionIndex = local.parameters.findIndex(item => item.name.getText(tree) === returned.condition.text)
              const originalIndex = local.parameters.findIndex(item => item.name.getText(tree) === returned.whenFalse.text)
              const condition = conditionIndex >= 0 ? valueOf(node.arguments[conditionIndex]) : unknown
              if (condition.known && condition.sample && !condition.value && originalIndex >= 0 && node.arguments[originalIndex]) {
                add(node, node.arguments[originalIndex].getText(tree)); return
              }
            }
            if (isImported(node.expression.text, 'workflowDate', '/workflowCopy') && node.arguments.length >= 3) {
              const english = valueOf(node.arguments[2])
              if (english.known && english.sample && !english.value) { add(node, node.arguments[1].getText(tree)); return }
            }
            if (isImported(node.expression.text, 'workflowRecruitmentPeriod', '/workflowCopy') && node.arguments.length === 2 && identity(node.arguments[1], 'translate')) {
              add(node, node.arguments[0].getText(tree)); return
            }
            if (isImported(node.expression.text, 'workflowCopy', '/workflowCopy') && node.arguments.length === 3 && identity(node.arguments[0], 'translate') && ts.isObjectLiteralExpression(node.arguments[2])) {
              const values = new Map(node.arguments[2].properties.flatMap(item => ts.isPropertyAssignment(item)
                ? [[item.name.getText(tree), item.initializer]] : ts.isShorthandPropertyAssignment(item) ? [[item.name.text, item.name]] : []))
              const pattern = node.arguments[1], title = values.get('title')?.getText(tree)
              let replacement
              // These source formats pre-date template interpolation. Preserve
              // their captured syntax only for the same literal templates.
              if (file === 'src/pages/public/ConcertsPage.tsx' && title && ts.isConditionalExpression(pattern)
                && ts.isStringLiteral(pattern.whenTrue) && pattern.whenTrue.text === '{title} 공연 기록 보기'
                && ts.isStringLiteral(pattern.whenFalse) && pattern.whenFalse.text === '{title} 공연 상세 보기') {
                replacement = '`${' + title + '} ${' + pattern.condition.getText(tree) + ' ? \'공연 기록\' : \'공연 상세\'} 보기`'
              }
              if (file === 'src/pages/public/GalleryPage.tsx' && title) {
                if (ts.isConditionalExpression(pattern) && ts.isStringLiteral(pattern.whenTrue) && pattern.whenTrue.text === '{title} 포스터 크게 보기'
                  && ts.isStringLiteral(pattern.whenFalse) && pattern.whenFalse.text === '{title} 사진 크게 보기') replacement = `${title} + (${pattern.condition.getText(tree)} ? ' 포스터' : ' 사진') + ' 크게 보기'`
                if (ts.isStringLiteral(pattern) && ['{title} 포스터', '{title} 영상 보기', '{title} 영상 썸네일'].includes(pattern.text)) replacement = `${title} + ${JSON.stringify(pattern.text.slice(7))}`
              }
              if (file === 'src/pages/public/ContactPage.tsx' && title && ts.isStringLiteral(pattern) && ['{title} 지도', '{title} 사진'].includes(pattern.text)) {
                replacement = `(${title}) + ${JSON.stringify(pattern.text.slice(7))}`
              }
              replacement ??= template(pattern, values)
              if (replacement) { add(node, replacement); return }
            }
          }
        }
        if (file === 'src/components/contact/ContactInquiryForm.tsx' && binding('translate', node)?.api === 'translate'
          && ts.isBinaryExpression(node) && ts.isJsxExpression(node.parent) && isJsx(node.parent.parent)
          && ts.isStringLiteral(node.right) && node.right.text === '') {
          // React renders null/undefined and an empty string identically. For
          // `||`, require the same expression to be the enclosing truthy guard.
          let sameTruthyGuard = false
          for (let parent = node.parent; parent; parent = parent.parent) if (ts.isConditionalExpression(parent) && parent.condition.getText(tree) === node.left.getText(tree)) sameTruthyGuard = true
          if (node.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken || node.operatorToken.kind === ts.SyntaxKind.BarBarToken && sameTruthyGuard) { add(node, node.left.getText(tree)); return }
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(tree)
    if (!edits.length) return source
    for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.text + source.slice(edit.end)
  }
  return source
}
