# Home Spirit Scorebook

## Goal

The home spirit section should feel like turning through a short scorebook. It should not be a long vertical manifesto on the home page.

## Component

`src/components/home/HomeSpiritScoreBook.tsx`

## Pages

1. The Name Motet
2. Honest Music
3. Church Music
4. Community
5. Next Generation

The default copy comes from `src/constants/spiritContent.ts`. Admin-editable `about_sections` can override each page using section keys like `home_spirit_motet`, `home_spirit_honest-music`, and so on.

## Interaction

- Prev/Next arrow buttons.
- Dot buttons for direct page selection.
- Keyboard support: ArrowLeft, ArrowRight, Home, End.
- `aria-live` announces the active page.

## Mobile

- The scorebook becomes a single-column card.
- Controls stay visible.
- Content is not hidden behind hover or 3D effects.

## Reduced Motion

- Active page is shown without transform-based entry.
- Controls still work.

## Privacy

The component does not request member data and does not render member photos.

