# Approved responsive home implementation plan

**Goal:** Apply the approved Figma home only below 1024px, with safe CMS editing and no changes to desktop, hero, menu, or footer.

**Architecture:** Reuse existing public-data hooks and CMS normalization. Add responsive concert and spirit components at existing responsive branch points; scope remaining layout CSS to the production V4 home at max-width 1023px. Keep shared copy untouched and introduce separate responsive spirit fields.

**Spec:** Figma `GBRHh1MIjSvazpMItUm6VT`, mobile `3:2`, tablet `4:2`; final spirit is the dark five-row list. Concert section is the explicitly approved redesign.

## Safety boundaries

- Preserve HomeHeroSlideshow, intro overlay, HomeV4SampleHeader/menu, Footer, their styles and current behavior.
- Preserve all layout and behavior at 1024px and above.
- No database writes, schema migrations, role/RLS/auth changes, or new dependencies.
- CMS dates, images, titles, visibility and notices remain live data; never ship sample event details.
- Concurrent task owns concert detail/list files and models. Work in an isolated worktree, then integrate only home-owned files after checking their original hashes.
- Use a separate 5177 server and independent headless browser; do not stop or reconfigure 5175.

## Initial implementation tasks (followed by the corrective fidelity pass below)

- [x] Test and register responsive spirit copy and concert-card label through existing CMS definitions/normalization/round-trip serialization. Verify legacy desktop fields do not change.
- [x] Build mobile/tablet concert ticket and notice list, with real upcoming filters, variable-length copy, valid dates and empty states.
- [x] Build the approved dark five-row spirit list; use dedicated CMS fields and preserve desktop orbit.
- [x] Adapt existing About, Join, Archive and Support layouts below 1024px; use public images and existing actions. Keep source hero/footer/menu and desktop markup unchanged.
- [x] Run targeted tests, full existing tests, lint and production build. Test 390/768/834/1023/1024/1440 widths, long CMS copy, empty/hidden data, links and keyboard use.
- [x] Compare protected desktop and hero/menu/footer styles between current checkout and isolated implementation. Integrate only the verified home change list without touching concurrent edits.

## CMS contract

Existing home/concert/notice copy fields are retained. New `home.spiritWrapper.responsive*` fields affect only the small-screen list; `home.concertProgram.responsiveCardEyebrow` and `responsiveNoticeEyebrow` affect only the small-screen ticket/notice labels. Editing existing shared fields can affect desktop copy and is labeled accordingly. New fields use the existing `site_texts` key/value store, so no migration or automatic live write is needed.

| Editing location | Applied content | Boundary |
| --- | --- | --- |
| Home CMS / spirit | 9 responsive fields: eyebrow, title, description, CTA, five row labels | Only below 1024px; existing desktop orbit copy preserved |
| Home CMS / concerts | 2 responsive label fields | Only below 1024px |
| Home CMS / existing section copy | About, Join, concert heading/description/actions, Archive, Support | Existing shared values retained; edits to shared copy affect both layouts |
| Concert / Notice management | Dates, venue, title, notice content, visibility | Actual published data only; Figma example events not inserted |
| Join management | Recruitment target | Current CMS target shown on small screens; original desktop target output retained |
| Photo / Poster / Video management | Visible ordered archive preview, caption, video thumbnail alternatives | Hidden media excluded; original image ratios preserved |

No administrator login, production save, database mutation, deployment, commit, or push is performed as part of this implementation. CMS registration and serialization are tested locally; browser scenarios replay read-only responses for long-copy and empty-data verification.

## Initial verification evidence (functional/preservation checks, not final fidelity)

- `pnpm lint` and `pnpm build`: passed.
- `pnpm test`: 61 passed; targeted home/CMS/desktop-spirit contracts: 38 passed.
- Independent headless comparison: 390, 768, 834, 1023, 1024, 1440px. Protected hero/header/footer and all desktop sections retained; responsive color, links, CTA click trials, open/close menu, long CMS copy and empty/hidden data checked.
- Main comparison passed 97/98 assertions; the single header comparison captured different asynchronous scroll states. An exact, stable-state focused rerun at 1023/1440 passed 4/4 without changing application code or relaxing assertions.
- Three image-error regressions reproduced before fixes and passed afterwards: video thumbnail alternatives, all-source failure, and About image failure. No document overflow, browser JavaScript errors, or write attempts in these scenarios.
- Browser compatibility for the existing `:has()` selector pattern checked against [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has). Physical iOS/Android devices and authenticated live CMS saving were not tested.

## Corrective fidelity pass — 2026-09-08

User approved resolving the full audit and explicitly confirmed tablet quick links. The mobile quick-link pattern is extended to tablet with 48px side padding because the tablet reference has no separate quick section. All other section layouts follow their own 390/834px nodes.

- [x] Replace large mobile/tablet quick cards with three compact CMS-backed rows; cancel the legacy hero-overlap offset only below 1024px.
- [x] Reproduce About/Join information order, compact facts, typography, spacing and source artwork; retain desktop rendering.
- [x] Remove the mobile score showcase; use the approved tablet education summary; retain the original desktop score.
- [x] Align concert date columns, notice links, letter spacing, rules and 18px action arrows.
- [x] Reproduce Archive mobile/tablet composition without desktop-only description; keep uncropped CMS images and thumbnail fallback handling. Tablet links retain a 44px hit area around the reference's 21px visual row.
- [x] Reproduce Support with one CTA, selected copy and three uses; exclude legacy secondary CTA/contact/detail rows only in approved small-screen layouts.
- [x] Prevent a future public sponsor record from adding an unapproved small-screen section; preserve desktop and other home presentations.
- [x] Register 37 responsive-only fields in total: About 5, Join 4, concert 4, education 6, spirit 9, Support 9. About/Join use the new home.responsive namespace, preserving the historical home.current SQL seed and all stored desktop values.
- [x] Retire the earlier unused home-responsive-approved.css overrides; deduplicate identical Figma paper exports by SHA256.
- [x] Complete final per-section screenshot/geometry, interaction, image failure, long/empty CMS and protected desktop checks.
- [x] Integrate only files whose original contents still match the captured baseline, then rerun the original 5175 route smoke/build checks.

The source design's small orange overline text (#FF601A on ivory) has low contrast. It is retained for the user's explicit visual-fidelity requirement; this is not a claim of full WCAG AA compliance. Primary action text and enlarged touch areas remain readable and operable. No live CMS save or device Safari validation is claimed.

Final isolated results: 61 existing tests + 59 home/CMS tests passed. Per-section/protected-browser comparisons passed 97/97, long/empty CMS checks 15/15, image failures 3/3, and the separate future-sponsor-data regression 6/6. About/Join source-content geometry differs only by browser text rounding (~1–2px). Archive uses the same local 3:2 performance asset for the geometry fixture; real CMS image ratios remain preserved. Browser fixtures never save to the database.

Corrective integration: 43 source/target files matched, five protected files unchanged; original production build passed and 33 route/viewport checks passed on 5175 with no JavaScript errors or unintended writes.

## Independent device Home CMS — added user request

This replaces the earlier shared-copy editing behavior for the approved responsive home. Desktop storage keys remain unchanged. Mobile and tablet copy use separate `home.mobile.*` and `home.tablet.*` keys in the existing `site_texts` table; no schema migration is required.

- [x] Explicitly whitelist 62 mobile and 64 tablet fields based on actual responsive consumers. Exclude hero, menu, footer, operational records, fixed routes, and desktop-only animation settings.
- [x] Resolve raw device overrides before normalization and Quick visibility filtering. Missing values use approved defaults; existing responsive-only keys remain a read-only compatibility fallback.
- [x] Keep desktop and other home presentations on their original normalization path. Browser fixture checks passed 20/20; same-page resizing passed four transitions. Desktop About/Quick/Spirit screenshots retained identical decoded pixels.
- [x] Provide independently persistent drafts, changed-field-only device saves and restores, global unsaved-change protection, and saved-content previews at real 390/834/1440 CSS-pixel widths.
- [x] Verify failed and delayed saves, changes during save, keyboard tab switching, preview widths, refresh, and restored defaults using intercepted test responses only.
- [x] Integrate after stage-3 baseline checks; rerun build, lint, source/target equality, and original route smoke.

The user separately authorized removing the hero's lower gold staff decoration on small screens. A scoped `::after` display override was integrated into 5175; 32 direct browser checks passed at 390/519/834/1440. The distinct orange autoplay progress bar, hero copy, actions, controls, and desktop decoration remain unchanged.

Home CMS validation exposed and resolved three issues: public/CMS text-validation mismatch, preview navigation retaining a non-home route across device tabs, and same-origin preview authentication broadcasting SIGNED_IN and unmounting the parent editor. Public and CMS text checks now share one validator without changing public fallback rules. Device switches reload the preview home. Only an embedded `/` with `home-cms-preview=1` uses nonpersistent anonymous Supabase options; normal public/admin authentication is unchanged. The parallel task independently fixed general same-user authentication recheck state in `useAdminAuth`; that hook was not edited or integrated by this task.

Verification after original integration: all 29 new device/editor/preview/hero tests passed, 61 existing tests and 59 home contracts passed, full original lint/build passed. Actual React CMS browser tests passed 31/31 at 5175 using intercepted authentication and storage responses (four simulated upserts, no real database writes). This includes opening an ordinary sibling tab and receiving SIGNED_IN without losing the editor draft. Original public route smoke passed 33/33.

## Later hero image-quality correction

The CMS originals are 6000×4000, but width-only `sizes="100vw"` chose small landscape derivatives that were enlarged to cover the tall mobile hero. Below 1024px the hero now uses the same CMS original; warmup uses the same original URL to avoid downloading both variants. Desktop transforms, source photographs, crops, text, actions and controls are unchanged. Four source photographs are approximately 2–4MB each, so improved detail has a mobile bandwidth cost. Save-data and reduced-motion settings still suppress next-image warmup.

Image-selection tests passed 7/7 and independent browser checks passed 50/50. A final original-5175 check confirmed 390px/DPR2 loads 6000×4000 with no gold strip, while 1440px/DPR2 retains desktop transform selection. No media upload, artificial sharpening, generated faces, or CMS record update was performed.

## Later desktop Spirit background clarification

The existing video uses `object-fit: contain`, which exposes side bands when the section aspect ratio differs from the source's 16:9 ratio; it was not caused by responsive changes. A full-bleed variant was tested only in the isolated worktree. Direct inspection then confirmed Chrome page zoom is 90% (CDP zoom ~0.9), with a different effective viewport from the app's 1536px desktop view. The user explicitly instructed not to change it after this explanation. The isolated five-line cover override was reverted and was never integrated into the original project. Desktop video fitting, layout and browser zoom settings remain untouched.
