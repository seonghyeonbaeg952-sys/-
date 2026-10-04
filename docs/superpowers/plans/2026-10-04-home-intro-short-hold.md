# Restore a brief home intro hold implementation plan

> **For agentic workers:** Use executing-plans inline with an independent read-only reviewer. The user's correction replaces the previous no-lock behavior; do not treat a removed lock as satisfying it.

**Goal:** Preserve the desktop opening animation and scroll hold, shorten the complete sequence to about one second, and prevent prolonged or leaked locks.

**Architecture:** HomeHeroIntroOverlay separates scrollable preparation (1200ms fallback) from a real playing hold ended by the retained 890ms field animation. A1100ms watchdog allows first-frame/event-delivery lag without extending normal completion. Phase-local first-start refs prevent StrictMode deadline renewal; the playing budget begins after pre-hold style reads, not before readiness. Only Escape, actual navigation, preference/compact changes or unmount interrupt it. Existing sticky handoff, assets, copy, CMS and body-owned popups are unchanged. Restore only matching owned root inline values.

**Tech Stack:** Existing React/TypeScript, production CSS, actual-effect node:test harness and Browser runtime; no dependency.

**Spec:** “제거하지말고 줄이라고 그리고 정밀검사들어가”. Verification covers home opening/input/handoff/lifecycle states, not a claim of certifying every site feature or real hardware.

## Constraints

- Recovery tag checkpoint/home-intro-before-short-lock-20261004 preserves 1a9978d7d14a63d211094ec0cba24f4b7983fdc9. Reuse the existing codex/recover-homepage-work branch and running server rather than moving the user's workspace.
- Do not restore the six-second lock or depend on the hidden sweep.
- Do not instantly dismiss on wheel/touch/PageDown: a short real hold is the user's requested behavior.
- No new decoration, gradients, copy/photo/CMS/finance/Auth/RLS/data writes.
- No scrollTo reset, queued surprise scroll or global preventDefault handlers. A normal wheel after release must scroll.

## Task 1: Brief hold and lifecycle safety

**Files:** src/components/home/HomeHeroIntroOverlay.tsx; src/components/home/HomeHeroIntroOverlay.motion.test.mjs.

- [x] Change the actual-component tests first. The first candidate restored a real hold from preparation and caught deletion/early intent dismissal. Precision later showed that preparation could consume the playing animation; revised tests require unlocked preparation, a genuine hold once ready, no wheel/key-intent skip while playing, a1100ms playing fallback and no replay after late fonts.
- [x] Verify real RED against the current no-lock implementation using node --test src/components/home/HomeHeroIntroOverlay.motion.test.mjs: 11 expected failures/4 passes after correcting two test expectations before production edits.
- [x] Implement bounded ownership: snapshot overflow/gutter, set overflow hidden and stable gutter, define an idempotent release; restore matching owned values before setIsDismissed. Listen to the retained field's end/cancel, Escape and actual scroll movement. No native-input dismissal listeners. Example contract:

```ts
const budgetRef = isAnimationReady ? introPlayingAtRef : introPreparedAtRef
const startedAt = budgetRef.current ??= performance.now() // after pre-hold style reads
const phaseDeadline = isAnimationReady ? 1100 : 1200
const deadline = window.setTimeout(finish, Math.max(0, phaseDeadline - (performance.now() - startedAt)))
// finish releases owned root styles synchronously, then dismisses.
// cleanup clears the deadline/listeners and calls the same release.
```

- [x] Permanently dismiss on compact/reduced preference transitions so returning to desktop cannot restart a preparing intro. Tests exercise a desktop→tablet→desktop and reduced→normal sequence, unmount, a separately locked body popup, overwritten root styles, and programmatic anchor movement without restoring old coordinates.
- [x] Initial green15/15, then native StrictMode diagnosis and replay regression RED1/15→GREEN16/16. That intermediate source passed the full1096 suite but was not accepted as final: a font fallback and dismissal firing together proved a cold-load sequence could still be cut before readiness. The revised two-phase contract had real RED13 failed/4 passed→GREEN17/17. A costly pre-hold style-read case then had RED1 failed/17 passed→GREEN18/18 after moving phase-start capture after that read. Timers may execute late on blocked main threads; no unconditional physical wall-clock guarantee is claimed.

## Task 2: Retained animation compressed, not removed

**Files:** src/styles/home-v6-fixes.css; src/pages/sample/HomeV4SamplePage.css; src/styles/publicRefinement.browser.test.mjs.

- [x] Add a rendered CSS timing check before changing timing. Retained words/tails/field/wordmark have real named animations, positive durations and the field's total delay+duration is under one second; every visible word/tail ends before the overlay exits. RED recorded the expected timing failure, then owning CSS changed.
- [x] Scale the existing sequence: field 400ms+490ms; words400ms at70/110/150/190ms; tails240ms at370/410/450/480ms; wordmark150ms+730ms; background500ms+50ms. Preserve shapes, colors, images and layout. Fix word-delay selector specificity so the shorthand no longer erases the intended stagger. Hero-copy handoff880ms with opacity beginning82% ends before the field; do not reveal still-hidden copy when removing the overlay. Hidden shutters/sweep remain hidden.
- [x] Rendered timing and adjacent surface tests passed 17/17, including sticky-distance/quick-menu/compact regressions.

## Task 3: Precise input and final gates

- [x] Independent native inspection executed in 11 approved isolated contexts, with failed thresholds preserved. Initial eight states verified KO/EN genuine hold and post-release input, reduced/compact modes, interruption, Escape/programmatic navigation; two diagnostics separated replay and scheduling latency, final one verified equal replay deadlines (0.5ms difference) and post-release native wheel520px. Final early wheel missed the hold and is not counted as a pass. Browser-native reload restoration failed; the actual-component already-scrolled branch still passes.
- [x] Final two-phase native inspection executed: KO actual completion/input pass, pending-font safe unlocked skip (animation completion unverified), and EN900ms watchdog truncating the last field/mark fade. CSS timeline began~60ms after the playing clock, so10ms slack was insufficient. Preserve phase-final.json; do not represent the three states as all passed.
- [x] Watchdog-only1100ms adjustment keeps CSS890ms unchanged; a960ms field-end regression plus updated fallback boundaries gave RED4 failed/15 passed→GREEN19/19. A single EN cold context retested the exact failure successfully: field start4840.5/end5240.5 with elapsed0.4s, release5241.5, actual hold1038.6ms. Four words/tails and mark0.15s completed. Watchdog due5302.9 was cancelled without firing. Trusted wheel while locked retained y0; after release native wheel moved520. Settled title/copy opacity1, loaded photograph/guide cards and no overflow/errors/writes were confirmed; root and reviewer both actually viewed the final image. watchdog-confirmation.json/PNG are final evidence; older failures remain intact.
- [ ] Root IAB reload/rendered check and viewport reset could not be completed: CDP focus/viewport commands timed out, REPL reset. Identity and existing tab list were readable. No new tab, server restart or fallback browser chosen for the user's tab; independent Edge contexts supply the actual rendered evidence instead. The attempted viewport override/reset outcomes are not claimed.
- [x] Fresh pnpm lint and pnpm build (includes tsc -b) exited0. Final actual-effect19/19 and rendered surface17/17 passed. Final browser-enabled pnpm test-watchdog-final.log:1099 passed,0 failed/cancelled/skipped, exit0,279605.4827ms. Production hashes remained unchanged through final inspection. Scope/staged checks and integration follow these verified results.
- [ ] Under prior explicit authorization, commit/push only this request's files on the existing branch, verify remote SHA, preserve recovery tag and unrelated artifacts. No PR, merge, force push or deploy.

Research: MDN overflow explains hidden scroll containers remain programmatically scrollable; MDN animationend explains removed/aborted animations can miss completion. These support allowing anchor navigation and keeping a wall-clock cap independent of a hidden decoration.

## Precision findings and unverified limits

Eight initial isolated native contexts verified early wheel/PageDown retain a genuine hold, post-release wheel moves, paired pin612/quick top732, compact/reduced modes, resize interruption, Escape/programmatic navigation. Three timing thresholds failed and remain recorded. Two lightweight diagnostics proved a StrictMode replay reset (~424ms extra budget) and separate preview main-thread timer latency (~167ms). The first was fixed with the replay regression; the latter is not falsely labelled exact wall-clock success.

Native reload from y520 returned y0 rather than restoring position. RouteScrollManager's POP guard does not reset it and no JS scrollTo was recorded; cause is unresolved. The actual-effect mount-at-y200 check covers only the component's already-scrolled branch, not native browser restoration. Do not mark the browser reload restoration as passed or broaden routing changes without evidence.

Final lightweight diagnostic independently verified the replay correction: inferred first deadline3048.7ms and second3049.2ms, rather than another fresh1200ms. Callback fired253.8ms late during recorded long tasks; release changed inline overflow within0.1ms. Full first-effect-start→release1454.4ms is not reported as <=1200ms. First timer registration already had overflow hidden at2397ms and release3303.1ms; recorded root-held portion from that registration is906.1ms, but this does not erase earlier preparation or timer lateness. Saved after-replay screenshot was taken after wheel during paper handoff, not a settled opening viewport; earlier released KO/EN captures show the unchanged first-view layout. No repeated contexts are added merely to turn a failed timing into a green result.

Intermediate first-start candidate: pnpm lint/build and full browser-enabled pnpm test1096 passed, exit0. Its preserved test-final.log is NOT the final two-phase verification. Its production hashes were HomeHeroIntroOverlay.tsx BB62938D18C671E02A6983941CF5D1BBA5F72D6D68BFCE7CA471F5FCD5622CEF; home-v6-fixes.css 7BDA8DE41630C58B8C5F04F939509E7C6E28DA26C222260E343A0B0E71C79BC9; HomeV4SamplePage.css DDD0F7DD524CD74931A12A70BA545094507678111527FBE2D11ABC652268C9E9. A separate phase-final log and actual result are required before integration.

Final watchdog source: HomeHeroIntroOverlay.tsx5754D66DBE74884B1BE595B0E7DAF411895D4731716313E9622C7B19FE64635A; owning CSS hashes unchanged from above. Fresh pnpm lint and pnpm build (tsc -b/Vite) exited0. Final full browser-enabled test-watchdog-final.log passed1099/1099, no skipped/cancelled/failed, exit0. Integration checkbox intentionally precedes the commit; actual commit/push identity will be recorded after execution outside the committed plan, not invented beforehand.

Root IAB identity read succeeded, but DOM/control/viewport operations then timed out in CDP and the REPL reset. The user explicitly requested precise inspection, so independent native Edge checks continue; no successful IAB rendering or viewport-reset claim is made. Existing server/preview are not restarted and user tabs are not replaced. Physical Safari/touch hardware remains untested.
