# Spirit copy and layout refinement implementation plan

> Execute inline with measured browser checkpoints. User-authored Korean desktop copy, formatting and placement are the design reference, not a redesign target.

**Goal:** Apply the reviewed desktop copy and typography to Korean mobile/tablet and translated English on all devices, then correct awkward public composition.

**Architecture:** Keep existing editor documents and native copy renderers. Preserve device-local font settings. Scope layout changes to the actual editor device and English language so Korean desktop stays intact.

**Tech Stack:** React, TypeScript, Motion, Vite, Supabase and existing CSS.

**Spec:** Latest user instructions in this chat: retain Korean desktop source, transfer copy and font settings, inspect aesthetic composition, verify ten actual public language/device cases, commit and push.

## Global constraints

- No new dependencies, auth/RLS changes, gradients or broad redesign.
- Back up current Spirit records before any content update; use version guards.
- Use existing colors, fonts, decoration and animation.
- Do not publish unrelated CMS changes.

## Tasks

- [x] Reproduce real public failures: tablet hero overlap, missing transferred font sizes, English phrase joins and decorative-rule collisions.
- [x] Write browser assertions for headline/body separation, phrase spacing, glyph bounds and CMS style application; verify they fail before changing production code/data.
- [x] Modify `SpiritHeritageExperience.tsx` and `spirit-heritage.css` to use the selected device for composition and natural text height; preserve Korean desktop editor values, with only supporting paragraph/action gaps adjusted.
- [x] Restore font sizes with reviewed device-local proportions and correct English fragment spaces in Spirit records; validate documents and publish through the authenticated CMS.
- [x] Inspect all nine sections in ten real public language/device cases (390, 768, 1024, 1440, 1920), exercise value/education tabs, and inspect refresh/resize.
- [x] Run `pnpm lint`, `pnpm test`, `pnpm build` and review the scoped changes for commit and push.

## Pre-commit verification checkpoint

- Korean Spirit publication version 91 and English version 70 match the reviewed documents; no draft-only copy remains.
- Korean desktop copy, text styles, layout values and shared copy match the backed-up source exactly.
- Ten actual public viewport/language combinations, nine sections each: 90 section audits pass. Layout assertions use reduced motion; normal-motion Korean/English desktop reloads separately preserve settled title/photo geometry.
- All nine English value/education tab states pass at 390px and 1440px; arrow-key wraparound and End-key selection work.
- Typography, paragraph grouping and ornament spacing were visually reviewed. English title edge spacing is corrected only on smaller desktops; no new decoration, font or motion system is introduced.
- Fresh lint and production build pass. Targeted content, layout, markup and image tests pass 53/53.
- The full test run has 1,152 passes, 11 skips and one `SiteImage.test.mjs` file-process failure after its three assertions pass. The same file and affected contracts pass in isolated reruns. Do not describe the entire full suite as passing; the Windows process-exit issue remains unconfirmed.
- Delivery: main-branch push and production-deployment verification are performed after this pre-commit checkpoint; retain external command/browser evidence rather than changing the verified commit merely to record its hash.
