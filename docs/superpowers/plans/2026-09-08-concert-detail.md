# Concert detail implementation plan

**Goal:** Apply the approved concert detail and readable concert-list dates without changing CMS data or access rules.

**Architecture:** Keep `useConcertDetailData` and the existing public layout. Read `poster_url` directly from the concert. Use a scoped poster component with native modal behavior, following the gallery's focus/scroll restoration pattern. Reuse the schedule model's safe HTTP URL and status helpers.

**Tech stack:** React, TypeScript, Vite, existing CSS/tokens, native dialog. No new dependencies.

**Spec:** Figma `nz8fKU1RqfasYhsIQEIVF5`, detail `557:1278`, mobile `557:1279`, date list `551:1239` / `553:1252`.

## Constraints

- Only concert detail and concert-list dates are in scope. Join/CMS redesign is excluded.
- Preserve `is_visible=true`, public hook, RLS, Auth, admin CRUD, current header/footer.
- No fabricated poster, ticket link, programme, or fixed date. CMS text is authoritative.
- Preserve poster ratio. No placeholder column when no poster exists.
- Mobile controls at least 44px; modal must support ESC, close, focus restoration, loading/error/retry, zoom, and body-scroll restoration.

## Tasks

1. Write date-label cases in `concertScheduleModel.test.mjs`: `2026-09-19` → `2026. 09. 19. (토)`, leap dates, blank/malformed/impossible dates → `날짜 미정`. Run `node --test src/components/concerts/concertScheduleModel.test.mjs` and observe failures before implementing `getConcertDateLabel`.
2. Write a temporary Playwright flow outside the repository. Mock only the public concert response (no database writes), load the real detail route, require a poster-open button, then verify dialog/ESC/focus/zoom/retry. Confirm the current page fails the poster-open assertion before implementation.
3. Replace the detail's duplicated hero/title and cards with the approved two-column poster/summary layout. Use one h1, safe CMS links, conditional programme/performers and a one-column no-poster state. Keep SEO structured data, but omit empty/unsafe image and action URLs.
4. Add `ConcertPoster.tsx` and scoped CSS; mount viewer only while open. Preserve native dialog focus isolation and existing page styles. No gallery or shared modal refactor.
5. Update only ConcertRow's date and responsive date-column CSS using the tested label formatter. Keep filtering, categories, posters, list navigation and ordering intact.
6. Run model tests, `pnpm test`, `pnpm lint`, `pnpm build`. Validate desktop 1440px, tablet 768px and mobile 390px for no poster, real-image fixture, failed image/retry, unsafe links, canceled concert, keyboard modal, and main routes. Capture screenshots outside the repository. Review the diff to verify no CMS/schema/auth files changed.

## Intentional differences from Figma

The frame's poster is an explicitly labeled example. Production must not show that placeholder. Registered posters display their actual aspect ratio; missing posters do not reserve a blank column. Image viewer controls include operational loading/error/retry and zoom rather than a nonfunctional mock.
