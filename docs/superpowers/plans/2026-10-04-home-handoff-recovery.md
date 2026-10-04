# Home handoff recovery implementation plan

> **For agentic workers:** Execute the tasks inline with independent read-only agents reviewing the cause and the rendered flow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the original home animation pacing and keep the hero pinned until the following panel has covered it, without the old invisible six-second startup wait.

**Architecture:** Restore the coupled desktop geometry (two viewport intro, one viewport overlap) independently of animation duration. Retain the safe preparation/cleanup code and complete the startup hold from both visible field and hero-copy animations, never the hidden sweep.

**Tech Stack:** React, TypeScript, Vite, CSS sticky positioning, requestAnimationFrame, Node tests and isolated Playwright/Edge.

**Spec:** User report: the following panel rises partway then scrolls away with the collage; startup and collage pacing and scroll hold were unintentionally shortened.

## Global constraints

- Preserve CMS, published copy, photos, security, translations and the recent restrained visual changes.
- No new dependency or scroll interception; compact and reduced-motion modes remain ordinary flow.
- Checkpoint: `checkpoint/home-handoff-before-recovery-20261004` at `96847fa`.
- No writes to Supabase or CMS during QA; capture evidence outside the repository.

### Task 1: Restore complete panel coverage and collage pacing

**Files:** `src/pages/sample/HomeV4SamplePage.tsx`, `src/pages/sample/HomeV4SamplePage.css`, `src/pages/sample/homeHeroHandoff.test.mjs`, `src/styles/publicRefinement.browser.test.mjs`.

**Interfaces:** Existing CSS intro height, flow margin, guide exit properties and paper-piece inline transforms. No public API change.

- [x] Run actual production effect test with all 26 paper pieces; at 1400ms the collage must still be in progress, at 3280ms settled, and reverse completes at 960ms.
- [x] In an offline fixture using production CSS, scroll a real sticky hero while the following plane is still below the header; assert hero top remains zero. Continue until the plane covers the hero, then assert the hero can leave. Test 1366×768, 1440×900 and 1920×1200.
- [x] Observe the tests fail against current code for prematurely completed motion and premature sticky release.
- [x] Restore `height: calc(200svh + var(--home-v4-hero-handoff-hold))`, `margin-top: -100svh`, hold `clamp(200px,26svh,260px)` and matching JS hold. Restore `3280` forward / `960` reverse; keep frame cancellation fixes.
- [x] Run effect and browser tests, then actual wheel/pause/resume/reverse public-page QA.

### Task 2: Restore authored startup pacing without hidden waiting

**Files:** `src/components/home/HomeHeroIntroOverlay.tsx`, its motion test, `src/styles/home-v6-fixes.css`, the hero-copy CSS and browser fixture test.

**Interfaces:** Startup completion listens to field and copy animationend; cancellation, Escape, navigation and watchdog still release ownership safely.

- [x] Test visible field completion alone cannot cut off the remaining hero-copy fade; both completions release immediately, regardless of event order. Cancellation and a missing completion have bounded cleanup.
- [x] Observe RED against current early finish and 1100ms watchdog.
- [x] Restore original field/word/tail/background/hero-copy durations and authored stagger. Preserve corrected selector specificity.
- [x] Finish only after both visible animations complete (missing or non-animated hero copy needs only field); set watchdog to 1900ms, not the historical hidden-sweep six seconds.
- [x] Run targeted tests and inspect actual animation completion plus root unlock with native input.

### Task 3: Verification and handoff

- [x] During visible collage assembly, completion and reverse, stop only the photographic hero's pointer parallax. Clear previous pointer ownership on scroll and cancel queued frames on pointerleave. Preserve pointer interaction on the photo after the reverse completes, and on other cards. Execute the actual `useHomeMotionDirector` hook and actual collage effect before/after the change; native A/B must distinguish stable paper styles from pixel changes underneath them.
- [x] Verify reduced motion clears both sticky priority and negative overlap using production CSS. Restore normal flow in that mode only.
- [x] Keep the operational-error card inside the following plane (after quick links) so a failed request cannot add a spacer between the sticky parent and the panel. Execute actual HomePage JSX/common retry UI in `src/pages/public/HomePage.handoff.test.mjs`, retain the existing copy and refetch handler, and register it in `scripts/run-tests.mjs`.
- [x] Run `pnpm lint`, `pnpm build`, and `pnpm test` on final source (1123 passed, zero failed/cancelled/skipped).
- [x] Verify Korean and English desktop full handoff, compact tablet/mobile flow, reduced motion and reverse scroll. Capture identity/content/overlay/errors/screenshots/interaction evidence.

The first full run passed 1122/1123: only the deliberately relocated HomePage error-boundary markup snapshot failed. Before updating its fingerprint, compare both the exact error subtree and all remaining emitted JSX against HEAD: both are unchanged. Only the boundary position is different. Preserve all other fingerprints and mutation checks; the reviewed snapshot plus the actual HomePage handoff tests pass 29/29. A fresh full run follows the narrowly reviewed update. Final command exits and Git handoff are reported separately after they complete.
- [x] Independently review the scoped patch and prepare narrow staging. Commit/push and remote SHA verification follow the successful checks and are recorded in the final response. Never force push or deploy.
