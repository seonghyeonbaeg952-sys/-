# Concert Template Panel

## Goal

The home concert section is a program-template panel, not a book. It should feel like a concert program sheet that reveals structured event information.

## Component

`src/components/home/ConcertTemplatePanel.tsx`

## Data Source

- Uses the first visible upcoming concert passed from `PerformanceNewsPreview`.
- Respects existing public data filtering from `useHomeData`.
- Does not introduce a new Supabase table.

## Interaction

Desktop fine pointer:
- Hover opens the details area.
- Focus opens the details area.
- Click on the pin button keeps it open.
- Escape unpins/closes and returns focus to the pin button.

Tablet/mobile/reduced motion:
- Details are always visible.
- No hover-only information.

## Accessibility

- The pin control is a native `button`.
- It uses `aria-expanded`, `aria-controls`, and `aria-pressed`.
- The details section has a stable ID.
- CTAs remain links, not nested inside a clickable card.

## Visual Structure

- Left media area preserves poster ratio with `objectFit="contain"`.
- Right content area contains title, date, place, status, summary, program note, and CTAs.
- Staff-line accents and program note lines preserve the music/program language.

## Replaced Legacy

Removed the old `ProgramBookletConcertCard` component and its legacy `program-booklet` CSS. The previous book-cover metaphor could imply page flipping and was more fragile.

## QA Criteria

- Desktop: hover/focus/click pin all expose details.
- Mobile: information is visible without interaction.
- Reduced motion: panel is readable and static.
- Posters are not cropped.

