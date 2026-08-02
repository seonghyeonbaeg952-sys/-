# 공연 템플릿 캐러셀 비활성 항목 표현 방식 재분류

- 분석 행: **160개** (고유 URL 160개)
- 입력 원장: `sources-a.csv`의 Awwwards 개별 사례 70개 + Codrops 문서·사례 90개
- 분류 방식: 공개 페이지 제목, 메타 설명, Codrops 공식 API 초록에 나타난 직접 단어를 우선하고, 근거가 부족한 항목은 `other`로 배제
- 주의: 이 원장은 대량 근거 분류이며, 모든 외부 라이브 사이트를 동일 브라우저에서 조작한 사용성 시험으로 과장하지 않습니다.

## 패턴 집계

| 패턴 | 수 | SMYC 판단 |
|---|---:|---|
| partial-visible | 16 | 채택 · 적합도 5/5 |
| hidden-offstage | 7 | 조건부 배제 · 적합도 2/5 |
| center-only-fade | 6 | 보조안 · 적합도 3/5 |
| layered-stack | 50 | 조건부 채택 · 적합도 4/5 |
| other | 81 | 배제 · 적합도 1/5 |

## 판정 및 근거 신뢰도

### 판정
- 배제: 81개
- 조건부 채택: 50개
- 채택: 16개
- 조건부 배제: 7개
- 보조안: 6개

### 근거 신뢰도
- 낮음: 81개
- 높음: 52개
- 중간: 27개

## SMYC 최종 선택

**`partial-visible`을 기본으로 채택하고 `layered-stack`은 건축 깊이 표현에만 제한적으로 결합합니다.**

- 중앙 템플릿 1개는 완전한 앞면으로 표시합니다.
- 좌우 템플릿은 같은 CMS 템플릿 컴포넌트를 사용하되, 전면 파사드 마스크 뒤에서 동일 면적만 보이게 합니다.
- 좌우 항목은 약 88~92% 스케일과 약한 명암만 적용해 깊이를 주고, 과도한 회전·3D 왜곡은 사용하지 않습니다.
- 자동 회전은 사용하지 않고, 이전/다음 버튼과 현재 `1 / 3` 상태를 항상 표시합니다.
- 비활성 항목은 `inert`, `aria-hidden=true`, 포커스 제외; 중앙 항목과 외부 설명만 접근성 트리에 남깁니다.
- `prefers-reduced-motion: reduce`에서는 이동 대신 짧은 상태 교체 또는 무전환으로 축소합니다.

부분 노출은 다음 콘텐츠가 있다는 정보 냄새를 제공하면서도, 기준 이미지가 요구하는 ‘건축물 내부 양측 공간’과 ‘전면 가리개 뒤 템플릿’ 구조를 그대로 설명할 수 있습니다. 다만 자동 전환이나 여러 겹의 Z축 중첩은 가독성과 키보드 순서를 해치므로 배제합니다.

## 접근성·모션 판단 기준

- [W3C WAI Carousels Tutorial](https://www.w3.org/WAI/tutorials/carousels/): 이동을 멈출 수 있어야 하고, 키보드 조작과 명확한 컨트롤이 필요합니다.
- [W3C Design System content slider](https://design-system.w3.org/components/slider.html): 한 번에 한 활성 슬라이드와 명시적 컨트롤을 기본 구조로 사용합니다.
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion): 운영체제 모션 감소 설정에 맞춘 대체 전환이 필요합니다.
- [WebAIM Animation and Carousels](https://webaim.org/techniques/carousels/): 캐러셀은 접근성 장벽이 될 수 있으므로 재생·정지와 이전·다음 제어가 핵심입니다.
- [Smashing Magazine carousel UX](https://www.smashingmagazine.com/2022/04/designing-better-carousel-ux/): 마지막 항목 일부 노출이나 페이드 같은 단서가 추가 콘텐츠의 발견 가능성을 높입니다.

## 대표 사례

### partial-visible
- [Parallax Slider with jQuery | Codrops](https://tympanus.net/codrops/2011/01/03/parallax-slider/) — 단서: `slider, parallax`; 판정: 채택
- [The Never Ending Story: Building a Seamless Infinite Scroll Experience with GSAP & Lenis](https://tympanus.net/codrops/2026/05/28/the-never-ending-story-building-a-seamless-infinite-scroll-experience-with-gsap-lenis/) — 단서: `infinite`; 판정: 채택
- [Building a Scroll-Reactive 3D Gallery with Three.js, Velocity, and Mood-Based Backgrounds](https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/) — 단서: `gallery`; 판정: 채택
- [Building a Scroll-Revealed WebGL Gallery with GSAP, Three.js, Astro and Barba.js](https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/) — 단서: `gallery`; 판정: 채택

### hidden-offstage
- [Fluid CSS3 Slideshow with Parallax Effect | Codrops](https://tympanus.net/codrops/2012/04/30/fluid-css3-slideshow-with-parallax-effect/) — 단서: `slideshow`; 판정: 조건부 배제
- [Building an Infinite GSAP Scroll Gallery with Parallax and Flip Transitions](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/) — 단서: `flip transition`; 판정: 조건부 배제
- [A Playful Clip Menu with GSAP’s easeReverse](https://tympanus.net/codrops/2026/04/22/a-playful-clip-menu-with-gsaps-easereverse/) — 단서: `clip`; 판정: 조건부 배제
- [SVG Mask Transitions on Scroll with GSAP and ScrollTrigger](https://tympanus.net/codrops/2026/03/11/svg-mask-transitions-on-scroll-with-gsap-and-scrolltrigger/) — 단서: `mask`; 판정: 조건부 배제

### center-only-fade
- [WebGL for Designers: Creating Interactive, Shader-Driven Graphics Directly in the Browser](https://tympanus.net/codrops/2026/03/04/webgl-for-designers-creating-interactive-shader-driven-graphics-directly-in-the-browser/) — 단서: `shader`; 판정: 보조안
- [Creating Wavy Infinite Carousels in React Three Fiber with GLSL Shaders](https://tympanus.net/codrops/2025/11/26/creating-wavy-infinite-carousels-in-react-three-fiber-with-glsl-shaders/) — 단서: `shader`; 판정: 보조안
- [How to Animate WebGL Shaders with GSAP: Ripples, Reveals, and Dynamic Blur Effects](https://tympanus.net/codrops/2025/10/08/how-to-animate-webgl-shaders-with-gsap-ripples-reveals-and-dynamic-blur-effects/) — 단서: `blur, shader`; 판정: 보조안
- [From Shader Uniforms to Clip-Path Wipes: How GSAP Drives My Portfolio](https://tympanus.net/codrops/2026/05/06/from-shader-uniforms-to-clip-path-wipes-how-gsap-drives-my-portfolio/) — 단서: `shader`; 판정: 보조안

### layered-stack
- [perspective | Codrops](https://tympanus.net/codrops/css_reference/perspective/) — 단서: `perspective`; 판정: 조건부 채택
- [perspective-origin | Codrops](https://tympanus.net/codrops/?p=21765) — 단서: `perspective`; 판정: 조건부 채택
- [Image Techniques for Creating Depth in Web Design | Codrops](https://tympanus.net/codrops/2013/02/27/image-techniques-for-creating-depth-in-web-design/) — 단서: `depth`; 판정: 조건부 채택
- [Interactive Storytelling for the Web: Building Immersive Stories with Timelines, 3D, and Layered Scenes](https://tympanus.net/codrops/2026/04/20/interactive-storytelling-for-the-web-building-immersive-stories-with-timelines-3d-and-layered-scenes/) — 단서: `layered, layer, 3d, immersive`; 판정: 조건부 채택

### other
- [Hearst Exhibit 2026 - Awwwards SOTD](https://www.awwwards.com/sites/hearst-exhibit-2026) — 단서: `직접 단서 없음`; 판정: 배제
- [2xA Studio - Awwwards SOTD](https://www.awwwards.com/sites/2xa-studio) — 단서: `직접 단서 없음`; 판정: 배제
- [Made With Gsap - Awwwards SOTD](https://www.awwwards.com/sites/made-with-gsap-1) — 단서: `직접 단서 없음`; 판정: 배제
- [Obys® Experiment Space - Awwwards SOTD](https://www.awwwards.com/sites/obys-r-experiment-space) — 단서: `직접 단서 없음`; 판정: 배제
