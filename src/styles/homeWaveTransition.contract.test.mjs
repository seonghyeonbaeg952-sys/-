import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const stylesDirectory = new URL('./', import.meta.url)

async function readStylesheets() {
  const fileNames = (await readdir(stylesDirectory)).filter((fileName) =>
    fileName.endsWith('.css'),
  )

  return Promise.all(
    fileNames.map(async (fileName) => ({
      fileName,
      source: await readFile(new URL(fileName, stylesDirectory), 'utf8'),
    })),
  )
}

function findStationaryFinalePaint({ fileName, source }) {
  const sourceWithoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '')
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g
  const violations = []

  for (const match of sourceWithoutComments.matchAll(rulePattern)) {
    const selectors = match[1]
      .split(',')
      .map((selector) => selector.replace(/\s+/g, ' ').trim())
    const declarations = match[2]
    const paintsBackground = /(?:^|;)\s*background(?:-color)?\s*:\s*(?!transparent\b|none\b)/i.test(
      declarations,
    )

    if (!paintsBackground) {
      continue
    }

    selectors.forEach((selector) => {
      if (selector.endsWith('.home-flow-sample-chunk--finale')) {
        violations.push(`${fileName}: ${selector}`)
      }
    })
  }

  return violations
}

test('스크롤 전환의 고정 finale 래퍼는 배경을 칠하지 않는다', async () => {
  const stylesheets = await readStylesheets()
  const violations = stylesheets.flatMap(findStationaryFinalePaint)

  assert.deepEqual(
    violations,
    [],
    `움직이지 않는 finale 래퍼가 전환판보다 먼저 노출됩니다:\n${violations.join('\n')}`,
  )
})

