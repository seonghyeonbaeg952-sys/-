# SMYC Home V4 Phase 0 구조·UX 감사

- `CURRENT_PHASE`: `0`
- 감사 범위: routing, sample isolation, shared CSS, Hero/Join 보호 계약,
  CMS ownership, Supabase schema 후보, Figma 준비도
- 결론: 현재 production 구조 위에서 바로 V4를 작성하면 회귀 위험이
  높다. Phase 1에서 Figma 샌드박스를 먼저 만들고, Phase 2에서 완전히
  격리된 `/sample/home-v4`를 새로 만드는 순서가 필요하다.

## 1. 실제 사용한 skill, tool, MCP

### Skill

- `product-design:audit`
  - 기존 화면, 사용자 흐름, 반응형, 상태, 접근성, 디자인 시스템
    기준으로 감사를 구조화했다.
- `build-web-apps:frontend-testing-debugging`
  - 실행·console·route·responsive·build 검증 절차에 사용했다.
- `chrome:control-chrome`
  - 사용자가 지정한 Chrome에서 viewport, scroll state, computed
    geometry, console, screenshot을 수집했다.
- `figma:figma-use`
  - Figma 계정과 기존 파일 구조를 read-only로 조사했다.

### Tool/MCP

- local PowerShell, `rg`, Git, pnpm
- Codex bundled Node runtime
- Chrome Plugin/CDP
- Figma connector/MCP read-only 조회
- `apply_patch` 문서 작성
- collaboration agent 3개

인터넷 검색은 이번 Phase에서 사용하지 않았다. 최신 사례 조사나
디자인 생성 단계가 아니라 현재 repository, 실행 화면, 연결된 Figma,
Supabase 계약을 고정하는 단계였기 때문이다.

## 2. Agent Wave

### Wave 1 — Phase 0에서 완료

| agent | 담당 | write |
| --- | --- | --- |
| `phase0_code_css_audit` | Git, route, component, CSS, sample isolation 위험 | 없음 |
| `phase0_figma_ui_audit` | Figma plan/file 구조, 변수·컴포넌트·프레임, Phase 1 설계안 | 없음 |
| `phase0_cms_data_audit` | CMS route, query ownership, schema/migration 후보 | 없음 |
| primary | Chrome 실측, screenshot, validation, 증거 통합 | 문서 2개만 |

### 다음 Wave — 사용자 승인 후

- Phase 1: Figma Home V4 sandbox page와 frame만 작성
- Phase 2: 승인된 Figma를 `/sample/home-v4`에 격리 구현
- Phase 3: sample route 안에서 주요 interaction 구현
- Phase 4: 별도 승인된 CMS/DB 변경안만 설계

## 3. Routing과 sample isolation 감사

### 확인된 구조

- `src/App.tsx:208`에서 `/sample` 여부에 따라 `BrowserRouter`
  basename만 바뀐다.
- `src/App.tsx:213`의 index는 production과 sample 모두 `HomeRoute`다.
- `src/pages/public/HomeRoute.tsx:5`는
  `HomeSectionFlowSamplePage.tsx`에서 `HomeSectionFlowPage`를 가져온다.
- `src/components/layout/PublicLayout.tsx:15`는 production에도
  `color-sample-theme`를 항상 적용한다.
- `/sample/home-v4` route는 없다.

### 위험

1. sample이라는 이름의 production dependency
   - `HomeSectionFlowSamplePage.tsx`를 독립 sandbox로 오인하고
     수정하면 production `/`도 바뀐다.
2. basename만 다른 동일 route tree
   - URL이 sample처럼 보여도 component/CSS/data ownership은
     production과 같다.
3. CSS import 순서 의존
   - `HomeRoute.tsx`는 `home-score-redesign.css`를 추가 import한다.
     같은 페이지 component를 다른 경로로 직접 렌더링하면 cascade
     순서와 bug-fix 적용 여부가 달라질 수 있다.
4. 항상 적용되는 sample theme
   - `color-sample-theme`가 public shell에 고정되어 production/sample
     경계가 class 이름에서도 분리되지 않는다.

### Phase 2용 격리 설계안

Phase 1은 Figma만 수행한다. 이후 Phase 2 승인을 받은 경우에만 다음
구조를 만든다.

```text
src/
  pages/
    sample/
      HomeV4SandboxPage.tsx
  components/
    sample/
      home-v4/
        ...
  styles/
    sample/
      home-v4-sandbox.css
```

격리 규칙:

- route는 `/sample/home-v4`에서만 활성화
- root marker는 `data-home-v4-sandbox`
- 새 CSS selector는 모두 해당 root 아래로 scope
- `body`, `html`, `#root`, `.public-shell`, `.home-flow-body`,
  `.flow-section`을 unscoped로 override하지 않음
- 기존 keyframe 이름 재사용·재정의 금지
- sandbox CSS는 해당 route에서만 lazy import
- Hero와 Join은 직접 재구현하지 않고 보호된 opaque slot으로 취급
- sample data는 고정 fixture snapshot을 사용하고 production CMS
  mutation과 분리
- `/`에 sandbox root/class/CSS가 나타나지 않는 테스트 추가
- direct refresh, back/forward, basename navigation을 각각 검증

## 4. CSS 구조 감사

현재 `src/styles`의 CSS는 총 11개, 17,325줄, 406,379 byte이며
`!important`는 738회다.

| 파일 | 줄 | byte | `!important` |
| --- | ---: | ---: | ---: |
| `globals.css` | 7,291 | 163,665 | 191 |
| `home-v6-fixes.css` | 3,285 | 84,495 | 264 |
| `home-global-refinement.css` | 1,517 | 35,630 | 57 |
| `home-join-open-score.css` | 976 | 19,050 | 4 |
| `home-premium-polish.css` | 891 | 23,384 | 46 |
| `color-sample-theme.css` | 744 | 21,743 | 141 |
| `home-motion-benchmark.css` | 712 | 16,234 | 1 |
| `home-spirit-editorial.css` | 665 | 14,553 | 12 |
| `home-section-flow-sample.css` | 550 | 11,712 | 7 |
| `home-score-redesign.css` | 427 | 10,103 | 6 |
| `shared-shell-fixes.css` | 267 | 5,810 | 9 |

### 주요 위험

- 큰 전역 cascade와 반복 보정으로 selector source order 의존도가 높다.
- `!important`가 많아 한 섹션의 개선이 다른 viewport와 route에
  예기치 않게 전파될 가능성이 있다.
- `shared-shell-fixes.css`는 1280–1599에서 `zoom: 0.8`,
  1600–1791에서 `zoom: 0.9`, 1792 이상에서 `zoom: 1`을 사용한다.
  breakpoint를 넘을 때 전체 shell의 체감 크기가 불연속적으로 바뀐다.
- production과 sample이 같은 cascade를 공유하므로 sample에서의
  selector 추가가 production 회귀로 이어질 수 있다.

### 권고

- Phase 2의 새 sample CSS는 단일 sandbox root 아래에서 시작한다.
- V4에서는 새 `!important`를 허용하지 않는 것을 기본으로 한다.
- 기존 11개 CSS의 정리는 별도 refactor로 분리한다. Home V4 작업과
  동시에 대규모 정리하면 원인 추적이 어려워진다.
- CSS `zoom` 제거·대체는 별도 영향 분석 후 진행한다. Phase 0에서는
  변경하지 않는다.

## 5. Hero 보호 감사

Hero는 현재 홈의 인지와 첫 화면 완성도를 담당하며 이미 여러
상태를 가진다.

보호 대상:

- 고정된 승인 문구
- 이미지 crop과 overlay
- 5초 autoplay와 760ms crossfade
- pause/prev/next/dots
- hover/focus/document visibility/save-data/reduced-motion 동작
- 1440, 834, 390 viewport의 현재 배치

Phase 1 Figma에서 Hero는 재디자인 대상이 아니라 baseline screenshot과
behavior contract로 배치한다. Phase 2 sample에서도 production
component를 수정하거나 fork하지 않는다.

## 6. Join motion 보호 감사

Join은 단순 section reveal이 아니라 fixed panel과 다음 섹션 경계가
서로 다른 속도로 움직이는 scroll state machine이다.

### 보호 파일군

- `src/components/home/JoinOpenScoreCTA.tsx`
- `src/pages/public/HomeSectionFlowSamplePage.tsx`
- `src/pages/public/HomePage.tsx`
- `src/pages/public/HomeRoute.tsx`
- `src/styles/home-join-open-score.css`
- `src/styles/home-section-flow-sample.css`
- `src/styles/home-score-redesign.css`
- `src/styles/home-v6-fixes.css`
- `public/images/sample/join-open-score-m.svg`

### 회귀 판정

패널이 fixed인 동안:

- intro와 guardian의 top/bottom이 유지되어야 한다.
- M/next boundary의 top만 scroll progress에 따라 상승해야 한다.
- 패널 전체가 같이 상승하거나, intro가 뒤늦게 사라지는 잔상이 보이면
  회귀다.

Chrome 실측은 이 계약을 충족했다. 상세 좌표는
`docs/home-v4-baseline.md`에 기록했다.

## 7. CMS route와 데이터 ownership 감사

### 현재 admin route

| route | 주 데이터 |
| --- | --- |
| `/admin/home`, `/admin/site-texts` | `site_texts` |
| `/admin/hero-slides` | `hero_slides` |
| `/admin/about` | `about_sections` |
| `/admin/join` | `join_info`, FAQ |
| `/admin/concerts`, `/admin/notices` | 공연, 공지 |
| `/admin/gallery`, `/admin/videos`, `/admin/posters` | archive |
| `/admin/sponsors` | `sponsors` |
| `/admin/support` | support settings |

`/admin/spirit` route는 없다.

### Home section ownership

| Home 영역 | 현재 source |
| --- | --- |
| Hero wrapper | `site_texts` |
| Hero images/order | `hero_slides` |
| Quick | `site_texts` |
| About | `site_texts` + `site_settings` + concert/gallery |
| Choir Program 4개 | 고정 ID의 `site_texts` |
| Join wrapper | `site_texts` + `join_info` |
| Join 4단계 | component 상수 `joiningSteps` |
| Concert/News | `site_texts` + concerts/notices |
| Score | `site_texts` |
| Spirit wrapper | `site_texts` |
| Spirit 5개 | `about_sections` |
| Archive | `site_texts` + gallery/videos/posters |
| Sponsors | `site_texts` + sponsors |
| Support | `site_texts` + support/site settings |

public query는 visibility를 적용하며 sponsor는 별도 public 동의와
노출 위치 조건도 확인한다. `HomeContentV2` resolver는 기본값,
fallback, normalize, order, visibility, legacy fallback을 제공한다.

## 8. CMS ownership 결함

### 8.1 Spirit admin key 불일치 — 우선 해결 필요

`AdminAboutPage`와 seed 설명은 홈 정신 section key로 `home_spirit`을
안내한다. 그러나 실제 Home consumer는 다음 5개 key를 읽는다.

- `home_spirit_motet`
- `home_spirit_honest-music`
- `home_spirit_church-music`
- `home_spirit_community`
- `home_spirit_next-generation`

현재 `home_spirit`을 읽는 Home consumer는 확인되지 않았다. 따라서
관리자에서 저장 성공 메시지가 나와도 실제 홈의 5개 정신이 바뀌지
않을 수 있다. Phase 4 전에 admin UX와 key ownership을 먼저
명시해야 한다.

### 8.2 Join 4단계가 CMS가 아님

Join 상세의 `join_info.audition_process`는 textarea지만 홈의
4단계는 `JoinOpenScoreCTA.tsx`의 `joiningSteps` 상수다. 운영자가
관리자에서 홈의 단계 문구를 바꿀 수 없다.

### 8.3 Choir Program의 subtitle/개수

현재 contract는 4개 고정 item에 맞춰져 있다.

- `HomeProgramItem.subtitle`이 없다.
- 임의 개수 item을 운영하는 구조가 아니다.

단, subtitle은 새 DB column 없이 additive `site_texts` key로도
지원할 수 있다. Phase 4에서는 migration보다 기존 content contract
확장을 우선 검토한다.

### 8.4 과도한 select

`src/lib/publicData.ts:160`의 `SITE_TEXT_SELECT = '*'`는 화면에 필요한
필드보다 많은 column을 가져온다. 기능 오류는 아니지만 data
minimization과 contract 명확성 측면의 후속 개선 후보다.

## 9. `/admin/about`과 `about_sections`

- `about_sections` table은 `supabase/schema.sql` 본문에는 없고
  `supabase/migrations/2026_add_about_sections.sql`에 정의되어 있다.
- public read는 visible row, admin write는 기존 admin RLS 구조를
  따른다.
- 현재 summary는 `content`의 `summary:` 또는 `subtitle:` line을
  parser가 읽을 수 있다.
- 그러므로 `home_summary` 전용 column은 즉시 필요한 migration으로
  확정하지 않는다.
- `supabase/migrations/20260724_restore_home_copy_from_v2_html.sql`은
  활성 문구를 덮어쓰는 migration이므로 향후 일반 migration template로
  재실행하면 안 된다.

## 10. Schema 변경 후보 분리

### migration 없이 가능한 후보

- Choir Program subtitle을 additive `site_texts` key로 추가
- Spirit summary를 기존 `content` 구조화 line으로 유지
- Home wrapper 카피를 기존 `site_texts`로 확장

### Phase 4에서 schema 제안이 필요한 후보

- 운영자가 순서·개수·노출을 관리하는 structured Join step 배열
- 임의 개수 Choir Program item이 실제 요구로 확정된 경우
- 5개 Spirit을 위한 명확한 admin 편집 UX 또는 별도 구조

### 안전한 전환 순서

1. production 데이터를 JSON으로 export
2. nullable/additive 구조만 생성
3. 기존 consumer 유지
4. resolver는 `new → legacy → default` 순서
5. staging에서 empty/partial/long copy/visibility QA
6. 사용자 승인
7. consumer switch
8. legacy는 별도 cleanup 승인 전 유지

Phase 0에서는 migration 작성·실행과 production Supabase write가 모두
없었다.

## 11. 실제 check command 감사

확인된 package script:

- `pnpm check:supabase-env`
- `pnpm check:supabase-live`
- `pnpm check:home-copy-contract`
- `pnpm test`
- `pnpm lint`
- `pnpm build`

`pnpm check:home-contract`라는 script는 없다. 유사 목적의 실제 명령은
`pnpm check:home-copy-contract`다.

`check:supabase-live` 구현은 안정적인 RPC와 public GET, storage list,
private endpoint의 401 여부를 확인하며 production write를 수행하지
않는 것으로 감사했다. 이번 실행은 39/39 통과했다.

## 12. Figma read-only 감사

### 연결 상태

- 계정: Professional plan, Full seat 확인
- 기존 repository artifact에서 추정한 파일 key:
  `AddtkFxmBpT6Vqw3O4EeN1`
- 추정 URL:
  `https://www.figma.com/design/AddtkFxmBpT6Vqw3O4EeN1`

master prompt가 이 파일을 명시적으로 대상 파일로 선택하지는 않았기
때문에 Phase 1 시작 전 사용자 확인이 필요하다.

### 기존 파일 현황

- page 00–19 존재
- desktop 1440×8924 frame 확인
- mobile 390×10942 frame 확인
- current+UI desktop/mobile frame 확인
- local variable collection 1개:
  `SMYC Sample · Editorial M`, color 9개
- Overview 기준 local component/component set 없음
- local paint/text/effect/grid style 없음
- Figma에서 AritaBuri 사용 가능 여부 미확인/불가 상태
  - 현재 안전한 fallback 후보: Hahmlet
  - 영문 후보: Cormorant

계정 plan만으로 Dev Mode UI, Code Connect, named branch의 실제 사용
가능 여부까지 확정할 수는 없다.

## 13. Phase 1 Figma 샌드박스 제안

Phase 1 승인 시 기존 page/variable을 수정하지 않고 새 page를 만든다.

### Page

`90 Sandbox · Home V4`

### canonical frames

- `Home V4 / Desktop 1440`
- `Home V4 / Tablet 834`
- `Home V4 / Mobile 390`
- `Home V4 / Long Copy Test 390`
- `Home V4 / Empty Data Test 1440`

### page section

1. baseline screenshots와 보호 계약
2. foundations
3. components
4. desktop/tablet/mobile layouts
5. long copy/empty/missing image stress cases
6. Hero/Join motion storyboard
7. developer handoff

### grid

| frame | grid |
| --- | --- |
| desktop | content 1280, 12 columns, gutter 24, outer 80 |
| tablet | 8 columns, gutter 20, outer 28 |
| mobile | 4 columns, gutter 16, outer 16 |

### 새 isolated variable collections

- `SMYC Home V4 / Color`
- `SMYC Home V4 / Dimensions`
- `SMYC Home V4 / Motion`

기존 `SMYC Sample · Editorial M`은 수정하지 않는다.

### motion storyboard 범위

- Hero: 5s interval, 760ms crossfade, pause/prev/next/dots, reduced-motion
- Join: fixed panel, held state, M boundary rising, release의 최소 4개 state

Figma prototype는 Join의 실제 scroll state machine을 그대로 증명하지
못한다. 따라서 storyboard는 상태/타이밍/레이어 계약만 표현하고,
실제 동작 판정은 Phase 3 browser QA에서 한다.

## 14. 반응형·접근성 기준

Phase 1 이후 모든 frame/sample에서 다음을 검증한다.

- 390/834/1440 canonical viewport
- 320px narrow stress
- 200% zoom
- 긴 한글 문구와 영문 혼합
- 이미지 누락, 데이터 0건, 데이터 1건
- 최소 44px touch target
- visible focus
- icon-only control의 accessible name
- 색만으로 상태를 전달하지 않음
- `prefers-reduced-motion`
- section pinning 중 keyboard focus와 DOM 순서 유지
- 가로 overflow 없음

## 15. 우선순위와 Phase gate

### P0

- production과 sample의 route/CSS 완전 격리
- Hero와 Join protected contract 고정
- `home_spirit` admin/consumer key 불일치 해결안
- production Supabase write 금지 유지

### P1

- CSS `zoom`과 큰 cascade의 영향 추적
- Join steps와 Program subtitle의 CMS ownership 결정
- Figma isolated variables/components 구성
- long copy/empty/missing image state

### P2

- `SITE_TEXT_SELECT='*'` 축소
- 기존 CSS debt 정리
- Dev Mode/Code Connect 사용 가능성 검증

## 16. Phase 0 결론

Home V4의 다음 단계는 production 수정이 아니라 Figma 샌드박스다.
사용자가 `CURRENT_PHASE=1`과 대상 Figma 파일을 명시적으로 승인하기
전에는 frame 생성, sample route 구현, CSS 추가, migration 설계로
넘어가지 않는다.

현재 production baseline, Hero/Join 보호 좌표, sample 격리 위험,
CMS ownership 결함, schema 후보, Figma 준비도는 문서화됐다. 실기기와
향후 새 디자인의 visual regression은 아직 수행하지 않았다.
