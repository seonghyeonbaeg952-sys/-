# English Figma layout and translation verification — 2026-09-27

## Scope and source of truth

- Figma file `nz8fKU1RqfasYhsIQEIVF5`, English page `676:1777` only. No website source edits, CMS writes, publishing, deployment, or production dependency changes.
- Home: anonymous GET of the existing public `get_public_site_editor_pages` RPC returned the copy published at `2026-09-27T04:05:24.689137+00:00`. This is the verified source, not an assumed CMS version number.
- Spirit: no public editor document was returned. Its expanded English designs remain based on the agreed Korean draft v8 and are explicitly named **not published**.
- Mobile Home About uses the preserved current override `함께 빚어가는 화음,\n세대의 노래`; English does not silently add “next”. Desktop/tablet retain their next-generation meaning.
- Public adult biographies and eligibility/rehearsal information were read with `is_visible=eq.true`. No private applications, contacts, or member records were queried.
- Current application structure comes from `JoinApplicationForm.tsx`, `joinApplicationModel.ts`, `siteCopyPagesCatalog.ts`, and `join-application.css`.

## Corrections made

1. Home desktop About CTA originally ended at local y=1177.2003 while the transition started at y=1157.4001: **19.8002px overlap**. Its transition now starts at y=1217.2003. The container and section grow to 1274.8003px, preserving the CTA and artwork. Full-instance readback gives **40.0016px clearance**.
2. Members desktop footer moved from y=828, inside the archive, to y=2120, after its content.
3. About tablet/mobile duplicated “and value” removed; the complete heading now reads “We learn music’s true meaning and value.” The omitted neighbours/comfort/hope/generosity/love sentence is restored. Dependent quote/card positions use the new text height, with 24px body-to-quote clearance.
4. Concert tablet day/month spacing corrected; mobile hero metadata moved below its two-line title.
5. Contact mobile navigation wraps into two columns. “Invite the choir” replaces the overlong navigation label while preserving its meaning.
6. Intrinsic bounding-box checks found clipping invisible to rendered-glyph-only checks: header navigation, footer actions, tablet pledge fields retaining 1098/1476px desktop widths, consent labels, monthly giving amounts, and an expanded biography. These were corrected. Mobile conductor CURRENT label has 24px clearance after its biography.
7. The library checkbox label’s inherited sizing did not accept the intended width overrides. An English-only responsive consent component (`1026:6297`) reuses the existing checkbox geometry and token paints; its label fills available width and wraps, with a 44px minimum target. Nine form consent instances use it. The original design-system component and Korean pages are unchanged.
8. Current application samples (`840:7291`, `840:7593`, `840:7879`) now contain six text/date/phone/textarea fields plus multiple-choice voice parts: name, birth date, school/grade, applicant phone, guardian phone, parts, motivation; consent is separate. Old paper-form fields are hidden, not deleted. No visible religion, Hanja, photo, occupation, recommendation, or referral fields remain. Desktop/tablet parts use two columns, mobile one column. The first action is **Review application**, not immediate submission. Header, source font roles, and footer are retained.
9. Search no longer breaks “Search” across two lines in the two no-results screens.
10. Final visual readback found a narrow tablet Soprano label after grid restructuring and copied desktop navigation highlights pointing to the wrong page. Voice-part rows now fill the actual form width (1024px desktop / 704px tablet), with 500px / 340px cells and one-line labels. Twenty desktop header instances have their active label/indicator matched to the displayed route. Changed views were re-exported after these corrections.

## Translation checks and corrections

- British spelling is retained (`programme`, `organisation`, `neighbours`, `honours`). Currency and eligibility remain unchanged; the public university age limit is 22, and rehearsal time is Saturday 10:00–13:00.
- Literal “Your next voice starts here” is removed from the current form. Its title and instructions now correspond to the actual source form.
- Language-name placeholders use correct capitalization and natural wording.
- Video cards describe the in-page viewer, not an automatic external YouTube navigation; the viewer’s separate YouTube link is not removed.
- Poster-present references no longer say “No poster is currently registered”. Their six top-level frames are explicitly labelled `Artwork pending · layout sample`, because they do not contain real concert-poster artwork.
- `Musicianship & vocal range` clarifies the check’s meaning. Honest music uses “We explore every note in depth.” “Voices for the next generation” replaces a literal “resonance” heading. The service paragraph uses “Through music, we share peace and hope.”
- The desktop principal-accompanist label is matched to the published override. Graduation wording and the omitted accompanist experience list are restored from public Korean biographies, without adding a new degree claim.
- Review/error copy now reflects the current seven-field workflow and the uncertainty of a previous submission, without promising a payment or an automatic withdrawal.

## Verification evidence

- Inventory: **132 existing English page/state designs**, including desktop/tablet/mobile, plus **5 Korean popup design views**. Explicit legacy references and the new reusable consent master are not counted as public screens.
- All 137 views were re-rendered through Figma screenshot export at natural resolution (`maxDimension=15000`); all exports/downloads succeeded. Later changed application and search views were re-exported.
- Recursive readback after corrections: **5,994 visible text nodes**, **879 unique text strings**, **124 visible image paints**, **0 missing fonts**, **0 detected readable-glyph overlaps**, **0 text-box overflow past clipping ancestors**. Low-opacity watermarks are intentionally excluded from readable-text collision checks. These are structural checks, not a claim that every possible dynamic state exists.
- Composition screenshots and enlarged proof strips were inspected for page boundaries, imagery, typography, footer position, form widths, and dependent content flow. Screenshot files are in `C:/Users/seong/AppData/Local/Temp/smyc-final-<node-id>.png`; a compact About-gap proof is `smyc-about-gap-final.png`.
- Source PDF extraction `copy.json` was preserved. No application build/lint was run for Figma-only changes; no browser-interactive test is claimed. Computer Use stopped when URL verification failed and was not used further.
- Figma component/layout guidance led to fixing the English consent component rather than altering the original library. UX-writing guidance led to restoring meaning and matching labels to actual actions rather than merely shortening translations.

## Remaining coverage and risks — not claimed complete

- Six concert-poster layout references still need the actual relevant concert-poster artwork. No unrelated recruitment image was substituted to make them look complete.
- The expanded Spirit copy is still a draft source. Its future publication must be rechecked before describing it as a current published translation.
- The existing 27 submission/review/error state boards are standalone state illustrations, not full source-page captures with surrounding header, footer, and retained form. Full-context variants still need composition.
- Missing dedicated samples from earlier route inventory: video viewer (3 sizes), Contact performance/general-enquiry/location/supporters subviews (12), pledge inline-error (3), 404 (3), mobile/tablet navigation drawer (2), expanded FAQ (3). Their absence is not hidden by the 132-screen count.
- Original logo/poster/programme raster artwork keeps its source language. Official personal-name romanizations and ambiguous doctoral-study wording still require owner confirmation; no unsupported qualification was added.
- Static concert example dates/statuses are capture data, not a live schedule guarantee. Live form submission, payment, keyboard focus, scrolling motion, and real-device browser behaviour were not tested in this Figma-only task.

## Main updated links

- [Home desktop](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=842-8929)
- [Home tablet](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=842-3543)
- [Home mobile](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=841-3125)
- [Current application desktop](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=840-7291)
- [Current application tablet](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=840-7593)
- [Current application mobile](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=840-7879)

Official read-only API reference consulted: https://supabase.com/docs/reference/javascript/select .
