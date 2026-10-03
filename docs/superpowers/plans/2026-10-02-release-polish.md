# Release Copy Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the confirmed Korean desktop hero overlap and prevent the English page from briefly presenting obsolete default copy before its published CMS documents arrive.

**Architecture:** Keep the independent Korean/English CMS stores and existing preview protocol. Correct only the two offending Korean desktop placement entries through the CMS, preserving copy and other devices. Add a bounded first-publication boundary to the existing English providers; retain existing content and error/retry behavior during later refreshes.

**Tech Stack:** React 19, TypeScript, Vite, node:test, Supabase, Codex in-app browser.

**Spec:** The inline scope below reflects the user's 2026-10-02 approval of the deployment-readiness fixes.

## Global Constraints / Inline Scope

- No production deployment, credential changes, Auth/RLS relaxation, or new dependencies.
- Preserve authored copy, fonts, Korean/English separation, and unaffected placements.
- Preview remains immediately available and submissions remain blocked.
- Existing Korean and admin routes retain their DOM and behavior.
- Initial English publication reads are bounded at 8 seconds. Failed reads show available content with an explicit retry notice, not an indefinite loader.
- Normal polling must not hide/restart an already visible page.
- Work in the existing clean `codex/recover-homepage-work` checkout; do not switch or overwrite another session's branch.
- Do not commit or push without a separate user request.

## Task 1: Correct the confirmed desktop hero placement

**Targets:** Korean `spirit`, desktop `spirit.spiritHero.text4` / `spirit.spiritHero.text5` only. Initial version 68, draft = publication.

**Evidence:** `text4`: width 70.8%, X -0.6, Y -32.8. `text5`: width 73%, X 136, Y -101.3. Actual CMS bounds overlap on both axes.

- [x] Assert in the browser that the existing rendered words overlap (red).
- [x] Use the existing CMS placement controls to restore original width for each word, align the second word's offsets with the first, and inspect the resulting natural inline spacing before saving.
- [x] Check title, reading stroke and body clearances; make the smallest additional placement adjustment only if those still collide.
- [x] Save and publish through the existing CMS flow. Read back the documents and ensure that only these two desktop placement entries changed, with revision history preserved.

## Task 2: Prevent old English copy from painting during initial publication loading

**Files:**
- Modify `src/App.tsx` for the English lazy-route bootstrap fallback
- Modify `src/components/site-editor/SiteEditorProvider.tsx`
- Extract ready presentation to `src/components/site-editor/siteEditorLanguagePresentation.ts`
- Modify `src/features/sample-language/SampleLanguageProvider.tsx`
- Modify `src/features/sample-language/useSampleLanguage.ts`
- Reuse/extract bounded reads in `src/lib/siteEditorPublication.ts`
- Test `src/components/site-editor/SiteEditorProvider.test.mjs`
- Test `src/features/sample-language/SampleLanguageProvider.test.mjs`
- Test `src/lib/siteEditorPublication.test.mjs`
- Test `src/components/site-editor/siteEditorLanguagePresentation.test.mjs`
- Preserve ready-page/media assertions in `src/features/sample-language/sampleRoutes.test.mjs`
- Register the new test in `scripts/run-tests.mjs`

**Interfaces:** Existing load APIs remain unchanged. A bounded read helper returns the original successful result or a null/error result after 8000ms. Language context exposes initial-content loading; editor provider combines source and English document readiness only for public English pages.

- [x] Write failing tests for an English first render hiding obsolete children, pending/empty/failed publication settlement, and timeout release.
- [x] Run the tests and confirm expected assertion failures.
- [x] Implement the smallest readiness boundary using existing loading styles. Do not run effects conditionally or block Korean/CMS previews.
- [x] Connect failed editor reads to the existing English error/retry notice; retain previously loaded documents during refresh.
- [x] Run provider/API/regression tests and verify direct English loads, KO→EN→KO, and CMS previews in the in-app browser.

## Task 3: Scoped release checks and handoff

- [x] Run `pnpm lint`, `pnpm build`, and the changed/adjacent test files.
- [x] Verify 390px, 1180px landscape and 1440px, checking title overlap and viewport overflow.
- [x] Confirm local production-preview deep links from the built artifact if a port is available; do not deploy externally.
- [x] Review reported security-function warnings against actual grants/body checks read-only; do not alter account security settings.
- [x] Report verified changes separately from real-device, hosted deployment, live upload/submission and account-setting checks still requiring follow-up.

## Results and evidence

- Korean Spirit: version 68 → saved draft 69 → published 70 through the existing admin CMS. English Spirit remains version 66, unchanged. Both current drafts match their publications.
- Publication comparison contains exactly four field changes within the two desktop placement entries: remove both forced widths, remove text5's X offset 136, change text5's Y offset -101.3 → -32.8. Copy, per-device copy, formatting, appearance and other placements are unchanged.
- Actual Korean desktop word overlap failed before the edit (106.1875px horizontal overlap). The final built page has a 0.6px gap between the two word bounds, with no intersection.
- Initial English read assertions failed before implementation. Pending, valid-empty, failed, thrown and timed-out reads now settle correctly. Unchanged polling retains document identity; retry clears relevant pending caches.
- Full regression initially exposed ready-page SSR tests that expected English children before effects ran. Ready presentation was extracted as production code; the existing media/navigation assertions now use that exact presentation, while first-read behavior remains tested through the actual provider. No assertions were skipped to make the change pass.
- Latest `pnpm test`: 1009 total, 1007 passed, 0 failed, 2 existing browser-toolbar tests skipped because `SMYC_PLAYWRIGHT_MODULE` is not configured. Duration 285414.9951ms.
- Latest `pnpm lint`: exit 0. Latest `pnpm build`: exit 0; TypeScript and Vite production build completed, 887 modules.
- Final built artifact served at local Preview `http://127.0.0.1:5176/`, not a cloud deployment. Korean/English Spirit at 390×844, 1180×820 and 1440×900 have document horizontal overflow 0. Fresh English desktop has the current published manifesto heading and no obsolete heading. Normal final-page console warnings/errors: none.
- Actual GET-only delayed English-publication test showed the preparation boundary; at the bounded timeout it exposed the existing failure/retry notice instead of an indefinite loader. Retry restored current English copy and removed the notice. Temporary request interception was cleared.
- Core-value tab changed its selected panel and content. KO→EN→KO preserved the `#spirit-values` anchor. Both normal Korean CMS editing/publication and English CMS preview worked; English preview reports saved draft equals publication and submissions blocked.
- Read-only inspection of the publication readers, admin photo reader, save/publish RPCs and `is_admin` confirmed published-only reads and existing admin/version guards. No security settings, credentials, grants, RLS or schema were changed.
- Consulted React effect lifecycle documentation and Supabase RLS documentation. Root-cause/TDD skills drove the before/after assertions and separated transport readiness from ready presentation.
- Remaining known behavior: Korean first mount still briefly renders source defaults before the Korean publication arrives. This was observed when resetting the final Preview; the publication then correctly restored the latest Korean text. The initial-read boundary in this scope deliberately targets English only, so this Korean behavior is not claimed as fixed.
- Remaining release checks: real iOS/Android devices, hosted production deep links, genuine file upload/receipt delivery and account security configuration (including leaked-password protection). These are not claimed as verified or fixed by this scope.
- No commit, push, PR or official deployment performed; changes remain in the current branch.
