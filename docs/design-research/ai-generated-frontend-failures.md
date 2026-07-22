# GPT‑5.6 생성형 프론트엔드가 “구려 보이는” 이유

- 조사 시점: `2026-07-19 01:30 KST`
- 범위: GPT‑5.6 Sol/Terra/Luna, 최신 GPT/Codex 계열, 일반적인 LLM 기반 UI 생성
- 목적: 모델 비난이 아니라, 서울모테트청소년합창단(SMYC) 홈페이지 5개 디자인 시안에서 반복되는 생성형 UI의 실패를 사전에 차단하기 위한 근거 정리
- 방법: OpenAI 공식 문서 → 독립 벤치마크·기업 연구 → 학술 연구·표준 → GitHub·Hacker News·Reddit의 실제 사용 보고 순으로 교차 확인했다.

## 한 문장 결론

“GPT‑5.6은 프론트엔드를 못한다”는 주장은 근거가 부족하다. 더 정확한 결론은 **GPT‑5.6은 이전 GPT보다 시각적 품질이 크게 좋아졌지만, 목표 사용자·브랜드 재료·실제 콘텐츠·디자인 제약·브라우저 검증이 부족한 단발 생성에서는 여전히 학습 데이터와 실행 환경의 고빈도 미학으로 수렴한다**는 것이다. 그래서 결과가 작동은 하지만 서로 비슷하고, 브랜드 고유성이 약하며, 실제 UX·접근성·모바일 상태가 덜 완성된 것처럼 보인다.

이 구분은 중요하다.

- **모델 능력 문제**: 모델이 갖는 기본 미학과 고빈도 패턴, 시각적·구조적 추론의 한계
- **프롬프트·컨텍스트 문제**: “세련되게”, “모던하게”처럼 판단 기준이 없는 요청, 실제 카피·이미지·디자인 시스템 부재
- **평가 문제**: 컴파일 성공이나 한 장의 예쁜 스크린샷을 전체 UX 품질로 오인
- **구현 환경 문제**: 사용 가능한 컴포넌트, 아이콘, 폰트, 이미지, 토큰·시간, 브라우저 검증 도구의 제약

## 근거 상태 정의

- **Confirmed**: 서로 독립적인 2개 이상의 출처가 같은 방향을 지지하거나, 직접 데이터가 있는 1차 연구·표준으로 확인됨
- **Conditional**: 직접 관찰은 있지만 GPT‑5.6만을 분리한 통제 실험이 없거나, 특정 프롬프트·런타임·평가 방식에 따라 달라짐
- **Unsupported**: 현재 공개 근거로 일반화할 수 없거나 반례가 더 강함

## 주장별 검증표

| ID | 주장 | 상태 | 독립 출처 수 | checked_at (KST) | 확인 근거 | 정확한 해석 |
|---|---|---:|---:|---|---|---|
| C1 | GPT‑5.6은 GPT‑5.5보다 프론트엔드 디자인이 개선됐다. | **Confirmed** | 독립 provenance 최대 3개 | 2026-07-19 | [O1], [E14]–[E17] | OpenAI의 파트너 평가, Design Arena의 사람 선호 평가, Sitegeist의 동일 브리프 비교가 모두 개선 방향을 지지한다. 단, [E14]와 [E15]는 같은 Design Arena 출처군이고 [E16]과 [E17]은 같은 Sitegeist 조사이므로 URL 수를 독립 출처 수로 세지 않는다. 모든 과제에서 항상 우수하다는 뜻도 아니다. |
| C2 | GPT‑5.6도 반복되는 “시각적 지문”을 가진다. | **Confirmed** | 독립 provenance 최대 2개 | 2026-07-19 | [E15]–[E17] | Design Arena의 1,000개 생성물 분석은 confetti가 26.5% 이상에서 반복됐다고 보고했다. Sitegeist 100개 생성물에서는 lime/yellow·gradient 반복이 관찰됐다. [E16]과 [E17]은 하나의 조사·작성자 계열이므로 둘로 세지 않는다. |
| C3 | 모호한 프롬프트는 generic structure와 weak hierarchy를 만들 수 있다. | **Conditional (1차 가이드)** | 독립 provenance 1개 | 2026-07-19 | [O2], [O3], [O5] | 세 URL은 모두 OpenAI 출처군이므로 독립 3개로 세지 않는다. OpenAI는 불충분한 지시에서 모델이 학습 데이터의 고빈도 패턴으로 후퇴할 수 있다고 명시하지만, 독립 통제 실험 없이 모든 모델·과제의 인과로 일반화하지 않는다. |
| C4 | 카드·그라디언트·둥근 모서리 자체가 나쁘다. | **Unsupported** | 0 | 2026-07-19 | 반례: [O2], [O3], [E15] | 문제는 요소 자체가 아니라 **기능적 이유 없이 모든 구역에 반복**되어 정보 구조와 브랜드를 대체하는 것이다. 필요한 반복 항목·상호작용 컨테이너에는 카드가 적절하다. |
| C5 | GPT‑5.6은 좋은 UX를 스스로 완성할 수 없다. | **Conditional** | 4 | 2026-07-19 | [E1], [E9], [E10], [S9] | 실제 사용자 조사와 조직 맥락을 입력받지 못한 모델은 사용자 필요를 관찰할 수 없다. 그러나 충분한 리서치·디자인 시스템·검증 도구를 제공하면 강력한 구현 파트너가 될 수 있다. |
| C6 | LLM 생성 UI는 접근성 누락이 잦다. | **Confirmed (일반 LLM)** / **GPT‑5.6 직접값 없음** | 5 | 2026-07-19 | [E6], [E7], [E8], [E9], [S1] | 300개 UI에서 의미적 접근성 위반 541건을 찾은 연구와 WCAG 정렬 모델이 기본 모델의 비접근성률을 60% 낮춘 연구가 있다. 이 수치를 GPT‑5.6에 그대로 적용하면 안 된다. |
| C7 | 한 장의 스크린샷이나 컴파일 성공은 UX 품질을 증명한다. | **Unsupported** | 5 | 2026-07-19 | [O4], [E2], [E3], [E4], [E18] | 시각 충실도, 기능, 모바일, 접근성, 전체 여정은 별도 축이다. 브라우저·다중 뷰포트·상태 기반 검증이 필요하다. |
| C8 | 컴포넌트 라이브러리와 스타터가 생성 결과를 비슷하게 만든다. | **Conditional** | 3 | 2026-07-19 | [O5], [E15], [U3] | Tailwind·shadcn·Lucide 같은 공통 기본값은 구현 속도를 높이지만, 별도 아트 디렉션이 없으면 같은 radius·spacing·icon language로 수렴하기 쉽다. 인과 크기는 통제 실험이 더 필요하다. |
| C9 | reasoning effort가 높을수록 프론트엔드가 항상 좋아진다. | **Unsupported** | 1 | 2026-07-19 | [O3] | OpenAI는 단순한 웹 작업에서는 low/medium이 더 집중된 결과를 내는 경우가 있다고 안내한다. 복잡성에 맞춰 조절해야 한다. |
| C10 | GPT‑5.6의 “나쁜 프론트엔드”는 모델만의 잘못이다. | **Unsupported** | 독립 provenance 최대 4개 | 2026-07-19 | [O2], [O3], [O4], [E10], [E11], [E12] | OpenAI 3개 URL은 한 출처군이고 세 연구는 각각 별도 연구군이다. 결과는 모델×프롬프트×도구×기존 코드×검증×사용자 피드백의 결합물이므로 모델 단독 원인으로 환원할 수 없다. |
| C11 | GPT‑5.6은 프론트엔드가 전반적으로 형편없다. | **Unsupported** | 독립 provenance 최대 3개 | 2026-07-19 | [O1], [E14], [E15], [E17] | [E14]·[E15]는 같은 Design Arena 출처군이다. OpenAI, Design Arena, Sitegeist 세 계열에서 반례가 있으며 “기본 출력의 반복성”과 “절대 능력 부족”은 다른 주장이다. |
| C12 | 커뮤니티의 반복 불만은 증상 탐색을 위한 조건부 신호로 쓸 수 있다. | **Conditional signal** | 7개 스레드·성능 독립근거 0개 | 2026-07-19 | [U1]–[U7] | 자기선택·프롬프트 차이 때문에 성능 수치나 인과 근거로 쓰면 안 되지만, 반복해서 등장하는 증상과 실패 언어를 찾는 조기 경보로는 유용하다. |

`독립 출처 수`는 URL 수가 아니라 발행 주체·연구 데이터·작성자 계열이 다른 provenance family 수다. 같은 회사의 문서 세 개나 같은 조사에서 나온 글 두 개는 각각 한 출처군으로 센다.

## 왜 기본 출력이 비슷해지는가

### 1. 모델의 기본 미학: “평균적으로 그럴듯한 것”에 대한 강한 사전분포

OpenAI의 자체 프론트엔드 가이드는 프롬프트가 불충분할 때 모델이 학습 데이터에서 자주 보인 패턴으로 후퇴하며, 결과가 기능적으로는 그럴듯하지만 구조가 일반적이고 시각 계층이 약해질 수 있다고 설명한다([O3]). 이것은 “모델이 미적 감각이 없다”기보다, 열린 문제에서 **실패 위험이 낮고 자주 칭찬받은 조합**을 우선 선택한다는 뜻이다.

GPT‑5.6은 이 문제를 상당 부분 완화했다. Design Arena는 1,000개 GPT‑5.6 사이트를 임베딩으로 분석해 GPT‑5.5에서 많았던 보라 그라디언트·bento·과대형 hero type가 줄었다고 보고했다([E15]). 그러나 기본 습관이 사라진 것은 아니다.

- confetti 장식이 26.5% 이상의 생성물에서 반복됨([E15])
- 같은 이미지를 다른 맥락에 반복 사용하는 경향([E15])
- Sitegeist의 100개 동일 브리프 실험에서 lime/yellow·gradient가 반복되는 시각적 지문으로 관찰됨([E16], [E17])

즉 “purple gradient AI look”을 억제한 뒤 새로운 안전한 기본값이 또 생길 수 있다. **anti-pattern 목록을 모델에게 주는 것만으로는 충분하지 않고, 브랜드 고유 재료로 빈자리를 채워야 한다.**

### 2. 프롬프트 문제: 형용사는 방향이 아니라 평균값을 호출한다

“modern”, “premium”, “clean”, “세련되게”는 평가 가능한 제약이 아니다. 이런 형용사만 주면 모델은 보편적인 SaaS·에이전시 랜딩페이지의 평균을 반환하기 쉽다. OpenAI가 권장하는 입력은 다음처럼 구체적이다([O2], [O3], [O5]).

- 대상 사용자와 사용 상황
- 실제 브랜드·제품·장소가 첫 화면에서 보여야 하는 방식
- 실제 카피와 콘텐츠 우선순위
- 색·서체·간격·radius·surface 역할
- 사용해도 되는 이미지와 금지할 이미지
- section별 단 하나의 목적
- 2~3개의 의도된 motion
- desktop/mobile에서 확인할 성공 조건
- 기존 컴포넌트·토큰을 재사용할 규칙

SMYC에서 “정갈하고 클래식하게”만 입력하면 모델은 navy/gold, serif, 큰 합창 사진이라는 익숙한 평균으로 갈 가능성이 높다. 반대로 “Ivory가 아닌 순백, 로고 심볼에서 추출한 단 하나의 orange, 검은 활자, 프로그램 북처럼 넓은 여백, 카드는 일정·공연처럼 실제 반복 데이터에만 사용”처럼 쓰면 선택 공간이 구체화된다.

### 3. 컨텍스트 문제: 모델은 보지 못한 사용자와 조직을 연구할 수 없다

좋은 UX는 예쁜 화면이 아니라 실제 사용자의 과업·문제·언어를 근거로 한 결정이다. GOV.UK 서비스 표준은 사용자 의견이 아닌 제안은 연구로 검증할 가정으로 취급하라고 안내한다([S9], [S10]). GPT‑5.6에게 다음 자료가 없으면 “정답 UX”를 스스로 알아낼 수 없다.

- 방문자가 가장 많이 찾는 정보: 공연 일정, 지원, 합창단 소개, 문의 등
- 학부모·청소년·후원자·교회/공연 관계자의 서로 다른 과업
- 실제 검색·문의·분석 데이터
- 긴 한국어 이름과 실제 공지 길이
- 관리자가 CMS에서 만드는 빈 상태·오류 상태·이미지 비율
- 미성년 단원 사진 공개 원칙

Apple의 2026 CHI 연구는 21명의 디자이너가 약 1,500개의 구체적 피드백을 제공한 방식으로 정렬한 모델이 전통적 선호 순위 학습과 GPT‑5를 포함한 베이스라인보다 사람 평가에서 우수했다고 보고한다([E1]). 핵심은 더 큰 모델보다 **디자이너의 수정 이유와 직접 조작 데이터**가 품질을 끌어올렸다는 점이다.

### 4. 평가 문제: “작동”과 “좋은 경험”을 한 점수로 뭉친다

일반 코딩 벤치마크는 패치·테스트 통과 능력을 측정하지만 브랜드 고유성, 읽기 흐름, 모션의 의미, 모바일 터치, 스크린리더 경험을 직접 측정하지 않는다. 프론트엔드 연구들도 이 간극 때문에 평가를 여러 축으로 나눈다.

- Design2Code: 시각 요소 회수와 올바른 레이아웃 생성에서 모델이 뒤처짐([E2])
- FrontendBench: 단순 과제와 약한 테스트의 한계를 보완하기 위해 실제 인터랙션 테스트를 도입([E3])
- WebCoderBench: 24개 세부 지표·9개 관점으로 분리하며 어떤 모델도 모든 축에서 우세하지 않음([E4])
- ArtifactsBench: 정적 코드가 아니라 렌더링된 동적 결과와 인터랙션을 평가([E18])

Design Arena도 유용하지만 비에이전트 평가는 single-file HTML 결과에 대한 사람 선호가 중심이다([E14]). 이는 첫인상과 미학 비교에는 강하지만 다음을 자동으로 보장하지 않는다.

- SMYC의 실제 정보 구조와 전환 성과
- WCAG 적합성
- CMS 데이터의 빈/오류/로딩 상태
- 390px 모바일과 200% 확대
- 키보드·스크린리더
- 유지보수 가능한 React/Supabase 구조

따라서 “arena 1위”와 “우리 홈페이지에 맞는 UX”는 같은 명제가 아니다.

### 5. 구현 환경 문제: 모델이 쓸 수 있는 재료가 결과를 규정한다

동일 모델도 아래 조건에 따라 전혀 다른 결과를 낸다.

- 설치된 UI 라이브러리와 아이콘 세트
- 사용할 수 있는 실제 이미지·영상·폰트
- 한 파일 데모인지, 기존 디자인 시스템을 가진 제품인지
- 브라우저를 보고 반복 수정할 수 있는지
- 토큰·시간·도구 호출 예산
- 테스트할 뷰포트와 상태가 명시됐는지

OpenAI의 권장 워크플로도 스크린샷·디자인 브리프를 기준으로 기존 토큰을 재사용하고, Playwright로 desktop/mobile을 비교하며 반복하라고 한다([O4]). 즉 좋은 결과는 “한 번에 코드를 뱉는 모델”보다 **참조 → 구현 → 렌더 → 비교 → 수정** 루프에 가깝다.

## 반복적으로 “AI 같아 보이는” 구체 증상

| 증상 | 왜 어색해지는가 | SMYC에서의 대응 |
|---|---|---|
| 보라·파랑 또는 neon gradient가 기본 배경 | 브랜드와 상관없는 고빈도 장식이 분위기를 대신함 | white/orange 안은 순백과 실제 로고 orange를 중심으로 하고, navy는 활자·구조·야간 무대 장면에 제한 |
| lime/yellow·confetti를 새 기본값처럼 반복 | GPT‑5.6이 이전 anti-pattern을 피하면서 생긴 새로운 시각적 지문 | 로고 심볼의 형태·리듬만 사용하고 무작위 particle/confetti 금지 |
| 모든 section을 둥근 카드로 감쌈 | 계층이 container chrome에 의존해 모든 내용의 중요도가 같아짐 | section은 여백·정렬·rule line으로 구분하고, 카드는 반복 데이터/상호작용에만 사용 |
| `rounded-2xl`·soft shadow의 일괄 적용 | 물성과 브랜드 이유가 없는 “컴포넌트 라이브러리 기본값”처럼 보임 | radius 0/4/8 중심. 포스터·프로그램 북의 종이 모서리와 실제 버튼만 예외 |
| 큰 hero 문구가 브랜드명보다 큼 | first viewport에서 합창단이 아니라 캠페인 카피가 주인공이 됨 | “서울모테트청소년합창단” 또는 심볼을 가장 강한 신호로 두고 headline은 보조 |
| eyebrow pill + headline + 설명 + 두 CTA + stat strip | 첫 화면의 경쟁 요소가 많아 5초 내 이해가 어려움 | 브랜드, 한 문장, 주 CTA, 한 개 dominant visual만 우선 |
| Inter/Roboto/system sans만 사용 | 무난하지만 교회음악·교육·악보의 문화적 결이 사라짐 | 한국어 본문 가독성 서체 + 절제된 serif display, 최대 2개 family |
| “함께 만드는 아름다운 하모니”류의 일반 카피 | 어느 합창단에도 붙일 수 있어 고유성이 사라짐 | 실제 교육 철학·정직한 음악·공연·모집 맥락에서 나온 문장 사용 |
| Lucide 아이콘을 장식적으로 반복 | 기능을 설명하지 않는 outline icon row가 시각 잡음이 됨 | 아이콘은 메뉴·검색·재생·이동처럼 빠른 스캔에 필요한 경우만 |
| stock-like 공연 사진 또는 추상 3D object | 실체보다 “분위기”를 보여줘 신뢰와 장소성이 약함 | 실제 단체·공연장·악보·로고·공연 프로그램을 사용하되 미성년 개인 초상 중심 구성은 피함 |
| 모든 block의 간격·크기가 균등 | 의도적 hierarchy 없이 “잘 정렬된 템플릿”처럼 보임 | section마다 dominant scale을 하나만 정하고 긴장과 휴식의 리듬을 설계 |
| hover만 있고 loading/error/empty/disabled가 없음 | 스크린샷은 예쁘지만 실제 사용 흐름이 끊김 | 일정·지원·문의에 최소 4상태를 명시하고 피드백을 카피로 연결 |
| desktop을 축소한 모바일 | text overflow, 작은 target, 메뉴 충돌이 생김 | 390px에서 정보 순서와 control을 다시 구성하고 44px 권장 target 유지 |
| 움직이는 모든 것을 “premium animation”으로 포장 | 의미 없는 입장·parallax가 읽기를 방해하고 모델의 장식 습관이 됨 | 애니메이션은 방향·상태·진행·공간 관계를 설명할 때만 유지 |

## 애니메이션: 없애지 말고 쓸모 있게 바꾸기

사용자의 “웬만하면 애니메이션을 없애지 말자”는 방향은 근거와 맞는다. 현재 공개된 OpenAI 개발자 글은 시각 중심 작업에서 2~3개의 의도된 motion을 권장하며, motion은 presence와 hierarchy를 만들어야지 noise가 되어서는 안 된다고 한다([O3]).

SMYC에서는 기존 애니메이션을 다음처럼 분류한다.

| 유지·개선할 motion | 기능 | 실패 방지 규칙 |
|---|---|---|
| Hero crossfade | 공연·공동체의 시간적 변화 전달 | 자동 전환은 충분히 느리게, 텍스트 대비 유지, 일시정지 고려 |
| Intro shutter/curtain | 무대가 열리는 첫 진입 맥락 | 첫 방문 또는 짧은 구간에만, 콘텐츠 접근을 늦추지 않음 |
| Staff line / score reveal | section 진행과 음악적 구조 연결 | 스크롤을 가로채지 않고 현재 위치를 설명하는 보조 레이어로 사용 |
| Scorebook/page transition | 아카이브의 페이지 관계 설명 | wheel lock·scroll hijack 금지, 일반 스크롤과 키보드 이동을 유지 |
| Archive card stack | 과거→현재의 관계와 선택 상태 표현 | 단순 장식이 아니라 선택·전환 상태가 명확해야 함 |
| Support letter fold | 후원 행동의 서사적 전환 | CTA를 가리거나 완료 피드백을 대체하지 않음 |
| Logo-symbol orange pulse | 현재 section·재생·진행 상태 표시 | 무작위 pulse 금지, 상태 변화와 1:1로 연결 |

모든 안에 정지 대안을 설계한다. W3C는 비필수 interaction animation을 끌 수 있어야 하며 `prefers-reduced-motion`을 지원하라고 안내한다([S2], [S3]). reduced-motion에서는 내용과 상태가 사라지면 안 되고, 이동·scale 대신 즉시 전환 또는 짧은 opacity 변화로 대체한다.

## SMYC 5안용 anti-pattern 체크리스트

아래는 각 Figma 안마다 독립적으로 통과해야 하는 체크다. `근거` 열을 비워 두지 않아 1:1로 추적 가능하게 했다.

| # | 확인 항목 | 합격 조건 | 근거 |
|---:|---|---|---|
| 1 | 5초 브랜드 테스트 | nav를 가려도 첫 화면이 SMYC임을 로고 심볼·이름·실제 소재로 식별 가능 | [O3] |
| 2 | one composition | 첫 화면이 dashboard/card collage가 아니라 하나의 장면으로 읽힘 | [O2], [O3] |
| 3 | white/orange 방향의 고유성 | orange는 실제 로고 심볼에서 추출하고 purple/lime 기본값을 피함 | [E15], [E17] |
| 4 | orange 대비 | 작은 orange 글자를 흰 배경에 무검증 사용하지 않음. 본문은 WCAG AA 대비 확인 | [S1], [S5] |
| 5 | 심볼의 기능성 | 심볼 반복이 section marker·play/progress·focus 등 실제 역할과 연결됨 | [O3] |
| 6 | confetti/particle 절제 | 기능 없는 confetti·orb·glow·random particle이 없음 | [E15], [O2] |
| 7 | 카드 필요성 | border/radius/background를 지워도 이해되는 영역은 카드가 아님 | [O2], [O3] |
| 8 | radius 규칙 | 0/4/8px 중심이며 큰 radius는 의미 있는 container에만 사용 | [O2] |
| 9 | 브랜드보다 큰 headline 금지 | 합창단명·심볼보다 generic campaign line이 더 강하지 않음 | [O3] |
| 10 | 실제 카피 | placeholder·추상 수사가 없고 공연/교육/모집/후원의 실제 의미가 있음 | [O3], [S10] |
| 11 | typography 제한 | 최대 2개 family, 역할별 scale이 명확하고 default stack 의존을 피함 | [O3] |
| 12 | hierarchy grayscale 검사 | 색을 제거해도 제목·본문·CTA·보조정보의 우선순위가 보임 | [O3], [N1] |
| 13 | section one-job | 각 section에 headline 하나, 핵심 정보/행동 하나가 있음 | [O3] |
| 14 | icon 의미 | 장식용 icon row가 없고 모든 icon button에 label/tooltip 명세가 있음 | [O2], [S7] |
| 15 | 실제 visual anchor | 분위기용 추상 gradient만으로 hero를 채우지 않고 실제 장소·악보·로고·단체 맥락을 보여줌 | [O2], [O3] |
| 16 | 청소년 프라이버시 | 개인 초상 중심 홍보가 아니라 공동체·활동·파트·교육 맥락을 우선 | 프로젝트 보안 원칙 |
| 17 | 390px 재구성 | 단순 축소가 아니라 정보 순서·메뉴·CTA가 모바일 과업에 맞게 재배치됨 | [O4], [S8] |
| 18 | touch target | 핵심 모바일 target은 프로젝트 기준 44×44px 이상 | [S4] |
| 19 | overflow | 390/768/1440px 및 긴 한국어에서 가로 overflow·겹침 없음 | [O4], [S8] |
| 20 | 상태 완성도 | loading/error/empty/disabled/success가 CTA와 데이터 영역에 명시됨 | [O2], [E3] |
| 21 | 키보드·focus | 메뉴·CTA·모달 흐름과 visible focus가 설계됨 | [S6], [S7] |
| 22 | motion purpose | 모든 motion에 `무엇을 설명하는가`가 한 문장으로 기록됨 | [O3] |
| 23 | scroll 보존 | wheel lock·scroll hijack 없이 일반 스크롤·키보드 이동 가능 | [S2], [S3] |
| 24 | reduced motion | 이동/scale을 제거해도 내용·선택·진행 상태가 동일하게 이해됨 | [S2], [S3] |
| 25 | 실제 렌더 검증 | desktop/mobile screenshot 비교, interaction 실행, console error 확인 | [O4], [E3], [E18] |
| 26 | 안별 차이 | 색만 바꾼 5안이 아니라 composition·content rhythm·motion thesis가 서로 다름 | [E15], [E17] |
| 27 | 컴포넌트 기본값 탈피 | Tailwind/shadcn/Lucide를 쓰더라도 SMYC token·type·spacing·icon rule로 재해석 | [O5], [E15] |
| 28 | 사용자 근거 기록 | 방문자 과업 또는 기존 데이터/문의/콘텐츠 근거가 section 결정 옆에 기록됨 | [S9], [S10] |

## 5안 검수에 사용할 빠른 테스트

1. **브랜드 삭제 테스트**: nav의 로고만 지웠을 때 어느 합창단/문화기관에도 붙을 수 있다면 탈락.
2. **흑백 테스트**: 색을 제거했을 때 CTA와 콘텐츠 우선순위가 사라지면 hierarchy 재설계.
3. **카드 삭제 테스트**: radius·shadow·border를 지워도 의미가 같다면 카드 treatment 삭제.
4. **모션 목적 테스트**: motion을 말로 설명할 때 “예뻐 보여서”밖에 없으면 수정. 단, 삭제보다 상태·방향·진행과 연결하는 개선을 우선.
5. **첫 화면 예산 테스트**: 브랜드, 한 문장, 주 CTA, dominant visual 외의 stat·schedule·badge가 경쟁하면 다음 section으로 이동.
6. **실제 콘텐츠 스트레스 테스트**: 가장 긴 공연 제목, 한국어 이름, 빈 일정, 이미지 없는 공지, 네트워크 실패를 넣어 확인.
7. **390px 손가락 테스트**: 메뉴·CTA·carousel control을 엄지로 누를 수 있고 고정 UI가 가리지 않는지 확인.
8. **reduced-motion 동등성 테스트**: 애니메이션을 꺼도 현재 section, 선택 상태, 다음 행동을 똑같이 이해할 수 있어야 함.
9. **사용자 과업 테스트**: 처음 온 방문자가 공연 일정·지원·후원·문의 중 하나를 30초 안에 찾을 수 있는지 확인.
10. **반복성 테스트**: 5안에서 동일한 hero 구조·3-card row·final CTA가 이름만 바뀌어 반복되면 다시 발산.

## 반례와 대안적 설명 재검증

### 반례 1: GPT‑5.6은 실제로 강한 프론트엔드 모델이다

- OpenAI는 GPT‑5.6이 high-level 지시만으로도 ergonomic·functional interface를 만든다고 발표했고, Triple Whale의 7개 과제 5점 척도에서 4.4점을 받았다는 파트너 결과를 공개했다([O1]).
- Design Arena는 출시 직후 GPT‑5.6 Sol이 single-turn web design에서 1위를 기록했다고 보고했다([E15]). 순위는 이후 신규 모델 추가로 변할 수 있다.
- Sitegeist의 100개 동일 브리프 비교에서도 많은 참여자가 Sol을 세 모델 중 가장 강하게 평가했다([E17]).

따라서 “GPT‑5.6은 프론트엔드를 못한다”가 아니라 “강한 모델도 기본값과 단발 생성에서는 고유 브랜드 UX를 자동 보장하지 않는다”가 증거에 맞다.

### 반례 2: 반복 패턴은 안정적인 관례일 수도 있다

카드, grid, 명확한 CTA, 익숙한 icon은 사용성을 돕는 관례다. 반복됐다는 사실만으로 나쁜 UX는 아니다. 문제는 맥락·기능과 무관하게 적용되는 경우다. 체크리스트도 카드나 motion의 전면 금지가 아니라 **필요성 증명**을 요구한다.

### 대안적 설명 1: 프롬프트와 harness가 모델보다 더 큰 원인일 수 있다

Sitegeist의 시각 지문은 동일 브리프라는 장점이 있지만 단발 생성 방식, system prompt, 사용 도구가 결과에 영향을 준다([E17]). Design Arena도 non-agentic 과제는 single-file HTML이다([E14]). 실제 Codex의 기존 저장소·디자인 시스템·이미지 생성·Playwright 루프와 동일한 조건이 아니다.

### 대안적 설명 2: 커뮤니티 불만은 선택 편향이 있다

실패한 사용자가 성공한 사용자보다 글을 올릴 동기가 클 수 있고, 모델·effort·프롬프트·기존 코드가 공개되지 않은 글도 많다. 그러므로 Reddit/HN은 패턴 탐색에 사용하고, 성능 수치나 인과 증명에는 사용하지 않았다.

### 대안적 설명 3: 접근성 연구의 세대 차이

접근성 연구 상당수는 GPT‑5.6 이전 모델 또는 여러 상용 모델을 묶어 평가했다([E6]–[E9]). “LLM UI 생성의 기본 위험” 근거로는 유효하지만 GPT‑5.6의 실제 위반률로 인용할 수 없다. SMYC 구현 단계에서 axe/Lighthouse와 수동 키보드·스크린리더 검증이 별도로 필요하다.

### 대안적 설명 4: 사람 선호 벤치마크도 UX 전체를 측정하지 않는다

Design Arena의 blind preference는 첫인상과 렌더 품질을 비교하는 데 유용하지만, 사용자 조사·장기 사용·관리자 운영·접근성·유지보수성을 모두 대표하지 않는다([E14], [E4]). Figma 5안은 preference winner를 고르는 단계이고, 실제 구현 전 사용자 과업 테스트가 다음 단계다.

## 출처 레지스트리

### OpenAI 1차 자료

- **[O1]** OpenAI, *GPT‑5.6: Frontier intelligence that scales with your ambition*  
  https://openai.com/index/gpt-5-6/
- **[O2]** OpenAI Developers, *Frontend prompt instructions*  
  https://developers.openai.com/api/docs/guides/frontend-prompt
- **[O3]** OpenAI Developers, *Designing delightful frontends with GPT‑5.4*  
  https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4
- **[O4]** OpenAI/Codex Use Case, *Build responsive front-end designs*  
  https://learn.chatgpt.com/use-cases/frontend-designs
- **[O5]** OpenAI, *GPT‑5 for Coding Cheatsheet*  
  https://cdn.openai.com/API/docs/gpt-5-for-coding-cheatsheet.pdf
- **[O6]** OpenAI, *Introducing GPT‑5 for developers*  
  https://openai.com/index/introducing-gpt-5-for-developers/

### 독립 벤치마크·기업·학술 연구

- **[E1]** Apple Machine Learning Research, *Improving User Interface Generation Models from Designer Feedback*  
  https://machinelearning.apple.com/research/designer-feedback
- **[E2]** Si et al., *Design2Code: Benchmarking Multimodal Code Generation for Automated Front-End Engineering*  
  https://arxiv.org/abs/2403.03163
- **[E3]** Zhu et al., *FrontendBench*  
  https://arxiv.org/abs/2506.13832
- **[E4]** Liu et al., *WebCoderBench*  
  https://arxiv.org/abs/2601.02430
- **[E5]** *WebUIBench: A Comprehensive Benchmark for Evaluating MLLMs in WebUI-to-Code*  
  https://aclanthology.org/2025.findings-acl.815/
- **[E6]** Yoon et al., *A11YN: Aligning LLMs for Accessible Web UI Code Generation*  
  https://arxiv.org/abs/2510.13914
- **[E7]** Calò et al., *Measuring the Semantic Accessibility Gap in LLM-Generated Web UIs*  
  https://iris.polito.it/handle/11583/3008330
- **[E8]** ACM ASSETS, *Can Generative AI Create Accessible Websites?*  
  https://doi.org/10.1145/3663547.3759755
- **[E9]** Sawicki et al., *Qualitative Evaluation of LLM-Designed GUI*  
  https://arxiv.org/abs/2601.22759
- **[E10]** Li et al., *Vibe Coding for UX Design*  
  https://arxiv.org/abs/2509.10652
- **[E11]** Fawzy et al., *From Prompting to Verification: How Experience Shapes Vibe Coding Practices*  
  https://arxiv.org/abs/2605.24521
- **[E12]** Sarkar et al., *Vibe coding: programming through conversation with artificial intelligence*  
  https://arxiv.org/abs/2506.23253
- **[E13]** Chu et al., *Do Novices Struggle with AI Web Design? An Eye-Tracking Study*  
  https://www.mdpi.com/2414-4088/9/9/85
- **[E14]** Design Arena, *Leaderboards and methodology*  
  https://www.designarena.ai/leaderboard
- **[E15]** Design Arena, *How OpenAI’s Sol Finally Learned Design Taste*  
  https://notes.designarena.ai/how-openais-sol-finally-learned-design-taste/
- **[E16]** Sitegeist, 100 동일 브리프 × 3모델 결과 탐색기  
  https://sitegeist.kian.im/
- **[E17]** Sitegeist 작성자의 방법·결과·커뮤니티 검토 스레드  
  https://www.reddit.com/r/ClaudeAI/comments/1uyb1i9/i_gave_gpt56_sol_claude_opus_48_and_grok_45_the/
- **[E18]** *ArtifactsBench: Bridging the Visual-Interactive Gap*  
  https://artifactsbenchmark.github.io/
- **[E19]** *DesignCoder: Hierarchy-aware and self-correcting UI code generation*  
  https://www.sciencedirect.com/science/article/pii/S095058492600203X
- **[E20]** *DesignBench: A Comprehensive Benchmark for MLLM-based Front-end Code Generation*  
  https://arxiv.org/abs/2506.06251

### 표준·실무 원칙

- **[S1]** W3C, *WCAG 2.2*  
  https://www.w3.org/TR/WCAG22/
- **[S2]** W3C, *Understanding Animation from Interactions*  
  https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
- **[S3]** W3C, *Understanding Pause, Stop, Hide*  
  https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide
- **[S4]** W3C, *Target Size (Enhanced): 44×44 CSS px*  
  https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced
- **[S5]** W3C, *Contrast (Minimum)*  
  https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum
- **[S6]** W3C, *Focus Appearance*  
  https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance
- **[S7]** W3C, *Name, Role, Value*  
  https://www.w3.org/WAI/WCAG22/Understanding/name-role-value
- **[S8]** web.dev, *Learn Responsive Design*  
  https://web.dev/learn/design/intro
- **[S9]** GOV.UK Service Standard, *Understand users and their needs*  
  https://www.gov.uk/service-manual/service-standard/point-1-understand-user-needs
- **[S10]** GOV.UK Service Manual, *Learning about users and their needs*  
  https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs
- **[N1]** Nielsen Norman Group, *Visual Design Principles*  
  https://media.nngroup.com/media/articles/attachments/Principles_Visual_Design-Letter.pdf

### 커뮤니티·현장 관찰 — 성능 증명이 아닌 증상 교차 확인용

- **[U1]** Reddit r/vibecoding, *Why do all AI-generated websites look exactly the same?*  
  https://www.reddit.com/r/vibecoding/comments/1ta6r5y/why_do_all_aigenerated_websites_look_exactly_the/
- **[U2]** Hacker News, *Using LLMs for Better Design in Front End Development?*  
  https://news.ycombinator.com/item?id=42439456
- **[U3]** Hacker News, *Best practices for building front ends with AI assistance?*  
  https://news.ycombinator.com/item?id=44214154
- **[U4]** Reddit r/ChatGPT, *5.6 Sol Ultra High for webdesign sucks*  
  https://www.reddit.com/r/ChatGPT/comments/1ute6qk/56_sol_ultra_high_for_webdesign_sucks/
- **[U5]** Reddit r/codex, frontend skill을 추가해 결과가 개선됐다는 사례  
  https://www.reddit.com/r/codex/comments/1uuvt8x/everyone_should_try_this/
- **[U6]** Reddit r/OpenAI, GPT‑5.6 실제 사용의 긍정·부정 혼합 보고  
  https://www.reddit.com/r/OpenAI/comments/1ushmno/what_are_you_actually_building_with_gpt56_honest/
- **[U7]** Reddit r/ClaudeCode, GPT‑5.6 frontend에 대한 100+ 댓글의 엇갈린 반응  
  https://www.reddit.com/r/ClaudeCode/comments/1uqitgg/56_finally_good_at_frontend/
- **[U8]** Reddit r/UI_Design, AI처럼 보이는 UI의 구체 증상 토론  
  https://www.reddit.com/r/UI_Design/comments/1uchh8o/how_can_you_tell_a_design_is_ai/
- **[U9]** Reddit r/UI_Design, rounded card·generic icon 반복에 대한 AI fatigue 토론  
  https://www.reddit.com/r/UI_Design/comments/1tvb91q/ai_fatigue_from_seeing_same_designs/
- **[U10]** Reddit r/Frontend, frontend가 AI 위임에서 어려운 이유 토론  
  https://www.reddit.com/r/Frontend/comments/1tl5o0j/is_frontend_the_biggest_victim_of_ai_or_it_is/

## 조사 한계

- GPT‑5.6은 2026년 7월 공개 직후라 장기간·독립·동료심사를 거친 전용 UX 연구가 아직 적다.
- OpenAI와 파트너사의 수치는 제품 발표 맥락이며, 원본 7개 task와 전체 rubric·평가자 일치도는 공개 페이지에서 충분히 재현할 수 없다.
- Design Arena와 Sitegeist는 공개 결과를 대량 비교할 수 있다는 장점이 있지만, 실제 SMYC 코드베이스·사용자·CMS 데이터·한국어 콘텐츠를 평가한 것은 아니다.
- Apple 연구의 GPT‑5 베이스라인 결과와 접근성 연구의 수치를 GPT‑5.6에 직접 대입하지 않았다.
- 커뮤니티 글은 정성적 증상 탐색에만 사용했으며, 단독으로 “모델 성능”을 확정하지 않았다.

## 2차 검수 기록

- `2026-07-19 KST`: GPT‑5.6을 무조건 낮게 평가하는 가설과, “GPT‑5.6이 이미 문제를 해결했다”는 반대 가설을 각각 재검색했다.
- 반대 근거로 OpenAI 공식 4.4/5 파트너 평가, Design Arena 상위 결과, Sitegeist의 상대 선호를 포함했다.
- 부정 근거는 GPT‑5.6의 confetti 26.5%, 이미지 반복, Sitegeist의 lime/yellow/gradient 지문처럼 직접 관찰 가능한 항목으로 제한했다.
- 접근성·UX 연구는 “일반 LLM 생성 UI”와 “GPT‑5.6 직접 증거”를 분리 표기했다.
- 5안 체크리스트 28개 항목 모두 최소 1개 근거 ID와 연결했다. 프로젝트 내부의 미성년 단원 공개 원칙만 프로젝트 지침을 직접 근거로 사용했다.
