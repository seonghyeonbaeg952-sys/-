# Sample English CMS UX Follow-up Implementation Plan

**Goal:** Improve the existing English sample workflow and repair the English layout problems reported afterward, excluding proposal 17 (reviewer assignment). Follow-up reports also require independent English operation-setting copy and a discoverable CMS print action.

**Scope:** Proposals 1 (missing-version filter for the current CMS page), 5 (publication change summary), 7 (field input progress), 12 (clear an English date), and 19–20 (live text counts and optional length guidance).

**Architecture:** Derive read-only counts and changes from the existing Korean row, saved English draft, and published English fields. Reuse the existing CMS list, form, and modal. Extend the existing sample translation allowlist and its database constraint for four operation settings records; keep shared dates, account details, contacts, links, and visibility untouched. Keep `/sample/` and its English content separate from the original public site. Add no dependency.

**Files:** `sampleContentGuidance.ts` owns derived counts/diffs/soft limits; `AdminCrudListPage.tsx` owns page-local status filtering; `AdminEnglishContentForm.tsx` shows progress and a publication summary; `AdminRecordForm.tsx` displays opt-in live counts; `SampleDateInput.tsx` provides the English-only clear control. `sampleContentModel.ts` and a new migration authorize four CMS setting resources; their admin pages expose the shared English editor. `sample-english-layout.css` contains English-only fixes for the reported About and Join sections. Existing CMS print documents are inspected and their access path is clarified. Tests cover the affected behavior.

**Evidence and constraints:** Use the existing 11-resource allowlist, source fallback, `save → publish` flow, original route isolation, and protected CMS API. GOV.UK's character-count guidance supports counts where a real length concern exists and discourages arbitrary hard limits. WCAG 4.1.3 supports understandable status feedback. Existing backend validation still limits each field to 10,000 characters; the new visual guidance is advisory.

### Task 1: Status and writing guidance

- [x] Write failing tests for page-local status filtering, field input progress, and saved-draft versus published field changes. The expected counts use literal fixtures.
- [x] Add pure helpers that distinguish loading/errors from missing translations, count only non-empty original text fields, and compare saved field values including images.
- [x] Verify focused tests pass.

### Task 2: CMS list and editor

- [x] Add a clearly labeled current-page filter for `All / No English version / Draft / Published` and a page summary. On failed status retrieval, retain all rows and offer retry.
- [x] Show per-record text-field input progress and saved changes before English publication; no new approval role.
- [x] Add live character/word counts to opt-in English text fields. Show a soft recommendation only for titles and button labels; never truncate input or silently block publication by recommendation.
- [x] Verify CMS behavior tests and keyboard-readable labels/statuses.

### Task 3: English date convenience

- [x] Write a failing test for clearing a complete or partially entered English date with one control.
- [x] Add the control to the English sample date input, leaving the original Korean date input unchanged.
- [x] Verify the date model and rendered English/Korean markup.

### Task 4: Operation settings and English-only layout fixes

- [x] Write a failing contract for the four additional resources: `site_settings`, `locations`, `join_info`, and `support_settings`. Text and relevant image fields may vary by language; contact, bank account, amounts, dates, IDs and visibility remain shared.
- [x] Extend the translation model, CMS entry points and public sample overlay; migrate only the existing English variant allowlist and validation helper.
- [x] Test RLS, authorization, source visibility, and the published overlay without inserting lasting test data.
- [x] Reproduce the About decorative text and Join button width problem from the supplied screenshots and existing CSS; add sample-English-only flow rules, then verify responsive contracts.

### Task 5: CMS print workflow

- [x] Inspect the existing application and pledge print actions and receipt tests. Preserve submitted answers, historical terms, signatures, and private attachment handling.
- [x] Make the print action easy to find in both relevant CMS lists. The requested shared print access reuses the existing Korean admin document, retains submitted language verbatim, and does not add an unrequested second print template.

### Task 6: Regression and handoff

- [x] Run focused tests, `pnpm lint`, `pnpm build`, and full `pnpm test`.
- [x] Check local server routes with read-only HTTP requests, including `/sample/?lang=en` and CMS routes. Do not use computer-use automation, per the user's standing instruction.
- [x] Update the sample English usage guide and report exactly what was implemented and what remains unverified visually.

### Task 7: English line-break follow-up

- [x] Review the supplied home, spirit, About and Join screenshots against the current English copy and component line breaks.
- [x] Shorten high-visibility English headings and sentences without changing the Korean original; replace unnecessary forced breaks with natural wrapping.
- [x] Keep typography and flow corrections scoped to `/sample/` English, with contracts for title fragments, orphan-prone body copy and wrapped buttons.
- [ ] Perform direct pixel/viewport review only if the standing no-computer-use instruction is lifted. Static CSS/SSR tests and HTTP responses do not establish visual parity.
