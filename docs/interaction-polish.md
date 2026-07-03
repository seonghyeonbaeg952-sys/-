# Interaction Polish

## Interaction Model

The site should feel like a restrained arts institution site:

- clear navigation,
- visible focus states,
- controlled motion,
- no scroll hijacking,
- no unnecessary hover-only behavior,
- no decorative elements that cover text or faces.

## Home Flow

The home page uses `SMYC Flow Engine` to maintain a shared sense of progress. The side progress staff is deliberately hidden on tablet/mobile because it competes with content in narrow layouts.

## Micro-Interactions

Buttons:
- Keep elevation and movement small.
- Primary actions use gold or navy.
- Secondary actions should not visually overpower section titles.

Cards:
- Concert/program cards may open or lift.
- Archive cards may separate on desktop hover.
- Mobile cards stay static and readable.

Sponsors:
- Five or more visible sponsors can use quiet marquee.
- Fewer sponsors remain static.
- Reduced motion makes sponsor movement static.

## Reduced Motion

The existing global `prefers-reduced-motion: reduce` rule disables transitions and animations broadly. Home flow labels and handoff transitions are included in that rule.

## Security And CMS

- Public pages must still use only visible public data.
- Admin-only data must not be surfaced by decorative flow components.
- No keys, tokens, passwords, or service-role values belong in code or documentation.

## QA Checklist

- Keyboard focus remains visible.
- No fatal console errors.
- No horizontal overflow at 390px.
- `pnpm lint` and `pnpm build` pass.
- `.env.local` remains uncommitted.
