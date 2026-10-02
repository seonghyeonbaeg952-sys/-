# Reviewed English Copy Refresh Implementation Plan

> **For agentic workers:** Execute this user-authorized content refresh inline using the executing-plans checkpoints. Preserve the shared dirty checkout; do not commit or change unrelated content.

**Goal:** Reflect the published Korean introduction, spirit and history changes in independent English CMS copy, with readable responsive wrapping.

**Architecture:** Use the existing `sample_english_editor_pages` and revision tables. Patch only reviewed text keys, retain other English copy/appearance/styles/layouts, and leave all Korean and per-record content unchanged. Use a version-guarded transaction with the same advisory lock as CMS saves; validate complete documents and retain publication history.

**Tech Stack:** React, existing Supabase/Postgres CMS, in-app browser, Node tests.

**Spec:** User request in this chat: safely translate modified Korean introduction/spirit/history, apply English, then fix line breaks and text overflow.

## Global Constraints

- Korean documents, Korean revisions, image/media fields and per-record history remain read-only.
- No automatic Korean-to-English live inheritance; the English CMS stays independent.
- Refuse writes if any captured source or English version has changed.
- Retain unrelated English custom styles and placements. Reposition only fragments proven to overflow after the reviewed text replacement.
- Do not add dependencies or relax Auth/RLS.

## Task 1: Source and translation review

- [x] Read public routing, language isolation, copy resolution and CMS publication procedures.
- [x] Capture the three Korean documents and existing English spirit document in `docs/content-updates/2026-10-02-english-before.json`.
- [x] Compare current Korean and English source/record dates; retain unchanged per-record translations.
- [x] Review English title fragments as complete sentences, not isolated Korean word substitutions.

## Task 2: Guarded English-only data update

- [x] Run a read-only mismatch check for the reviewed English keys before applying changes.
- [x] Run the complete transaction in rollback mode: acquire `sample-english-editor:<page>` advisory locks; compare versions and complete captured JSON; merge reviewed device copy; validate documents; append English publication history; assert Korean and unrelated English content remain unchanged.
- [x] Commit the same checked update only after the rollback assertions pass.
- [x] Read published English documents back and confirm the reviewed values and revisions. Final English versions: about 2, history 2, spirit 64. Complete Korean records match the before snapshot.

## Task 3: Responsive review and handoff

- [x] In the in-app browser, verify the English introduction, spirit and history plus language switching back to unchanged Korean.
- [x] At 390, 768, 1180 landscape, 844 landscape and 1440px widths inspect heading/body line boxes, clipping and text overlap, including all 18 expanded history records and spirit tabs.
- [x] Fix observed English-layout problems: Lo/ve displacement, heading/body spacing, alternate landscape heading IDs, the 2px caption protrusion, fixed 790px/500px education columns and italic NEXT overflow. Rerun the failing geometry checks.
- [x] Run relevant tests (90 passing), English CSS regressions (12 passing), lint, build and diff whitespace checks. Real iOS/Android devices remain untested.

Browser measurements used reduced motion to avoid measuring an unfinished entrance animation; the temporary device/media overrides are reset at handoff. History record translations load independently of the page title; final history checks wait for translated records rather than mistaking the initial loading fallback for saved English content.
