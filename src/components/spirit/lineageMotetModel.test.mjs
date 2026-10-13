import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const path = '/src/components/spirit/lineageMotetModel.ts'
const vite = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
after(() => vite.close())
const model = existsSync(`.${path}`) ? await vite.ssrLoadModule(path) : {}

test('word placement samples the original three-segment curve without changing its endpoints', () => {
  assert.equal(typeof model.getLineageCurvePoint, 'function')
  assert.deepEqual(model.getLineageCurvePoint(0), { x: 66.4009, y: 0.514496 })
  assert.deepEqual(model.getLineageCurvePoint(1), { x: 82.4009, y: 1040.51 })
  const middle = model.getLineageCurvePoint(0.5)
  assert.ok(Math.abs(middle.x - 128.650975) < 0.000001)
  assert.ok(Math.abs(middle.y - 500.514) < 0.000001)
})

test('word placement clamps out-of-range progress and does not emit invalid coordinates', () => {
  assert.equal(typeof model.getLineageCurvePoint, 'function')
  assert.deepEqual(model.getLineageCurvePoint(-1), { x: 66.4009, y: 0.514496 })
  assert.deepEqual(model.getLineageCurvePoint(2), { x: 82.4009, y: 1040.51 })
  assert.deepEqual(model.getLineageCurvePoint(Number.NaN), { x: 66.4009, y: 0.514496 })
})

test('individual letters keep vertical spacing even where the curve has a steep or shallow tangent', () => {
  assert.equal(typeof model.getLineageCurvePointAtHeight, 'function')
  const middle = model.getLineageCurvePointAtHeight(0.5)
  assert.ok(Math.abs(middle.y - 520.512248) < 0.000001)
  assert.ok(middle.x > 120 && middle.x < 130)
  assert.deepEqual(model.getLineageCurvePointAtHeight(-1), { x: 66.4009, y: 0.514496 })
  assert.deepEqual(model.getLineageCurvePointAtHeight(2), { x: 82.4009, y: 1040.51 })
})

test('word boundaries use the same spacing as adjacent letters', () => {
  const letters = model.LINEAGE_MOTET_LETTERS
  assert.ok(Array.isArray(letters))
  const letterGap = letters[1].y - letters[0].y
  assert.ok(letterGap > 0)
  for (let index = 5; index < letters.length; index += 5) {
    const wordGap = letters[index].y - letters[index - 1].y
    assert.ok(Math.abs(wordGap - letterGap) < 0.000001, 'Words must not leave an extra blank slot')
  }
})
