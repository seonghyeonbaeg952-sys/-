# Korean First Publication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Korean public first mounts from showing obsolete defaults before the published CMS documents arrive, with localized failure/retry feedback.

**Architecture:** Reuse the bounded first-publication loader and existing retry notice. The Korean path waits only for the source publication; English still waits for its independent publications. Ready markup, CMS previews and administrator routes remain unchanged. No publication or account changes are required.

**Tech Stack:** React 19, TypeScript, Vite, node:test, Supabase, Codex in-app browser.

**Spec:** User's 2026-10-02 “해봐” approves addressing the remaining Korean loading issue and release checks identified in the previous handoff.

## Global Constraints

- Preserve previous uncommitted work on `codex/recover-homepage-work`.
- No new dependencies, commit, push, official deployment or content publication.
- Do not change credentials, Auth settings, grants or RLS.
- Do not create fake production applications, inquiries, pledges or uploaded photos.
- Use the existing 8000ms bound; timeout is failure, not an empty publication.
- Later polling/retry retains available copy and does not remount the public page.
- Korean/English CMS previews accept drafts immediately and block live submissions.
- Record real-device, hosted and genuine write/delivery checks as unverified when unavailable.

## Task 1: Korean loading and retry regression

**Files:** Modify `src/components/site-editor/SiteEditorProvider.tsx`, `src/features/sample-language/SampleLanguageSwitch.tsx`, `src/components/site-editor/SiteEditorProvider.test.mjs`; add test-only `src/components/site-editor/siteEditorProviderHarness.test-utils.mjs`.

**Interfaces:** Keep existing provider props and contexts. A test-only hook harness runs the actual transpiled provider/viewport hook with controlled transport, and renders its real contexts/components for ready markup assertions.

- [ ] Add a failing first-mount assertion and a failing Korean failure-notice assertion:
  ```js
  assert.match(h.markup(), /aria-busy="true"/)
  assert.doesNotMatch(h.markup(), /이전 기본 제목/)
  // After a failed source read:
  assert.match(h.markup(), /일부 게시 문구를 불러오지 못했습니다/)
  assert.doesNotMatch(h.markup(), /Some English content/)
  ```
- [ ] Run `node --test src/components/site-editor/SiteEditorProvider.test.mjs` and observe expected failures.
- [ ] Extend only the existing loading condition:
  ```ts
  !isPreview && (sourceRead.attempt < 0 ||
    (isEnglish && (englishRead.attempt < 0 || sample.contentLoading)))
  ```
- [ ] Localize loader/notice and make retry settlement depend only on the active language's reads. Korean retry must not request English records or remain disabled waiting for an unused English read.
- [ ] Preserve ready-page DOM, landscape-device, whitespace and CMS-preview assertions through actual settled-provider rendering; do not skip them.
- [ ] Verify retained copy on refresh failure, valid-empty completion, independent English first load, Korean retry recovery and preview bypass.

## Task 2: Bounded release review

**Files:** Read existing upload/admission/inquiry/pledge flows, tests, migration policies and `scripts/check-supabase-live.mjs`. No writes to production data or settings.

- [ ] Read current Supabase changelog and official Storage/Auth/RLS documentation.
- [ ] Run the existing read-only live connection/privacy checks and inspect relevant Storage/receipt policies and security advisors read-only.
- [ ] Exercise public form validation without submitting valid data; inspect CMS photo controls without choosing/uploading a file.
- [ ] Separate observed failures from genuine upload, receipt delivery, hosted deployment and real-device checks that require further authority/environment.

## Task 3: Verification and handoff

- [ ] Run targeted regression tests, `pnpm lint`, `pnpm build`, and the full existing suite.
- [ ] Use local production Preview to pause the Korean GET publication request, confirm old text is absent while waiting, then confirm timeout notice and Retry restore the actual current publication.
- [ ] Clear temporary network interception and viewport overrides; verify normal KO/EN and CMS preview display.
- [ ] Capture a current public screenshot outside the repository; leave the local Preview available.
- [ ] Report changes, observed checks and remaining release requirements, without claiming real-device or live-write completion.
