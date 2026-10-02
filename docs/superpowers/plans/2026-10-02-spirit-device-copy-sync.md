# Spirit Device Copy Sync Implementation Plan

> **For agentic workers:** Use executing-plans inline; this request authorizes implementation in the existing workspace. Do not delegate or create a new checkout for this scoped CMS content update.

**Goal:** Carry the latest Korean desktop spirit wording and the supplied history/member/concert headings to tablet/mobile, translate independently into English, and verify wrapping in both languages.

**Architecture:** Keep the existing independent Korean/English versioned documents. Patch only reviewed copy keys; preserve desktop Korean wording/styles/layout, media, unrelated copy, Auth and RLS. The CMS itself is not in scope: the user explicitly clarified the screenshots depict desktop content to transfer, not a preview-device bug.

**Tech Stack:** React, React Router, TypeScript, Vite, Supabase Postgres, Node test runner, Codex in-app browser.

**Spec:** Current user request plus the history/members/concerts mobile-editor screenshots.

## Global Constraints

- No new dependencies, auth changes, RLS changes, private data reads, deployment, or commits.
- Back up both language documents; abort publication if a captured version/document changed.
- Keep authored desktop Korean copy and styling intact. Do not copy desktop pixel offsets to smaller devices or to English.
- Verify public copy at 390×844, 768×1024, 844×390, 1180×820 and 1440×900 in Korean and English.

## Task 1: Correct scope and source data

**Files:** No CMS UI or route changes.

- [x] Read current desktop Korean CMS documents; inspect the screenshots' actual edited wording.
- [x] User clarified this is a copy-transfer request. Reverted all exploratory CMS viewport changes and tests; no tracked CMS diffs remain.
- [x] Capture spirit v64, history v10, members v3, concerts v4. All drafts match their publications.

## Task 2: Reviewed spirit copy

**Files:** Dated snapshot and guarded one-off SQL under `docs/content-updates/` and `scripts/`.

- [x] Capture latest spirit Korean/English draft+published+version; Korean desktop version 64, English version 64, no unpublished changes.
- [x] Sync Korean desktop faith/manifesto/values/CTA wording to smaller devices, adapt the compact hero without changing meaning, and remove obsolete small-device hero/manifesto fragment offsets. Keep all desktop Korean copy/styles/layout unchanged.
- [x] Translate latest desktop Korean headings for all three English devices; use the full desktop paragraph wording on mobile instead of the previous shortened overrides.
- [x] Include the three supplied desktop headings: 합창단 연혁 / 합창단 단원 아카이브 / 공연안내, with independent English headings.
- [x] Validate documents and preflight in a rollback transaction. Initial SQL guard needed parentheses around JSONB subtraction; that attempt rolled back completely. Corrected preflight passed and eight documents published atomically with revision history.
- [x] Compare exact readback and prove Korean desktop objects unchanged on all four pages.

### Added user request: resident accompanist

- [x] User selected `RESIDENT ACCOMPANIST` for the profile currently labelled principal accompanist, then requested all devices and English too.
- [x] Snapshot both independent documents, validate/preflight, then publish only that profile-specific label to shared+three device scopes. Keep the other accompanist, names, portraits, biographies and existing placement untouched.
- [ ] Verify the label on both languages at all five dimensions.

## Task 3: Wrapping and regression checks

**Files:** `SiteEditorProvider.tsx`, its behavioral test, and the existing spirit responsive CSS. No admin preview code changes.

- [x] Reproduced: published provider chose tablet for 844×390 and desktop for 1180×820 while the page composition chose mobile/tablet. Added failing provider render test, then reused the existing responsive hook; nonce-bound CMS iframe still uses its explicitly selected width. Added preview-isolation test.
- [x] Reproduced marker text overflow at 1180px (NEXT 214px inside 190px). Reduced marker font size only in the existing tablet media rule, then all four markers fit 190px exactly in the IAB check. Korean desktop manual offsets remain unchanged.

- [ ] Check all spirit sections, values/growth tabs, CTA links and language switching at all five dimensions in both languages.
- [ ] Check history/members/concerts copied headings at all five dimensions in both languages.
- [ ] Run related tests, `pnpm lint`, `pnpm build`, and `git diff --check`.
- [ ] Restore QA emulation and report actual-device limitations without claiming physical-device testing.
