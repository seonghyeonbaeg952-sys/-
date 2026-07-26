# Original public-site rollout design QA

## Comparison target

- Source visual truth: `http://127.0.0.1:5175/sample/join`
- Source screenshot: `C:\Users\seong\AppData\Local\Temp\motet-original-rollout-qa\accepted-sample-join.jpg`
- Implementation: `http://127.0.0.1:5175/join`
- Implementation screenshot: `C:\Users\seong\AppData\Local\Temp\motet-original-rollout-qa\production-original-join.jpg`
- Viewport: 1536 x 770 CSS px, device scale factor 1
- Captured pixels: 1521 x 762 for both images (browser scrollbar/chrome exclusion is identical)
- State: desktop, loaded public page, `입단 안내` active, first viewport
- Additional implementation evidence:
  - Home intro: `C:\Users\seong\AppData\Local\Temp\motet-original-rollout-qa\production-home-intro.jpg`
  - Mobile home: `C:\Users\seong\AppData\Local\Temp\motet-original-rollout-qa\production-home-mobile.png` (390 x 844)

## Full-view comparison evidence

The accepted `/sample/join` capture and production `/join` capture were opened together at the same viewport and loaded state. Header height, logo placement, navigation spacing, active underline, page-title position, paragraph measure, white canvas, orange staff lines, centered M divider, bottom rule, typography, and visible copy match. The only visible difference is the mouse cursor location in the production capture; it is capture state, not rendered UI.

## Focused comparison evidence

A separate crop was not required because the native-size first-viewport captures keep the header typography, title, body copy, rules, and M geometry clearly readable. The home intro was checked independently at its visible wordmark frame: field `rgb(255,255,255)`, initials `rgb(255,96,26)`, wordmark `rgb(21,21,21)`, no background image, and the existing animation-ready class/timing retained.

## Required fidelity surfaces

- Fonts and typography: the same display/body font classes, sizes, weights, line heights, tracking, and Korean wrapping are shared by sample and production.
- Spacing and layout rhythm: the same PublicLayout, component tree, responsive containers, hero spacing, and M-divider dimensions are used. No desktop or 390px horizontal overflow was found.
- Colors and tokens: production inherits the approved white/orange token set. The home photo hero remains unchanged, while the intro veil now uses white, orange, and ink without the former navy field.
- Image quality and assets: the existing logo and choir photography are reused without replacement, distortion, or a new overlay. The 20 orange hand frames use the already approved raster assets.
- Copy and content: sample and production render the same CMS/fallback copy and navigation labels. No new above-the-fold text was introduced.
- Icons and controls: desktop navigation, the active route state, 44 x 44 mobile menu button, and mobile menu expanded state were verified.
- Motion and accessibility: the original home hero intro timing, M surface-rise animation names/timelines, and `prefers-reduced-motion` behavior are unchanged. Mobile correctly skips the desktop-only intro.

## Findings

- No actionable P0, P1, or P2 mismatch remains between the accepted sample and production public theme.

## Comparison history

1. Pre-rollout mismatch: the production PublicLayout did not receive the accepted sample theme, and the production home surface still selected the old curved edge. Fix: promoted the approved theme to PublicLayout and made the centered M path the production home surface boundary.
2. User-requested follow-up: the home intro still used the former navy field. Fix: changed only intro color properties to white/orange/ink while preserving the existing keyframes, delays, and removal behavior.
3. Post-fix evidence: sample and production `/join` first viewports match at the same state; production home intro tokens were measured in Chrome; desktop and 390 x 844 route audits showed no relevant console errors or horizontal overflow.

## Interaction and runtime evidence

- Desktop header `입단 안내` click navigated from `/` to `/join`, set the active link, and retained the production theme.
- Mobile menu opened with `aria-expanded="true"`, changed its accessible label to `모바일 메뉴 닫기`, and exposed the complete navigation.
- Desktop routes checked: `/`, `/spirit`, all requested `/about` sections, `/concerts`, `/notices`, `/gallery`, `/join`, `/contact?section=support`.
- Mobile routes checked at 390 x 844: `/`, `/spirit`, `/about?section=members`, `/concerts`, `/gallery`, `/join`, `/contact?section=support`.
- Admin isolation checked: `/admin` does not render PublicLayout or the white/orange public-theme marker.
- Console: no relevant errors or warnings in the checked public and admin states.

## Follow-up polish

- No P3 item is required for this rollout.

final result: passed

---

# V2 home content synchronization design QA

## Comparison target

- Visual source of truth: the existing V2 public home component tree, motion
  classes, responsive layout and live Supabase content.
- User-supplied historical references:
  - `C:\Users\seong\AppData\Local\Temp\codex-clipboard-02bd74c0-22db-4ed9-ac33-209bd3e734e4.png`
  - `C:\Users\seong\AppData\Local\Temp\codex-clipboard-5b1f0dc7-9344-49a5-95b6-6ac8ac66b343.png`
- Implementation captures:
  - 390 x 844 public home:
    `C:\Users\seong\AppData\Local\Temp\motet-home-v2-390-viewport.png`
  - 768 x 1024 public home:
    `C:\Users\seong\AppData\Local\Temp\motet-home-v2-768-settled.png`
  - 1440 x 1000 public home:
    `C:\Users\seong\AppData\Local\Temp\motet-home-v2-1440.png`
  - 390 x 844 admin home editor:
    `C:\Users\seong\AppData\Local\Temp\motet-admin-home-v2-390-settled.png`

The historical screenshots and implementation captures were reviewed together
for the shared header, ivory paper surface, orange staff-line ornament, editorial
typography, archive/spirit transitions and mobile rhythm. They are different
scroll states and viewport sizes, so they were not treated as a pixel-diff
baseline. The CMS work deliberately retains the current V2 components and only
replaces embedded copy reads with the normalized contract.

## Required fidelity surfaces

- Section order remains Hero, quick actions, introduction, choir program, join
  letter, concerts/news, MOTET SCORE, five spirits, archive, sponsors and support
  letter.
- Existing photo assets, cover behavior, Deep Navy/Warm Gold/Ivory tokens,
  typography classes, staff-line ornaments and motion class names are retained.
- Hero slide images, titles, descriptions and CTAs still come from
  `hero_slides`; join, concerts, notices, spirits, archive media, sponsors and
  support settings remain owned by their dedicated tables/admin screens.
- Decorative motion continues to use the existing reduced-motion behavior.
- The only shared visual adjustment is a 45px minimum height for small and
  medium buttons, guaranteeing the 44px mobile touch-target requirement.

## Interaction and runtime evidence

- Public home loaded live data and all eleven V2 wrapper sections.
- Hero autoplay, previous/next controls and slide tabs remained present.
- Mobile navigation opened with `aria-expanded`, changed its accessible name to
  `모바일 메뉴 닫기`, exposed all nested links and closed normally.
- `/admin/home` loaded 133 editable fields in eleven public-order sections.
- Editing a field enabled both save actions and changed the status to
  `저장하지 않은 변경사항이 있습니다.`; restoring the original value disabled
  both save actions and returned the status to `저장된 내용과 일치합니다.`
- The mobile admin editor has no horizontal overflow and keeps the save action
  fixed within reach.
- Public route checks at 390px passed for `/`, `/spirit`, all required `/about`
  sections, `/join` and `/contact?section=support`.
- Public home checks at 390px, 768px and 1440px found no horizontal overflow.

## Data and safety evidence

- The production Supabase migration completed successfully.
- Active V2 rows: 133.
- Active legacy home rows: 0.
- Retained inactive legacy rows: 89.
- `site_texts` RLS enabled: true.
- `site_texts` forced RLS: true.
- No row, column, RLS policy, grant or stored legacy value was deleted.

## Findings

- No actionable P0, P1 or P2 visual, interaction, responsive or data-contract
  issue remains.
- The supplied historical captures do not represent the same live V2 state as
  the final Hero captures, so they are retained as qualitative brand references,
  not claimed as exact screenshot matches.

final result: PASSED
