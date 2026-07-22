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
