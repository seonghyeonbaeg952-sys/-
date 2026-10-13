# Editor line height and missing copy targets plan

> Execute inline with browser checkpoints; keep all existing copy and device formatting intact.

**Goal:** Add persistent text-box line height and reconnect missing Spirit canvas targets.

**Architecture:** Add optional `lineHeight` to the existing `EditorTextLayout` contract. Reuse placement history, saving and publication. Connect plain Spirit strings with existing copy adapters and catalog keys.

**Tech Stack:** React, TypeScript, existing placement bridge, CSS and Supabase/Postgres.

**Spec:** Latest user request: line-spacing adjustment and investigation of text that cannot be edited.

## Constraints

- No production dependencies, auth/RLS changes or content replacement. The user subsequently requested a targeted redesign of the homepage text editor after comparing at least 40 UI references; public-page redesign and other CMS CRUD remain out of scope.
- Unitless line height 0.8–3; absent value preserves original styling. Body copy should normally use 1.5 or more.
- Preserve fonts, geometry, device/language isolation and undo/redo.
- Do not publish temporary verification edits.

## Task 1: Line-height contract, control and rendering

Files: `src/types/siteEditor.ts`, `src/lib/siteEditorLayout.ts`, `src/components/site-editor/EditableLayout.tsx`, `CanvasCopy.tsx`, `site-editor-text-box.css`, `src/components/admin/site-editor/EditorPlacementToolbar.tsx`, generated Supabase migration.

- [x] Add failing validation/preview/renderer tests for `{offsetX:12,width:80,lineHeight:1.6}` and invalid values; retain existing save-model tests.
- [x] Add optional `lineHeight`, canonical ordering and finite 0.8–3 validation.
- [x] Add `줄간격 (배)` input and default reset; render opt-in line-height marker/CSS variable and auto height without changing untouched boxes.
- [x] Extend only the internal Postgres layout validator; test old documents, accepted values, rejected CSS and unchanged permissions.

## Task 2: Missing Spirit targets

File: `src/components/spirit/SpiritHeritageExperience.tsx`; test: `src/content/siteCopyAboutCatalog.test.mjs`.

- [x] Add a failing preview-render test for lineage, manifesto labels, faith paragraphs, scripture cards, community roles and education panels.
- [x] Connect them with their existing source keys and adapters; preserve animation keys, links, dates and counters.
- [x] Check unchanged default public markup and real CMS selection/editing. Real-browser testing found missing authorization keys; a bounded 52-key renderer inventory and device/language isolation regression now cover them.

## Task 3: Verify

- [x] Exercise line-height change/default, invalid input, input cancel, undo/redo, text editing and navigation/save locks locally without publishing test data.
- [x] Check Korean/English 390, 768 and 1440 layouts, numeric keyboard input and console health; also check 1024 landscape and 1920 desktop.
- [ ] After release, verify actual draft save/reload, publication review (cancel only), and restoration of only the temporary line-spacing override. Keep production content unchanged; record the result in the session's verification artifacts.
- [ ] Run affected/full tests, lint and build. Commit/push only verified relevant changes under standing delivery instructions; report any unrelated test-process failure honestly.
