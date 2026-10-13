import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// This is a pure-data module: load the real production sources without starting
// a native Vite SSR worker just to test counters and field descriptions.
// Keep dependency identities explicit rather than substituting test fixtures.
async function moduleUrl(path, dependencies = {}) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  let code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText
  for (const [specifier, url] of Object.entries(dependencies)) {
    code = code.replaceAll(`'${specifier}'`, JSON.stringify(url)).replaceAll(`"${specifier}"`, JSON.stringify(url))
  }
  return `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
}

const youtube = await moduleUrl('../../utils/youtube.ts')
const model = await moduleUrl('./sampleContentModel.ts', { '../../utils/youtube': youtube })
export const guidance = await import(await moduleUrl('./sampleContentGuidance.ts', { './sampleContentModel': model }))
