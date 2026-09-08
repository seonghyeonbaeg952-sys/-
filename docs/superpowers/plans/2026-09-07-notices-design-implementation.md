# Notices Design Implementation Plan

**Goal:** Apply the approved Figma notice desk to the live local website without changing CMS data or permissions.

**Architecture:** Keep `useNoticesData`, `useNoticeDetailData`, public queries, admin CRUD, authentication, header and footer unchanged. Replace only the two notice page presentations with scoped styles; use a small shared notice view model for filtering and presentation. Preserve real category/importance/content/image values and URL-based navigation.

**Tech Stack:** Existing React, TypeScript, React Router, Vite, CSS, Node test runner and bundled Playwright; no new dependencies.

**Spec:** Figma file nz8fKU1RqfasYhsIQEIVF5, desktop 446:613, mobile 446:615, detail 455:675 / 455:684.

## Global constraints

- Do not write to Supabase or change authentication/RLS/migrations.
- Do not copy the five illustrative notices into production.
- Keep optional CMS images on detail at their original aspect ratio; no placeholder thumbnails in the list.
- All selectors are scoped to `.notices-page`; preserve unrelated dirty files.
- Support reduced motion, keyboard focus, 44px controls, loading, retry, empty results and missing detail.

## Tasks

1. Add and run failing behavior tests for a shared notice view model: hidden rows excluded; combined title/content/category/importance filters; existing server order preserved; source array unchanged; excerpt and category/date presentation.
2. Implement `src/components/notices/noticeViewModel.ts`, rerun its tests. Reuse it in both public pages.
3. Replace `src/pages/public/NoticesPage.tsx`: compact masthead, real count, accessible importance buttons, URL-backed search/category, semantic linked list, retry and reset states. Keep the existing data hook.
4. Replace `src/pages/public/NoticeDetailPage.tsx`: breadcrumb, CMS title/date/body, optional uncropped image, return link preserving list filters, honest error and missing states. Keep the existing detail hook and SEO.
5. Add `src/styles/notices-page.css` using existing local font assets and Figma tokens. Match 1536 / 768 / 390 layouts without fixed content heights or global overrides.
6. Run Node tests, `pnpm lint`, `pnpm build`. Validate real `/notices`, query/reset/detail/back behavior and fixture-only edge states in an isolated browser context. Never save fixture data to CMS.
7. Capture desktop/tablet/mobile screenshots outside the repository, verify no overflow, overlay or relevant runtime errors. Recheck protected file hashes and inspect only this task's diff.

## Acceptance

- Approved flat title-first design is rendered; existing public CMS records remain authoritative.
- Existing header/footer and all protected data/admin files remain unchanged.
- Search, combined filters, browser history, empty reset, retry and detail work.
- Tests and render checks provide evidence; unresolved issues are reported rather than hidden.
