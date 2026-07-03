# Home V5 Motion System

## Purpose

Home V5 treats the SMYC home page as a restrained concert-program sequence: hero, guide cards, score motif, about, spirit scorebook, concert template panel, archive wall, join invitation, sponsor rhythm, support letter, and footer curtain call.

The motion supports orientation. It must not trap scroll, force full-page snapping, or require hover to read core information.

## Components

- `HomeFlowProvider`: passive scene state and desktop progress staff.
- `ScrollScoreBookReveal`: early Motet score cue.
- `HomeSpiritScoreBook`: arrow-controlled scorebook for the choir spirit.
- `ConcertTemplatePanel`: concert program template panel, replacing the old book-cover card.
- `NoticeProgramNotes`: notices rendered as program notes.
- `GalleryPreview` and `ArchivePageStack`: archive-style visual preview.
- `SponsorQuietMarquee`: partner/sponsor rhythm when data exists.
- `SupportLetterFold`: pledge-letter style support invitation.

## Motion Rules

Desktop:
- Scroll is an intent signal. Scene changes trigger fixed-duration CSS transitions.
- Use horizontal typography motion, staff-line sweeps, panel reveal, and quiet page transitions.
- Do not intercept wheel events, use mandatory full-page snap, or create long sticky sections.

Tablet:
- Reduce 3D depth and keep content readable in stacked layouts.
- Concert and spirit controls remain explicit.

Mobile:
- Normal scroll only.
- Concert panel is always open.
- Spirit scorebook uses visible arrows and dots.
- No hover-only information.

Reduced motion:
- All important content is visible without animated entry.
- Marquee, panel fade, and page transitions resolve to static states.

## Visual Rules

- Navy creates stage depth.
- Warm gold is reserved for notation, focus, active state, and program accents.
- Ivory is paper/program surface.
- Posters and documentary images preserve original ratios unless they are intentionally used as mood backgrounds.

## Accessibility

- Toggling panels use native buttons with accessible names.
- Concert panel uses `aria-expanded`, `aria-controls`, and `aria-pressed` on the pin button.
- Spirit scorebook supports Prev/Next buttons, dots, ArrowLeft/ArrowRight, Home, and End.
- Decorative staff lines and motion graphics are `aria-hidden`.

## Performance

- Motion uses CSS transitions/animations and a single passive scroll listener.
- `requestAnimationFrame` batches scene progress reads.
- No new production animation dependency was added.

