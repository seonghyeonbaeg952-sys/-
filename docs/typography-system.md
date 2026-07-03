# SMYC Typography System

서울모테트청소년합창단 홈페이지는 한글 Serif 사용을 중단하고, 한글은 현대적인 Display Sans 중심으로 통일한다. 전통성과 신앙적 깊이는 궁서체처럼 보일 수 있는 세리프가 아니라 글자 굵기, 자간, 색상, 여백, 오선지 모티프로 표현한다.

## Font Stack

```css
--font-sans-kr:
  "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont,
  system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;

--font-heading-kr:
  "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont,
  system-ui, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif;

--font-display-en:
  "Cormorant Garamond", Georgia, "Times New Roman", serif;

/* Deprecated alias: compatibility only. Korean text should not render as serif. */
--font-serif-kr: var(--font-heading-kr);
```

실제 웹폰트는 `index.html`에서 Pretendard Variable dynamic subset과 Cormorant Garamond stylesheet로 로드한다. 저장소에는 폰트 파일을 직접 포함하지 않는다.

## Role

- Korean Display Sans: Hero headline, Page title, Section title, Spirit manifesto, Join/Support emotional headline
- Korean Sans: body text, menu, button, tabs, card metadata, forms, admin CMS
- English Display Serif: MOTET, SPIRIT, LEGACY, PARTNERS, SUPPORT, JOIN THE CHOIR 같은 영문 장식 라벨

관리자 CMS는 감성 타이포그래피를 쓰지 않고 `.admin-shell` 기준으로 산세리프만 사용한다.

## Why Korean Serif Was Removed

한글 Serif는 공식 문서나 기념비 같은 인상을 줄 수 있어 청소년합창단의 미래성, 교육성, 공동체성을 충분히 살리지 못한다. 현재 사이트는 Deep Navy, Warm Gold, Ivory, 오선지 모티프가 이미 전통성과 공연예술의 분위기를 만들고 있으므로, 한글 타이포그래피는 절제된 현대 산세리프가 더 적합하다.

## CSS Utilities

- `.type-hero-title`: Pretendard Variable 820, Hero headline
- `.type-page-title`: Pretendard Variable 800, page title
- `.type-section-title`: Pretendard Variable 760, section title
- `.type-manifesto`: Pretendard Variable 620, manifesto/emotional copy
- `.type-body`: Pretendard Variable 400, body text
- `.type-body-strong`: Pretendard Variable 620, emphasized body
- `.type-eyebrow`: Pretendard Variable 820, small uppercase label
- `.type-card-title`: Pretendard Variable 760, expressive Korean card title
- `.type-card-title-sans`: Pretendard Variable 800, UI-like Korean card title
- `.type-display-en`: Cormorant Garamond, English display only
- `.type-date`: Pretendard Variable 820, tabular numeric date
- `.type-number`: Pretendard Variable 820, tabular numeric value
- `.type-button`: Pretendard Variable 800, button label

모바일에서는 제목류의 크기와 행간을 낮춰 긴 한국어 제목이 세로로 과하게 늘어나지 않도록 보정한다.

## Figma Text Styles

Figma 파일 `SMYC Global Arts Polish QA`의 `SMYC Typography System` 기준 Text Style 이름은 아래처럼 정리한다.

- `SMYC / Hero / KR Display Sans`
- `SMYC / Page Title / KR Display Sans`
- `SMYC / Section Title / KR Display Sans`
- `SMYC / Manifesto / KR Display Sans`
- `SMYC / Body / KR Sans`
- `SMYC / Body Strong / KR Sans`
- `SMYC / Eyebrow / KR Sans`
- `SMYC / Card Title / KR Display Sans`
- `SMYC / Card Title / KR Sans`
- `SMYC / Display / EN Serif`
- `SMYC / Date Number / KR Sans`
- `SMYC / Button / KR Sans`
- `SMYC Admin / Body / KR Sans`

기존 한글 세리프 계열 명칭은 더 이상 사용하지 않는다.

## Applied Pages

- `/`: Home Hero, About Preview, Concert Preview, Sponsor Strip
- `/spirit`: Hero, manifesto, MOTET wordmark, values, legacy, CTA
- `/about`: PageHero and shared content headings
- `/concerts`: shared PageHero and section/card typography
- `/gallery`: shared PageHero and section/card typography
- `/join`: shared PageHero and section/card typography
- `/contact?section=support`: shared PageHero, support form, sponsor section
- `/contact?section=sponsors`: sponsor section and sponsor cards
- `/admin`: sans-only admin shell

## Performance And Accessibility

- `display=swap`을 사용해 웹폰트 로딩 중에도 텍스트가 보이도록 한다.
- `word-break: keep-all`과 `overflow-wrap: break-word`를 함께 사용해 한국어 제목의 어색한 한 글자 줄바꿈을 줄인다.
- 숫자/날짜는 `font-variant-numeric: tabular-nums`로 폭 흔들림을 줄인다.
- 버튼과 form UI는 모두 산세리프를 유지해 조작성이 떨어지지 않게 한다.
- `prefers-reduced-motion`은 기존 전역 motion-reduce 규칙을 유지한다.

## Maintenance Notes

- 새로운 public 페이지의 한글 제목은 `.type-section-title` 또는 `.type-page-title`을 우선 사용한다.
- 본문은 `.type-body`, 강조 본문은 `.type-body-strong`을 우선 사용한다.
- 영문 장식 wordmark나 라벨에만 `.type-display-en`을 사용한다.
- 관리자 화면에는 display utility를 적용하지 않는다.

