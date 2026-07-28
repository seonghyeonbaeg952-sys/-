# SMYC Home V4 Phase 0 기준선

- 기록 시각: 2026-07-27 (Asia/Seoul)
- `CURRENT_PHASE`: `0`
- 대상 프로젝트: 서울모테트청소년합창단 공식 홈페이지
- 대상 화면: production `/`, 현재 sample tree, Hero, Join 고정 패널/상승 경계
- 작업 성격: 읽기 전용 감사와 기준선 고정

## 1. 변경 금지 범위

Phase 0에서는 다음을 변경하지 않았다.

- production `/`의 React/TypeScript/CSS
- `/sample/` 및 다른 sample route의 React/TypeScript/CSS
- Hero 슬라이드 구조, 문구, 타이밍, 이미지, 인터랙션
- Join Open Score 구조, 문구, 스크롤 상태기계, 모션, M 경계
- Supabase 데이터, Storage, Auth, RLS, schema, migration
- Figma 디자인 파일의 프레임, 컴포넌트, 변수, 스타일
- `package.json`, lockfile, dependency
- Git commit, push, deploy

Phase 0에서 새로 작성한 repository 파일은 이 문서와
`docs/home-v4-audit.md`뿐이다. 그 밖의 증거는 repository 밖 TEMP 경로에
보관했다.

## 2. Git 기준선

| 항목 | 값 |
| --- | --- |
| 브랜치 | `main` |
| HEAD | `9cda1f0a4cb5630319e5bdb822f143a39a8f3e62` |
| HEAD 제목 | `Preserve fixed hero copy and add open-score join presentation` |
| 원격 추적 상태 | `origin/main`, `origin/HEAD`와 동일 커밋 |
| 감사 시작 시 worktree | clean |
| tracked diff | 없음 |
| untracked file | 없음 |
| `git diff --check` | 통과 |

현재 HEAD에는 사용자가 최근 승인한 고정 Hero 카피와 Open Score Join
연출이 포함되어 있다. 따라서 이 커밋을 Home V4의 production 보호
기준점으로 사용한다.

## 3. 외부 보호 백업과 manifest

외부 백업 루트:

`C:\Users\seong\AppData\Local\Temp\smyc-home-v4-phase0-20260727-000932`

주요 파일:

| 파일 | 의미 |
| --- | --- |
| `git-branch.txt` | 감사 시작 브랜치 |
| `git-head.txt` | 감사 시작 전체 SHA |
| `git-status.txt` | 감사 시작 status |
| `git-diff-name-only.txt` | tracked 변경 파일 목록 |
| `git-diff-stat.txt` | tracked diff 통계 |
| `git-diff-check.txt` | whitespace 오류 기준선 |
| `untracked-files.txt` | untracked 목록 |
| `working-tree.patch` | worktree patch |
| `protected-files-manifest.json` | 보호 파일 29개의 SHA-256, 크기, 수정 시각, Git 상태 |

감사 시작 시 clean 상태였으므로 patch/status/diff/untracked 파일은
0 byte다. `protected-files-manifest.json`은 Hero, Join, home routing,
public shell, 홈 콘텐츠 resolver, 핵심 CSS, admin 관련 파일을 포함한다.

## 4. 실행 기준선

### 환경

- Vite 개발 서버: `http://127.0.0.1:5175/`
- 브라우저: 사용자가 지정한 Chrome
- 페이지 제목: `서울모테트청소년합창단`
- 프레임워크 오류 overlay: 없음
- 브라우저 console `warning`/`error`: 0건
- console 증거: `browser-console-warn-error.json` (`[]`)
- Hero 상태: 첫 번째 슬라이드 선택, 자동 재생 일시정지
- 웹폰트: 로드 완료 후 측정
- 기준 배율: Chrome 페이지 배율을 작업 중 임의 변경하지 않음

### 스크린샷

| ID | 화면 | viewport | artifact |
| --- | --- | --- | --- |
| 01 | production `/` | 1440×900 | `01-home-1440x900.png` |
| 02 | production `/` | 834×1194 | `02-home-834x1194.png` |
| 03 | production `/` | 390×844 | `03-home-390x844.png` |
| 04 | Join 고정 진입 | 1440×900 | `04-join-1440x900-fixed-entry.png` |
| 05 | Join 패널 고정 상태 | 1440×900 | `05-join-1440x900-held.png` |
| 06 | 아래 M 경계만 상승 | 1440×900 | `06-join-1440x900-m-boundary-rising.png` |
| 07 | 현재 `/sample/` | 1440×900 | `07-sample-root-1440x900.png` |
| 08 | 없는 `/sample/home-v4` | 1440×900 | `08-sample-home-v4-missing.png` |

모든 artifact는 외부 백업 루트 아래에 있다.

## 5. Hero 기준선

### 동작 계약

현재 Hero는 다음 동작을 제공하며 Home V4에서 보호해야 한다.

- 5초 간격 자동 전환
- 약 760ms crossfade
- 이전/다음/점 표시/일시정지·재생 제어
- hover, focus, 사용자의 명시적 입력 시 자동 재생 중지
- 문서가 숨겨진 상태에서 자동 재생 중지
- Save-Data 고려
- `prefers-reduced-motion`에서 자동 재생 및 불필요한 이동 비활성화

### 1440×900 측정값

브라우저 scrollbar를 제외한 실제 content viewport 폭은 약 `1424.8px`다.

| 요소 | x | y | width | height |
| --- | ---: | ---: | ---: | ---: |
| 고정 header | 0 | 0 | 1424.8 | 58.4 |
| Hero root | 0 | 0 | 1424.8 | 900 |
| Hero title | 238.8 | 115.51 | 392.34 | 348.30 |
| Hero description | 238.8 | 483.01 | 448 | 47.15 |
| Hero CTA 영역 | 238.8 | 558.96 | 448 | 38.4 |
| Hero controls | 238.8 | 665.30 | 224.26 | 35.33 |
| Hero image | 0 | -14.4 | 1424.8 | 900 |
| Quick section root | 0 | 828 | 1424.8 | 245.01 |

### 834×1194 측정값

| 항목 | 값 |
| --- | ---: |
| content viewport 폭 | 819.2 |
| header 높이 | 72.8 |
| Hero 높이 | 1194.4 |
| title x/y/width/height | 28 / 333.91 / 337.94 / 317.95 |
| title font/line-height | 86.4 / 79.488 |
| description x/y/width/height | 28 / 675.86 / 544 / 55.03 |
| CTA x/y/width/height | 28 / 766.89 / 544 / 48 |
| controls x/y/width/height | 28 / 907.40 / 279.55 / 43.78 |
| Quick section y/height | 1122.4 / 511.35 |

### 390×844 측정값

| 항목 | 값 |
| --- | ---: |
| content viewport 폭 | 375.2 |
| header 높이 | 72.8 |
| Hero 높이 | 844 |
| title x/y/width/height | 20 / 176.61 / 223.43 / 220.15 |
| title font/line-height | 58.56 / 55.0464 |
| description x/y/width/height | 20 / 414.76 / 335.2 / 55.03 |
| CTA x/y/width/height | 20 / 505.79 / 335.2 / 108 |
| controls x/y/width/height | 20 / 705.39 / 311.2 / 61.6 |
| Quick section y/height | 802 / 471.2 |

세 viewport 모두 감사 시점의 첫 화면에서 주요 Hero 문구와 조작부가
잘리지 않았다.

## 6. Join 기준선

### 사용자가 승인한 핵심 계약

Join은 일반적인 `fade in` 섹션이 아니라 scroll-driven fixed panel이다.

1. Join 패널이 viewport의 고정 위치에 도달한다.
2. 패널 내부의 소개·입단 절차·보호자 안내는 그 자리에 유지된다.
3. 사용자가 계속 스크롤하면 상단 패널 전체가 같이 밀려 올라가지 않는다.
4. 아래 섹션 경계인 M 장식만 아래에서 위로 상승한다.
5. 경계 상승이 완료된 뒤 다음 섹션으로 전환된다.

### 1440×900 실측 비교

| 상태 | scrollY | 고정 패널 | 소개 영역 | 보호자 안내 | M/다음 경계 |
| --- | ---: | --- | --- | --- | --- |
| held | 2031.2 | top 96, bottom 900 | top 164.4, bottom 805.54 | top 735.3, bottom 847.3 | top 784.44, bottom 868.97 |
| boundary rising | 2150.4 | top 96, bottom 900 | top 164.4, bottom 805.54 | top 735.3, bottom 847.3 | top 653.47, bottom 738.38 |

두 상태 사이에서 fixed panel, intro, guardian의 위치는 동일했고 M
경계만 약 `130.98px` 위로 이동했다. 이 실측값을 Phase 1 이후 Join
회귀 판정의 핵심 기준으로 사용한다.

## 7. 현재 sample route 기준선

- `src/App.tsx`는 URL이 `/sample`로 시작하면 `BrowserRouter`에 sample
  basename을 적용한다.
- `/sample/` index는 별도의 Home V4가 아니라 production과 같은
  `HomeRoute`를 렌더링한다.
- production `HomeRoute`도
  `HomeSectionFlowSamplePage.tsx`에서 export한 `HomeSectionFlowPage`를
  렌더링한다.
- `PublicLayout`은 production에서도 항상 `color-sample-theme` class를
  적용한다.
- `/sample/home-v4` route는 현재 존재하지 않으며 NotFound 화면이
  표시된다.

따라서 현재 sample tree는 Home V4를 안전하게 실험할 수 있는 격리
영역이 아니다.

## 8. 검증 명령 기준선

Node가 기본 PowerShell `PATH`에 없어서 첫 실행은 명령을 찾지 못했다.
Codex workspace가 제공한 bundled Node 경로를 `PATH` 앞에 추가한 뒤
같은 명령을 다시 실행했다. 이 과정에서 dependency는 설치하거나
변경하지 않았다.

| 명령 | 결과 |
| --- | --- |
| `pnpm check:supabase-env` | 통과; `.env.local` 존재, 필수 4개 설정 확인, 값은 출력하지 않음 |
| `pnpm check:supabase-live` | 39/39 통과; public 읽기, stable RPC, storage 목록, private 401 확인 |
| `pnpm check:home-copy-contract` | 9/9 통과 |
| `pnpm test` | 7/7 통과 |
| `pnpm lint` | 통과 |
| `pnpm build` | 통과; TypeScript build와 Vite production build 완료 |
| `git diff --check` | 통과 |

`check:supabase-live`는 감사한 구현상 read-only 요청만 사용한다.
Phase 0에서 Supabase write는 발생시키지 않았다.

## 9. Phase 0 판정

- 현재 production `/`는 실행되며 console 오류가 관찰되지 않았다.
- Hero의 데스크톱/태블릿/모바일 초기 상태 기준선이 확보됐다.
- Join fixed panel과 M 경계 상승의 위치 계약이 실측으로 고정됐다.
- 현재 `/sample/`은 production과 충분히 격리되지 않았다.
- `/sample/home-v4`는 아직 없다.
- Phase 1은 Figma 샌드박스 설계만 가능하며, code sample 구현은
  Phase 2 승인 전 시작하면 안 된다.

## 10. 확인 한계

- 실제 iOS Safari와 Android 실기기에서는 확인하지 않았다.
- 모든 CMS 조합, 긴 다국어 문구, 이미지 누락, 네트워크 실패 상태의
  visual baseline은 아직 없다.
- 이번 Phase는 baseline 수집이므로 새 디자인과 현재 화면의 픽셀
  visual regression 비교는 수행하지 않았다.
- Figma Dev Mode, Code Connect, 별도 branch 기능 사용 가능 여부는
  계정의 Professional Full seat만으로 확정할 수 없어 Phase 1에서
  대상 파일을 사용자가 확인한 뒤 재검증해야 한다.
