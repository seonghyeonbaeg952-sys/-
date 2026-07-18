# 서울모테트청소년합창단 디자인 콘셉트 5안

- 작성일: 2026-07-18
- 근거: [`websites-a.md`](./websites-a.md)의 실제 사이트 100개, `docs/motion-system.md`, `docs/home-book-motion-system.md`, `src/styles/globals.css`, `src/pages/public/HomePage.tsx`, `src/components/home/HomeHeroSlideshow.tsx` 및 홈 하위 컴포넌트
- 목적: Figma에서 비교 가능한 1440px 데스크톱 홈과 390px 모바일 홈 샘플 5개를 만들 수 있을 정도로 구체적인 방향 제시
- 공통 원칙: 청소년 단원의 개인 얼굴을 중심으로 홍보하지 않는다. 악보, 손, 발성·지휘 디테일, 빈 무대, 좌석, 조명, 공연 포스터, 프로그램 북, 건축, 그룹의 뒷모습·실루엣, 익명화된 활동 기록을 우선한다.

## 현재 구현에서 확인한 기반과 주의점

### 재사용 가능한 자산

- 색 토큰: `#071526` Midnight Navy, `#10233F` Deep Navy, `#C9A45C` Warm Gold, `#8A6728` Gold Ink, `#E7D5A3` Gold Soft, `#FAF7F0` Ivory, `#FFFDF8` Warm White
- 레이아웃: 콘텐츠 최대 폭 1280px, 데스크톱 섹션 상하 96px, 모바일 56~64px, 홈 히어로 100svh
- 히어로: 760ms opacity crossfade와 약한 scale, 첫 이미지만 eager, 다음 이미지는 idle preload, 자동재생 일시정지·이전·다음·dots, hover/focus 중 정지, Save Data·문서 비활성·reduced motion 대응
- 진입 모션: `fade-up`, `fade-in`, `scale-in`, `clip-up`, `card-rise`, `line-draw`, `soft-scale`
- 홈 고유 모션: SMYC 영문 워드마크 intro, 오선 진행 rail, KineticHeadline, scorebook, spirit page slide, archive stack, sponsor marquee, support letter fold
- 접근성 기반: Hero와 scorebook의 44px 조작 영역, 키보드 방향키·Home·End, `aria-live`, reduced-motion 정지, 모바일 normal scroll
- 현재 데이터 흐름: Hero → 빠른 길 3개 → 소개 → 입단 → 공연/공지 → Motet Score → 합창단 정신 → 기록 → 후원사 → 후원

### 디자인 전에 정리할 충돌

1. `docs/typography-system.md`는 **한국어 전체를 Pretendard 산세리프로 유지**하고 영문 장식에만 Cormorant Garamond를 쓰도록 정한다. 그러나 현재 `globals.css` 상단은 `AritaBuri`를 로컬로 불러 `--font-heading-kr`에 할당한다. 5개 콘셉트는 문서화된 원칙을 기준으로 한국어는 Pretendard를 사용한다. AritaBuri를 채택하려면 먼저 타이포 문서와 실제 CSS의 결정을 하나로 맞춰야 한다.
2. `home-book-motion-system.md`는 스크롤을 가두지 않는다고 명시하지만, 현재 `ScrollScoreBookReveal`은 데스크톱 wheel을 가로채 약 1.8초 동안 위치를 고정한다. 5개 안 모두 **스크롤 잠금 없이** 수동 버튼 또는 passive scroll progress로 scorebook을 재사용한다.
3. Warm Gold `#C9A45C`는 Navy 위에서는 충분히 선명하지만 밝은 Ivory 위 작은 글자로는 대비가 부족하다. 밝은 화면의 본문·라벨은 Gold Ink `#8A6728`을 사용하고 Warm Gold는 선, 큰 숫자, 아이콘, 선택 배경에 제한한다.
4. 홈에는 여러 세대의 CSS 정의가 누적돼 있다. 실제 구현 단계에서는 콘셉트별 새 예외 규칙을 계속 추가하기보다 역할 기반 토큰과 한 개의 최종 홈 레이어로 정리해야 한다.

## 5안 한눈에 비교

| 안 | 주된 분위기 | 가장 중요한 사용자 | 첫 화면의 목적 | 콘텐츠 밀도 | 대표 모션 | 핵심 CTA |
|---|---|---|---|---|---|---|
| A. 무대의 첫 숨 | 어둡고 영화적인 공연장 | 공연 관람객·처음 온 방문자 | 곧 열릴 무대를 즉시 이해 | 낮음 | 느린 Hero crossfade, spotlight breathe | `다가오는 무대 보기` |
| B. 살아 있는 프로그램 북 | 밝고 지적인 문화 에디토리얼 | 합창단 철학·역사를 알고 싶은 보호자·후원자 | 정체성과 신뢰를 읽게 함 | 중간 | line-draw, 페이지 전환 | `합창단 이야기를 펼쳐보기` |
| C. 다음 세대 아카데미 | 밝고 활기찬 교육 플랫폼 | 입단 희망 학생·보호자 | 대상·일정·절차를 빠르게 판단 | 중간~높음 | 탭 indicator, card-rise, 단계선 | `입단 대상과 절차 확인` |
| D. 목소리의 아카이브 | 절제된 미술관·기록관 | 기존 관객·동문·연구형 방문자 | 35년 기록을 탐색 | 중간 | archive stack, soft-scale, View Transition | `35년의 기록 탐색` |
| E. 하나의 호흡 | 따뜻한 공동체·공익 서사 | 후원자·지역사회·학교 파트너 | 가치가 실제 활동으로 이어짐을 증명 | 중간 | staff progress, network pulse, letter fold | `함께하는 방법 보기` |

---

## A. 무대의 첫 숨 — First Breath on Stage

### 리서치 근거

- Tenebrae Choir의 어둠·골드 절제
- Metropolitan Opera의 공연 중심 전환
- Bang & Olufsen의 소리·공간·재료 클로즈업
- Rolex의 느린 장인 서사
- Berliner Philharmoniker의 “시즌 이야기 → 가까운 공연” 구조

### 핵심 사용자 목표

처음 방문한 사용자가 10초 안에 “어떤 합창단인가, 다음 공연은 언제인가, 관람하거나 참여하려면 어디를 눌러야 하는가”를 이해한다. 감성은 강하지만 티켓·공연·입단 행동을 늦추지 않는다.

### 팔레트

| 역할 | HEX | 사용 |
|---|---|---|
| Stage Black | `#050E18` | Hero·후원 finale의 가장 어두운 배경 |
| Midnight Navy | `#071526` | 기본 어두운 표면 |
| Deep Navy | `#10233F` | 카드·오버레이·섹션 전환 |
| Warm Gold | `#C9A45C` | 빛, 큰 날짜, active, focus |
| Gold Soft | `#E7D5A3` | Navy 위 보조 라벨 |
| Warm White | `#FFFDF8` | 어두운 배경의 주요 텍스트 |
| Smoke Blue | `#9BAABD` | 어두운 배경의 보조 텍스트 |

`#FFFDF8`/`#071526`과 `#C9A45C`/`#071526` 조합을 주요 대비로 사용한다. Gold는 밝은 배경 본문에 사용하지 않는다.

### 타이포그래피

- Hero 영문: Cormorant Garamond 600, 112/0.86, `SEOUL / MOTET / YOUTH / CHOIR`
- Hero 한국어 설명: Pretendard 450, 18/1.75, 최대 34자
- 섹션 제목: Pretendard 760, 56/1.08
- 공연 날짜: Pretendard 820 tabular, 72/0.95
- UI·버튼: Pretendard 760, 15/1
- 영문 장식은 Cormorant, 실제 정보와 한국어 제목은 Pretendard로 분리한다.

### 데스크톱 1440 홈 구성

1. **100svh Cinematic Hero**
   - 전체 배경은 빈 무대·지휘자의 손·악보대·공연장 조명 중 한 장면. 얼굴 중심 단체 사진은 사용하지 않는다.
   - 1280px 그리드에서 왼쪽 5열에 영문 워드마크, 한국어 한 문장, CTA 2개. 오른쪽은 의도적으로 비워 조명과 공간이 보이게 한다.
   - 하단 128px “NEXT STAGE” dock에 큰 날짜, 공연명, 장소, 상태, `공연 상세`를 한 줄로 제공한다.
2. **Three Ways**
   - 현재 `FloatingInfoCards`를 3개의 떠 있는 카드가 아니라 얇은 투명 유리 panel로 재해석한다.
   - `공연 보기 / 입단 알아보기 / 후원·문의` 세 경로만 제공한다.
3. **The Work Behind the Voice**
   - 5:7 split. 왼쪽에는 발성·악보·파트·앙상블 4단계, 오른쪽에는 악보/손/공간 디테일 영상 또는 정지 이미지.
4. **Performance Program**
   - 현재 `PerformanceNewsPreview`의 concert template을 크게, 공지는 오른쪽 4열의 program note로 유지한다.
   - 포스터는 `contain`, 날짜와 장소는 이미지 밖에 둔다.
5. **Spirit in One Breath**
   - `HomeSpiritScoreBook` 전체를 3D 책처럼 보이지 않게 하고 어두운 2면 무대 패널로 변경한다.
   - 한 번에 가치 하나와 실제 활동 근거 하나만 제시한다.
6. **Archive Afterglow**
   - 대표 포스터 1개, 공연장 1개, 악보 1개만 크게 보여주고 전체 기록 CTA로 보낸다.
7. **Finale Support**
   - 현재 `SupportLetterFold`를 유지하되 후원 사용처 3개와 문의 응답 기준을 CTA 옆에 노출한다.

### 모바일 390 재구성

- Hero intro overlay는 표시하지 않는다. 첫 슬라이드 정지 이미지, 제목, 설명, CTA 2개가 100svh 안에서 잘리지 않게 한다.
- Hero dots/재생/화살표는 하단에 44px로 유지하고 이미지 opacity를 낮춰 텍스트를 우선한다.
- “NEXT STAGE” dock은 Hero 아래 독립 카드로 내려 날짜 → 공연명 → 장소 → 버튼 순으로 쌓는다.
- 3개 진입 경로는 세로 목록으로, 카드마다 52px 이상의 전체 행을 터치할 수 있게 한다.
- Spirit는 좌우 페이지가 아닌 한 장씩 표시하고 이전/다음·현재 페이지 텍스트를 함께 둔다.
- Archive stack은 겹치지 않고 세 장을 세로로 나열한다.
- 고정 bottom CTA는 두지 않아 본문과 브라우저 안전 영역을 가리지 않는다.

### 기존 애니메이션 재사용

- `HomeHeroSlideshow`: 현재 760ms crossfade와 약한 scale을 그대로 사용. 최대 3장, 5초 간격, pause/prev/next/dots 유지.
- `HomeHeroIntroOverlay`: 데스크톱 첫 방문 1회에만 사용하고 목표 지속시간은 1.2초 이내. 반복 방문·back navigation에서는 생략한다.
- `spotlight-breathe`, `staff-breathe`: amplitude를 현재 수준(약 4%) 이상 키우지 않는다.
- `fade-up`: Hero 설명과 Performance 제목만 사용한다.
- `line-draw`: 공연 dock과 섹션 전환 오선에 사용한다.
- `SupportLetterFold`: corner open을 유지하되 정보가 먼저 보인 뒤 장식이 움직이게 한다.
- `ScrollScoreBookReveal`의 wheel lock과 12장 flutter는 사용하지 않는다.

### 접근성·성능 주의점

- 영상이 있으면 무음, 8초 이내 loop, 일시정지 버튼, poster fallback을 제공한다.
- 배경 이미지의 핵심 의미는 텍스트로 중복 제공하고 장식 배경은 빈 alt로 처리한다.
- 첫 Hero 이미지만 eager/high priority, 나머지는 현재 idle warmup을 유지한다.
- 3840px 원본을 무조건 전달하지 말고 DPR·viewport에 맞는 변환을 사용한다.
- reduced motion에서는 첫 이미지·모든 정보·정적 오선만 표시한다.
- 어두운 사진 위 텍스트는 위치별 overlay 대비를 실제 이미지마다 검사한다.

### 핵심 CTA

- Primary: **다가오는 무대 보기** → `/concerts`
- Secondary: **입단 안내** → `/join`
- Finale: **청소년의 다음 무대 후원하기** → `/contact?section=support#form`

---

## B. 살아 있는 프로그램 북 — Living Program Book

### 리서치 근거

- Royal Concertgebouw Orchestra의 아이보리·홀 금빛
- Monocle의 네이비/크림 문화 저널
- Aesop의 재료감과 문학적 카피
- King’s College Choir의 전통 기록
- The New York Times·Aeon의 제목/본문/메타 위계

### 핵심 사용자 목표

보호자·후원자·교회·문화 관계자가 합창단의 역사, 교육 철학, 공연 활동을 “홍보 문구”가 아니라 읽을 수 있는 근거와 기록으로 이해하고 신뢰한다.

### 팔레트

| 역할 | HEX | 사용 |
|---|---|---|
| Program Paper | `#F6F0E4` | 주 배경 |
| Warm White | `#FFFDF8` | 카드가 아닌 읽기 표면 |
| Editorial Ink | `#16233A` | 제목·본문 |
| Oxblood | `#6E2D3C` | 연도·중요 공지·링크 |
| Antique Brass | `#A8782B` | 큰 번호·규칙선·장식 |
| Sage Grey | `#8A9487` | 캡션·보조 면 |
| Line | `#D9CFBF` | 규칙선·구분 |

본문은 Editorial Ink, 링크·중요 라벨은 Oxblood를 사용한다. Antique Brass는 Program Paper 위 작은 글자에 쓰지 않고 큰 숫자와 선에만 사용한다.

### 타이포그래피

- 한국어 제목: Pretendard 760, 64/1.12, 자간 -0.045em
- 한국어 본문: Pretendard 420, 17/1.9, 한 줄 34~40자
- 영문 장식·큰 연도: Cormorant Garamond 600, 84/0.9
- 날짜·목차 번호: Pretendard 820 tabular
- 긴 글은 serif로 바꾸지 않고 행간·열 폭·규칙선으로 에디토리얼 품질을 만든다.

### 데스크톱 1440 홈 구성

1. **Editorial Masthead, 72~80vh**
   - 상단은 작은 `SEOUL MOTET YOUTH CHOIR / SINCE 1990`.
   - 12열 중 왼쪽 7열에 “정직한 음악, 다음 세대의 목소리” 2행 제목, 오른쪽 5열에 최신 프로그램 표지 또는 빈 무대 사진을 원본 비율로 둔다.
   - 하단에는 얇은 목차 `01 소개 / 02 교육 / 03 공연 / 04 기록 / 05 참여`.
2. **Director’s Note / About**
   - 왼쪽 4열에 큰 인용문, 오른쪽 7열에 두 단락 소개와 창단 연도·활동 수·정기연습 정보.
   - 현재 `AboutPreview`의 sticky copy는 유지하되 카드 그림자와 큰 둥근 모서리를 제거한다.
3. **The Motet Score**
   - 현재 scorebook을 2면 펼침 프로그램으로 사용한다. 왼쪽은 가치·정의, 오른쪽은 실제 교육 장면의 근거.
   - 책이 자동으로 열리지 않고 `다음 장` 버튼으로 명시적으로 전환한다.
4. **Season Calendar**
   - Elbphilharmonie처럼 날짜 숫자가 큰 3행 일정. 포스터는 작은 보조 이미지.
   - 공지는 우측 margin note로 배치한다.
5. **Archive Essay**
   - 대표 기록 하나를 큰 이미지+캡션+짧은 글로 소개하고 나머지는 연도별 index로 보낸다.
6. **Join Letter**
   - 현재 `JoinCTA`를 지원 대상·연습·절차가 적힌 실제 안내문처럼 디자인한다.
7. **Colophon / Support**
   - 후원, 연락처, 위치, SNS, 저작권을 프로그램 북의 colophon처럼 정돈해 finale로 마감한다.

### 모바일 390 재구성

- 100svh 강제보다 콘텐츠 높이에 맞춘 76~88svh masthead를 사용해 첫 스크롤에서 목차가 보이게 한다.
- 표지는 3:4 비율 `contain`, 제목 아래로 내려 가로 overflow를 막는다.
- 5개 목차는 44px 높이의 horizontal scroll이 아니라 세로 번호 목록으로 제공해 처음부터 전체 구조가 보이게 한다.
- About의 sticky를 해제하고 제목 → 인용 → 본문 → 수치 순으로 쌓는다.
- Scorebook은 2면을 한 번에 축소하지 않고 페이지 한 장씩 표시한다. 화살표, dots, `2 / 5` 텍스트를 모두 둔다.
- 공연 일정은 날짜가 왼쪽 72px 열을 차지하는 세로 list로 만든다.
- 긴 본문은 17px/1.8 이상, 3문단마다 소제목을 넣는다.

### 기존 애니메이션 재사용

- `line-draw`: 목차, 규칙선, 공연 일정 구분선의 주 모션.
- `clip-up`: Masthead의 한국어 2행 제목에 한 번만 사용.
- `HomeSpiritScoreBook`: 현재 키보드·버튼·aria-live 구조를 그대로 재사용하고 시각만 프로그램 북으로 단순화한다.
- `spirit-page-in`: 420ms 오른쪽 이동을 12~16px 수준의 짧은 전환으로 사용한다.
- `ArchivePageStack`: 첫 기록만 `soft-scale`; 나머지는 정적 index.
- `View Transition`: 목차에서 `/spirit`, `/about`, `/concerts`, `/gallery`로 넘어갈 때 얕은 fade.
- Hero autoplay와 intro overlay는 사용하지 않는다.

### 접근성·성능 주의점

- 종이 texture는 CSS 노이즈 또는 매우 작은 반복 자산 하나로 만들고 큰 bitmap을 깔지 않는다.
- Oxblood/Program Paper, Ink/Program Paper처럼 대비가 충분한 조합만 본문에 사용한다.
- 목차 번호만으로 의미를 전달하지 않고 텍스트 라벨을 함께 제공한다.
- 페이지 전환 후 제목으로 포커스를 옮기고 View Transition 미지원 시 일반 SPA 이동으로 fallback한다.
- scorebook은 scroll hijack을 제거하고 모든 페이지 내용을 JS 실패 시에도 순서대로 읽을 수 있는 구조를 유지한다.

### 핵심 CTA

- Primary: **합창단 이야기를 펼쳐보기** → `/spirit`
- Secondary: **공연 일정 보기** → `/concerts`
- Join: **입단 안내문 보기** → `/join`

---

## C. 다음 세대 아카데미 — Next Voice Academy

### 리서치 근거

- Interlochen의 학생·보호자 목적별 진입
- Juilliard의 품격과 젊은 예술 에너지 균형
- Stanford d.school의 질문형 탐색
- Girls Who Code의 대상별 참여 경로
- Guildhall·Berklee의 행동 중심 입학 UX

### 핵심 사용자 목표

입단을 고민하는 학생과 보호자가 각각 자신에게 필요한 정보를 찾고, 모집 대상·연습 일정·음역 확인·보호자 연락·지원 절차를 오해 없이 확인한 뒤 지원한다.

### 팔레트

| 역할 | HEX | 사용 |
|---|---|---|
| Academy Midnight | `#0B2239` | 헤더·핵심 제목·footer |
| Academy Blue | `#2F68A2` | Primary CTA·선택 상태 |
| Air Blue | `#DCEAF5` | 안내 섹션·학생 경로 |
| Apricot | `#D9825B` | 보호자 경로·따뜻한 강조 |
| Learning Cream | `#FFF8EE` | 기본 배경 |
| Ink | `#172230` | 본문 |
| Success Green | `#287A42` | 접수 완료·가능 상태 |

화이트/Academy Blue, Ink/Air Blue, Ink/Apricot 조합은 일반 크기 텍스트에도 충분한 대비를 확보한다. Apricot 배경에는 흰색이 아니라 Ink를 사용한다.

### 타이포그래피

- Hero·질문: Pretendard 820, 64/1.05, 친근하지만 과장되지 않은 큰 산세리프
- 단계 숫자: Cormorant Garamond 600, 72/0.9 또는 Pretendard tabular 820
- 본문·폼·FAQ: Pretendard 430, 16~17/1.75
- 버튼·탭: Pretendard 760, 15/1
- 영문은 `LEARN / REHEARSE / PERFORM / GROW` 같은 짧은 장식에만 사용한다.

### 데스크톱 1440 홈 구성

1. **Question Hero, 82~90vh**
   - 왼쪽 6열: “합창을 처음 시작해도 괜찮을까요?”처럼 실제 사용자의 질문을 큰 제목으로 제시한다.
   - 오른쪽 6열: 개인 얼굴 대신 악보를 함께 보는 손, 원형 대형의 뒷모습, 파트 표식, 빈 연습 의자를 모은 밝은 collage.
   - CTA는 `학생으로 알아보기`, `보호자로 알아보기` 두 개이며 둘 다 같은 위계다.
2. **Audience Switch**
   - 현재 `AnimatedSectionTabs` 패턴을 이용해 학생/보호자/학교·교회 3경로를 전환한다.
   - 각 탭에서 핵심 질문 3개와 다음 행동 하나만 보인다.
3. **입단 한눈에 보기**
   - `대상 / 연습 / 확인 / 지원 / 연락`의 5단계 가로 timeline.
   - 각 단계에 “필요한 것”과 “다음에 일어나는 일”을 짧게 쓴다.
4. **A Week in Choir**
   - 발성 → 파트 연습 → 앙상블 → 무대 준비를 4개 장면으로 보여준다.
   - 단원 사진보다 악보 표시, 호흡 자세의 실루엣, 지휘 beat, 무대 동선 도식을 활용한다.
5. **Next Stage as Proof**
   - 공연 하나를 교육 결과의 증거로 제시한다. 날짜·장소·곡목·관람 CTA를 명확히 둔다.
6. **성장과 안전**
   - 교육 원칙, 보호자 연락, 사진 공개 원칙, 개인정보·안전 안내를 2열 FAQ로 제공한다.
7. **Application Letter**
   - 현재 `JoinCTA`를 페이지 전반의 결론으로 사용한다. CTA 옆에 `약 3분 / 제출 후 보호자 연락 / 수정 가능` 같은 예상 정보를 둔다.

### 모바일 390 재구성

- Hero는 질문 2행 → 짧은 답 → 학생/보호자 2버튼 → collage 순으로 배치한다.
- 학생/보호자 탭은 한 줄에 2개, 각 48px 이상. 학교·교회 경로는 아래의 텍스트 링크로 둔다.
- 5단계 timeline은 가로 스와이프가 아니라 세로 ordered list로 바꿔 단계가 누락되지 않게 한다.
- “A Week in Choir”는 각 장면을 작은 카드로 만들지 않고 full-width 이미지+2행 설명으로 쌓는다.
- 지원 CTA는 스크롤 말미에 큰 버튼으로 제공한다. 고정할 경우 `env(safe-area-inset-bottom)`을 반영하고 높이 64px 이하, 닫기/축소 가능, 폼에 도달하면 숨긴다.
- 긴 FAQ는 native `details/summary` 또는 기존 accessible accordion 패턴을 사용한다.

### 기존 애니메이션 재사용

- `AnimatedSectionTabs`의 transform/width/opacity indicator와 키보드 방향키를 학생/보호자 전환에 재사용한다.
- `card-rise`는 경로 카드 3개에만 사용하고 과정 본문에는 사용하지 않는다.
- `line-draw`는 5단계 timeline의 진행선으로 사용한다.
- `KineticHeadline`은 Hero 질문의 두 번째 행만 짧게 이동시킨다.
- `HomeHeroSlideshow`는 사용하지 않거나 수동 2장으로 제한한다. 자동재생보다 정보 안정성이 중요하다.
- `JoinCTA`는 현재 outline·버튼·요약 dl 구조를 유지하되 카드 그림자를 줄인다.
- Scorebook·archive flutter·intro overlay는 이 안에서 사용하지 않는다.

### 접근성·성능 주의점

- 학생/보호자 탭의 선택은 색뿐 아니라 체크, 굵기, `aria-selected`로 표시한다.
- “지원 가능/불가”를 색만으로 구분하지 않고 이유와 다음 선택지를 문장으로 제공한다.
- 폼 이동 전 지원 요건을 다시 읽을 수 있고 뒤로가기로 입력이 사라지지 않게 한다.
- 밝은 collage 이미지는 4개 이하, responsive `srcset`, lazy load를 사용한다.
- 청소년 사진은 명시적 공개 설정이 있는 자료만 사용하고, 기본 샘플은 식별 불가능한 디테일 이미지로 만든다.
- reduced motion에서는 timeline이 처음부터 완성된 선과 숫자로 보인다.

### 핵심 CTA

- Primary: **입단 대상과 절차 확인** → `/join`
- Secondary: **보호자 안내 보기** → `/join`
- Form: **입단지원서 작성하기** → `/join?section=contact#application`

---

## D. 목소리의 아카이브 — Archive of Voices

### 리서치 근거

- Rijksmuseum의 작품 우선 컬렉션
- Opéra national de Paris의 포스터형 아카이브
- MoMA의 무채색 기관 프레임
- Louisiana Museum의 조용한 문화 저널
- The Creative Independent의 읽기 좋은 인터뷰·가이드

### 핵심 사용자 목표

기존 관객, 동문, 보호자, 문화 관계자가 합창단의 35년 활동을 연도·공연·매체로 탐색하고, 지금의 공연과 교육이 과거의 기록에서 어떻게 이어지는지 이해한다.

### 팔레트

| 역할 | HEX | 사용 |
|---|---|---|
| Archive Ink | `#111820` | 헤더·본문·어두운 표면 |
| Museum Paper | `#F4F1E8` | 주 배경 |
| Gallery White | `#FFFFFF` | 이미지 주변 여백 |
| Archive Burgundy | `#732E3A` | 연도·중요 링크·active |
| Ultramarine | `#345B8C` | 영상·디지털 기록 라벨 |
| Aged Ochre | `#B58432` | 큰 번호·장식선 |
| Mount Grey | `#D8D5CC` | 이미지 frame·divider |

Museum Paper 위 본문은 Archive Ink, 링크는 Archive Burgundy를 사용한다. Aged Ochre는 대비가 낮으므로 작은 텍스트가 아니라 선·큰 연도·아이콘에 한정한다.

### 타이포그래피

- Hero 기록명: Pretendard 780, 72/1.02
- 큰 연도: Cormorant Garamond 600, 120/0.82
- 작품/공연 제목: Pretendard 720, 28/1.2
- 메타·필터: Pretendard 700, 13/1, tabular 숫자
- 캡션: Pretendard 430, 14/1.6
- 긴 해설: Pretendard 420, 17/1.85

### 데스크톱 1440 홈 구성

1. **Artifact Hero, 88vh**
   - 왼쪽 5열에 `1990—2026`, 제목, 한 문장, CTA.
   - 오른쪽 7열에는 오래된 프로그램 북, 악보, 공연 포스터, 홀 사진 중 하나를 큰 “소장품”처럼 `contain`으로 전시한다.
   - 하단 캡션에 연도·공연·자료 유형·출처를 제공한다.
2. **Collection Filter**
   - `전체 / 공연 / 포스터 / 악보 / 영상 / 교육` 필터와 연도 범위를 제공한다.
   - 홈에서는 대표 6개만 보이고 전체 검색은 `/gallery`로 연결한다.
3. **Timeline Wall**
   - 12열 masonry가 아니라 3개의 크기 규칙만 가진 정돈된 grid.
   - 개인 얼굴 사진보다 포스터·공간·악보·그룹 원경을 우선한다.
4. **One Story, Deeply**
   - 한 공연 또는 교육 프로젝트를 큰 이미지, 3문단 글, 짧은 인용, 관련 자료 3개로 깊게 소개한다.
5. **Then / Now**
   - 과거 기록 1개와 다가오는 공연 1개를 좌우로 비교해 유산이 현재로 이어짐을 보여준다.
6. **Current Program**
   - 다음 공연 3개를 날짜 중심 행으로 제공해 아카이브가 과거에만 머물지 않게 한다.
7. **Contribute / Support**
   - 자료 제보·동문 연락·후원을 서로 다른 CTA로 구분한다.

### 모바일 390 재구성

- Hero 자료는 `contain` 3:4 또는 실제 비율로 보여주고 배경 cover로 잘라 쓰지 않는다.
- 캡션은 이미지 바로 아래에 연도·유형·제목이 항상 보이게 한다.
- 필터는 44px horizontal scroll이 가능하되 첫 항목 앞·끝 항목 뒤 여백과 선택 텍스트를 제공한다.
- Timeline Wall은 1열 목록으로 바꾸고 이미지 비율을 유지한다. 첫 6개 이후 `더 보기`로 점진 노출한다.
- Then/Now는 위아래로 쌓고 중간에 시각적 화살표와 “이어지는 가치” 한 문장을 둔다.
- Archive stack의 겹침·회전·hover 펼침은 제거한다.

### 기존 애니메이션 재사용

- `ArchivePageStack`: 데스크톱의 대표 자료 3개에만 적용하고, 키보드 focus에서도 같은 상태를 제공한다.
- `soft-scale`: 자료 상세로 들어가기 전 이미지 1.01 이하의 약한 확대.
- `archive-card-in`: 620ms stagger를 3개까지만 사용한다.
- `AnimatedSectionTabs`: 기록 유형 필터에 사용하고 모바일 horizontal scroll을 유지한다.
- `TransitionLink`의 View Transition: 홈 소장품 이미지와 `/gallery` 상세 첫 이미지 사이 shared fade/scale에 사용한다.
- `line-draw`: 연도 timeline의 세로선.
- Hero intro, 자동 슬라이드, sponsor marquee, scorebook flutter는 사용하지 않는다.

### 접근성·성능 주의점

- 이미지마다 실제 의미를 설명하는 alt와 보이는 캡션을 제공한다. 장식용 스캔 texture만 빈 alt로 둔다.
- 포스터의 텍스트를 이미지 안에만 두지 않고 제목·날짜·장소를 HTML로 반복한다.
- 한 번에 6개 썸네일만 로드하고 아래 기록은 lazy load한다.
- 오래된 큰 스캔은 WebP/AVIF 파생본과 원본 다운로드를 분리한다.
- 필터 변경 시 결과 수를 `aria-live`로 안내하고 포커스를 갑자기 이동시키지 않는다.
- 개인 식별이 가능한 청소년 사진은 `is_visible` 외에 공개 동의 상태 확인이 필요하다. 샘플은 비식별 자료만 사용한다.

### 핵심 CTA

- Primary: **35년의 기록 탐색** → `/gallery`
- Secondary: **다가오는 공연 보기** → `/concerts`
- Community: **기록을 함께 잇기** → `/contact`

---

## E. 하나의 호흡 — One Breath, One Community

### 리서치 근거

- Chineke! Orchestra의 미션과 공연의 동등한 위계
- IDEO.org의 가치→프로젝트→결과 연결
- charity: water의 감정 CTA 바로 뒤 투명성 제시
- Teach For All의 지역 네트워크 시각화
- The Ocean Cleanup의 문제→과정→성과 서사

### 핵심 사용자 목표

후원자, 학교·교회, 지역사회 파트너가 “함께 부르는 공동체”라는 가치를 구호가 아니라 교육 과정·공연·참여·성과로 확인하고, 자신이 참여할 수 있는 구체적 방법을 찾는다.

### 팔레트

| 역할 | HEX | 사용 |
|---|---|---|
| Community Deep | `#082433` | Hero·footer·강한 섹션 |
| Ensemble Teal | `#2C706C` | Primary CTA·네트워크·active |
| Breath Mint | `#D9E9E4` | 교육·공동체 밝은 면 |
| Clay | `#A9533C` | 사람의 온도·중요 이야기 |
| Warm Gold | `#C8A75F` | 오선·빛·후원 accent |
| Community White | `#FCFAF4` | 배경·어두운 면 텍스트 |
| Ink | `#16262E` | 밝은 면 본문 |

화이트/Teal, White/Clay, Ink/Mint, Gold/Community Deep 조합을 사용한다. 다섯 색을 한 화면에 모두 쓰지 않고 섹션마다 Deep+Teal 또는 Mint+Clay처럼 두 축만 노출한다.

### 타이포그래피

- Manifesto: Pretendard 760, 68/1.08
- 관계·역할 라벨: Pretendard 750, 15/1.3
- Impact 숫자: Pretendard 820 tabular, 76/0.95
- 본문: Pretendard 430, 17/1.8
- 영문 장식: Cormorant Garamond 600, `ONE BREATH / MANY VOICES`
- 목소리 다양성은 글꼴을 여러 개 섞지 않고 크기·위치·색·리듬으로 표현한다.

### 데스크톱 1440 홈 구성

1. **Manifesto Hero, 90~100vh**
   - 중앙 정렬이 아니라 왼쪽 7열의 “한 사람의 목소리가 공동체의 화음이 됩니다” 문장과 오른쪽 5열의 추상 voice field를 배치한다.
   - voice field는 개인 사진 대신 4개 파트의 점·선·오선이 한 중심으로 모이는 CSS/SVG 도식이다.
   - CTA 아래에 `단원 / 보호자 / 학교·교회 / 후원자` 4개의 작은 경로를 둔다.
2. **How Harmony Is Made**
   - `듣기 → 준비하기 → 맞추기 → 나누기` 4단계를 가로 흐름으로 보여준다.
   - 각 단계 아래 실제 활동 한 문장과 관련 링크를 둔다.
3. **Values with Evidence**
   - `지성 / 인성 / 영성` 세 가치를 큰 카드가 아니라 세로 editorial band로 구성한다.
   - 각 가치에는 프로그램 사례, 결과, 관련 공연 또는 콘텐츠 하나를 연결한다.
4. **Impact Without Hype**
   - 창단 연도, 공연·교육 활동, 정기 연습, 파트 구성을 큰 수치로 표시하되 카운트업하지 않는다.
   - 수치 산출 근거와 업데이트 날짜를 함께 둔다.
5. **Voices Around the Stage**
   - 단원 이름 공개가 허용된 경우에도 사진 대신 파트·그룹·활동 상태 중심으로 표현한다.
   - 합창단, 보호자, 지도진, 학교·교회, 후원자 관계를 접근 가능한 목록+시각 네트워크로 제공한다.
6. **Next Shared Moment**
   - 다음 공연·입단·후원 세 행동을 같은 구조의 3열 panel로 제공하되 각 목적의 색과 동사를 다르게 한다.
7. **Transparency Letter**
   - 현재 `SupportLetterFold` 안에 후원 사용처, 결과 공유 방식, 문의 연락, 개인정보 안내를 모두 포함한다.
8. **Partners in Rhythm**
   - 후원사 4개 이하는 정적 grid, 5개 이상에서만 느린 marquee. 파트너 유형도 텍스트로 표시한다.

### 모바일 390 재구성

- 추상 voice field는 220px 높이로 축소하고 정지 상태에서도 4개 파트와 “하나의 화음” 관계가 읽히게 한다.
- 4개 사용자 경로는 2×2 버튼, 각 48px 이상으로 제공한다.
- 4단계 과정은 세로로 이어지는 선과 번호로 표시한다.
- 지성·인성·영성은 한 번에 한 개만 보이는 캐러셀이 아니라 세 개 모두 순서대로 읽히는 band로 쌓는다.
- Impact 수치는 2열 grid로 두되 설명이 긴 항목은 전체 폭을 사용한다.
- 네트워크 도식은 숨기지 않고 동일 내용을 의미 있는 `<ul>` 목록으로 먼저 제공한다.
- 다음 행동 3개는 `공연 / 입단 / 후원` 순서로 세로 배치한다.

### 기존 애니메이션 재사용

- `StaffFlowRail`: 페이지 진행 표시를 넘어 네 개 파트가 한 선으로 합쳐지는 motif로 재해석한다. 장식 자체는 `aria-hidden`.
- `KineticHeadline`: Manifesto 두 행 중 한 행만 수평 진입.
- `line-draw`: 듣기→준비→맞추기→나누기 관계선을 그린다.
- `fade-in`: 수치의 설명과 근거에만 사용하고 숫자 자체는 카운트업하지 않는다.
- `HomeSpiritScoreBook`: 지성·인성·영성의 내용 모델은 재사용하되 캐러셀 대신 데스크톱 3열/모바일 세로 band로 정적 표시한다.
- `SponsorQuietMarquee`: 현재 5개 이상 조건과 pause/reduced-motion fallback을 그대로 유지한다.
- `SupportLetterFold`: 현재 구조를 가장 적극적으로 재사용한다.
- Hero slideshow·intro overlay·scorebook flutter는 사용하지 않는다.

### 접근성·성능 주의점

- 네트워크와 파트 관계를 색과 위치만으로 표현하지 않고 텍스트 목록·범례를 제공한다.
- SVG node는 포커스 대상이 아닌 장식으로 두고 실제 링크는 HTML 버튼/목록으로 제공한다.
- Impact 수치에는 단위·기간·업데이트 날짜·산출 근거를 붙인다.
- 애니메이션 점은 최대 8개, CSS transform/opacity만 사용하고 Canvas/WebGL·새 animation dependency를 추가하지 않는다.
- 후원 CTA는 목적·사용처·취소/문의 방법을 버튼 가까이에 제공한다.
- reduced motion에서는 관계선이 완성된 정적 그림으로 즉시 보인다.

### 핵심 CTA

- Primary: **함께하는 방법 보기** → 홈의 참여 경로 section
- Secondary: **청소년의 다음 무대 후원하기** → `/contact?section=support#form`
- Other: **입단 안내** → `/join`

---

## Figma 샘플 제작 공통 규격

각 콘셉트마다 최소 2개 프레임을 만든다.

### Desktop / 1440

- Frame: `1440 × 최소 4200`, 실제 홈 전체 흐름이 보이도록 길게 구성
- Content: 최대 1280px, 좌우 80px
- Grid: 12 columns, gutter 24px
- Section rhythm: 핵심 section 96~128px, 보조 section 64~80px
- Header: 실제 public header 높이와 스크롤 상태를 함께 표시
- 상태 예시: Hero 1개, 다음 공연 데이터 있음, 공지 3개, archive 3개, sponsor 6개
- 주석: 각 motion 시작 조건·지속시간·reduced-motion 결과를 prototype note에 기록

### Mobile / 390

- Frame: `390 × 최소 5200`, safe-area 포함
- Side padding: 20px
- Grid: 4 columns, gutter 12px
- 모든 터치 대상: 최소 44×44px, 주요 CTA 높이 48~52px
- Hero는 긴 한국어 제목, 한 장 이미지 실패, 슬라이드 1개/3개 두 상태를 견뎌야 한다.
- 카드와 패널에 고정 높이를 주지 않는다.
- 포스터·프로그램·기록 이미지는 `contain`과 원본 비율을 기본으로 한다.
- hover로만 나타나는 텍스트를 만들지 않는다.

### 반드시 포함할 상태

- `prefers-reduced-motion`: intro 없음, autoplay 없음, marquee 정적, 정보 즉시 표시
- Hero 이미지 없음 또는 로드 실패
- 다가오는 공연 없음
- 공지/갤러리/후원사 empty state
- 긴 한국어 공연명과 긴 장소명
- 키보드 focus-visible과 active 상태
- 로딩 skeleton, 데이터 오류+재시도
- 200% 브라우저 확대에서 제목·CTA 겹침 없음

## 5안 평가 기준

| 기준 | A 무대 | B 프로그램 북 | C 아카데미 | D 아카이브 | E 공동체 |
|---|---:|---:|---:|---:|---:|
| 첫인상·감성 | 5 | 4 | 4 | 4 | 4 |
| 공연 전환 | 5 | 4 | 3 | 4 | 3 |
| 합창단 정체성 | 4 | 5 | 4 | 5 | 5 |
| 입단 UX | 3 | 3 | 5 | 2 | 4 |
| 후원 설득 | 4 | 4 | 3 | 3 | 5 |
| 기존 컴포넌트 재사용 | 5 | 5 | 4 | 4 | 5 |
| 청소년 사진 비의존 | 4 | 5 | 5 | 5 | 5 |
| 모바일 단순성 | 4 | 4 | 5 | 5 | 4 |
| 구현 위험 | 중간 | 낮음 | 낮음 | 낮음 | 중간 |

## 추천 조합

한 안을 그대로 채택하기보다, 브랜드 홈의 기본 방향은 **B 살아 있는 프로그램 북**으로 잡고 다음 요소를 결합하는 편이 가장 안정적이다.

- A에서: 첫 화면의 무대감과 “다음 공연” dock
- B에서: 아이보리 에디토리얼 구조, scorebook, 역사·정신의 읽기 경험
- C에서: 학생/보호자 경로와 입단 단계
- D에서: 포스터 비율을 보존하는 archive와 필터
- E에서: 가치→실제 활동→후원 투명성 연결

이 조합은 현재 Deep Navy/Warm Gold/Ivory 자산을 버리지 않으면서도 카드·그림자·장식의 양을 줄이고, 기존 애니메이션을 방향 안내에만 남겨 더 새롭고 세련된 인상을 만든다.

## 구현 전 의사결정 체크

1. 한국어 heading을 문서대로 Pretendard로 유지할지, 현재 코드의 AritaBuri로 바꿀지 먼저 확정한다.
2. Hero intro를 매 방문 표시할지, 첫 방문 1회만 표시할지 확정한다.
3. `ScrollScoreBookReveal`의 wheel lock을 제거하고 passive 또는 버튼 기반으로 바꾸는 것을 구현 조건으로 둔다.
4. 홈의 최우선 전환을 `공연`, `입단`, `후원` 중 무엇으로 둘지 운영 목표에 맞춰 정한다.
5. 공개 가능한 시각 자산을 `무대·악보·포스터·손·공간·그룹 원경` 기준으로 미리 분류한다.
