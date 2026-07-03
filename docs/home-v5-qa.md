# Home V5 QA Checklist

## Routes

- `/`
- `/spirit`
- `/about?section=overview`
- `/concerts`
- `/gallery?tab=photos`
- `/join`
- `/contact?section=support`

## Viewports

- 390 x 844
- 768 x 1024
- 820 x 1180
- 1440 x 900
- 1920 x 1080

## Visual Checks

- Hero remains a slideshow.
- Home sections read as one flow, not disconnected cards.
- Concert section is a template/program panel, not a book.
- Spirit section uses scorebook navigation, not a long text stack.
- Archive preview does not hide mobile content.
- Sponsor section hides when there is no visible sponsor data.
- Footer acts as the final curtain-call section.

## Interaction Checks

- Concert panel opens on hover and focus on desktop.
- Concert pin button toggles persistent open state.
- Escape closes pinned concert panel.
- Concert panel is always open on mobile.
- Spirit scorebook Prev/Next work.
- Spirit dots change pages.
- Spirit keyboard navigation works: ArrowLeft, ArrowRight, Home, End.
- Fast scroll does not break scene state.
- No scroll lock or wheel interception.

## Accessibility Checks

- Buttons have accessible names.
- Focus indicators are visible.
- No hover-only public information.
- Reduced motion keeps all content readable.
- Decorative staff lines are not required to understand content.

## Security and Privacy Checks

- `.env.local` is not committed.
- No service role key in frontend.
- No support pledge data is exposed publicly.
- Sponsor display depends on explicit public visibility/consent fields.
- Home page does not request or display member photos.

## Local Commands

```bash
pnpm lint
pnpm build
```

## Current Run

- `pnpm lint`: pass
- `pnpm build`: pass
- Browser QA:
  - `1440 x 900`, `768 x 1024`, `390 x 844`에서 Home root, Hero,
    Spirit scorebook, Concert template panel 렌더링 확인.
  - 세 viewport 모두 horizontal overflow 없음.
  - legacy program-book selectors 없음.
  - guided flow toggle 없음.
  - console error 없음.
  - Spirit scorebook next control: `현재 2 / 5: HONEST MUSIC` 전환 확인.
  - Desktop concert pin control: pointer click으로 `aria-pressed=true`,
    `data-pinned=true` 전환 확인.
