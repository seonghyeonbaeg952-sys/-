import assert from 'node:assert/strict'
import { after, test } from 'node:test'

import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  root: process.cwd(),
  server: { middlewareMode: true },
})
const spiritHeritage = await vite.ssrLoadModule('/src/lib/spiritHeritage.ts')
const spiritContent = await vite.ssrLoadModule('/src/constants/spiritContent.ts')

after(async () => {
  await vite.close()
})

test('wraps Spirit tab navigation in both directions', () => {
  assert.equal(spiritHeritage.getNextSpiritIndex(0, 4, -1), 3)
  assert.equal(spiritHeritage.getNextSpiritIndex(3, 4, 1), 0)
  assert.equal(spiritHeritage.getNextSpiritIndex(1, 4, 1), 2)
})

test('returns no selection when a Spirit tab collection is empty', () => {
  assert.equal(spiritHeritage.getNextSpiritIndex(0, 0, 1), -1)
})

test('reveals lineage milestones one segment at a time and clamps progress', () => {
  assert.equal(spiritHeritage.getMilestoneRevealProgress(-1, 0, 4), 0)
  assert.equal(spiritHeritage.getMilestoneRevealProgress(0.125, 0, 4), 0.5)
  assert.equal(spiritHeritage.getMilestoneRevealProgress(0.125, 1, 4), 0)
  assert.equal(spiritHeritage.getMilestoneRevealProgress(0.375, 1, 4), 0.5)
  assert.equal(spiritHeritage.getMilestoneRevealProgress(2, 3, 4), 1)
})

test('accelerates the lineage sequence so it completes before the section ends', () => {
  assert.equal(spiritHeritage.getAcceleratedTimelineProgress(-1), 0)
  assert.equal(spiritHeritage.getAcceleratedTimelineProgress(0.34), 0.5)
  assert.equal(spiritHeritage.getAcceleratedTimelineProgress(0.68), 1)
  assert.equal(spiritHeritage.getAcceleratedTimelineProgress(1), 1)
})

test('positions Spirit hash targets directly below the shared header', () => {
  assert.equal(spiritHeritage.getSpiritAnchorScrollTop(500, 20), 428)
  assert.equal(spiritHeritage.getSpiritAnchorScrollTop(40, 20), 0)
  assert.equal(spiritHeritage.getSpiritAnchorScrollTop(500, 20, 72), 448)
})

test('presents the education journey as five focused stages', () => {
  assert.equal(spiritContent.educationJourneySteps.length, 5)
  assert.deepEqual(
    spiritContent.educationJourneySteps.map((step) => step.step),
    ['듣기', '해석하기', '조율하기', '약속 지키기', '섬기기'],
  )
})
