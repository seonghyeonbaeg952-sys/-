# Sample English content and layout implementation plan

> **For agentic workers:** Use executing-plans to implement this plan in the current workspace. Preserve the existing uncommitted sample-language implementation.

**Goal:** Fix the supplied English layout screenshots, localise pledge date selection, and let CMS managers maintain a separate English version of each public content record.

**Architecture:** English layout CSS is gated by `html[data-sample-language='en']`. CMS record translations use a separate `sample_english_content` table with record-specific draft and published JSON, optimistic version checks and the existing administrator check. Sample visitor data is merged with published translations by resource and UUID; original data, relationships and filters remain the authoritative shared metadata.

**Tech Stack:** Existing React 19, TypeScript, Vite, Supabase, node:test. No new production dependency.

**Spec:** User screenshots and instructions in this task: sample-only English; separate CMS language versions; English pledge dates; original object design retained; sufficient verification and a source-backed recommendations report.

## Constraints

- The English variant is rendered only under `/sample/`; `/` and Korean sample views retain their existing stylesheet and data.
- The computer-use prohibition remains in effect. Verification uses supplied screenshots, source/CSS review, React rendering tests, API tests, database transaction tests, lint and build. Post-change browser pixels cannot be claimed as verified.
- English content does not change source UUIDs, category/filter keys, dates, visibility or related record IDs.
- Blank English fields fall back to the current source. Publishing English is an explicit action separate from saving its draft.
- Public translations are returned only if their source is currently visible. Drafts are administrator-only. Original tables are never written by translation functions.

## 1. Layout and dates

- [x] Replace fixed title line heights and absolute neighbouring text offsets in English with natural flow. Retain images, rings, staff, accent colours and existing reveal variables.
- [x] Convert the English about intro/founding/education layout to an intrinsic grid so photos follow wrapped headings. Inspect captions and panel body height too.
- [x] Implement `SampleDateInput` with labelled English Month / Day / Year controls. Keep `YYYY-MM-DD` form values, leap-year validation, partially-entered date validation and original native Korean date controls.
- [x] Exercise date model and rendered markup. Check original SupportPledgeForm submission/signature/print regressions and sample submission guards.

## 2. CMS record variants

Files: `sampleContentModel.ts`, `sampleContentApi.ts`, `AdminEnglishContentForm.tsx`, `AdminCrudListPage.tsx`, `AdminTable.tsx`, `useSampleLanguage.ts`, `SampleLanguageProvider.tsx`, `SiteEditorProvider.tsx`, `usePublicData.ts`, one generated Supabase migration.

Contract:
```ts
type EnglishContentRecord = {
  resource: SampleContentResource; record_id: string;
  draft: Record<string, string>; published: Record<string, string> | null;
  version: number; updated_at: string; published_at: string | null;
}
// Original tables are not a mutation target.
loadEnglishContent(resource, id)
saveEnglishContentDraft(resource, id, draft, expectedVersion)
publishEnglishContent(resource, id, expectedVersion)
getPublicEnglishContent()
```

- [x] Define a resource/field allowlist for notices, gallery, concerts, videos, posters, hero slides, popups, history, FAQ, about sections and sponsors. Translate user-facing text and optional language-specific media only.
- [x] Create the migration using the installed Supabase CLI. Add admin-only reads, restricted save/publish RPCs, private drafts, explicit grants, record locks and stale-version rejection. Add a public projection which checks current original visibility.
- [x] Add independent Korean/English actions to the existing CMS lists. New content is registered in Korean/common metadata first; its English version is then linked to that saved record. Display source text beside the English inputs, saving/publishing feedback, retry and unsaved-input protection.
- [x] Reuse existing ImageUploader for English images. Blank image fields reuse the original image. Upload does not itself publish the record.
- [x] Load published English variants only when sample English is active. Map nested public-data resources explicitly; preserve record identity, category, dates, URLs/relationships unless an allowed English media field is provided.
- [x] Check isolation, same-text different-record independence, missing translation fallback, image fallback, hidden/deleted source handling, collision rejection and publication refresh.

## 3. Review and handoff

- [x] Run targeted regressions, type/build, lint and the project test inventory. Repair failures introduced by these changes.
- [x] Apply additive schema only after reviewing its privileges. Execute allow/deny/save/publish/version/fallback checks in a transaction and roll back all fixtures. Compare original publication/content checksums before and after.
- [x] Review the requested twenty areas, recording evidence and any unavailable visual checks. Use further iterations when a real failure is found rather than repeating identical tests.
- [x] Research authoritative localisation, accessible dates, CMS workflow and publishing guidance. Report actual source count, recommendations, implemented items and remaining limits. Do not claim 10,000 documents were reviewed.

Result: lint/build passed; 941 project tests, 939 passed, 0 failed, 2 browser checks skipped. Reports: `docs/sample-english-guide.md`, `docs/sample-english-verification.md`, `docs/sample-english-research-and-review.md`. Workspace and branch retained; no merge, push or production deployment was performed for this sample-only task.
