# SMYC Motion System

서울모테트청소년합창단 홈페이지의 모션은 장식보다 읽기 흐름을 돕는 전환 품질을 우선한다.

## Motion Tokens

`src/styles/globals.css`의 전역 토큰을 기준으로 사용한다.

- `--motion-ease-out`: 빠르게 반응하고 부드럽게 멈추는 진입/퇴장
- `--motion-ease-soft`: Hero, reveal, card lift처럼 긴 호흡의 전환
- `--motion-ease-standard`: 색상, border, shadow 같은 UI 상태 전환
- `--motion-duration-fast`: 작은 hover, focus 보정
- `--motion-duration-base`: 버튼, 탭, 메뉴, 모달 기본 전환
- `--motion-duration-slow`: 섹션 reveal
- `--motion-duration-hero`: Hero slide crossfade
- `--motion-stagger`: 카드/리스트 stagger 간격

## Reveal

공통 reveal은 `src/hooks/useRevealOnScroll.ts`와 `src/components/common/Reveal.tsx`를 사용한다.

지원 variant:

- `fade-up`: 일반 섹션 제목과 본문
- `fade-in`: 탭 패널, 보조 텍스트
- `scale-in`: 이미지/로고 같은 시각 요소
- `clip-up`: 제목이나 선언문처럼 드러나는 느낌이 필요한 요소
- `card-rise`: 카드와 리스트
- `line-draw`: 오선지/라인 장식
- `soft-scale`: 이미지 프리뷰
- `none`: 모션 제외

기본 정책:

- IntersectionObserver 기반
- `once: true`
- 기본 `threshold: 0.15`
- 기본 `rootMargin: 0px 0px -8% 0px`
- `prefers-reduced-motion: reduce`에서는 즉시 표시

## Page Transition

내부 버튼 링크는 `TransitionLink`를 통해 View Transitions API를 사용한다.
브라우저가 지원하지 않거나 reduced motion이면 일반 SPA navigation으로 fallback한다.

## Hero Carousel

Hero slide는 opacity crossfade와 매우 약한 scale 전환만 사용한다.
이미지는 첫 장을 high priority로 예열하고, 다음 장은 low priority로 미리 로드한다.
reduced motion에서는 자동 재생과 전환이 사실상 정지된다.

## Sponsor Strip

- 후원사 4개 이하: 정적 grid
- 후원사 5개 이상: CSS marquee
- hover/focus 시 marquee pause
- reduced motion에서는 marquee 비활성화

## Animated Tabs

`src/components/common/AnimatedSectionTabs.tsx`를 사용한다.

- active tab은 별도 indicator layer로 표시한다.
- indicator는 `transform`, `width`, `height`, `opacity`만 전환한다.
- tab label 위에 indicator가 올라오지 않도록 tab content는 `z-index: 1`을 유지한다.
- 모바일에서는 줄바꿈보다 horizontal scroll을 우선한다.
- ArrowLeft, ArrowRight, Home, End 키로 이동할 수 있다.
- reduced motion에서는 transition duration이 전역 규칙에 따라 즉시 전환된다.

적용 위치:

- `/about?section=...`
- `/join?section=...`
- `/contact?section=...`
- `/gallery?tab=...`
- `/concerts?filter=...`
- `/notices?filter=...`

## Buttons And Micro Interactions

공통 `Button`은 기존 navy/gold/outline 디자인을 유지하고 작은 feedback만 제공한다.

- hover: 최대 `translateY(-2px)`
- active: 아주 약한 press
- link button: arrow가 `4px` 이동
- gold button: 약한 warm gold glow
- navy button: 과하지 않은 navy shadow

Uiverse 계열의 neon, 3D, jelly, RGB, liquid effect는 사용하지 않는다.

## Cards And Glow

`Card`의 `hoverable` 옵션과 `SponsorLogoCard`에만 약한 glow를 허용한다.

- glow color는 `rgba(201,164,92,0.14)` 수준으로 제한
- pointer 위치는 CSS variable `--glow-x`, `--glow-y`로만 반영
- 본문형 카드, 후원약정서, 개인정보 안내 카드에는 glow를 쓰지 않는다.

## Forms, Loading, Empty State

- input/select/textarea는 focus-visible 상태에서 gold ring을 표시한다.
- checkbox/radio는 native semantic을 유지하고 `accent-color`로 gold를 적용한다.
- 후원 금액/회원 유형 선택은 `.donation-option` 상태 클래스로 selected/hover를 구분한다.
- `LoadingState`는 spinner 대신 skeleton block을 사용한다.
- `EmptyState`는 `compact` 모드를 지원해 데이터가 적을 때 큰 빈 공간을 줄인다.

## Tabs, Menus, Modals

- 탭 패널: 짧은 fade-up
- 모바일 메뉴: 위에서 아래로 짧게 열림
- 팝업/갤러리 모달: backdrop fade + panel rise
- 모든 modal close button은 44px 이상 터치 영역을 유지한다.

## Reduced Motion

`prefers-reduced-motion: reduce`에서는 전역적으로 animation/transition을 최소화한다.
정보 구조와 접근성은 동일하게 유지하고, 장식적 움직임만 제거한다.

## QA Checklist

- `/`: Hero crossfade, play/pause, prev/next, sponsor strip
- `/spirit`: reveal 과다 여부, 정보 리듬
- `/about?section=overview`: 탭 이동 후 jump 없음
- `/about?section=conductor`: 문서형 소개 레이아웃 유지
- `/gallery?tab=photos`: 탭 fade, 사진 모달 open/close
- `/gallery?tab=videos`: YouTube modal open/close
- `/join?section=process`: 탭 이동과 accordion 상태
- `/contact?section=support`: 후원약정서와 sponsor section
- `/contact?section=sponsors`: 후원사 grid/marquee 조건

최근 확인:

- 18개 route x 4개 viewport, 총 72개 조합에서 horizontal overflow와 page error 없음
- viewport: `390x844`, `768x1024`, `1440x900`, `1920x1080`
- reduced motion: reveal transition duration `1e-05s`, sponsor animation `none`
- 탭 ArrowRight 키보드 이동, 후원 checkbox, donation option 렌더링 확인
