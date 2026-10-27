# 1900×900 public typography and roster refinement

Scope: preserve CMS copy, existing typefaces, photos, motion and device-specific edits. Inspect Korean and English public routes at 1900×900, then confirm 390/768/1440 and wide-desktop edges for changed layouts. No new dependencies, database mutations or privacy changes.

1. Reproduce the home concert column collapse after CMS data loads. Replace viewport-derived padding inside the bounded grid with bounded local gutters; preserve brochure controls and animations. Check all home sections with live content before accepting the result.
2. Tune confirmed typography problems through owning CSS only; do not flatten intentional display type into a uniform scale or overwrite stored CMS formatting.
3. Remove the five Spirit voice-description cards and their unused CSS while keeping the photo and closing message. Preserve saved CMS records.
4. Remove current-member SATB filter buttons while retaining voice-group headings. Partition all-time names into general members, staff and accompanists, keeping CMS order and safe Korean-name ties within each list. Test exclusive membership and accompanist precedence.
5. Verify meaningful component/data tests, lint, build and rendered geometry; record before/after evidence and screenshots outside Git. Update only deliberately changed markup baselines. Commit and push after checks under the user's standing instruction.

Initial evidence: home concert grid tracks are 424/824px, but viewport-based copy padding leaves only 94px for text at 1900px. The 824px brochure track likewise shrinks to 364px after padding. This is a container-sizing error, not a font-size problem. Home orbit labels intentionally sit beside their dots; distinguish this authored placement from actual clipping before changing it.

## Verified result

- The loaded concert copy has 418px of usable width at 1900px, and the brochure has 673px. Korean and English titles wrap normally; brochure opening and closing still work.
- The reduced-motion score stage previously collapsed to zero height because its children are absolutely positioned. Its measured height is now 828px at 1900×900. Desktop negative handoff margins now apply only when motion is enabled, so reduced-motion sections no longer cover preceding content.
- At 2375×1125 the decorative score staff previously scaled to about 167px tall and crossed the summary. Its vertical slot now stays bounded, leaving a measured 27px gap before the summary. Normal and reduced-motion layouts were checked, including 2560px width.
- Spirit retains its community photo and closing copy without the five removed voice cards. All-time members are partitioned without duplication into 162 general names, 15 staff and 7 accompanists in the live data checked; current-member SATB headings remain, while their filter buttons are removed. CMS order and protected-name tie handling remain intact.
- Rendered Korean and English routes were checked at 1900×900; changed layouts were also checked at 390/768/1440px and wide-desktop sizes. Hero controls, brochure controls, orbit detail dismissal and photo selection were exercised. No document horizontal overflow or clipped changed headings was found in these checks.
- Final validation: `pnpm lint` passed; `pnpm build` passed; the selected component, motion, roster, copy, authentication, upload and deployment checks passed **139/139**, with no skips. This is a focused regression set, not a claim that every repository test ran.
- Obsolete tests that required previously retired Spirit sections were removed; retained section/copy contracts remain. The wave contract now recognizes the deliberately static tablet wrapper. Only intentional public-markup fingerprints were updated.
- The separate PHP2Shell assessment found no PHP execution path in the inspected Vite/static/Supabase architecture. Live Storage role verification passed without file or row changes. Detailed deployed Vercel function enumeration remains unverified because the connector returned 403/404; the managed security report records that limitation. No security configuration was weakened or changed.

Screenshots and command logs are stored outside Git in the thread's visualization directory. Physical iOS/Safari devices were not tested.
