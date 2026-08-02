# Performance carousel decision research — source set B

- Directly inspected and classified: 206 unique pages
- Score scale: 1 (poor) to 5 (strong)
- Dimensions: functional intuitiveness, minimalism, mobile, reduced-motion, CMS change resilience

## Distribution and average

- partial-visible: 1 sources, average 21.00/25
- hidden-offstage: 11 sources, average 23.55/25
- center-only: 56 sources, average 24.70/25
- stack: 2 sources, average 19.00/25
- spatial-3d: 5 sources, average 13.40/25
- excluded: 131 sources, average 8.66/25

## Decision

Use a responsive hybrid, not one identical composition at every breakpoint:

1. **Desktop default — partial-visible:** one full front-facing template in the center; two smaller full templates remain behind the reference facade mask with only controlled portions visible.
2. **Mobile and reduced-motion — hidden-offstage:** only the active center template is visible; adjacent items stay offstage and switch without spatial parallax.
3. **Fallback/CMS stress state — center-only:** used for long titles, missing images, nonstandard poster ratios, or empty adjacent slots.
4. **Spatial depth:** applied to the architectural recess only. It is not a separate carousel model and must not add new pilasters or moving cameras.
5. **Stack:** rejected as the main direction because overlapping posters weaken the precise building opening and CMS legibility.

## Representative evidence

1. **partial-visible** — [https://onepagelove.com/johny-vino](https://onepagelove.com/johny-vino) — 수평 슬라이더가 다음 항목의 존재를 알리는 대표 사례. 데스크톱 보조 단서로만 채택.
2. **hidden-offstage** — [https://onepagelove.com/experience-lab](https://onepagelove.com/experience-lab) — 모션은 상태 이해를 돕되 비활성 항목은 시각 무대 밖에 두는 방향으로 해석.
3. **center-only** — [https://onepagelove.com/ma](https://onepagelove.com/ma) — negative space를 통해 중앙 콘텐츠 집중도를 확보하는 근거.
4. **spatial-3d** — [https://muz.li/blog/weekly-designers-update-443/](https://muz.li/blog/weekly-designers-update-443/) — 깊이와 착시는 단일 소실점·광원 계약이 있을 때만 채택.
5. **excluded** — [https://onepagelove.com/belen-jones](https://onepagelove.com/belen-jones) — 회전 3D 큐브는 작품성은 있으나 공연 정보 탐색·모바일·reduced-motion에 불리.
6. **excluded** — [https://onepagelove.com/digital-original-xr](https://onepagelove.com/digital-original-xr) — scroll-driven XR 데모는 정보 캐러셀보다 체험 자체가 우선이라 제외.
7. **center-only** — [https://www.figma.com/resource-library/ai-website-examples/](https://www.figma.com/resource-library/ai-website-examples/) — 넓은 여백과 중앙 초점은 채택하되 생성형 장식은 사용하지 않음.
8. **hidden-offstage** — [https://www.figma.com/community/file/1337383844852052585/parallax-scrolling-example](https://www.figma.com/community/file/1337383844852052585/parallax-scrolling-example) — Figma에서는 동일 레이어 이름과 Smart Animate 상태 전환으로 구현 가능.
9. **spatial-3d** — [https://muz.li/blog/weekly-designers-update-502/](https://muz.li/blog/weekly-designers-update-502/) — 3D theater 사례는 건축 깊이의 참고용이며 카메라 이동은 배제.
10. **center-only** — [https://onepagelove.com/belgrade-architecture](https://onepagelove.com/belgrade-architecture) — 건축 프레임을 한 연속 구조로 유지하고 콘텐츠보다 기둥 장식이 앞서지 않게 함.

### Supplemental horizontal-navigation evidence

- [WMNVM — One Page Love](https://onepagelove.com/wmnvm) — 키보드 이동과 진행 표시를 함께 제공하는 수평 탐색 사례. 옆 항목 노출 자체보다 명시적인 제어와 현재 위치 표시가 중요하다는 근거로 사용.
- [We Are Outline — One Page Love](https://onepagelove.com/we-are-outline) — 수평 포트폴리오 전환 사례. 데스크톱에서는 다음 항목의 존재를 예고할 수 있지만, 모바일에서 동일한 노출 폭을 강제하지 않는 근거로 사용.

## Official interaction and accessibility constraints

The visual-site evidence above was checked against primary guidance rather than used by popularity alone:

- [Figma: Create interactions](https://help.figma.com/hc/en-us/articles/360040315773-Create-interactions) — prototype behavior must be expressed as an explicit trigger, action, destination, and animation. The three carousel states therefore need one shared component contract instead of three unrelated screens.
- [Figma: Guide to prototyping](https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma) — overflow behavior supports carousel/gallery prototypes. The side templates can remain clipped by a fixed viewport while state changes keep their layer names and hierarchy stable.
- [WAI-ARIA Authoring Practices: Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) — Previous/Next controls and the currently displayed slide must remain understandable to assistive technology; off-screen slides must not create confusing focus or reading order.
- [WCAG 2.2 Understanding SC 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions) — non-essential interaction motion must be suppressible. Architectural parallax and perspective are therefore enhancement-only, never required to understand or operate the carousel.
- [MDN: `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion) — large scaling and panning can cause discomfort. The reduced-motion state uses opacity or an immediate state change and retains the same content order.
- [web.dev: Carousel best practices](https://web.dev/articles/carousel-best-practices?hl=en) — use composited transforms and avoid expensive layout-driven animation. The prototype contract limits motion to transform/opacity and keeps the architectural mask static.

These documents support the hybrid decision: `partial-visible` is an optional desktop affordance, while `hidden-offstage` and `center-only` are the robust operational states.

## Implementation contract derived from the evidence

- Preserve the exact reference image pixels for the architectural aperture and separate only the occlusion mask needed for side templates.
- Use one CMS template component for center, left, and right; scale/position/state may change, visual grammar may not.
- Update center template, left text, date, venue, active index, and accessible label atomically.
- Provide Previous/Next buttons of at least 44 px with visible focus state and `aria-label`.
- Reduced motion removes perspective/parallax and uses a short opacity transition or immediate state change.
- Mobile never depends on partially visible side items; the count and buttons remain sufficient navigation cues.
- Missing or one-item CMS collections automatically collapse to center-only without empty architectural slots.

## Evidence-quality note

- The CSV contains 206 unique URLs that returned HTTP 200 in the source-B crawl. Every row retains a source excerpt or page-heading observation and a stated access limitation where applicable.
- The distribution is not a popularity vote: only one inspected page explicitly described a partial-visible horizontal slider. The desktop recommendation is therefore a constrained synthesis of that direct example, the two supplemental horizontal cases, the approved reference composition, and the official accessibility/CMS constraints above.
- Generic inspiration roundups without a directly observable carousel, spatial, stacking, or motion cue are classified as `excluded`; they are not counted as positive design evidence.
