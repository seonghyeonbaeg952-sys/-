# Home intro scroll release implementation plan

> **For agentic workers:** Use executing-plans for inline implementation and independent read-only subagent review. Steps use checkboxes; do not redesign the home or alter stored CMS data.

**Goal:** Let visitors leave the opening animation without a six-second dead lock, and shorten the desktop hero's pinned handoff while preserving its approved composition.

**Architecture:** HomeHeroIntroOverlay no longer locks the root or restores old scroll coordinates. Native scroll remains available during font preparation; passive scroll intent dismisses only the decorative overlay. HomeV4SamplePage owns desktop-only handoff distance/timing; adjust its owning CSS and existing RAF effect together. Do not add a library or intercept scrolling.

**Tech Stack:** Existing React/TypeScript, CSS animations, Vite, node:test and bundled browser runtime.

**Spec:** The user's current request: “홈 인트로 스크롤고정 너무 오래잡히는데”. Additional small polish is secondary to this confirmed interaction defect.

## Constraints and evidence

- Checkpoint: checkpoint/design-after-personas-20261004 at 79b2ca431debb4d0005dda51d14438e233dfcd02. Existing unrelated artifacts are preserved.
- No new gradient/glitter/curtain/lace, factual copy change, image replacement, CMS save, financial-data change or submission.
- Before this fix, root lock waited for home-intro-real-sweep, but the production theme sets that element display:none. Agent independently observed overflow:hidden after the visible field was transparent; wheel input did not move scrollY.
- Desktop intro is 200svh plus 200–260px; at 1440×900 this is 2034px with a 900px sticky hero. Tablet/phone already use normal flow and must remain so.
- Existing visible field-release ends at 760+620ms after animation readiness. Follow that actual event; retain Escape, preference, unmount cleanup and separately owned body-popup lock.
- Do not rerun the previous refinement's Impeccable detector or claim another large design research count.

## Task 1: Opening lock release

**Files:** HomeHeroIntroOverlay.tsx and HomeHeroIntroOverlay.motion.test.mjs.

- [x] Extend existing actual-effect tests and observe real red before source changes. The first event-based attempt passed unit checks but real first-wheel input still did not move. Preserve that failure; do not claim it passed.
- [x] Refine the cause: overflow:hidden prevents the native scroll target from accepting its first wheel, even if restored in the callback. Remove root overflow/gutter/scrollBehavior writes and keepPosition entirely. Passive wheel/touch/actual-scroll and non-editing scroll keys dismiss the overlay without preventDefault/scrollTo. Keep other popup ownership untouched.
- [x] Write the revised unblocked-scroll test first; seven expected assertions failed against the first attempt. After the simpler implementation, thirteen actual-effect tests passed. Stalled fonts/animation cap only overlay lifetime at 2400ms; scrolling itself is never locked by this component. Later font completion cannot replay it.
- [x] Finish idle overlay on the actual home-intro-field-release end/cancel; retain Escape, preference and unmount cleanup. Root native fresh-load overlay was present with overflow empty; one page-scroll input moved scrollY to 900 and removed the overlay.

## Task 2: Desktop handoff length

**Files:** HomeV4SamplePage.css, HomeV4SamplePage.tsx, publicRefinement.browser.test.mjs and an actual-effect handoff regression if needed.

- [x] Add rendered sticky-distance/following-plane checks at 1366/1440/1920 plus normal-flow compact modes. Add homeHeroHandoff.test.mjs executing the actual effect, forward/reverse settlement and interruption; observe red before source changes, then green.
- [x] Intro: 160svh + 64–96px/8svh, matching existing effect values. Update the paired flow overlap to -60svh so resting quick cards stay at their original origin; 1440×900 native quick top is still 732px. Forward/reverse timing 1400/600ms; assets/keyframe geometry unchanged. Cancel the active RAF immediately when reduced-motion or compact mode interrupts it.
- [x] Independent native-browser confirmation: a first 500px wheel during the attached desktop overlay moved scrollY 0→500 and removed only the overlay. 1180×820 tablet and 390×844 phone also moved 0→500 with normal flow and no horizontal overflow. At 1440×900, pinned travel fell from 1134px to 612px, quick-card top stayed 732px, and y1000 showed the following photo (opacity 1). Escape, control-key boundaries and interruption have actual-effect regression tests; do not claim those unit checks as physical-device input coverage.

## Task 3: Safe integration

- [x] Run targeted tests, pnpm lint, pnpm build, browser-enabled pnpm test and scoped git diff --check. Final full run: 1092 passed, 0 failed/cancelled/skipped, exit 0. Earlier implementation failures are recorded under Task 1, not hidden.
- [ ] Commit only this request's files and push the existing branch under the user's prior integration authorization; no force push, PR, merge or direct deployment.
- [x] Reset temporary viewport to the existing IAB default 1280×720 and mark the existing KO home tab as a deliverable. Development server remains available; no server was stopped.

Final-tree targeted command: node --test --test-concurrency=1 for HomeHeroIntroOverlay.motion.test.mjs, homeHeroHandoff.test.mjs, publicRefinement.browser.test.mjs, homeHoldScroll.test.mjs and SupportPledgeForm.test.mjs: 63 passed, 0 failed, exit 0. Final-tree pnpm lint and pnpm build also exited 0. Full browser-enabled pnpm test finished with 1092 passed and exit 0. This plan precedes the commit, so the commit checkbox above intentionally remains pending; the actual commit/push identity will be recorded after execution in the separate additional-pass evidence log.

Independent Edge keyboard check: PageDown keydown while the overlay was attached and BODY focused moved scrollY 0→703 and removed the overlay. Space while the Our Spirit button was focused matched the interactive boundary, kept scrollY 0 and did not dismiss the overlay. That button's expanded state already changed on focus, so activation by Space is not claimed. A later optional fresh-navigation attempt timed out; it was preserved as a browser-check limitation, not counted as a confirmed app defect or successful check.

Implementation proceeds inline without another user question; independent screen review is delegated separately. Further optional visual polish is deferred until this confirmed scroll problem is resolved.

## Small parallel public-state correction from the additional review

The prior bank-note inconsistency is addressed only at display time: completed account rows plus one of four exactly known legacy registration placeholders may omit that stale note. A different custom note, even mentioning CMS, must stay intact. The saved KO/EN settings, financial fields, submission, permissions and publications are not changed. SupportPledgeForm.tsx and its existing tests are owned by the delegated implementer; root reviews the diff and runs final gates. No broad substring/regex filter is acceptable.

Delegated actual-effect tests: 26 total, initial red 10 failed/16 passed, final green 26/26. Six independent anonymous browser states (390px/1440px × KO public/EN public/EN sample) retained complete bank rows and their copy button, hid the exact pending note, and made zero writes. Saved settings are frozen in the new test harness to reject accidental mutation. No account ownership or financial correctness is being certified.
