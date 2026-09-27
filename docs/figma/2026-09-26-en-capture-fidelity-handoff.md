# English Figma capture-fidelity handoff — 2026-09-26

## Scope and source

- Figma file: `nz8fKU1RqfasYhsIQEIVF5`; English sample page `676:1777` only.
- Website source code, deployment and CMS data were not written by this task.
- Korean copy task: `01a03308-d8f3-7ef0-be07-9cc35db7994d`; latest confirmed draft is home v7 / spirit v3, 129 fields, unpublished. The final Score summary is two lines to fit the existing summary/action positions. v7 removes duplicate data punctuation; the rendered Score headline retains one orange period.
- English compact adaptation: `artifacts/copy-revision/en-compact-sample-copy.json`.
- The user’s 17-page PDF was checked for missing scenes. Actual graphics and placement were derived from the current site’s CSS and assets, not substituted with old PDF artwork.

## Verified causes

1. Off-screen poster/video images initially had an empty `currentSrc` and zero intrinsic width. The page-ready status alone did not prove media readiness.
2. Archive images were loaded, but the scene was still at `--motion: 0.0000`, with image opacity 0.72 and desaturated filters. The site's built-in reduced-motion final state changed it to `--motion: 1.0000` and displayed complete, coloured records.
3. CSS repeating gradients and `clip-path` were lost by conversion. Join staff lines disappeared and end chevrons became solid bars. Architecture foreground clipping became four full-image fills that covered the programme cover.
4. Orbit WebP upload succeeded, but the Figma render omitted it. Lossless format conversion to PNG restored the same source poster.
5. CSS pseudo-elements imported as normal grid children doubled selected-tab height. They were restored to absolute decoration.
6. Grid tracks support `FIXED` and `FLEX`, not `HUG`. The mobile Join introduction now uses its actual one-column vertical auto layout, so headings and body do not overlap or leave a fixed-height gap.

## Changes

- Restored Join staff and chevrons as source-derived SVG, architecture clipping, programme cover and L-shaped corner rules.
- Restored Orbit poster with source-equivalent scrim and selected dot/halo states.
- Restored the complete Score sheet: paper, heading, voice legend, staff, summary and actions. Closed cover is preserved separately.
- Replaced intermediate Archive canvas images with complete source images; removed intermediate text blur and restored completed footer.
- Added source M boundaries and five-line rail to the full desktop Home design.
- Added 33 full-design state samples: desktop Orbit 5, Values 4, Learning 5 and programme-open 1; tablet Values 4 and Learning 5; mobile Values 4 and Learning 5.
- Applied latest Korean draft meanings, with compact English copy where needed. Mobile closing headline is separately shortened to avoid the logo. Mobile voice descriptions wrap inside their cards.

## Main frames

| Frame | Node |
| --- | --- |
| Home desktop 1536 | `842:8929` |
| Home tablet 768 | `842:3543` |
| Home mobile 390 | `841:3125` |
| Spirit desktop 1536 | `842:5801` |
| Spirit tablet 768 | `842:6873` |
| Spirit mobile 390 | `842:7901` |
| Score complete | `842:9622` |
| Score closed | `902:6326` |
| Programme open | `927:6301` |

State samples are named `COMPLETE / …` and located to the right, at x=22000 onward. `CONTENT REFERENCE ONLY` is a copy reference, not a substitute for state designs.

## Verification

- Read all 17 PDF pages and compared coverage with the real site and Figma.
- Used actual UI interactions to reveal Join, open programme and Score scenes; checked image intrinsic dimensions, fonts and scene progress.
- Exported and visually inspected six full-page English frames, plus detailed representative section/state renders.
- Audited 1,555 visible text nodes across the main component libraries and 33 state designs: no missing fonts; no unintended clipped text. The large `2026` background watermark is intentionally clipped like the source.
- Verified mobile Join, closing logo/headline, voice-card wrapping, selected tab colours and final Archive media in detailed renders.
- Original `artifacts/copy-revision/copy.json` SHA-256 remains `D1762C10C37341B8C486049552E84F5C015ABC532FFF6D11F1BC4D1E82CB1C9F`.
- No website lint/build claim is made: this is a Figma/artifact-only change.

## Limits

- Figma state frames are editable static design samples, not a new implementation of web scroll animation.
- Archived photos and printed posters retain their original pixels and language; UI labels are English.
- The Korean page `851:1253` remains owned by the Korean copy task. Read-only inspection confirmed its repaired Join, programme, Orbit and Archive graphics. The Korean Score complete scene is separately preserved at `924:1253`; the closed scene remains in the full-page reference.

## Balanced-copy follow-up — 2026-09-27

- Coordinated with the Korean task and read `balanced-sample-copy.json`, including its later additions. Final confirmed CMS drafts are **home v8 / spirit v4**, 129 keys, unpublished. Read-only `cms-final.json` confirmed both versions and null published fields.
- English adaptation: `artifacts/copy-revision/en-balanced-sample-copy.json`. The 33 meaning changes retain the added educational detail rather than shortening the body back to the compact version.
- Updated Home and Spirit at 1536, 768 and 390px, plus existing Orbit/Values/Learning state designs. The six main frames are labelled `Balanced KO v8 · v4`.
- Education heading was 600px in a 451.4px column. It is now constrained to the real column and uses normal flow. Mobile wording breaks into `Five experiences / of growth through / choral singing.`
- Education panel height grows with the body and reserves at least 40px before its lower decorative number. Mobile closing body reserves 24px before the actions; the wordmark follows beneath them. Closing heading now remains three meaningful lines without a lone `voice` line.
- Footer address tracks now use the actual two-/three-line height, with following rows reflowing. Desktop lineage year labels no longer invade adjacent text; long headings wrap within their columns. Lineage body/title sizes were checked against `spirit-heritage.css`.
- The decorative M had been captured at opacity 1. The source motion's completed value is 0.06 (`SpiritHeritageExperience.tsx`, `whileInView`); all three English sizes now preserve that value and no longer obscure prose.
- Fresh exports of all six full frames and detailed desktop/tablet/mobile sections were visually inspected. Final audit covered 93 component/state roots and 1,490 visible text nodes: no missing fonts, no unintended glyph overlap or main-frame overflow. Intentional source watermarks and the calligraphic ONE VOICE letter overlap are excluded.
- No website source, published CMS state or deployment was changed by this task. Original `copy.json` hash is unchanged. This follow-up does not claim all other public-route samples have been re-audited.

### Latest mobile source reference

- The Korean task subsequently confirmed **home v8 / spirit v6**: seven mobile-only Spirit overrides, with the desktop/tablet expanded meanings unchanged. English version labels and the adaptation artifact now reference v8/v6.
- English retains the longer descriptions because its panel/action spacing was already verified; no English content or geometry changed in this version-label update. The preceding full-screen and text-layout verification remains applicable.

### Final CTA reference — home v8 / spirit v7

- The Korean task finalized the common closing description as two sentences. English desktop/tablet/mobile now use: `Joining begins a journey of learning, singing and growing together. / Your support helps sustain young people’s learning and growth over time.`
- The seven Korean mobile overrides are unchanged from v6. English expanded education descriptions remain intact. Main frame names, state guide and English artifact now reference **home v8 / spirit v7**.
- Exported and visually checked all three changed closing scenes. Mobile body/action spacing remains exactly 24px; no unintended text overlap or missing fonts in the changed scenes.

### Faith-heading correction — home v8 / spirit v8

- The Korean task corrected the faith heading's emphasis split and removed the repeated life wording from the heading; the explanatory body remains unchanged.
- English heading at all three sizes: `Our approach to music / becomes a guide for / the next generation.` Main-frame labels, guide and English adaptation artifact now reference **home v8 / spirit v8**.
- Visually checked fresh renders of all three changed faith sections and checked text overlaps/missing fonts: none. No website or CMS writes were performed here.
