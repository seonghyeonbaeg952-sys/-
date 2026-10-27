# Conductor and Spirit photo refinement implementation plan

> **For agentic workers:** Use executing-plans to implement these tasks inline with checks after each task.

**Goal:** Fit the homepage guide cards, refine conductor identity/crops, use evidence-based tour imagery in a four-section Spirit page, and separate public staff responsibilities and accompanists.

**Architecture:** Preserve the React public routes, SiteImage/OptimizedImage boundaries, CMS copy keys, and existing motion. Scope crops to the approved source photo; keep CMS replacements and their focal points authoritative. Use the existing source-bound translation registry for approved identity wording.

**Tech Stack:** React, TypeScript, Vite, CSS, node:test; existing Python/Pillow for local contact sheets and web image encoding.

**Spec:** User requests dated 2026-10-27; AGENTS.md and PRODUCT.md are the incumbent constraints.

## Global constraints

- No authentication, RLS, storage policy, or credential changes.
- Keep current text edits and per-device CMS settings; no migration of unrelated copy.
- Preserve portrait proportions, reduced motion, keyboard access, and existing animation durations.
- Keep private original photo directories unchanged; publish only selected optimized derivatives without EXIF.
- No production dependencies. Push only after checks; the user's existing main-branch delivery authorization remains in effect.

### Task 1: Conductor identity and crop

Files: `src/components/about/ConductorProfileDocument.tsx`, its contract test, `src/styles/conductor-profile.css`, `src/content/siteCopyAboutCatalog.ts`, `src/features/sample-language/englishPages.ts`.

- [ ] Add a failing rendered test for both the known Korean identity and the published `Kim Hyung-su` English identity, expecting `Dr. Hyung-Su Kim` and `Artistic Director · Conductor`.
- [ ] Run `node --test src/components/about/ConductorProfileDocument.contract.test.mjs`; observe the identity assertion fail.
- [ ] Translate known identity variants; preserve unknown names and supplied CMS text. Keep professor/director terminology in approved translations without inventing appointments.
- [ ] Reduce the name sizes (desktop 42px, tablet/mobile 36px), allow natural wrapping, and crop only the approved default concert source toward the choir. Keep CMS photo focal points.
- [ ] Rerun the component contract and site copy tests; check Korean/English at 390, 768, and 1440px.

### Task 2: Homepage guide-card fit

Files: `src/pages/sample/HomeV4SamplePage.css`; existing public browser regression fixture where appropriate.

- [ ] Record the failing 1440×720 reduced-motion geometry: guide-card bottom 755.6px exceeds viewport 720px.
- [ ] Anchor the fallback guide overlap using its actual scaled card height and a bottom breathing gap; balance its following margin so page flow is retained.
- [ ] Verify normal-motion end pose separately; do not modify handoff durations, collage timing, or sticky lengths.
- [ ] Check guide buttons remain reachable without overlap at 1440×720 and 1920×1080, plus tablet/mobile routes.

### Task 3: Evidence-based Spirit photographs

Files: `src/components/spirit/SpiritHeritageExperience.tsx`, `src/features/site-photos/sitePhotoCatalog.ts`, relevant copy/translation entries, selected `public/images/spirit/tour-2025/` web assets, `docs/design/2026-10-27-spirit-photo-selection.md`.

- [ ] Inspect contact sheets of all group-photo candidates; open shortlisted originals to reject blur, distracting foregrounds, and poor crops.
- [ ] Document original filenames, visible evidence, the target paragraph, and the reason each photo is appropriate. Do not infer unverified venues or events.
- [ ] Export only selected photos as proportion-preserving WebP with EXIF removed; retain the D: originals.
- [ ] Replace Spirit-specific fallbacks through existing editable photo keys, retaining legacy sources for old CMS records. Do not change shared home/brochure photos.
- [ ] Verify asset decoding, semantic alt text in both languages, CMS override priority, and desktop/tablet/phone crops. Avoid unrelated copy/layout changes.

### User steering incorporated

- Keep exactly hero, lineage, community and closing; remove the five other rendered sections and their unused CSS. Preserve stored CMS records and redirect old anchors to retained sections.
- Use a solid blue hero, white community section and pale-blue closing. Remove the hero image fallback's gradient too. Keep home button transparency unchanged.
- English conductor name is 30px; Korean name is 42px on desktop and 36px on tablet/phone. The Korean page's Latin name also reads Dr. Hyung-Su Kim.
- Add constrained nullable staff_role through an atomic Supabase migration; keep the privacy-safe RPC field list, visibility checks and grants. Map only the approved role enum.
- Store the four explicitly requested assignments in the CMS. Show playing coaches, planning/PR and treasurer below one STAFF heading, exclude accompanists, and retain singing staff in voice-part lists.
- All-time members remain row-major, CMS order followed by protected Korean name ties, with accompanists in their own list.
- Reproduce the quick-menu mount race, observe only its stable rest grid, and disconnect the temporary mount observer after connection. Preserve the existing 3280ms/960ms handoff durations.

### Final verification record

- `pnpm lint` and `pnpm build` passed.
- Full suite: 1209 passed, 11 browser-environment tests skipped, one SiteImage test process crashed in the Windows/V8 native teardown (`node->IsInUse`). All three assertions in that file passed on isolated rerun. This is not reported as a clean full-suite run.
- Required public routes rendered without horizontal overflow at 390/768/1440px. Spirit and conductor were checked in Korean and English. Photos decoded; English conductor name computed to 30px.
- Home hero checked at 1440×720, 1536×900, 1920×1080 and 2375×1125; controls and guide cards fit without overlap. Controls retained opacity 0.58 and physical 44px targets. Pause/next actions worked; reduced-motion layout also fit.
- Impeccable detector ran once. Two existing accent-border warnings were reviewed; no new design violation was introduced by the scoped changes.
- Supabase migration and the four approved public staff-role values were verified. Local migration version matches recorded remote history.
- Proof screenshots are outside Git. Selected image derivatives total 637,610 bytes. Original photos, private data, auth/RLS and credentials were not changed.
- The user requested final commit and push after verification; integrate into the unchanged main fork point without force-pushing.
