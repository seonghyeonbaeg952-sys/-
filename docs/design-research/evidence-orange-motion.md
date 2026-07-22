# 흰 바탕·SMYC 오렌지 심볼·기능적 모션 근거 검증

- 조사·재검증일: 2026-07-19 (KST)
- 범위: 흰색/웜 화이트 바탕과 오렌지 포인트의 시각적 위계, 로고 심볼 반복 사용, 탐색·상태·진행 이해를 돕는 웹 모션
- 우선순위: 접근성 표준·동료평가 연구·공식 디자인 시스템 → 실제 브랜드 규정·전문가 가이드 → YouTube·Reddit·Hacker News·Awwwards 커뮤니티
- 목적: “세련돼 보인다”는 취향 진술을 그대로 채택하지 않고, 서울모테트청소년합창단(SMYC) Figma 5안에 적용할 수 있는 검증 가능한 설계 조건으로 바꾼다.

## 1. 결론 요약

1. **흰 바탕과 오렌지 조합은 채택할 가치가 높지만, 세련됨을 자동으로 보장하지는 않는다.** 흰색 또는 아주 옅은 웜 아이보리를 주 표면으로 두고, 오렌지를 로고 심볼·주요 CTA·현재 위치·진행 피드백에 제한하면 위계가 선명해진다. Apple과 NN/g의 원칙, Orange·Strava·HubSpot·Headspace의 실제 브랜드 운용, Madia Designer의 컬러 위계 설명이 이 방향에서 만난다.
2. **SMYC 심볼 원색은 적극적으로 쓰되 역할을 분리해야 한다.** 로컬 원본 `public/images/brand/smyc-symbol-transparent.png`의 비투명 픽셀을 집계한 지배색은 `#EB5307`이다. 이 색은 흰색과 3.64:1, 현재 아이보리 `#FFFDF8`과 3.58:1이므로 큰 글자·굵은 그래픽·심볼에는 쓸 수 있지만 일반 크기 본문이나 링크 글자에는 WCAG AA 4.5:1을 충족하지 않는다.
3. **오렌지를 없앨 이유는 없고, 접근 가능한 역할색을 하나 더 만들면 된다.** 원색 `#EB5307`은 심볼, 큰 면, 큰 CTA, 진행선, 선택 배경에 사용한다. 작은 텍스트·포커스 링·얇은 선에는 예시로 `#C2410C` 같은 더 짙은 오렌지(흰색 대비 5.18:1)를 별도 토큰으로 둔다. 최종 색은 실제 화면과 로고 승인 후 확정한다.
4. **심볼 반복은 ‘많이’가 아니라 ‘일관된 역할’이 핵심이다.** 반복 노출은 친숙함과 처리 유창성을 높일 수 있지만, 연구는 역 U자형 효과와 피로·침입감도 함께 보여준다. 헤더 로고를 제외한 심볼은 섹션 구분, 페이지 인덱스, 진행점, 마스크/리빌 등 각기 명확한 기능을 가져야 한다.
5. **기존 애니메이션은 웬만하면 유지하되 목적을 다시 붙인다.** 상태 변화, 공간적 연속성, 진행도, 원인과 결과를 설명하는 모션은 이해를 돕는다. 반대로 모든 문단의 반복적인 fade-up, 스크롤 잠금, 읽기를 기다리게 하는 연출, 취소할 수 없는 긴 전환은 제거 또는 축소 대상이다.
6. **`prefers-reduced-motion`은 ‘무조건 전부 정지’가 아니라 동등한 저모션 버전이다.** 큰 이동·확대·시차는 정적 최종 상태나 짧은 opacity/color 전환으로 바꾸되, 현재 상태와 다음 행동은 그대로 이해할 수 있어야 한다.

## 2. 로컬 브랜드 색 직접 확인

### 측정 대상과 방법

- 대상: `public/images/brand/smyc-symbol-transparent.png`
- 방법: 알파가 0보다 큰 모든 픽셀의 RGB 빈도를 집계했다. 안티앨리어싱으로 유사 오렌지가 여러 개 존재하며, 최빈값은 `#EB5307` 269픽셀이다.
- 해석 한계: 이미지 파일에서 추출한 실사용 대표색이지, 별도의 공식 브랜드 가이드가 확인된 것은 아니다. 추후 벡터 원본 또는 인쇄용 색상 규정이 있다면 그것을 우선한다.

### WCAG 2.2 상대 휘도 공식으로 계산한 대비

| 조합 | 대비 | 판정과 용도 |
|---|---:|---|
| `#EB5307` / `#FFFFFF` | 3.64:1 | 큰 글자(약 24px 일반 또는 18.5px 굵게)·굵은 심볼·비텍스트 그래픽 가능, 일반 텍스트 AA 불가 |
| `#EB5307` / `#FFFDF8` | 3.58:1 | 위와 동일 |
| `#111827` / `#EB5307` | 4.88:1 | 일반 크기 CTA 라벨 후보로 가능 |
| `#10233F` / `#EB5307` | 4.33:1 | 일반 크기 라벨 AA에 약간 부족하므로 큰 글자 외에는 사용하지 않음 |
| `#C2410C` / `#FFFFFF` | 5.18:1 | 작은 오렌지 링크·포커스·상태 텍스트 후보 |

계산 기준은 [WCAG 2.2 SC 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)의 sRGB 상대 휘도 공식과 4.5:1/3:1 문턱이다. 비율은 반올림해 표기했지만 실제 판정은 반올림 전 값으로 해야 한다.

## 3. 근거 원장

신뢰도 표기:

- **A**: 표준, 동료평가 연구, 메타분석, 공식 디자인 시스템/공식 브랜드 규정
- **B**: 검증된 UX 전문기관 가이드, 실제 우수 브랜드의 관찰 사례, 공식 사이트
- **C**: 실무자 영상·커뮤니티 경험담·수상작 큐레이션. 가설 생성용이며 단독 채택하지 않음

### A. 흰 바탕과 오렌지 포인트

| ID | 자료 | 핵심 주장·관찰 | 신뢰도 | SMYC 적용 결론 |
|---|---|---|---|---|
| O01 | [Apple HIG: Color](https://developer.apple.com/design/human-interface-guidelines/color) | 색은 상태·상호작용·브랜드를 일관되게 전달하고, 강조가 필요한 요소에 절제해 써야 한다. 색만으로 의미를 전달하면 안 된다. | A | 오렌지는 주 CTA·선택·진행처럼 의미가 있는 곳에 예약하고 장식 텍스트와 섞지 않는다. |
| O02 | [W3C: Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html) | 링크·상태·필수 정보는 색 이외의 단서가 필요하다. | A | 오렌지 활성 상태에 굵기, 밑줄, 아이콘, 라벨 중 하나를 함께 쓴다. |
| O03 | [W3C: Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | 일반 텍스트 4.5:1, 큰 텍스트 3:1이 AA 기준이다. | A | `#EB5307`은 흰 바탕의 일반 텍스트로 금지하고 심볼·큰 글자·면에 사용한다. |
| O04 | [W3C: Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast) | 필수 UI 경계와 상태 그래픽은 인접색 대비 3:1이 필요하다. | A | 포커스 링, 체크, 진행선은 실제 인접 배경 대비를 별도로 측정한다. |
| O05 | [NN/g: Visual Design Principles](https://media.nngroup.com/media/articles/attachments/Principles_Visual_Design-A4.pdf) | 밝은 색은 중요한 항목, 약한 색은 덜 중요한 항목에 써 시각적 위계를 만든다. 과도한 경쟁 신호는 스캔을 방해한다. | B | 한 화면에서 강한 오렌지 초점은 원칙적으로 하나의 주 행동 또는 하나의 현재 상태에 집중한다. |
| O06 | [Orange Brand Basics](https://brand.orange.com/en/brand-basics/orange-brand-basics) | Orange는 공식적으로 검정·흰색·오렌지를 핵심 팔레트로 운용한다. | A | 흰 바탕+오렌지+짙은 잉크의 3역할 구조가 실제 대형 브랜드에서도 운용 가능함을 보여준다. 복제보다 역할 분리를 참고한다. |
| O07 | [Strava API Brand Guidelines](https://developers.strava.com/guidelines/) | Strava orange는 `#FC5200`이며 링크는 색 외에도 굵기·밑줄로 식별할 수 있게 한다. 로고 변형·애니메이션은 금지한다. | A | 강한 오렌지를 링크·CTA에 쓰더라도 밑줄/굵기를 병행한다. 공식 심볼 자체는 변형하지 않고 주변 레이어를 움직인다. |
| O08 | [HubSpot Trademark Guidelines](https://legal.hubspot.com/tm-usage-guidelines) | 오렌지 sprocket은 높은 인지도를 가진 핵심 표식이며 색 변경·왜곡·중첩을 금지한다. | A | SMYC 심볼을 배경 패턴으로 쓰더라도 원형 마크 자체의 비율·획·색은 보존한다. |
| O09 | [Headspace Brand Guidelines: Logo](https://live.standards.site/headspace/logo) | 독립 심볼은 앱 아이콘·소셜·파비콘 등 제한된 상황에 쓰며, 최소 여백과 승인된 배경 조합을 정한다. | A | 심볼 단독 사용 규칙과 최소 여백을 Figma 노트에 명시하고, 모든 카드마다 찍는 방식은 피한다. |
| O10 | [Penguin Books: Who We Are](https://www.penguin.co.uk/about/who-we-are) | 오렌지 타원 속 펭귄은 책등과 판매 환경에서 반복되는 대표 브랜드 자산이다. | B | 심볼을 콘텐츠 표지·프로그램 북 탭처럼 매체 맥락과 연결하면 단순 워터마크보다 의미가 생긴다. |
| O11 | [Awwwards: Orange Websites](https://www.awwwards.com/websites/orange/) | 오렌지를 강하게 쓰는 수상·추천 사이트 사례를 모은 큐레이션이다. | C | 시각 영감으로만 사용한다. 수상 여부를 사용성 근거로 간주하지 않는다. |
| O12 | [A Color Bright: SoundCloud Design Language](https://www.acolorbright.com/en/work/soundcloud-redesign) | 강한 브랜드 오렌지를 제품 표면, 타이포, 이미지와 함께 시스템화한 사례다. | B | 오렌지를 버튼 하나가 아니라 심볼·진행·미디어 재생 상태가 공유하는 언어로 만든다. |
| O13 | [Reddit r/web_design: What kind of white?](https://www.reddit.com/r/web_design/comments/1046hwg/what_kind_of_white_should_we_use_as_white/) | 순백은 항상 나쁘지 않으며, 콘텐츠·조명·브랜드 톤에 따라 순백과 웜 오프화이트를 선택해야 한다는 다수 의견이 공존한다. | C | “무조건 `#F2F2F2`” 같은 규칙은 버리고 사진·종이 질감 섹션은 웜 아이보리, 데이터·탐색 섹션은 순백을 비교한다. |
| O14 | [Reddit r/web_design: Is this too orange?](https://www.reddit.com/r/web_design/comments/1n4b5jt/is_this_too_orange/) | 전면 오렌지 배경은 과하고 작은 텍스트 대비가 약하다는 피드백이 반복된다. | C | 전면 오렌지는 짧은 전환/CTA 밴드에 한정하고 긴 읽기 표면은 흰색/아이보리로 둔다. |
| O15 | [Reddit r/web_design: Improve design and mix colors](https://www.reddit.com/r/web_design/comments/1leyrf2/how_do_i_improve_this_design_and_how_to_mix_colors/) | 오렌지 면이 많아질수록 압도적이고, 흰 카드와 짙은 텍스트가 읽기 편하다는 실무 피드백이 있다. | C | 오렌지는 콘텐츠 배경보다 CTA·탭·선택 상태에 집중한다. |
| O16 | [Madia: 컬러 계층 잘 못 잡으면 디자인 망합니다](https://www.youtube.com/shorts/SdWN34yCMNs) | 브랜드 컬러를 남발하면 모든 버튼이 중요해 보여 시선이 분산되므로 강·중·약 계층을 만들라고 설명한다. | C | 오렌지 원색, 딥 오렌지, 8–12% 틴트의 세 역할을 정의하고 같은 강도로 남발하지 않는다. |
| O17 | [Madia: 다 강하게 UIUX 디자인하면 어떻게?](https://www.youtube.com/shorts/wKOK72fTi9Y) | 가장 중요한 요소를 파악하고 나머지를 약하게 처리해야 한다고 설명한다. | C | 한 viewport에 동일 강도의 오렌지 CTA 여러 개를 두지 않는다. |
| O18 | [Madia: UIUX 디자인은 밋밋하게 하세요](https://www.youtube.com/shorts/GyoZZJsBVoc) | 밋밋한 기본 표면 속 중심을 잡는 요소 하나가 필요하다고 설명한다. | C | 넓은 흰 표면과 오렌지 심볼 앵커의 대비를 Concept B·D에서 적극 실험한다. |
| O19 | [Madia: UIUX 디자인에서 기본기가 중요한 이유](https://www.youtube.com/shorts/mCYLAbI_1A0) | 중요한 것은 크게, 불필요한 것은 작게, 복잡한 것은 여백으로 풀라고 설명한다. | C | 오렌지뿐 아니라 크기·여백·위치로 위계를 함께 만든다. |

### B. 로고 심볼 반복의 효과와 과잉 위험

| ID | 자료 | 핵심 주장·관찰 | 신뢰도 | SMYC 적용 결론 |
|---|---|---|---|---|
| L01 | [Adobe: Graphic Design Basics](https://www.adobe.com/learn/express/web/graphic-design-basics) | 반복·패턴은 구성에 통일성과 리듬을 만들며 로고와 컬러도 반복 요소가 될 수 있다. | B | 심볼의 획 일부를 섹션 번호·진행점·구분선에 재사용해 리듬을 만든다. |
| L02 | [Journal of Consumer Research: Brand Logo Complexity, Repetition, and Spacing](https://academic.oup.com/jcr/article-abstract/28/1/18/1851175) | 반복과 간격, 로고 복잡도가 처리 유창성과 판단에 상호작용한다. 단순히 노출 횟수만 늘리는 모델은 부족하다. | A | 심볼 반복 횟수보다 여백·크기·복잡도·노출 간격을 함께 프로토타입 테스트한다. |
| L03 | [Psychological Bulletin / PubMed: Mere Exposure Meta-analysis](https://pubmed.ncbi.nlm.nih.gov/28263645/) | 81개 논문, 268개 곡선을 재분석했을 때 친숙함·선호는 대체로 역 U자형이다. | A | “많을수록 기억된다”를 거부하고, 주요 챕터마다 제한적으로 노출한다. |
| L04 | [Journal of Advertising: Advertising Repetition Meta-analysis](https://www.tandfonline.com/doi/abs/10.1080/00913367.2015.1018460) | 반복은 회상과 태도에 영향을 주지만 간격·관여도·맥락에 따라 효과가 달라진다. | A | 같은 페이지에서 촘촘히 반복하는 대신 헤더→중간 챕터→푸터처럼 간격을 둔다. |
| L05 | [Information & Management: Website Ad Repetition](https://www.sciencedirect.com/science/article/abs/pii/S0378720616300283) | 웹 광고 반복은 회상뿐 아니라 침입감·태도·재방문 의도에도 영향을 줄 수 있다. | A | 심볼이 광고 배너처럼 보이거나 콘텐츠를 가리면 브랜드 친숙함보다 침입감이 커질 수 있다. |
| L06 | [DOAJ: Sonic and Visual Logo Repetition](https://doaj.org/article/b6edf2c80bd24197a1ce8128bf6f85ee) | 시각·사운드 로고를 1·3·7회 노출해 회상·인지·태도 차이를 실험했다. | A- | 반복 효과가 존재할 가능성을 지지하지만 광고 실험이므로 홈페이지 심볼 횟수에 직접 환산하지 않는다. |
| L07 | [PubMed: Visual Search in Cluttered Websites](https://pubmed.ncbi.nlm.nih.gov/33957850/) | 웹사이트 스크린샷의 초기 시각 탐색에서 복잡도가 높을수록 사용자의 탐색 어려움을 조기에 감지할 수 있었다. | A | 큰 심볼 여러 개, 오렌지 CTA 여러 개, 움직이는 패턴을 동시에 겹치지 않는다. |
| L08 | [HubSpot: How to Create Effective Brand Guidelines](https://www.hubspot.com/hubfs/How%20to%20Create%20a%20Brand%20Style%20Guide.pdf) | 독립 sprocket은 브랜드가 이미 확립된 맥락에서 쓰고, 로고 최소 크기·제외 영역을 규정해야 한다고 설명한다. | B | 첫 화면에는 전체 로고/명칭을 보여주고, 이후 섹션에서만 심볼 단독 사용을 허용한다. |
| L09 | [Reddit r/logodesign: Recognizable without the logo](https://www.reddit.com/r/logodesign/comments/1tjb7xv/why_can_you_recognize_some_brands_instantly_even/) | 강한 브랜드는 로고 하나보다 색·형태·패턴의 일관된 반복으로 인지된다는 실무 의견이 있다. | C | 완전한 심볼 도장보다 오렌지 획, M자 리듬, 좌우 대칭을 보조 시각 언어로 확장한다. |
| L10 | [Reddit r/graphic_design: Visual identity without a supergraphic](https://www.reddit.com/r/graphic_design/comments/1echuu0/is_it_possible_to_design_a_brands_visual_identity/) | 로고 조각의 단순 반복 패턴이 진부해지거나 식별력을 약하게 만들 수 있다는 반대 의견이 있다. | C | 타일형 벽지 패턴은 기본안에서 제외하고, 기능 있는 단일 모티프를 우선한다. |
| L11 | [arXiv: Brand > Logo](https://arxiv.org/abs/1810.09941) | 패션 브랜드 인지는 로고 외에도 색·패턴·형태 등 넓은 시각 언어에서 형성된다고 분석한다. | B- | 심볼을 계속 찍는 대신 색 역할·여백·타이포·선 리듬까지 하나의 브랜드 문법으로 설계한다. |
| L12 | [Reddit r/branding: Branding is what people remember](https://www.reddit.com/r/branding/comments/1smyt4p/branding_isnt_what_you_say_its_what_people/) | 기억과 신뢰는 로고 한 번보다 지원·탐색·문구·상호작용의 일관된 경험에서 생긴다는 커뮤니티 의견이다. | C | 심볼 사용보다 공연 찾기·입단·후원 흐름의 일관성이 우선이다. |

### C. 유용한 애니메이션의 조건

| ID | 자료 | 핵심 주장·관찰 | 신뢰도 | SMYC 적용 결론 |
|---|---|---|---|---|
| M01 | [Apple HIG: Motion](https://developer.apple.com/design/human-interface-guidelines/motion) | 모션은 상태·피드백·지시를 전달할 때 유용하고, 짧고 정확하며 취소 가능해야 한다. 빈번한 조작에 긴 모션을 반복하지 않는다. | A | 기존 모션을 유지하되 각 애니메이션에 상태·관계·진행 목적을 한 줄로 명시한다. |
| M02 | [W3C: Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions) | 사용자 상호작용이 유발하는 비필수 움직임은 비활성화할 수 있어야 한다. | A | 포인터 시차·큰 scale·parallax는 reduced-motion에서 제거/대체한다. |
| M03 | [W3C: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | 5초 넘게 자동으로 움직이는 콘텐츠는 일시정지·중지·숨김 수단이 필요하다. | A | 자동 hero 교체나 marquee가 5초 이상 지속되면 pause를 제공하거나 루프를 중단한다. |
| M04 | [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) | 큰 이동·확대는 전정기관 트리거가 될 수 있으며, 브라우저는 저모션 설정을 널리 지원한다. | A | 이동·확대 대신 dissolve/opacity와 즉시 최종 상태를 사용한다. |
| M05 | [web.dev: Animation and Motion Accessibility](https://web.dev/learn/accessibility/motion) | 저모션은 무조건 무애니메이션을 뜻하지 않으며, opacity·cross-fade 같은 대체와 사용자 제어가 가능하다. | A | 사용자의 “애니메이션을 없애지 말자”는 방향과 접근성을 양립시켜 full/reduced 두 버전을 만든다. |
| M06 | [Microsoft Fluent 2: Motion](https://fluent2.microsoft.design/motion) | 짧고 자연스러운 지속시간, 초점 요소 안의 움직임, 동등한 비시각 피드백, no-motion 설정을 권한다. | A | 클릭한 카드 내부·현재 섹션 내부에서 움직이고 화면 가장자리의 자율 움직임은 줄인다. |
| M07 | [IBM Carbon: Motion](https://carbondesignsystem.com/elements/motion/overview/) | 생산적 모션은 효율·반응성을, 표현적 모션은 드문 중요 순간을 담당한다. 70–240ms의 마이크로 모션과 400ms 안팎의 큰 전환 예시를 제공한다. | A | hover/active는 70–150ms, 작은 공개는 150–240ms, 중요한 챕터 전환만 240–400ms를 출발점으로 테스트한다. |
| M08 | [NN/g: Animation for Attention and Comprehension](https://www.nngroup.com/articles/animation-usability/) | 모션은 변화·연속성·관계를 설명할 수 있지만 주변부 모션과 반복 모션은 주의와 시간을 빼앗는다. 직접 조작의 효과는 약 0.1초 안에 시작해야 인과성이 느껴진다. | B | 클릭/탭 피드백은 즉시 시작하고, 모든 문단의 scroll reveal은 금지한다. |
| M09 | [NN/g: Visibility of System Status](https://www.nngroup.com/articles/visibility-system-status/) | 시스템은 적절한 시간 안에 현재 상태와 결과를 알려야 하며 예측 가능한 피드백이 신뢰를 만든다. | B | 입단 문의·후원·관리 작업의 loading/success/error를 오렌지 진행선과 텍스트로 함께 알린다. |
| M10 | [IEEE TVCG / PubMed: Animated Transitions in Statistical Graphics](https://pubmed.ncbi.nlm.nih.gov/17968070/) | 두 통제 실험에서 잘 설계한 전환이 그래프 변화의 구문·의미 파악을 개선했다. | A | 공연 연도·아카이브 필터 변화에서 동일 요소를 연속적으로 이동시켜 무엇이 바뀌었는지 보여준다. 마케팅 hero 전체에 일반화하지 않는다. |
| M11 | [University of Manitoba HCI: Smooth View Transitions](https://hci.cs.umanitoba.ca/publications/details/quantifying-the-effects-of-smooth-view-transitions-on-perceptual-constancy) | 노드 링크·줌 인터페이스의 네 실험에서 부드러운 전환이 지각적 연속성과 일부 과제 성능을 크게 개선했다. | A | 카드→상세, 연도→공연 전환에 shared-element 방식의 연속성을 적용한다. |
| M12 | [PubMed: Feedback Preferences and Waiting](https://pubmed.ncbi.nlm.nih.gov/19899362/) | 사용자는 정보가 많은 진행 피드백을 선호했지만, 시간 지각과 선호는 동일하지 않았다. | A | 실제 진행을 모르는 가짜 퍼센트 대신 불확정 상태를 정직하게 표시하고, 완료·오류 결과를 명시한다. |
| M13 | [Displays: Visual Feedback Types and Wait Indicator](https://www.sciencedirect.com/science/article/pii/S0141938218300076) | 로딩 표시 형태와 대기 시간이 시간 지각·선호에 영향을 주며, 장식적 캐릭터가 항상 UX를 개선하지는 않았다. | A | SMYC 심볼을 로더로 쓸 경우 실제 상태 전달이 우선이며 장식만 추가하지 않는다. |
| M14 | [Reddit r/web_design: Scroll-triggered slide/fade](https://www.reddit.com/r/web_design/comments/1d91whv/) | 콘텐츠를 보기 위해 애니메이션을 기다리는 경험, 스크롤 시 빈 화면, 과도한 반복에 대한 강한 반대와 `prefers-reduced-motion` 권고가 반복된다. | C | 본문은 처음부터 DOM·레이아웃에 존재하고, 모션은 콘텐츠 접근을 막지 않는 보조층으로 만든다. |
| M15 | [Reddit r/webdesign: Unpopular opinion—animations](https://www.reddit.com/r/webdesign/comments/1sro7oh/unpopular_opinion_i_dont_like_animations/) | 스크롤 잠금·과한 전환을 싫어하지만, 한두 개의 의미 있는 섹션 모션과 미세 피드백은 유용하다는 의견도 공존한다. | C | “전부 제거/전부 유지” 이분법 대신 목적별 보존·수정·대체를 결정한다. |
| M16 | [Hacker News: Disorienting website animations](https://news.ycombinator.com/item?id=44420521) | 실제 사용자가 멀미와 탐색 불가를 호소하며 reduced-motion 지원을 요청한다. | C | QA에 OS 저모션, 키보드 탐색, 390px 터치 스크롤을 포함한다. |
| M17 | [Hacker News: Purposeful animations](https://news.ycombinator.com/item?id=45139088) | 원인-결과와 학습을 돕는 모션은 유용하지만 숙련 사용자에게 반복되면 느리게 느껴진다는 논의가 있다. | C | 첫 방문 설명 모션은 재방문 시 생략하고, 빈번한 경로는 더 짧게 한다. |
| M18 | [Awwwards: Animation Websites](https://www.awwwards.com/websites/animation/) | 애니메이션 중심 수상작·후보를 폭넓게 볼 수 있는 큐레이션이다. | C | 구현 아이디어의 폭을 넓히는 용도일 뿐, 탐색·접근성 우수성을 보증하는 근거로 쓰지 않는다. |
| M19 | [Madia: 화려하게 디자인하면 망하는 이유](https://www.youtube.com/shorts/ZHRE9R2xYnE) | 의미 없이 덜어내지 말되 시선 분산·복잡함·가독성이라는 이유를 갖고 줄이라고 설명한다. | C | 애니메이션 삭제 기준을 취향이 아니라 주의 분산·읽기 지연·상태 중복으로 문서화한다. |
| M20 | [Madia: 보고 싶지 않은데 계속 보여주는 UIUX](https://www.youtube.com/shorts/ertN0_5GDew) | 좁은 모바일에서 모든 요소를 계속 노출하기보다 현재 필요한 정보만 보여주는 편이 선호됐다는 실무 테스트 경험을 소개한다. | C | 모바일에서는 다음 행동 중심의 progressive disclosure를 쓰되, 숨긴 정보의 존재와 여는 방법은 명확히 한다. |
| M21 | [Madia: 그룹만 잘해도 UIUX 디자인 절반은 성공](https://www.youtube.com/shorts/AfO-B6FYkeQ) | 빠르게 스크롤하는 모바일에서는 정보 그룹과 가독성이 장식보다 중요하다고 설명한다. | C | 모션 단위도 개별 단어가 아니라 의미 있는 콘텐츠 그룹으로 묶는다. |

### D. 2차 반례 검색에서 추가한 자료

| ID | 자료 | 반례·보완 주장 | 신뢰도 | 기존 결론에 미친 영향 |
|---|---|---|---|---|
| V01 | [W3C COGA Wiki: Dyslexia Gap Analysis](https://www.w3.org/WAI/GL/task-forces/coga/wiki/Gap_Analysis/Dyslexia) | 일부 난독·시각 스트레스 사용자는 순백 배경의 눈부심을 불편해할 수 있어 밝은 비백색 배경을 권하는 참고 지침이 있다. 다만 WCAG 규범 조항은 아니다. | B | pure white와 warm ivory를 함께 만들고 사용자 선택·고대비 모드에서 확인한다. “순백이 항상 더 깨끗하다”는 주장을 기각했다. |
| V02 | [JASIST / HKUST: Non-banner Animation and Web Users](https://repository.hkust.edu.hk/ir/Record/1783.1-18429) | 쇼핑 실험에서 주 콘텐츠 애니메이션이 첫 클릭을 끌었지만 과제 성능과 인식에 부정적 영향도 보였다. 과제 유형과 경험이 효과를 조절했다. | A | 주의를 끈다는 사실을 성공으로 오인하지 않는다. SMYC의 찾기 과제에서는 성능·오클릭을 함께 측정한다. |
| V03 | [Kellogg: Advertising Wearout—Experimental Analysis](https://www.kellogg.northwestern.edu/academics-research/research/detail/1976/advertising-wearout-an-experimental-analysis/) | 매우 높은 반복에서도 주의와 반발을 통제하면 브랜드 회상 wearout이 항상 나타나지는 않았다. | A | 반복은 반드시 나쁘다는 단정도 기각했다. 문제는 횟수 하나가 아니라 주의, 침입감, 간격, 맥락이다. |
| V04 | [University of Manitoba HCI: Animated Zoom Transitions](https://hci.cs.umanitoba.ca/publications/details/the-effect-of-animated-transitions-in-zooming-interfaces) | 공간 과제에서 애니메이션이 속도·오류를 개선했고 짧은 전환도 긴 전환만큼 효과적이었다. | A | 관계 설명에는 모션을 유지하되, 길게 보여줄 이유는 없다는 결론을 강화했다. |

총 56개 고유 URL을 검토 대상으로 기록했다. 같은 채널·같은 발행처의 여러 자료는 독립 근거로 중복 계산하지 않았으며, 커뮤니티 자료는 반례와 실제 불편 사례를 찾는 데만 사용했다.

## 4. 2차 재귀 검증 매트릭스

상태 정의:

- **confirmed**: 로컬 측정 또는 표준/연구가 직접 지지하고 독립 출처로 교차 확인됨
- **conditional**: 방향은 지지되지만 대상·맥락·정량값을 SMYC에 그대로 일반화할 수 없음
- **rejected**: 근거가 없거나 반대 근거가 있어 보편 규칙으로 채택하지 않음

| Claim | 1차 주장 | 반례·충돌 확인 | 독립 출처 수·구성 | status | checked_at |
|---|---|---|---|---|---|
| C01 | SMYC 대표 오렌지는 `#EB5307`이다. | 벡터/인쇄용 공식 가이드가 없으므로 절대적 브랜드 원색이라고 단정할 수 없다. | 2: 로컬 PNG 픽셀 측정 + W3C 계산 공식 | **conditional** | 2026-07-19 KST |
| C02 | 흰 바탕+오렌지는 SMYC를 더 세련되게 만든다. | 커뮤니티에서도 순백/오프화이트 선호가 갈리고, W3C COGA 참고 자료는 일부 사용자에게 순백의 눈부심 가능성을 제기한다. 실제 품질은 타이포·여백·콘텐츠 위계에 좌우되며, 특정 조합의 ‘세련됨’을 입증한 인과 연구는 찾지 못했다. | 7+: Apple, W3C/WAI, NN/g, Orange, Strava, Reddit | **conditional** | 2026-07-19 KST |
| C03 | 원색 오렌지를 모든 CTA·링크 텍스트에 써도 된다. | `#EB5307`/흰색은 3.64:1로 일반 텍스트 AA 4.5:1에 미달한다. | 2: 로컬 색 측정 + W3C 표준 | **rejected** | 2026-07-19 KST |
| C04 | 오렌지 원색을 심볼·큰 면·큰 텍스트에 쓰고 작은 텍스트는 딥 오렌지로 분리한다. | 큰 텍스트 기준·비텍스트 기준과 실제 폰트 굵기를 함께 확인해야 하며, 후보 `#C2410C`가 최종 브랜드 승인색은 아니다. | 4: W3C text/non-text, Apple, 로컬 대비 계산 | **confirmed**(역할 분리), 색상값은 **conditional** | 2026-07-19 KST |
| C05 | 로고 심볼은 반복할수록 인지와 선호가 계속 높아진다. | 메타분석은 역 U자형을 보이고, 웹 반복 연구는 침입감·재방문 저하 가능성을 보여준다. 반대로 고반복에서 회상 wearout이 항상 생기지 않았다는 실험도 있어 단순한 선형 법칙은 어느 방향으로도 성립하지 않는다. | 5: APA meta-analysis, JCR, Journal of Advertising, Information & Management, Kellogg/JMR | **rejected** | 2026-07-19 KST |
| C06 | 제한적이고 간격 있는 심볼 반복은 브랜드 친숙함과 리듬을 만들 수 있다. | 광고 노출 연구를 홈페이지 장식에 직접 환산할 수 없고, 직접적인 웹 심볼 반복 RCT는 확인하지 못했다. | 5: Adobe, JCR, 2개 메타분석, 브랜드 규정 | **conditional** | 2026-07-19 KST |
| C07 | 한 섹션/viewport에 심볼 한 번이면 최적이다. | 이를 보증하는 연구는 없다. 과잉을 막기 위한 프로토타입 상한일 뿐이다. | 0 직접 근거; clutter·wearout 연구의 간접 근거만 있음 | **conditional**(테스트 가설) | 2026-07-19 KST |
| C08 | 좋은 UX를 위해 애니메이션을 대부분 제거해야 한다. | 상태·연속성·진행 피드백을 설명하는 전환은 통제 실험과 디자인 시스템에서 이점이 확인된다. | 6+: Apple, IBM, NN/g, IEEE, Manitoba HCI, wait-feedback 연구 | **rejected** | 2026-07-19 KST |
| C09 | 기존 애니메이션을 상태·관계·진행 이해에 맞게 수정해 유지한다. | 그래프·노드 링크 실험을 감성적 홈페이지 전체에 일반화할 수는 없다. JASIST 실험에서는 주 콘텐츠 애니메이션이 관심을 끌면서도 과제 성능을 낮춘 경우가 있어, 모션별 과제 성공률과 불편을 별도 테스트해야 한다. | 7+: Apple, IBM, NN/g, IEEE, Manitoba, JASIST, NN heuristic | **confirmed**(방향), 개별 효과는 **conditional** | 2026-07-19 KST |
| C10 | reduced-motion은 모든 애니메이션을 완전히 없애는 것이다. | web.dev와 MDN은 이동·확대를 dissolve/opacity/정적 상태로 대체할 수 있음을 보여준다. 단, 비필수 상호작용 모션 비활성화와 5초 이상 자동 모션 제어는 지켜야 한다. | 4: W3C 2개, MDN, web.dev | **rejected** | 2026-07-19 KST |
| C11 | scroll-jacking과 wheel lock은 감성적 스토리텔링에 도움이 된다. | 공식 가이드는 취소 가능·짧은 모션을 권하며, 여러 커뮤니티에서 읽기 방해·멀미·정보 회귀 실패가 반복 보고된다. 직접적인 SMYC 사용자 실험은 아직 없다. | 5: Apple, NN/g, Reddit 2개, HN | **rejected**(기본값), 별도 실험 전 도입 금지 | 2026-07-19 KST |
| C12 | 60/30/10 색 비율은 흰색·오렌지 UI의 과학적 최적값이다. | 신뢰도 높은 HCI/접근성 근거를 찾지 못했고 커뮤니티 관행 수준이다. | 0 고품질 직접 근거 | **rejected** | 2026-07-19 KST |
| C13 | Carbon의 70–400ms 토큰은 모든 웹사이트의 정답이다. | 디자인 시스템의 출발점일 뿐 거리·크기·빈도·기기 성능에 따라 달라진다. | 3: Carbon, Fluent, Apple | **conditional** | 2026-07-19 KST |
| C14 | Awwwards 수상작은 사용성이 검증됐다. | Awwwards는 시각·기술 큐레이션이며 접근성·과제 성공을 직접 증명하지 않는다. 커뮤니티는 수상형 사이트의 scroll-jacking을 자주 비판한다. | 3: Awwwards + Reddit + HN | **rejected** | 2026-07-19 KST |
| C15 | Madia Designer 영상의 실무 조언은 SMYC에 그대로 적용할 수 있다. | 같은 채널의 경험 기반 조언으로 독립 연구가 아니며, 특정 사용자군·과제 데이터가 공개되지 않았다. 다만 컬러 위계·그룹화·절제 주장은 Apple·NN/g·W3C와 방향이 일치한다. | 4 발행처: Madia, Apple, NN/g, W3C | **conditional** | 2026-07-19 KST |

### 2차 검증에서 수정한 과장

- “흰색+오렌지가 더 세련되다” → **세련됨은 가설**이며, 위계·대비·브랜드 일관성이 좋아질 가능성을 Figma와 사용자 과제로 검증한다.
- “심볼을 적극 반복하면 기억된다” → **역할 있는 제한적 반복**으로 수정했다. 횟수는 연구에서 직접 도출하지 않는다.
- “애니메이션을 유지하면 몰입이 좋아진다” → **상태·연속성·진행 이해를 돕는 경우에만 유지**하고, 콘텐츠 접근을 늦추는 반복 모션은 축소한다.
- “reduced-motion에서는 전부 정지” → **큰 공간 이동을 정적 상태·opacity/color로 대체**하는 동등 경험으로 수정했다.
- “Awwwards·YouTube 인기 사례가 곧 UX 근거” → 아이디어와 반례 탐색용으로만 쓰고 공식 표준·독립 연구로 교차 확인했다.

## 5. Figma 5안 적용 체크리스트

### 공통 색·심볼 체크

- [ ] Desktop 1440, Tablet 768, Mobile 390 모두에서 흰색/웜 아이보리 주 표면과 오렌지의 시각적 비중을 비교한다.
- [ ] 최소 2개 안은 **white-first**로 구성한다. 권장: B `살아 있는 프로그램 북`, D `목소리의 아카이브`.
- [ ] 원색 `brand-orange: #EB5307`과 접근성용 `orange-ink` 역할을 분리한다. `orange-ink` 최종값은 대비와 브랜드 승인 후 확정한다.
- [ ] `#EB5307` 위 작은 CTA 라벨은 `#111827`처럼 4.5:1 이상인 잉크색을 사용한다. 흰 글자는 큰 텍스트 조건 외에 사용하지 않는다.
- [ ] 오렌지 상태는 색만으로 표현하지 않고 밑줄·굵기·아이콘·텍스트 중 하나를 함께 쓴다.
- [ ] 첫 화면은 전체 로고 또는 단체명을 제공하고, 이후에만 심볼 단독 사용을 허용한다.
- [ ] 심볼 원형을 회전·왜곡·늘임·획 변경하지 않는다. 움직임은 심볼 주변 마스크·선·빛·컨테이너에 준다.
- [ ] 장식용 심볼은 `aria-hidden` 대상임을 노트에 적고, 기능 심볼은 텍스트 라벨을 가진다.
- [ ] 심볼이 버튼처럼 보이는데 클릭되지 않는 혼동을 만들지 않는다.
- [ ] 한 viewport에 강한 오렌지 CTA를 여러 개 두지 않는다. 주 행동 1개, 보조 행동은 outline/text 역할로 낮춘다.
- [ ] 타일형 로고 벽지는 기본안에서 제외한다. 쓰려면 한정된 캠페인 면에서만 A/B 테스트한다.

### 공통 모션 체크

- [ ] 각 모션 이름 옆에 목적을 `상태`, `관계`, `진행`, `방향`, `브랜드 순간` 중 하나로 표기한다.
- [ ] 목적을 한 문장으로 설명하지 못하는 모션은 삭제 대신 먼저 정적/opacity 대체안을 만든다.
- [ ] 탭·버튼 피드백은 입력 후 약 100ms 안에 시작한다.
- [ ] hover/active 70–150ms, 작은 공개 150–240ms, 큰 챕터 전환 240–400ms를 초기값으로 두고 실제 기기에서 조정한다.
- [ ] 400ms를 넘는 전환은 첫 방문의 드문 브랜드 순간에만 허용하고, 재방문·빈번 경로에서는 단축한다.
- [ ] 자동 모션이 5초 이상 지속되면 pause/stop/hide 또는 비반복 종료를 제공한다.
- [ ] 모든 핵심 텍스트와 CTA는 애니메이션 완료를 기다리지 않고 읽고 조작할 수 있다.
- [ ] wheel lock, scroll hijack, 커스텀 커서 강제, 가로 스크롤 강제는 사용하지 않는다.
- [ ] `prefers-reduced-motion` 프레임에서 큰 pan/zoom/parallax를 정적 최종 상태 또는 짧은 opacity/color 전환으로 바꾼다.
- [ ] full/reduced 두 버전에서 현재 상태·다음 행동·성공/오류 의미가 동일하다.
- [ ] 모바일에서 스크롤과 모션 제스처가 충돌하지 않는지 390px 실기기 또는 에뮬레이션으로 확인한다.

### A. 무대의 첫 숨 / First Breath on Stage

- [ ] 어두운 무대 Hero는 유지하되, 다음 공연·프로그램 정보 면을 흰색으로 전환해 오렌지 심볼이 “무대 조명에서 종이 인쇄색으로 이동”하는 서사를 만든다.
- [ ] 심볼은 Hero 중앙 장식이 아니라 오프닝 마스크 또는 다음 섹션 방향 표시 중 하나만 담당한다.
- [ ] hero crossfade는 맥락 전환용으로 1회 또는 낮은 빈도로 제한하고, pause와 reduced-motion 정적 첫 장면을 제공한다.
- [ ] 기존 staff line은 장식 루프가 아니라 현재 챕터 진행선으로 수정한다.

### B. 살아 있는 프로그램 북 / Living Program Book

- [ ] **가장 적극적인 white-first + orange 안**으로 만든다: `#FFFFFF/#FFFDF8` 종이, 짙은 잉크, `#EB5307` 심볼 탭·페이지 인덱스·주 CTA.
- [ ] 심볼의 M자 획을 프로그램 북의 섹션 탭/악보 마디 구분자로 사용하되 한 페이지에 한 번만 강하게 노출한다.
- [ ] scorebook page transition은 앞/뒤 문맥을 보존하고 네이티브 스크롤을 잠그지 않는다.
- [ ] reduced-motion에서는 페이지가 이미 펼쳐진 정적 목차와 명확한 이전/다음 버튼을 제공한다.

### C. 다음 세대 아카데미 / Next Voice Academy

- [ ] 웜 화이트 학습 표면에 오렌지를 단계 진행, 현재 선택, 완료 피드백에 사용한다.
- [ ] 학생/보호자 경로 전환은 선택된 탭 아래 심볼 획이 이동하는 150–240ms 전환으로 관계를 설명한다.
- [ ] 오렌지를 오류와 성공에 공통 사용하지 않는다. 상태는 아이콘·라벨과 별도 semantic color를 함께 쓴다.
- [ ] 단계 진행 애니메이션은 실제 완료 상태만 반영하고 가짜 진척을 만들지 않는다.

### D. 목소리의 아카이브 / Archive of Voices

- [ ] **두 번째 white-first + orange 안**으로 만든다: 박물관형 흰색 표면, 짙은 잉크, 오렌지 연도 인덱스·선택 태그·심볼 크롭.
- [ ] 심볼 반복은 카드 워터마크가 아니라 연도 변경점 또는 컬렉션 표지에만 사용한다.
- [ ] archive-stack은 선택 카드가 상세로 이어지는 공간적 연속성을 설명하고, 모든 카드가 반복적으로 흔들리거나 솟지 않게 한다.
- [ ] 필터 변화는 결과 수 텍스트와 shared-element transition을 함께 제공한다.

### E. 하나의 호흡 / One Breath, One Community

- [ ] 웜 아이보리와 네이비를 기본으로 하되 후원·공동체의 연결점과 주 CTA에 오렌지 심볼을 쓴다.
- [ ] network pulse는 자동 무한 반복 대신 실제 후원 단계/공동체 연결의 상태 변화 때 1회 재생한다.
- [ ] letter fold는 후원 안내 공개 또는 전송 완료처럼 원인-결과가 있는 순간에만 사용한다.
- [ ] 개인정보·청소년 사진보다 심볼, 선, 타이포, 실제 활동 수치로 공동체를 표현한다.

## 6. 검증 과제와 성공 기준

시각 선호만 묻지 않고 같은 콘텐츠·과제를 5안에 적용한다.

1. “다음 공연을 찾아 날짜와 장소를 말해 주세요.”
2. “입단 대상과 신청 방법을 찾아 주세요.”
3. “합창단의 핵심 정신 한 가지를 찾아 주세요.”
4. “후원 방법과 문의 경로를 찾아 주세요.”

기록할 값:

- 첫 올바른 클릭까지 걸린 시간
- 과제 성공/실패
- 뒤로 가기 또는 잘못된 클릭 수
- 첫 화면에서 가장 먼저 본 요소
- 오렌지 요소 중 클릭 가능하다고 오인한 항목
- 모션이 이해를 도왔는지, 기다리게 했는지, 불편했는지
- 심볼이 기억나는지와 과하다고 느꼈는지
- full motion / reduced motion 선호와 멀미·두통 여부

임시 통과 기준:

- 5초 안에 첫 주 CTA를 발견
- 핵심 과제 성공률 90% 이상
- 오렌지 비대화로 인한 잘못된 클릭 0회가 목표
- 핵심 콘텐츠가 모션 완료 전에 읽히고 조작 가능
- 390px에서 가로 overflow·스크롤 잠금·44px 미만 주 터치 대상 없음
- `#EB5307`을 일반 크기 흰색 텍스트 조합으로 사용한 사례 0개

## 7. 남은 리스크

- 로고의 벡터 원본·공식 색상 규정이 아직 확인되지 않아 `#EB5307`은 PNG 실측 대표값이다.
- 반복 노출 연구는 광고·브랜드 자극 맥락이 많아 홈페이지 섹션 심볼의 최적 횟수를 직접 알려주지 않는다.
- 그래프·노드 링크의 애니메이션 이점을 감성적 홈페이지에 그대로 일반화할 수 없다. 각 모션은 실제 SMYC 과제로 확인해야 한다.
- YouTube·Reddit·Hacker News·Awwwards는 실무 감각과 반례를 주지만 표본과 검증 방법이 통제되지 않았다.
- `#C2410C`은 접근성 역할색 후보일 뿐, 최종 팔레트는 Figma 비교와 브랜드 승인 후 확정해야 한다.
- 실제 iOS Safari, Android Chrome, 고대비/강제색 모드, 전정기관 민감 사용자의 직접 검증이 남아 있다.
