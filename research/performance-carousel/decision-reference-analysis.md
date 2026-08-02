# 공연 템플릿 비활성 항목 표현 방식 — 근거 재분류 및 의사결정

## 범위와 방법

- 원본 근거 원장: `evidence-ledger-400-plus.csv`의 고유 URL 679개.
- 관련 키워드 후보: 566개. 이 중 URL 중복 없이 옵션별 상위 35개씩 총 140개를 재분류했다.
- 공식·시지각 보충 근거: 12개. W3C WAI, Figma, Autodesk, NIH PMC 자료를 별도 출처로 추가했다.
- 최종 분석 행: 152개. 각 행의 원장 ID, URL, 관찰 근거, 분류 키워드, 점수는 `decision-reference-analysis.csv`에 기록했다.
- 주의: 원장 행은 기존에 검증·수집된 메타데이터와 관찰 메모를 동일 기준으로 재분류한 것이다. 679개 페이지 전부를 이번 작업에서 다시 시각 재생했다고 주장하지 않는다. 공식 보충 자료는 본문 원칙을 직접 재확인했다.

## 옵션별 집계

| 옵션 | 표현 방식 | 근거 수 | 평균 근거강도 /5 | SMYC 적합도 /10 | 인지 명료성 /10 | 모션 위험 /10 | 결론 |
|---|---|---:|---:|---:|---:|---:|---|
| A | 건축 포켓에 일부 노출 | 42 | 4.52 | 9.36 | 8.07 | 2.24 | **데스크톱 주안** |
| B | 완전 숨김 후 전환 시 등장 | 37 | 4.19 | 7.27 | 6.05 | 6.27 | **주안 제외** |
| C | 중앙 1개만 교체·크로스페이드 | 38 | 4.37 | 10.00 | 10.00 | 1.16 | **모바일·감소모션 대안** |
| D | 겹침 스택 | 35 | 4.20 | 5.43 | 6.09 | 7.91 | **배제** |

## 비교 판단

### A. 건축 포켓에 일부 노출

- 구조: 중앙 템플릿은 완전 노출하고 좌우 템플릿은 같은 CMS 컴포넌트를 축소해 건축 전면 마스크 뒤 포켓에 일부만 보인다.
- 장점: 다음 항목의 존재와 방향을 즉시 알리면서 기준 사진의 건축 개구부·깊이·레이어 논리를 가장 충실하게 보존한다.
- 단점: 가림 순서가 틀리면 잘린 그림처럼 보이고, 비활성 항목의 접근성·포커스 제외 처리가 필요하다.
- SMYC 판단: **데스크톱 주안**.
- 대표 근거:
  - [Cobloc - Awwwards Honorable Mention](https://www.awwwards.com/sites/cobloc) — 가림, 개구부, architect, 건축, 깊이, 레이어; 근거강도 5/5.
  - [Apply effects to layers](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers) — 후면 벽, 포켓 안쪽, 전면 립의 명암을 분리해 깊이를 만들 수 있다는 구현 근거.; 근거강도 5/5.
  - [AlterG Resources — One Page Website Award](https://onepagelove.com/alterg-resources) — mask, 가림, 개구부, architect, 건축; 근거강도 5/5.
  - [Depth perception from occlusion](https://pmc.ncbi.nlm.nih.gov/articles/PMC3485797/) — 과도한 원근 회전 없이도 일부 노출과 가림만으로 깊이를 만들 수 있다는 근거.; 근거강도 5/5.
  - [Occlusion contours and border ownership](https://pmc.ncbi.nlm.nih.gov/articles/PMC5871781/) — 전면 건축 레이어가 템플릿 가장자리를 덮어야 내부에 들어간 것으로 읽힌다는 시지각 근거.; 근거강도 5/5.

### B. 완전 숨김 후 전환 시 등장

- 구조: 비활성 템플릿을 개구부 밖이나 마스크 뒤에 완전히 숨기고 이전/다음 조작 시에만 중앙으로 진입시킨다.
- 장점: 정지 상태가 깨끗하고 중앙 집중도가 높으며 좁은 화면에 대응하기 쉽다.
- 단점: 다음 항목의 존재가 약해지고, 진입 시작 위치가 보이면 뿅 생기는 현상이나 과도한 슬라이드 모션이 발생한다.
- SMYC 판단: **주안 제외**.
- 대표 근거:
  - [Ai in Design Report 2026 - Awwwards Honorable Mention](https://www.awwwards.com/sites/ai-in-design-report-2026) — 전환, motion, 모션; 근거강도 5/5.
  - [Arnaud Rocca’s Portfolio: From a GSAP-Powered Motion System to Fluid WebGL](https://tympanus.net/codrops/2026/03/31/arnaud-roccas-portfolio-from-a-gsap-powered-motion-system-to-fluid-webgl/) — transition, 전환, motion, 모션, interaction; 근거강도 5/5.
  - [Carousel animations](https://www.w3.org/WAI/tutorials/carousels/animations/) — 숨김 항목이 진입할 때 시각·접근성 상태를 동기화해야 한다는 근거.; 근거강도 5/5.
  - [Parallax-Scrolling-Example | Figma](https://www.figma.com/community/file/1337383844852052585/parallax-scrolling-example) — 전환, 모션; 근거강도 3/5.
  - [Weekly Designers Update #475 | Muzli Blog](https://muz.li/blog/weekly-designers-update-475/) — 전환, 모션; 근거강도 3/5.

### C. 중앙 1개만 교체·크로스페이드

- 구조: 중앙 슬롯 한 곳에서 템플릿·공연명·날짜·장소·인덱스를 원자적으로 교체하고 짧은 불투명도 전환만 사용한다.
- 장점: 인지·접근성·모바일·reduced-motion 대응이 가장 단순하고 CMS 텍스트 길이 변화에 강하다.
- 단점: 기준 이미지가 가진 건축 포켓 깊이와 다음 항목의 공간적 단서가 사라져 시각적 개성이 약해진다.
- SMYC 판단: **모바일·감소모션 대안**.
- 대표 근거:
  - [Blå Station - Awwwards Honorable Mention](https://www.awwwards.com/sites/bla-station) — 미니멀, editorial, 여백, 접근성; 근거강도 5/5.
  - [Allagi — One Page Website Award](https://onepagelove.com/allagi) — minimal, 미니멀, 에디토리얼, 여백; 근거강도 5/5.
  - [Between Print and Digital: The Making of MERSI’s Website](https://tympanus.net/codrops/2026/07/27/between-print-and-digital-the-making-of-mersis-website/) — 미니멀, editorial; 근거강도 5/5.
  - [ARIA Authoring Practices Guide: Carousel Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) — 중앙 단일 항목과 명시적 제어가 가장 예측 가능한 접근성 기준이라는 근거.; 근거강도 5/5.
  - [Carousels Tutorial](https://www.w3.org/WAI/tutorials/carousels/) — 모바일·감소 모션에서는 중앙 단일 항목과 인덱스·버튼을 유지해야 한다는 근거.; 근거강도 5/5.

### D. 겹침 스택

- 구조: 세 템플릿을 z축·크기·그림자로 겹쳐 놓고 활성 항목을 앞으로 이동시킨다.
- 장점: 항목 수와 순환 구조를 한눈에 보여 주고 깊이·전환의 역동성을 만들기 쉽다.
- 단점: 프로그램북 더미처럼 보이기 쉽고, 겹침·그림자·회전이 SMYC의 미니멀한 건축 개구부보다 강해진다.
- SMYC 판단: **배제**.
- 대표 근거:
  - [CIAO ENERGY - LAUNCH WEBSITE - Awwwards SOTD](https://www.awwwards.com/sites/ciao-energy-launch-website) — 3d, immersive; 근거강도 5/5.
  - [Behind the KAI Design Dept. Experience: WebGL Line Blur, Video Scrubbing, and 3D Animation](https://tympanus.net/codrops/2025/11/20/behind-the-kai-design-dept-experience-webgl-line-blur-video-scrubbing-and-3d-animation/) — 3d, webgl; 근거강도 5/5.
  - [Weekly Designers Update #562 | Muzli Blog](https://muz.li/blog/weekly-designers-update-562/) — 3d, webgl, immersive; 근거강도 4/5.
  - [Sarah & Matt Wedding — One Page Website Award](https://onepagelove.com/sarah-matt-wedding) — 3d; 근거강도 3/5.
  - [SimpleSketche — One Page Website Award](https://onepagelove.com/simplesketche) — 3d; 근거강도 3/5.

## 최종 권고

**데스크톱 기본은 A(건축 포켓 일부 노출), 모바일·`prefers-reduced-motion`·CMS 예외 상태는 C(중앙 1개 교체)로 확정하는 것이 가장 타당하다.**

1. 기준 사진의 핵심은 책 더미가 아니라 `후면 공간 → 전체 템플릿 → 전면 건축 가리개`의 가림 순서다. 따라서 좌우 항목은 잘라 만든 별도 그래픽이 아니라 중앙과 같은 CMS 템플릿 컴포넌트 전체를 포켓 뒤에 놓는다.
2. 데스크톱 좌우 템플릿은 중앙보다 작고 대비가 약해야 하지만, 앞면 디자인·비율·CMS 바인딩은 동일해야 한다. 보이는 흰 면적은 좌우가 대칭이고, 검은 등 부분은 건축 전면 레이어가 자연스럽게 가린다.
3. 이전/다음 조작은 `01 → 02 → 03 → 01`의 원형 순환이다. 중앙 템플릿, 왼쪽 공연명, 날짜, 장소, 하단 활성 표시, 접근성 이름을 한 상태 변경에서 동시에 갱신한다.
4. 비활성 템플릿은 `aria-hidden=true`, `inert`, 포커스 제외로 처리한다. 현재 항목만 의미 있는 이미지 설명과 조작 대상을 가진다.
5. 감소 모션에서는 위치·원근 이동을 제거하고 C 방식의 짧은 불투명도 교체 또는 즉시 전환으로 바꾼다. W3C 기준상 opacity-only 변화는 이동 애니메이션보다 안전한 대안이다.
6. D 방식의 겹침 스택과 과도한 3D 회전은 프로그램북 더미 인상을 만들고, 사용자가 요구한 미니멀한 공연 템플릿·건축 개구부를 가리므로 사용하지 않는다.

## 구현 금지선

- 좌우 템플릿을 검은 막대나 잘린 별도 이미지로 대체하지 않는다.
- 전면 가리개를 삭제하거나 후면 벽을 앞으로 보내지 않는다.
- 자동 재생, 이동 카메라, 회전형 3D, 무한 패럴랙스를 기본값으로 두지 않는다.
- CMS 데이터가 1개일 때 빈 포켓을 보여 주지 않는다. 자동으로 중앙 단일 상태 C로 축소한다.
- 긴 공연명·이미지 누락·비표준 비율이 구조를 깨뜨리지 않도록 fallback 템플릿을 둔다.

## 검증 상태

- 이 문서는 의사결정 근거 분석만 수행했다.
- Figma 파일, `/sample/home-v4`, production 앱 코드는 수정하지 않았다.
- 실제 레이어 재생성·픽셀 비교·모션 프로토타입 검증은 다음 구현 단계에서 별도 수행해야 한다.
