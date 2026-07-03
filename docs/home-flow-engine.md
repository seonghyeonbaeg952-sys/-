# Home V5 Flow Engine

## Purpose

The flow engine connects the home page into one continuous arts-institution experience without scroll hijacking. It keeps the page readable during fast scroll, while giving desktop users a quiet scene rail.

## Section Order

1. `hero` - Stage hero slideshow.
2. `quick` - Three guide cards.
3. `score-book` - Motet score cue.
4. `about` - choir introduction preview.
5. `spirit` - arrow-controlled spirit scorebook.
6. `concert-program` - concert template panel plus program notes.
7. `archive-stack` - gallery/archive preview.
8. `join-letter` - join invitation.
9. `sponsors` - sponsor/partner rhythm.
10. `support-letter` - support pledge invitation.
11. `footer` - curtain-call footer.

## Implementation

- `src/constants/homeFlow.ts` defines canonical scene keys and labels.
- `src/hooks/useHomeFlowProgress.ts` reads `[data-flow-section]` nodes and computes active scene using viewport proximity.
- The hook uses one passive `scroll` listener, one `resize` listener, and `requestAnimationFrame`.
- `src/components/home/HomeFlowProvider.tsx` exposes:
  - `data-active-flow-section`
  - `--home-active-index`
  - `--home-active-position`
  - `--home-flow-progress`

## Behavior

Desktop:
- The side progress staff is visible.
- Section labels update as the viewport enters each scene.
- Home side staff/hand animation remains only on the home page, not on `/spirit`.

Tablet:
- The progress rail is hidden to prevent crowding.
- Layouts become stacked or reduced-depth.

Mobile:
- Normal scroll.
- No side progress staff.
- No hover dependency.

Reduced motion:
- Scene content remains visible.
- Transitions resolve quickly and do not block reading.

## QA Notes

Check `/` at 390x844, 768x1024, 1440x900, and 1920x1080.

Expected:
- No horizontal overflow.
- No scroll lock.
- Active section changes without wheel interception.
- The concert panel and spirit scorebook are readable without hover.
