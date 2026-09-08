# Gallery implementation verification — 2026-09-08

## Changes

- Applied the accepted Figma gallery frames to the existing `/gallery` route: photos, videos, posters and a shared accessible viewer.
- Kept existing `useGalleryData`, public queries, CMS fields, ordering, visibility, authentication, storage and cache invalidation unchanged. No CMS rows or files were uploaded, edited or deleted.
- Reused the public header/footer, `FilterSelect`, `OptimizedImage` and `AnimatedSectionTabs`. The only shared-tab change adds optional tab IDs and controlled-panel IDs.
- Added a typed gallery view model and eight behavioral tests to the existing `pnpm test` command. No dependency added.
- Removed three duplicated viewers in favor of a native dialog. URL state preserves the category, selected media ID and unrelated query parameters. Closing returns to the invoking control without scrolling the list away.

## Design / UX

- Source: Figma `nz8fKU1RqfasYhsIQEIVF5`, desktop/tablet/mobile `470:689`, `470:690`, `470:691`; videos `478:745`; posters `478:746`; viewer `480:816`.
- Verified desktop paper `#fcfaf5`, 1368px shell at 1536px, 64px title, 104×44px tabs with 4px radius, 864:472 photo layout and 408×576px poster frames.
- Original CMS photographs and posters use `contain`. Captions remain below images; hover does not hide images or text.
- Intentional differences from the sample: the existing 72px website header is preserved; actual CMS content replaces all design-only examples; videos retain in-page playback with a safe external YouTube fallback.
- Partial query failures preserve successful collections and offer retry. Empty/unknown categories, hidden/stale media links and malformed video URLs have explicit non-fabricated states.
- Very long viewer titles are limited to a two-line header preview; the full title remains readable below the image. The sticky header masks its upper padding so scrolled text cannot bleed through.

## Verified commands

- `node --test src/components/gallery/galleryViewModel.test.mjs`: RED before implementation; GREEN 8/8 after implementation.
- `node --test src/components/gallery/galleryViewModel.test.mjs src/components/notices/noticeViewModel.test.mjs`: 14/14 passed.
- `pnpm test`: 59/59 passed.
- `pnpm lint`: exit 0.
- `pnpm build`: exit 0, including TypeScript project build.
- Scoped `git diff --check`: exit 0.

## Browser verification

- Actual CMS content: 2 photos, 1 video and 2 posters. Read-only visual inspection covered all three tabs at 1536px, 768px and 390px; no horizontal overflow, overlapping controls, cropped titles or failed images were observed.
- Read-only smoke checks passed on `/`, `/spirit`, `/about?section=spirit`, conductor, accompanist, members, `/join`, `/contact?section=support`, `/notices`, `/concerts` and all gallery tabs. `/admin/gallery` correctly redirected an unauthenticated session to `/admin/login`.
- The smoke run recorded no JavaScript runtime errors or backend write attempts. It allowed the existing SELECT-only, STABLE `get_public_members` RPC, which uses POST as its transport.
- Long-title regression: 844×390 header reduced from 270px (9 lines) to 60px (2 lines); full title preserved; at least 120px image visibility and next-photo navigation passed.
- Final independent browser regression: 15/15 PASS, exit 0, on Edge 152.0.4191.66 after the final CSS change. Covered filtered navigation, native focus trap, closing, 180px scroll restoration, browser back/forward/reload, hidden rows, unknown/empty categories, partial failure/retry, malformed videos, broken-image recovery and four viewports including 844×390.
- Runtime errors and attempted CMS writes: 0. Only explicitly injected failure responses occurred (four HTTP 503 responses and two image 404 responses); no unexpected network/console failures. Iframe keyboard/close behavior used a controlled GET fixture, not a claim of real YouTube playback.
- Executable browser checks and PNG evidence are outside the repository at `C:/Users/seong/AppData/Local/Temp/smyc-gallery-implementation-20260908/`. Browser: existing bundled Playwright plus installed Chromium/Edge; no package installed.

## References and limitations

- [React Router useSearchParams](https://reactrouter.com/api/hooks/useSearchParams) for URL-backed view state.
- [MDN showModal](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal) and [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) for modal focus, keyboard and background interaction.
- CMS saving was intentionally not tested against real data. Security rules and CRUD code are unchanged; response fixtures tested public behavior without backend mutation.
- Real iOS/Safari and physical Android devices were not tested. YouTube player behavior may depend on embed availability, network and browser settings; safe external playback remains available.
- With only two CMS photographs, the tablet's second photo occupies one half-width grid column; this is the accepted grid's sparse-content case, not omitted data.
- Applied locally only. No production deployment, commit, reset, unrelated refactor or dependency change was performed.
