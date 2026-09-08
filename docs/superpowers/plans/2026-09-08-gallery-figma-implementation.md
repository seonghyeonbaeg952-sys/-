# Gallery Photo Journal Implementation Plan

> For agentic workers: execute the test-first tasks in order; use independent read-only CMS and UX review checkpoints. Preserve the current dirty workspace and unrelated work.

**Goal:** Port the accepted Figma gallery into the existing public site without changing CMS rows, permissions, or data contracts.

**Architecture:** Keep `useGalleryData`, public queries, the public header/footer and shared `FilterSelect`/`OptimizedImage`. Add a small pure gallery view model and one native-dialog viewer. Use URL parameters for tab, photo category and selected media ID; preserve ordering and restore focus/scroll when closing.

**Tech Stack:** React 19, TypeScript, Vite, existing CSS and Node test runner. No new dependency.

**Spec:** Figma `nz8fKU1RqfasYhsIQEIVF5`, photo frames `470:689/470:690/470:691`, video `478:745`, poster `478:746`, viewer `480:816`. Existing public CMS data replaces design-only imagery.

## Global Constraints

- Never write CMS/DB/Storage or change auth, RLS, public visibility, or shared query/cache logic.
- Preserve the existing working tree. No resets, commits, dependency installs, or unrelated component edits.
- No design example photos, dates, counts or rows hardcoded into public content.
- Read actual table contracts: `gallery`, `videos`, `posters`; not the mistaken gallery_images label in the sample notes.
- Existing header/footer stay unchanged. Gallery styles use a dedicated namespace.
- Original images use contain, no face/edge crop or hover text overlay.
- Keep existing in-page video playback; offer an allowlisted original YouTube link as a secondary action.

## Task 1 — Test URL, collection and selection behavior

Files: create `src/components/gallery/galleryViewModel.test.mjs`, then `galleryViewModel.ts`.

- [x] Write tests against real model exports: visible-only CMS arrays preserve order, categories exclude hidden data, unknown filters return no fabricated items, selected IDs remain stable after reorder, navigation wraps within the filtered set, blank/malformed video IDs are rejected, query updates preserve unrelated parameters and category.
- [x] Run `node --test src/components/gallery/galleryViewModel.test.mjs`; observe the absent behavior before implementation.
- [x] Implement `getGalleryView`, `readGalleryLocation`, `updateGallerySearch`, `getAdjacentMediaId`, and `getGalleryVideoLinks` with strict typed inputs.
- [x] Run tests again and verify literal expected outputs.

## Task 2 — Port layout and viewer

Files: modify `src/pages/public/GalleryPage.tsx`; create `src/components/gallery/GalleryViewer.tsx`, `src/styles/gallery-page.css`.

- [x] Write an executable browser regression script outside the repository. Test photo captions, category selection, no clipping at 390px, native modal focus/scroll restoration and poster previous/next. Observe the current gallery fail the new UX expectations.
- [x] Replace oversized PageHero/card decorations with the Figma 64/48/40px title, paper background, 104×44 tabs, 864:472 desktop lead split, 3/2/1-column remaining media, and 12px caption gaps.
- [x] Bind data only from the existing public hook. Render loading and partial-error retry without hiding successful collections. Show distinct empty collection/filter states.
- [x] Implement a native `<dialog>` with a title, close, filtered sequence counter, previous/next, Escape and arrow keys. Lock background scroll only while mounted; restore original styles and the invoking focus target with preventScroll.
- [x] ID-based selection must survive reorder and never select a different item by stale index. Invalid/deleted/hidden IDs must not open a dialog.
- [x] Reuse FilterSelect with a gallery-scoped left-aligned popup. Keep 44px touch targets and reduced-motion support.
- [x] Keep iframe URLs allowlisted and unmount the player when closed. Do not add arbitrary CMS URLs as clickable external links.

## Task 3 — Verify and hand off

- [x] Run the new unit test, existing tests, `pnpm lint`, and `pnpm build`.
- [x] Verify live `/gallery?tab=photos`, videos, posters at 1536/768/390 and short landscape. Compare exact poster content and gallery spacing to Figma. Record the intentional current-header and CMS-content differences.
- [x] Run controlled read-only network fixtures for hidden rows, empty data, partial failure/retry, malformed video URL, failed image recovery, long captions, and mixed categories. Never mutate backend data.
- [x] Smoke-check existing public routes and the admin login boundary.
- [x] Review the final diff and report verified behavior and real browser/device limitations. No claim of perfection beyond the evidence.
