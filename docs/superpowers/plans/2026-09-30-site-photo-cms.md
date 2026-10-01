# Site Photo CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. This request already authorizes inline implementation; preserve the current shared working tree and do not commit unrelated work.

**Goal:** Let administrators replace every public website photo, including currently hard-coded pictures, from one CMS screen.

**Architecture:** Existing content photos remain authoritative in their existing tables. Fixed assets get their own versioned draft/published override table, completely separate from Korean and English text documents. A shared image resolver applies published overrides to image elements and explicit CSS background variables.

**Tech Stack:** React, TypeScript, Vite, existing Supabase Auth/Storage/RLS, Node tests.

**Spec:** User request: all public photos editable through CMS; research 2,000 actual references. The research corpus must distinguish automated indexing from detailed review.

## Global Constraints

- Preserve administrator authorization and public visibility filters.
- Never include applicant photos, private signatures, or member photos in this public-photo manager.
- No new production dependency; reuse ImageUploader, AdminModal, unsaved-change guards.
- Uploads use unique paths; replacing a photo never deletes an existing file.
- Keep translations and layout documents untouched.
- Mobile controls remain at least 44px; photo/poster proportions are preserved.

## Task 1: Research and inventory

- [x] Retrieve 2,000 distinct public image/media issue references (1,974 Gutenberg + 26 Strapi), save URLs/titles/labels and transparent method/counts.
- [x] Review official Supabase upload/RLS, OWASP upload safety, and Sanity image semantics/positioning guidance.
- [x] Map fixed assets and existing photo fields to public usage locations.

## Task 2: Photo data contract and persistence

Files: `src/features/site-photos/sitePhotoModel.ts`, `.test.mjs`, `sitePhotoApi.ts`, `.test.mjs`, `supabase/migrations/*_add_site_photo_overrides.sql`.

- [x] Write failing tests for valid/unsafe URLs, validated photo values, published-only resolution, resetting to defaults, and content-image payloads that preserve non-photo fields.
- [x] Run `node --test src/features/site-photos/*.test.mjs` and observe missing behavior.
- [x] Implement `validateSitePhoto`, `resolveSitePhoto`, `buildContentPhotoPayload`; implement versioned save/publish APIs with friendly conflict errors.
- [x] Create migration through Supabase CLI and apply additive schema with admin-only reads/mutations and a published-only public RPC.
- [x] Test anonymous access, draft isolation, compare-and-swap conflicts and restore-to-original in a rollback transaction.

## Task 3: Public image integration

Files: `sitePhotoCatalog.ts`, `SitePhotosProvider.tsx`, `SiteImage.tsx`; common image helpers and raw-photo consumers; CSS background references.

- [x] Wrap public routes with the image provider without changing text documents.
- [x] Resolve static images in OptimizedImage, raw img helpers, brand assets, brochure and profile photos.
- [x] Replace fixed CSS background URLs with catalogued variables and original fallback URLs.
- [x] Add coverage tests catching unregistered public image assets, ambiguous aliases and missing default files; preserve default rendered markup.

## Task 4: CMS photo workspace

Files: `AdminSitePhotosPage.tsx`, `SitePhotoEditor.tsx`, `sitePhotoContent.ts`, `site-photos.css`; router/navigation/editor links.

- [x] Grid with thumbnail, title, usage routes, search, category, fixed/content/background filters, visibility and publication status.
- [x] Fixed-photo modal: upload/URL, Korean/English alt, focal position, before/after preview, draft save, publish, original restoration and cancel guard.
- [x] Content-photo modal: reuse upload and update the actual existing image field with a compare-and-swap check, never rewrite translated content.
- [x] English-photo publication merges only the selected photo field, preserving both published copy and unrelated unfinished drafts.
- [x] Handle partial list errors, pending upload, duplicate submission, connection failure and unsaved navigation.

## Task 5: Verification and handoff

- [x] Run targeted behavior tests, `pnpm test`, `pnpm lint`, `pnpm build`, `git diff --check`.
- [x] In the in-app browser, verify upload, preview, draft isolation, publication, Korean/English alt and original restoration; leave no temporary public photo change.
- [x] Inspect public home/about/spirit/concerts/gallery/contact in Korean and English; inspect responsive photo workspace and selected public routes at 390, 768, 1180, 1440 and 844px landscape widths.
- [x] Record research counts, commands, browser evidence and limitations in `docs/site-photo-cms-guide.md` and the final report.
