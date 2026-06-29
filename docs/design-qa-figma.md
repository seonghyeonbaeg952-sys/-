# SMYC Global Arts Polish QA

이 문서는 Figma 설계판과 React/Tailwind 구현을 맞추기 위한 QA 기준입니다.

## Figma 파일

- 파일명: `SMYC Global Arts Polish QA`
- URL: https://www.figma.com/design/MrTVZQlhhqVBGi90bge0Bu
- 페이지명: `SMYC Global Arts Polish QA`
- 생성 방식: Figma MCP `create_new_file`, `use_figma`, `get_metadata`, `get_design_context` 사용
- 목적: 현재 코드의 UI 구조를 편집 가능한 기준 설계판으로 정리하고, Dev Mode에서 컨테이너/그리드/컴포넌트 규칙을 확인할 수 있게 한다.

## Viewport Frames

| Frame | Size | Purpose |
| --- | ---: | --- |
| `01 Desktop Home — 1440 × 900` | 1440 x 900 | 홈 Hero, CTA, motto chips, floating info card 기준 |
| `02 Desktop Spirit — 1440 × 900` | 1440 x 900 | 합창단 정신 PageHero, manifesto card 기준 |
| `03 Desktop About — 1440 × 900` | 1440 x 900 | 소개 카드/프로필/연혁 흐름 기준 |
| `04 Desktop Concerts — 1440 × 900` | 1440 x 900 | 공연 카드와 포스터 원본 비율 기준 |
| `05 Desktop Gallery — 1440 × 900` | 1440 x 900 | 갤러리 원본 이미지 카드 기준 |
| `06 Desktop Join — 1440 × 900` | 1440 x 900 | 입단 탭과 overview visual 기준 |
| `07 Desktop Support — 1440 × 900` | 1440 x 900 | 후원약정서/문의 통합 구조 기준 |
| `08 Tablet Spirit — 820 × 1180` | 820 x 1180 | 태블릿 합창단 정신 레이아웃 |
| `09 Tablet Join — 820 × 1180` | 820 x 1180 | 태블릿 입단 안내 탭/카드 |
| `10 Tablet Support — 820 × 1180` | 820 x 1180 | 태블릿 후원약정서 |
| `11 Mobile Home — 390 × 844` | 390 x 844 | 모바일 홈 Hero/CTA/chip |
| `12 Mobile Spirit — 390 × 844` | 390 x 844 | 모바일 합창단 정신 |
| `13 Mobile Join — 390 × 844` | 390 x 844 | 모바일 입단 안내 |
| `14 Mobile Support Form — 390 × 844` | 390 x 844 | 모바일 후원약정서 |

## Grid Tokens

Figma와 코드의 기준을 아래처럼 맞춘다.

| Breakpoint | Figma 기준 | React/CSS 적용 |
| --- | --- | --- |
| Desktop 1440 | content 1184, 12 columns, gutter 24 | `Container`: outer 1280, `lg:px-12` |
| Wide 1920 | max content 1280, 12 columns, gutter 28 | `Container`: `2xl:px-0`, `max-w-content: 1280px` |
| Tablet 820 | `calc(100% - 56px)`, 8 columns, gutter 20 | `Container`: `sm:px-7` |
| Mobile 390 | `calc(100% - 32px)`, 4 columns, gutter 16 | `Container`: `px-4` |

## Component Variants

Figma `Component Variants / React mapping` 보드에 아래 컴포넌트 이름으로 정리했다.

- `PageHero`
- `SectionTabs`
- `PaperCard`
- `NavyFeatureCard`
- `CompactListCard`
- `MediaCard`
- `CollectionGrid`
- `ConcertCard`
- `GalleryCard`
- `ProfileCard`
- `MemberRow`
- `InquiryLayout`
- `PledgeFormSection`
- `PreFooterBand`

각 컴포넌트는 React 컴포넌트 또는 CSS 패턴과 이름을 맞추는 것을 우선한다. 실제 구현에서는 Figma auto layout 값을 그대로 복사하지 않고, 현재 코드의 `Container`, `Card`, `StaffLines`, `PageHero`, `SectionTabs`, `OptimizedImage` 패턴으로 옮긴다.

## React/CSS Mapping

- Container/grid: `src/components/common/Container.tsx`, `src/styles/globals.css`
- Home Hero: `src/components/home/HomeHeroSlideshow.tsx`
- Home staff/hand animation: `src/components/common/StaffFlowRail.tsx`, `src/styles/globals.css`
- Spirit page sections: `src/pages/public/SpiritPage.tsx`, `src/components/spirit/SpiritSections.tsx`
- Collection mode: `src/utils/collectionLayout.ts`
- Collection grid CSS: `.collection-grid`
- Section tabs CSS: `.section-tabs-wrap`, `.section-tabs`
- Profile/member rows: `.accompanist-grid`, `.member-row`, `.member-stat-card.is-zero`
- Inquiry layout: `.inquiry-layout`
- Pre-footer: `.pre-footer-score-band`
- Support pledge: `src/components/contact/SupportPledgeForm.tsx`

## Preserved Decisions

- Navy/Gold/Ivory 브랜드 팔레트 유지
- Home desktop side staff/hand animation 유지
- `/spirit`에서는 side staff/hand animation 제거 유지
- `Motet` 섹션은 desktop에서 wordmark와 본문 카드가 겹치지 않게 분리
- Public 데이터는 `is_visible=true` 기준 유지
- 단원 사진은 public 단원 소개에 노출하지 않는 정책 유지
- 후원약정서는 결제 기능이 아니라 서버 저장/인쇄 가능한 신청서 구조 유지
- Supabase `service_role`은 프론트엔드에서 사용하지 않음

## Playwright QA

실행 기준:

- 서버: `http://127.0.0.1:5175`
- Viewports: `360x740`, `390x844`, `768x1024`, `1440x900`, `1920x1080`
- URL: `/`, `/spirit`, `/about`, `/about?section=conductor`, `/about?section=accompanist`, `/about?section=members`, `/concerts`, `/notices`, `/gallery?tab=photos`, `/gallery?tab=videos`, `/gallery?tab=posters`, `/join`, `/join?section=eligibility`, `/join?section=process`, `/contact`, `/contact?section=support`, `/contact?section=performance`, `/contact?section=location`

결과:

- 총 90개 조합 검사
- HTTP 400 이상 없음
- React/Vite 치명 텍스트 없음
- Console error 없음
- Horizontal overflow 2px 초과 없음
- 본문이 비어 있는 화면 없음

대표 스크린샷:

- `C:\Users\seong\AppData\Local\Temp\smyc-figma-sync-mobile-390-home.png`
- `C:\Users\seong\AppData\Local\Temp\smyc-figma-sync-mobile-390-spirit.png`
- `C:\Users\seong\AppData\Local\Temp\smyc-figma-sync-mobile-390-contact_section_support.png`
- `C:\Users\seong\AppData\Local\Temp\smyc-figma-sync-desktop-1440-home.png`
- `C:\Users\seong\AppData\Local\Temp\smyc-figma-sync-desktop-1440-spirit.png`

## Implementation Notes

- Figma의 절대 좌표 코드는 직접 사용하지 않는다.
- Figma frame은 시각 기준판이고, 실제 구현은 반응형 CSS grid/auto layout으로 유지한다.
- `body { overflow-x: hidden; }` 같은 전역 숨김으로 overflow를 해결하지 않는다.
- 장식용 `StaffLines`는 `inset-x-*`와 함께 사용할 때 `!w-auto`로 폭 충돌을 방지한다.
- 문구가 길어지는 CMS 데이터는 카드 높이를 고정하지 않고 내용에 따라 늘어나게 둔다.

## Remaining Risks

- Figma 프레임은 현재 구현을 기준으로 재구성한 editable QA 보드이며, 모든 실제 이미지 픽셀을 Figma에 캡처해 붙인 상태는 아니다.
- 실제 Supabase 데이터 양이 크게 늘어날 경우 `featured`, `two-up`, `grid`, `empty` 상태를 운영 데이터로 한 번 더 확인해야 한다.
- 실제 모바일 Safari/Chrome 기기에서는 font fallback과 이미지 decoding 차이가 있을 수 있어 배포 전 실기기 확인이 필요하다.
