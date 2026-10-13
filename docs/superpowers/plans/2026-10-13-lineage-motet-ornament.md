# Lineage MOTET Ornament Implementation Plan

> **For agentic workers:** Use inline executing-plans execution for this scoped change. No sub-agents are authorized for this turn. Steps use checkbox syntax for tracking.

**Goal:** On desktop only, replace the lineage line with repeated MOTET lettering: each character follows the curve's position and rotates exactly 90 degrees, retaining the current orange scroll-fill effect.

**Architecture:** A pure model samples each character's position on the original curve, using equal vertical spacing to prevent overlaps. An isolated SVG component renders two identical sets of characters at a fixed 90-degree rotation. The existing MotionValue draws a hidden white stroke mask over the orange characters; the grey text remains underneath. NOW/NEXT entrance transforms stay in text-only children, separate from their decorative dots and CMS placement anchors.

**Tech Stack:** Existing React, TypeScript, motion/react and SVG; no new dependency.

**Spec:** User's 2026-10-13 instructions and attached curve screenshot: replace only the line with repeated MOTET, keep the effect, desktop only, fixed 90-degree rotation with the top facing right, and position each individual letter along the curve. Latest clarification: use the same gap between words as between individual letters.

## Global Constraints

- Preserve the existing useScroll offsets, 0.68 acceleration, spring configuration, section length, photos, copy and CMS values.
- Preserve Korean/English and mobile/tablet/desktop copy isolation and point-position editing.
- Keep SVG decorative (`aria-hidden`) and complete the orange fill immediately for reduced motion.
- Do not add gradients, glow, looping effects, font dependencies or database writes.
- Mobile/tablet retain the original SVG curve, dimensions and stroke.
- Rollback checkpoint: clean starting commit `5be6d5c2f06fed1a8ed86a172366cce0c89e91b1`; user data is never modified.

### Task 1: Replace the curve's painted output, retaining its motion input

**Files:**
- Create: `src/components/spirit/LineageMotetOrnament.tsx`
- Create: `src/components/spirit/LineageMotetOrnament.test.mjs`
- Create: `src/components/spirit/lineageMotetModel.ts`, `lineageMotetModel.test.mjs`
- Modify: `src/components/spirit/SpiritHeritageExperience.tsx`
- Modify: `src/styles/spirit-heritage.css`
- Modify: `scripts/run-tests.mjs`

**Interface:** `LineageMotetOrnament({ progress, reducedMotion }: { progress: MotionValue<number>; reducedMotion: boolean })`.

- [x] Write and run failing SSR/model tests for the repeated, individually positioned characters, unique mask IDs, progress 0/0.5/1, reduced-motion completion and desktop-only rendering.
  ```js
  assert.ok(Math.abs(model.getLineageCurvePointAtHeight(0.5).y - 520.512248) < 0.000001)
  assert.match(render(0, true), /path-length:1(?:px)?|stroke-dasharray="1(?:px)? 1(?:px)?"/)
  ```
- [x] Render a white motion.path in a user-space mask. Both identical sets of individual characters use sampled curve positions, `rotate(90)`, centered text and 24px existing condensed type. Only the orange layer receives the mask. Render 14 repetitions without extra word-gap slots, retaining the curve's covered height.
- [x] Run the word-boundary regression test red before removing blank slots, then green after making word and letter advances identical.
- [x] Pass the existing `pathProgress` and `reducedMotion` directly from HeritageTimeline; do not add another scroll listener, spring, duration or animation state.
- [x] Use existing condensed type and orange token. Preserve desktop dimensions and keep the exact original curve for mobile/tablet without moving their copy columns.
- [x] Keep the desktop lettering 16px clear of the existing independently edited English NOW dot. Preserve CMS values, curve shape, vertical extent and timing; small-screen line placement remains unchanged.
- [x] Register both new test files and run them alongside the Spirit source/CMS contracts. Review intentional markup changes before updating only Spirit's fingerprints.

### Task 2: Verify the actual rendered result, then commit and push

**Files:**
- Modify: `src/content/siteCopyAboutCatalog.test.mjs`, `docs/public-copy-default-baseline.json` (reviewed Spirit snapshots only).
- Modify: `docs/spirit-cms-guide.md` (ornament behavior).

- [x] Run `pnpm lint`, `pnpm build`, `pnpm test` and `node --test src/lib/spiritHeritage.test.mjs`. Investigate failures and record any unrelated native-worker instability honestly.
- [x] In the browser, sample real scroll frames at 390/768/1440px in Korean and English: stationary dot centers, text movement, mask progress, no horizontal overflow. Inspect the character group matrices to confirm fixed 90-degree rotation and check desktop-only rendering.
- [x] Check reduced motion, reverse scrolling, refresh and the specified public routes. Save screenshots and measurement JSON outside Git.

**Release gate:** Inspect the scoped diff, commit on main, push the already-authorized remote and verify Vercel READY for that exact commit before the final handoff. Preserve noindex and owned-domain routing. Record the actual commit and release status in the final handoff, without a second documentation-only auto-deployment.

## Verification Notes

- The first full run after compact spacing reported 1,186 passes, 11 skips and one native `SiteImage.test.mjs` process failure. That unchanged photo test immediately passed all three assertions in isolation. This is not treated as a clean full-suite pass; rerun after the final spacing/clearance change.
- The final full run after clearance reported 1,187 passes, 11 skips and the same single `SiteImage.test.mjs` file-process failure. Its three isolated tests passed again. This existing test-runner instability remains an explicit risk; neither full run is described as fully passing.
- Final scoped suite: 71 passes, no failures. Fresh `pnpm lint` and `pnpm build` passed. No production dependency, saved CMS document, database row or deployment/security setting was changed.
- Rendered Korean/English checks: mobile 390px, tablet 768px, desktop 1440px, plus 1920px desktop and 1366px coarse-pointer landscape tablet. Desktop carries 70 separately positioned letters; small-screen variants carry none. Final animation samples found no glyph/dot intersections, no adjacent glyph collisions and no horizontal overflow. Dot center drift was below 0.001px while the labels moved independently.
- Eight required public routes at three widths were checked after loading completed (24 route/viewport checks). The unmodified accompanist route currently displays its empty-state fallback; this task does not add or publish CMS profile records. Screenshot/measurement artifacts are kept outside Git.
