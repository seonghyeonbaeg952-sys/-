# Interaction Polish

서울모테트청소년합창단 홈페이지의 인터랙션은 장식보다 정보 흐름, 상태 인지, 접근성을 우선한다.

## 확인한 외부 기준

SmoothUI는 직접 HTTP 확인으로 아래 문서가 정상 응답하는 것을 확인했다.

- `https://smoothui.dev/`
- `https://smoothui.dev/docs/components`
- `https://smoothui.dev/docs/guides/animation-best-practices`
- `https://smoothui.dev/docs/guides/accessibility`
- `https://smoothui.dev/docs/components/animated-tabs`
- `https://smoothui.dev/docs/components/smooth-button`
- `https://smoothui.dev/docs/components/reveal-text`
- `https://smoothui.dev/docs/components/infinite-slider`
- `https://smoothui.dev/docs/components/glow-hover-card`
- `https://smoothui.dev/docs/components/number-flow`

Uiverse는 `uiverse.io`와 category URL이 현재 HTTP 확인에서 403을 반환했다. 다만 요청 범위에 맞춰 Uiverse 계열에서 참고할 수 있는 범주는 `buttons`, `checkboxes`, `inputs`, `radio-buttons`, `forms`, `tooltips`, `loaders`, `cards`로 한정하고, 실제 코드는 복사하지 않았다.

## 적용 원칙

- 새 production dependency는 추가하지 않는다.
- SmoothUI CLI 또는 Uiverse 코드 복사를 사용하지 않는다.
- CSS transition, IntersectionObserver, React state만 사용한다.
- `transform`, `opacity`, `box-shadow`, `border-color` 중심으로 짧고 목적 있는 움직임만 사용한다.
- `prefers-reduced-motion: reduce`에서는 장식적 animation과 transition을 사실상 비활성화한다.
- 관리자 CMS에는 감성적 reveal, marquee, glow를 넣지 않고 form focus, loading, button 상태만 유지한다.

## 구현한 인터랙션

- `AnimatedSectionTabs`: route/query 기반 탭과 state 기반 탭에 공통 적용. active indicator는 별도 레이어로 움직이고, 모바일에서는 가로 스크롤을 유지한다.
- `Button`: 기존 디자인을 유지하면서 link 버튼에 작은 arrow movement, hover lift, active press를 추가했다.
- `Card`: hoverable 카드에만 아주 약한 gold spotlight를 추가하고, pointer 위치는 CSS variable로만 반영한다.
- `SponsorStrip`: 4개 이하 정적 grid, 5개 이상 CSS marquee, hover/focus pause, reduced motion static.
- `Gallery media`: 사진/영상/포스터 카드에만 약한 scale/saturate hover를 적용한다. 포스터 원본 비율은 `object-fit: contain`으로 유지한다.
- `LoadingState`: spinner 중심에서 skeleton 중심으로 변경했다.
- `EmptyState`: compact 모드를 추가해 작은 데이터 상태에서 빈 공간이 과해지지 않게 했다.
- `Form controls`: input/select/textarea focus ring, checkbox/radio accent, 후원 옵션 selected state를 통일했다.

## 적용 페이지

- `/about?section=...`: 소개 섹션 탭
- `/join?section=...`: 입단 안내 섹션 탭
- `/contact?section=...`: 후원/문의 섹션 탭, 후원약정 옵션, 개인정보 동의
- `/gallery?tab=...`: 갤러리 탭, media hover
- `/concerts?filter=...`: 공연 기간 필터 탭
- `/notices?filter=...`: 전체/중요공지 필터 탭
- `/`: 버튼, 후원사 strip, hoverable card, reveal 시스템 유지
- `/admin`: 기존 CMS 구조 유지, 공통 loading/form/button 상태만 간접 적용

## 복사 코드 및 라이선스

외부 컴포넌트 코드를 직접 복사하지 않았다. SmoothUI와 Uiverse는 motion pattern과 UI 범주만 참고했고, 실제 구현은 기존 React/Tailwind/CSS 구조로 재해석했다.

## 금지한 효과

- neon, RGB glow, 3D, jelly button, cyberpunk, liquid morphing
- 무한 shine, 큰 cursor blob, 과한 glassmorphism
- 긴 한글 문장을 글자 단위로 쪼개는 reveal
- form/card 전체에 과도한 spotlight 적용

## QA 기록

- `pnpm lint` 통과
- `pnpm build` 통과
- Playwright + Chrome executable로 18개 route x 4개 viewport, 총 72개 조합 확인
- 확인 viewport: `390x844`, `768x1024`, `1440x900`, `1920x1080`
- 확인 결과: horizontal overflow 0건, page error 0건
- reduced motion 확인: reveal transition duration `1e-05s`, sponsor animation `none`
- 추가 상호작용 확인: 탭 ArrowRight 키보드 이동, 후원 옵션 렌더링, 개인정보 checkbox check 동작

## 남은 확인

- Uiverse 사이트는 HTTP 확인에서 403이므로 브라우저 UI에서 직접 상세 카드별 원본까지 확인하지 못했다.
- 현재 홈 Hero 슬라이드가 1개일 경우 carousel dot/arrow는 렌더링되지 않는다. 여러 slide 데이터가 들어갔을 때 컨트롤 클릭 QA가 추가로 필요하다.
- 실제 iOS Safari, Android Chrome 기기에서는 touch hover 대체와 font rendering을 한 번 더 확인하는 것이 좋다.
