# Restrained public design refinement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the current public site through small, reversible surface and composition changes, without replacing the choir's visual identity or CMS content.

**Architecture:** Edit public CSS at its owning selectors rather than adding a global override layer. Keep public data, CMS formatting, route registry and original image files unchanged. Small persona-discovered link/hash, focus and popup geometry fixes reuse existing components. Home scroll handoff reads guide height at setup/resize. Test computed styles and actual components offline; inspect the real public app separately.

**Tech Stack:** React 19, Vite 8, TypeScript, Tailwind 4, existing Motion, Supabase; no new application dependency.

**Spec:** `C:/Users/seong/.codex/visualizations/2026/08/24/01a03308-d8f3-7ef0-be07-9cc35db7994d/motet-design-20261003/research-and-brief.md`

## Global constraints

- Small refinement, not a redesign. Preserve current photography, copy, brand, typography families, route structure, CMS layout overrides, authentication, RLS and youth privacy.
- No new gradients, glitter, curtains, lace, synthetic photography, ornamental text or continuous decorative animation.
- Use matte fills, restrained rules and one simple open circle only where existing decoration needs replacement.
- Keep 44px controls, keyboard focus and reduced-motion support.
- Korean and English; 390×844, 844×390, 768×1024, 1180×820, 1440×900.
- Requested research is 50×5,000 = 250,000 items. Do not claim this count. Record actual sources and 50 distinct review dimensions.
- Independent final review consists of 30 distinct documented page/viewport review passes, not repeated identical screenshots or 30 claimed fixes.
- No production deployment, CMS save, form submission or remote database modification.

## Task 1: Recoverability, skills and evidence

**Files:** research-and-brief.md and before screenshots in the external evidence directory.

- [x] Verify source status and preserve the baseline with local tag `checkpoint/design-before-20261003` at `db8baca7126fd831bb33fb2f69348cfd972d54db`.
- [x] Read the existing skills and installer; compare primary GitHub sources.
- [x] Install `Leonxlnx/taste-skill` paths `skills/redesign-skill` and `skills/minimalist-skill`, pinned at `ce26fc25c0e5e8cab638f883de62d9a86ee5e45b`; do not overwrite existing skills.
- [x] Read both installed skills; use preservation/anti-template guidance, overriding conflicting gradient and major-recomposition advice with the user's brief.
- [x] Record source access level and all 50 review criteria before editing production CSS. Additional diverse source checks on 2026-10-04 are explicitly dated in the brief.
- [x] Save `git archive --format=zip --output=<evidence>/checkpoint-styles.zip checkpoint/design-before-20261003 src/styles src/components/sample/home-v4/HomeV4SampleHeader.css`.

## Task 2: Matte surfaces and precise composition

**Files:** `src/styles/publicRefinement.browser.test.mjs`, owning CSS in `color-sample-theme.css`, `spirit-heritage.css`, `about-overview.css`, `accompanist-profiles.css`, `concerts-page.css`, `contact-page.css`, `home-responsive-quick.css`, `src/components/sample/home-v4/HomeV4SampleHeader.css`, and `src/pages/sample/HomeV4SamplePage.css`; `HomeV4SamplePage.tsx` synchronizes guide height, and `scripts/run-tests.mjs` registers the new regression.

**Interfaces:** Existing CSS classes only; no new runtime exports or stored content model.

- [x] Add offline rendered-style tests: decorative backgrounds contain no computed gradient; stage panels do not use decorative blur/shadow; closing decoration is a static outlined shape; shared header remains readable and operable without a decorative shadow.
- [x] Run `node --test src/styles/publicRefinement.browser.test.mjs` with the bundled Playwright module. Five expected assertions failed before production edits; the later fixture-only hover-origin issue is recorded, not a public-app bug.
- [x] Replace backgrounds at their original selectors with matte fills. Replace the closing glow using its existing DOM node with a thin open circle, no animation and no pointer interception.
- [x] Remove redundant presentation shadow/blur, preserve navigation/card structure and image-fit rules. Refine overly tight heading tracking without changing stored copy or font sizes set by CMS.
- [x] Incorporate the user's later screenshot feedback: separate the three neutral translucent guide cards, increase their gap, and soften the small accent colors. Do not retain the earlier opaque brown band.
- [x] Fix three independent visual-review findings: Korean mobile title/em spacing; mobile duplicate decorative accompanist title; English phone donation category word splitting. Preserve semantic headings and Korean/tablet/desktop layout.
- [x] Run the expanded regression: 8 tests passed, 0 skipped, including English guide spacing at 1366/1440/1920px and all three mobile rechecks. Existing full test inventory remains a final gate below.

## Task 3: Full path review and completion

**Files:** screenshots and `review-log.md` in the external evidence directory, plus the final source diff.

- [x] Inspect public route families beyond their hero: home, spirit, overview, conductor, accompanists, members, history, concerts/detail, notices/detail, gallery, join, contact, and not-found. Admin login inspection redirected to an existing signed-in session, so unauthenticated login/private CMS are explicitly NOT verified.
- [x] Exercise menu open/close, language selection, hero playback, brochure expansion/collapse, tabs and gallery filters without submitting forms.
- [x] Collect actual viewport dimensions, document overflow, rendered headings, overlays, image load state, console health and screenshots. Do not mistake a transient entry-animation screenshot for a persistent blank page.
- [x] Ask a separate agent for 30 numbered substantive review passes after the first implementation; require concrete findings or explicit untested status. Preserve pre-fix failures and later rechecks in reviewer-a/review-log.md.
- [x] Fix confirmed defects only; recheck affected cases and preserve review failures in the log rather than relabeling them as passes.
- [x] Run `pnpm lint`, `pnpm build`, and `pnpm test` with browser tests enabled: final pre-persona tree passed 1056 tests, zero failed/skipped. Run gates again if persona feedback changes production source.
- [x] Run the Impeccable detector once on the changed TSX target through the independent evidence reviewer (zero findings). Do not treat that as a whole-site/CSS certification and do not run the detector again.
- [x] Record actual research/review counts, checkpoint, changes and limits in external final-review-log.md. Final user handoff follows Git integration; no claim about all browsers/CMS states or 250,000 researched items.

## Task 4: User-requested fifteen persona agents and integration

**Brief:** External `persona-brief.md`; each distinct worker writes its own evidence-backed report. A rolling queue keeps at most three workers active alongside root. Fifteen original reviews, not fifteen concurrent workers or five strictly synchronised batches.

- [x] Complete 15 independent AI-persona reviews, including the five user-named fictional lenses, without claiming real-person contact/opinions or fifteen human usability participants.
- [x] Deduplicate 12 unique findings: fix 11 narrow code defects; retain the existing contradictory CMS bank note as a content risk. Do not apply optional ornament/layout preferences without a confirmed scoped defect.
- [x] Add seven rendered CSS checks and six actual-component tests in publicFlowRefinement.test.mjs (navigation, popup geometry and keyboard focus). Run red before fixes and green after: 21 tests passed. Fixes are in owning CSS/components plus one pure filterSelectPosition.ts helper; no form submission/API/auth/RLS changes.
- [x] Obtain real-screen delta rechecks from the SAME personas 03, 08 and 14. Root independently checks EN membership/return, natural overview photo, full phone intro and whole tablet Organisation label in the in-app browser.
- [x] Refresh lint/build: both exit 0. First full run failed an intentional JSX baseline delta and one unexplained existing CMS worker exit; preserve that log. Review/update only the three changed JSX hashes and keep all mutation checks. Isolated CMS recheck and combined copy/CMS contract checks pass (19/19).
- [x] Final full-suite rerun with browser tests enabled: pnpm test exit 0, 1069 passed, zero failed/skipped, 273834.4384ms. Preserve both failed and successful logs. Record final hashes of eighteen production files in the external evidence directory.
- [ ] Commit only this scoped source/test/plan diff and push the existing branch, as previously authorized; no force push, unrelated artifacts, private data, PR, merge or deployment-setting changes.
- [x] Leave the existing public server available and reset the temporary in-app browser viewport to its original state; keep the existing tab at /?lang=ko. Final completion/checkpoint/evidence handoff follows actual commit and push.

## Integration handoff

The remaining commit/push step is logged with its actual SHA and remote result in the external final-review-log.md after execution. This plan is committed with the reviewed source; do not fabricate a future commit identity here or rerun tests merely to change a documentation checkbox afterward. Recoverability includes checkpoint/design-before-20261003 plus three external git-archive ZIPs; source checkpoint is not an external CMS-data snapshot.
