# Home Copy V2 감사

작성일: 2026-07-23  
대상: 현재 `/` V2 홈, 관리자 CMS, `site_texts`, 관련 동적 데이터 테이블  
원칙: 이 문서가 완성되기 전에는 기존 관리자 필드나 DB 컬럼을 삭제하지 않는다.

## 결론

현재 홈의 시각 구조와 모션 순서는 V2 요구와 일치한다. 문제는 문구 소유권이다.

- 홈 문구는 `site_texts`, 구형 `site_settings` 홈 컬럼, 컴포넌트 상수에 분산되어 있다.
- Hero 문구는 `hero_slides`, `site_texts`, `site_settings`에 중복되어 있지만 공개 화면은 주로 `site_texts`만 표시한다.
- 입단 요약은 `join_info`가 있는데도 홈 전용 `site_texts`에 중복 저장된다.
- Choir Program, MOTET SCORE 일부, Spirit wrapper, Archive 펼치기/접기, Sponsor wrapper는 공개 화면에 존재하지만 관리 필드가 없다.
- 관리자에서 “현재 사용”으로 보이지만 공개 소비자가 없는 키가 있고, 공개가 읽지만 관리자 정의가 없는 키도 있다.
- 기존 값을 잃지 않으려면 먼저 canonical V2 key로 값을 이관하고, 그 뒤 legacy key를 비활성화해야 한다.

최종 소유권은 다음처럼 정리한다.

- 홈 화면의 presentation copy: `site_texts`의 V2 canonical key
- Hero 슬라이드별 문구·이미지·CTA: `hero_slides`
- 실제 입단 정보: `join_info`
- 공연·공지: `concerts`, `notices`
- 정신 상세 항목: `about_sections`
- 사진·영상·포스터: `gallery`, `videos`, `posters`
- 후원사: `sponsors`
- 후원 약정: `support_settings`
- 연락처·SNS·사이트 기본 정보: `site_settings` 및 기존 전용 설정 화면
- Footer: PublicLayout/Footer 소유이며 홈 문구 CMS에서 제외

## 실제 렌더 경로와 섹션 순서

실제 `/` 렌더 경로:

```text
App.tsx
└─ PublicLayout
   ├─ Header
   ├─ HomeRoute
   │  └─ HomeSectionFlowPage
   │     └─ HomePage(mode="section-flow-sample", spiritPresentation="editorial")
   │        ├─ HomeHeroSlideshow
   │        ├─ HomePopupManager
   │        ├─ FloatingInfoCards
   │        ├─ AboutPreview
   │        │  ├─ GlobalIdentityPlate
   │        │  └─ Choir Program
   │        ├─ JoinCTA
   │        ├─ PerformanceNewsPreview
   │        ├─ ScrollScoreBookReveal
   │        ├─ HomeSpiritScoreBook
   │        │  └─ HomeSpiritEditorial
   │        ├─ GalleryPreview
   │        │  └─ ArchivePageStack
   │        ├─ SponsorQuietMarquee
   │        └─ SupportLetterFold
   └─ Footer
```

근거:

- `/`: `src/App.tsx`
- 기본 홈 분기: `src/pages/public/HomeRoute.tsx`
- V2 샘플 모드 전달: `src/pages/public/HomeSectionFlowSamplePage.tsx`
- Footer가 HomePage 밖에서 렌더됨: `src/components/layout/PublicLayout.tsx`

현재 `data-flow-section` 순서:

1. `hero`
2. `quick`
3. `about`
4. `join-letter`
5. `concert-program`
6. `score-book`
7. `spirit`
8. `archive-stack`
9. `sponsors` — 공개할 후원사가 있을 때만
10. `support-letter`
11. `footer`

이 순서, 현재 색상, M자 전환 장식, Score 애니메이션, Spirit 인터랙션, Archive 인터랙션은 유지 대상이다.

## 화면별 문구 소유권

| Public 화면 | 실제 문구/역할 | 렌더 컴포넌트 | 현재 데이터 출처 | 현재 관리자 위치 | DB key/테이블 | 최종 소유권 | 처리 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hero | 슬라이드 이미지·순서·공개 여부 | `HomeHeroSlideshow` | `hero_slides` | `/admin/hero-slides` | `hero_slides` | Hero 관리 | KEEP |
| Hero | 슬라이드 title/subtitle/description/CTA | `HomeHeroSlideshow` | 저장은 `hero_slides`, 현재 title은 dot aria에만 사용하고 나머지는 미표시 | `/admin/hero-slides` | `hero_slides.*` | Hero 관리 | MIGRATE consumer |
| Hero | 공통 영문 wordmark와 시스템 라벨 | `HomeHeroSlideshow` | 컴포넌트 상수 | 없음 | 없음 | 코드 | FIXED_DESIGN_LABEL |
| Hero | 가치 칩 3개 | `HomeHeroSlideshow` | `site_texts` | `/admin/site-texts` | `home.hero.chip1..3` | Home CMS | KEEP/MIGRATE |
| Hero | 슬라이드가 없을 때 설명 fallback | `HomeHeroSlideshow` | `site_texts` + `site_settings` | 분산 | `home.hero.subtitle`, legacy 설정 컬럼 | Home CMS | MIGRATE |
| Quick | 카드 title/description | `FloatingInfoCards` | `site_texts` | `/admin/site-texts` | `home.quick.{join,concert,support}.*` | Home CMS | KEEP |
| Quick | CTA label/공개 여부/순서 | `FloatingInfoCards` | 코드 고정 또는 없음 | 없음 | 없음 | Home CMS | ADD |
| Quick | JOIN/STAGE/CONNECT, 번호, VIEW | `FloatingInfoCards` | 컴포넌트 상수 | 없음 | 없음 | 코드 | FIXED_DESIGN_LABEL |
| Quick | route | `HomePage` | 코드 고정 | 없음 | 없음 | 코드 허용 목록 | KEEP |
| About | eyebrow/title/본문/CTA | `AboutPreview` | `site_texts`, 일부 `about_sections`·`site_settings` fallback | `/admin/site-texts` | `home.about.*` | Home CMS | KEEP/MIGRATE |
| Global Identity | tagline/description | `GlobalIdentityPlate` | 미정의 `site_texts` key + 코드 fallback | 없음 | `home.global.*` | Home CMS | ADD |
| Global Identity | SNS | `GlobalIdentityPlate` | `site_settings` | `/admin/settings` | `site_settings.*_url` | 사이트 설정 | MANAGED_ELSEWHERE |
| Global Identity | 다음 공연 | `GlobalIdentityPlate` | `concerts` | `/admin/concerts` | `concerts` | 공연 관리 | DERIVED |
| Global Identity | NEXT STAGE, facts | `GlobalIdentityPlate` | 컴포넌트 상수 | 없음 | 없음 | 코드 | FIXED_DESIGN_LABEL |
| Choir Program | 제목과 4개 카드 | `AboutPreview` | 컴포넌트 하드코딩 | 없음 | 없음 | Home CMS | ADD |
| Join Letter | eyebrow/title/body/CTA | `JoinCTA` | `site_texts` | `/admin/site-texts` | `home.join.{kicker,title,body,cta}` | Home CMS | KEEP |
| Join Letter | 모집 대상/연습/절차 | `JoinCTA` | 홈 전용 `site_texts` | `/admin/site-texts`와 `/admin/join` 중복 | `home.join.{target,schedule,process}`, `join_info` | 입단 관리 | DERIVED/MANAGED_ELSEWHERE |
| Concert Program | wrapper title/body/CTA | `PerformanceNewsPreview` | `site_texts` | `/admin/site-texts` | `home.concert.*` | Home CMS | KEEP |
| Concert Program | 공연/공지 실제 데이터 | 하위 카드 | `concerts`, `notices` | `/admin/concerts`, `/admin/notices` | 각 테이블 | 전용 관리 | MANAGED_ELSEWHERE |
| Concert Program | 공연/공지 빈 상태 | 하위 카드 | 컴포넌트 상수 | 없음 | 없음 | Home CMS | ADD |
| Concert Program | PROGRAM, DATE/TIME/PLACE 등 악보형 라벨 | 하위 카드 | 컴포넌트 상수 | 없음 | 없음 | 코드 | FIXED_DESIGN_LABEL |
| MOTET SCORE | cover/left/right/final/value copy | `ScrollScoreBookReveal` | 일부 `site_texts`, 대부분 하드코딩 | `/admin/site-texts` 일부 | `home.score.*` | Home CMS | ADD/MIGRATE |
| MOTET SCORE | MOTET SCORE, VOICE, S·A, T·B, 성부명 | `ScrollScoreBookReveal` | 컴포넌트 상수 | 없음 | 없음 | 코드 | FIXED_DESIGN_LABEL |
| Spirit | 상세 5항목 | `HomeSpiritEditorial` | `about_sections` | `/admin/about` | `home_spirit_*` | 합창단 정신 관리 | MANAGED_ELSEWHERE |
| Spirit | wrapper title/eyebrow/default CTA | `HomeSpiritEditorial` | 하드코딩 | 없음 | 없음 | Home CMS | ADD |
| Archive | wrapper eyebrow/title/description/CTA | `GalleryPreview`, `ArchivePageStack` | 일부 `site_texts`, 일부 하드코딩 | `/admin/site-texts` | `home.gallery.*` | Home CMS | MIGRATE |
| Archive | 펼치기/접기 | `ArchivePageStack` | 하드코딩 | 없음 | 없음 | Home CMS | ADD |
| Archive | 실제 미디어 | `ArchivePageStack` | gallery/videos/posters | 전용 관리자 메뉴 | 각 테이블 | 전용 관리 | MANAGED_ELSEWHERE |
| Sponsors | wrapper 문구 | `SponsorQuietMarquee` | `HOME_SPONSOR_COPY` 상수 | 없음 | 없음 | Home CMS | ADD |
| Sponsors | 로고/기관명/URL/순서/공개 | `SponsorQuietMarquee` | `sponsors` | `/admin/sponsors` | `sponsors` | 후원사 관리 | MANAGED_ELSEWHERE |
| Support Letter | title/body/두 CTA/card copy | `SupportLetterFold` | `site_texts` | `/admin/site-texts` | `home.support.*` | Home CMS | KEEP/MIGRATE |
| Support Letter | 전화/주소 | `SupportLetterFold` | `site_settings`, legacy fallback | `/admin/settings` | `site_settings` | 사이트 설정 | MANAGED_ELSEWHERE |
| Support Letter | SUPPORT/PLEDGE LETTER | `SupportLetterFold` | 컴포넌트 상수 | 없음 | 없음 | 코드 또는 wrapper CMS | FIXED_DESIGN_LABEL/ADD |
| Footer | tagline/quick links/contact/sponsor | `Footer` | `site_texts`, settings, sponsors | 전용 설정들 | 여러 테이블 | PublicLayout/Footer | MANAGED_ELSEWHERE |

## 현재 관리자 Home 문구 필드 전체

현재 `/admin/site-texts`가 정의하는 홈 계열은 다음과 같다.

### Hero

- `home.hero.title.line1`
- `home.hero.title.line2`
- `home.hero.title.line3`
- `home.hero.title.line4`
- `home.hero.subtitle`
- `home.hero.eyebrow`
- `home.hero.chip1`
- `home.hero.chip2`
- `home.hero.chip3`
- `home.hero.cta.primary`
- `home.hero.cta.secondary`

판정:

- title/eyebrow/CTA는 `hero_slides`와 중복이므로 Home CMS에서 제거한다.
- 영문 wordmark와 한글 cue는 고정 디자인 라벨로 유지한다.
- Home CMS에는 motto chips와 slide 0개 시 fallback description만 둔다.

### Quick

- `home.quick.join.{title,description}`
- `home.quick.concert.{title,description}`
- `home.quick.support.{title,description}`
- `home.quick.gallery.{title,description}`

판정:

- 앞의 3개는 유지하고 CTA label/공개 여부/순서를 추가한다.
- gallery 슬롯은 현재 V2가 3개 카드만 사용하므로 DEPRECATE한다.

### About / Join / Concert / Score / Archive / Support

- `home.about.{kicker,title,body,cta}`
- `home.join.{kicker,title,body,target,schedule,process,cta}`
- `home.concert.{kicker,title,description}`
- `home.concert.cta.{schedule,notice,more,inquiry}`
- `home.score.cover.{title,body}`
- `home.score.left.{kicker,title,body}`
- `home.score.right.{title,body}`
- `home.score.final.{title,body}`
- `home.score.value.list`
- `home.gallery.{kicker,title,description,cta}`
- `home.gallery.empty.{title,description}`
- `home.support.{title,description}`
- `home.support.cta.{primary,secondary}`
- `home.support.card.{title,description}`
- `home.support.short.cta`

판정:

- About wrapper는 유지하고 Global/Choir Program 필드를 추가한다.
- Join target/schedule/process는 `join_info`에서 파생하도록 Home 입력에서 제거한다.
- Concert wrapper는 유지하고 빈 상태 문구를 추가한다.
- Score는 현재 정의만 있고 미소비인 left fields를 실제 consumer에 연결하고 나머지 copy를 구조화해 추가한다.
- Archive는 새 canonical `home.archive.*`로 이관한다.
- Support는 새 canonical `home.supportLetter.*`로 이관한다.
- `home.support.short.cta`는 소비자가 없으므로 DEPRECATE한다.

## 공개가 읽지만 관리자 정의가 없는 key

- `home.global.tagline`
- `home.global.description`
- `home.concert.eyebrow`
- `home.hero.primaryButton`
- `home.hero.secondaryButton`
- `home.join.button`
- `home.join.description`

마지막 다섯 개는 canonical key의 중첩 fallback으로만 사용된다. V2 migration에서 기존 값을 canonical key로 옮긴 뒤 public consumer를 제거한다.

## 관리자 정의는 있지만 공개 소비자가 없는 key

- `home.hero.title`
- `home.hero.description`
- `home.quick.gallery.title`
- `home.quick.gallery.description`
- `home.score.left.kicker`
- `home.score.left.title`
- `home.score.left.body`
- `home.support.short.cta`

추가로 전체 public 호출이 없는 공통/푸터 정의:

- `common.cta.join`
- `common.cta.concert`
- `footer.privacy`

처리:

- `home.score.left.*`는 V2 Score consumer에 연결하므로 MIGRATE한다.
- 나머지 미사용 키는 migration에서 값을 보존한 채 `is_active=false`로 전환한다.
- DB row와 구형 컬럼은 이번 단계에서 물리 DROP하지 않는다.

## 공개에만 존재하는 하드코딩 운영 문구

- Choir Program title과 4개 카드
- Global Identity tagline/description fallback
- Quick action CTA label
- 공연·공지 빈 상태
- MOTET SCORE left/right keywords, callout, 가치 단어 설명, 최종 CTA
- Spirit wrapper 제목/eyebrow/default CTA
- Archive visible title, 펼치기/접기
- Sponsor wrapper
- Support pledge eyebrow

이 항목들은 V2 Home CMS에 추가한다. 반면 다음은 운영자가 바꿀 이유가 낮은 시각·접근성 시스템 라벨로 남긴다.

- Hero 영문 wordmark
- 현재 슬라이드 n/n, 이전/다음, 자동 재생/일시정지
- JOIN/STAGE/CONNECT, VIEW, 카드 번호
- NEXT STAGE
- PROGRAM, DATE, TIME, PLACE
- MOTET SCORE, VOICE, S·A, T·B, 성부명
- ARCHIVE BOOK
- FIVE MOVEMENTS/MOTET SPIRIT
- 장식 악보 기호, 페이지 번호, note glyph
- aria-live 상태 문구와 키보드 조작 안내

## MANAGED_ELSEWHERE

Home CMS에서 중복 입력을 만들지 않는다.

| 데이터 | 소유 화면 | 공개 source |
| --- | --- | --- |
| Hero 슬라이드 title/subtitle/description/image/alt/CTA/order/visibility | `/admin/hero-slides` | `hero_slides` |
| 입단 대상/연습/오디션/지원서/FAQ | `/admin/join` | `join_info`, `faq` |
| 공연 | `/admin/concerts` | `concerts` |
| 공지 | `/admin/notices` | `notices` |
| 정신 상세 5항목 | `/admin/about` | `about_sections.home_spirit_*` |
| 사진 | `/admin/gallery` | `gallery` |
| 영상 | `/admin/videos` | `videos` |
| 포스터 | `/admin/posters` | `posters` |
| 후원사 로고/기관/URL/순서 | `/admin/sponsors` | `sponsors` |
| 후원 약정 정책 | `/admin/support` | `support_settings` |
| 전화/주소/이메일/SNS | `/admin/settings` 및 현재 위치 설정 | `site_settings`/`locations` |
| Footer | PublicLayout 관련 설정 | `site_texts` footer keys, settings, sponsors |

관리자 Home 화면은 위 항목을 편집 필드로 보여주지 않고 설명과 바로가기를 제공한다.

## Legacy key 이관 계획

| Legacy | V2 canonical | 규칙 |
| --- | --- | --- |
| `home.quick.1.*` | `home.quick.join.*` | canonical value가 비어 있을 때만 복사 |
| `home.quick.2.*` | `home.quick.concert.*` | canonical value가 비어 있을 때만 복사 |
| `home.quick.3.*` | `home.quick.support.*` | canonical value가 비어 있을 때만 복사 |
| `home.join.description` | `home.join.body` | canonical value가 비어 있을 때만 복사 |
| `home.join.button` | `home.join.cta` | canonical value가 비어 있을 때만 복사 |
| `home.concert.concertButton` | `home.concert.cta.schedule` | canonical value가 비어 있을 때만 복사 |
| `home.concert.noticeButton` | `home.concert.cta.notice` | canonical value가 비어 있을 때만 복사 |
| `home.concert.sectionTitle` | `home.concert.title` | canonical value가 비어 있을 때만 복사 |
| `home.scorebook.coverTitle` | `home.score.cover.title` | canonical value가 비어 있을 때만 복사 |
| `home.scorebook.coverDescription` | `home.score.cover.body` | canonical value가 비어 있을 때만 복사 |
| `home.scorebook.rightTitle` | `home.score.right.title` | canonical value가 비어 있을 때만 복사 |
| `home.scorebook.finalTitle` | `home.score.final.title` | canonical value가 비어 있을 때만 복사 |
| `home.scorebook.finalDescription` | `home.score.final.body` | canonical value가 비어 있을 때만 복사 |
| `home.gallery.eyebrow` | `home.archive.eyebrowEn` | canonical value가 비어 있을 때만 복사 |
| `home.gallery.sectionTitle` | `home.archive.title` | canonical value가 비어 있을 때만 복사 |
| `home.gallery.sectionDescription` | `home.archive.description` | canonical value가 비어 있을 때만 복사 |
| `home.support.button` | `home.supportLetter.primaryCtaLabel` | canonical value가 비어 있을 때만 복사 |
| `home.support.secondaryButton` | `home.supportLetter.secondaryCtaLabel` | canonical value가 비어 있을 때만 복사 |
| `home.support.cardTitle` | `home.supportLetter.pledgeTitle` | canonical value가 비어 있을 때만 복사 |
| `home.support.cardDescription` | `home.supportLetter.pledgeDescription` | canonical value가 비어 있을 때만 복사 |

현재 canonical `home.gallery.*`, `home.support.*` 값도 각각 `home.archive.*`, `home.supportLetter.*`로 같은 규칙으로 이관한다.

Migration 순서:

1. V2 key를 additive insert한다.
2. 기존 canonical/legacy 값 중 운영자가 입력한 non-empty `value`를 V2 key로 복사한다.
3. metadata/default를 V2 정의로 갱신하되 운영자 `value`는 덮어쓰지 않는다.
4. V2 public/admin 배포가 끝난 뒤 legacy row를 `is_active=false`로 만든다.
5. row와 구형 `site_settings` 컬럼은 보존한다.
6. 물리 DROP은 별도 destructive migration으로 분리한다.

## 구형 `site_settings` 홈 컬럼

런타임 consumer가 없는 강한 DEPRECATE 후보:

- `home_info_card_1_*`
- `home_info_card_2_*`
- `home_info_card_3_*`
- `home_concerts_*`
- `home_notices_*`
- `home_join_*`
- `home_support_*`
- `join_cta_text`
- `support_text`

아직 fallback으로 읽는 항목:

- `hero_title`
- `hero_subtitle`
- `home_hero_eyebrow`
- `home_hero_description`
- `home_about_*`
- `home_gallery_*`

V2 normalizer가 전부 대체하기 전까지는 삭제하지 않는다. 이번 migration에서도 컬럼 DROP은 하지 않는다.

## 미사용 컴포넌트 후보

전역 import 검색에서 선언 파일 외 참조가 없는 후보:

- `src/components/home/ConcertTemplatePanel.tsx`
- `src/components/home/NoticePreview.tsx`
- `src/components/home/SupportCTA.tsx`
- `src/components/home/UpcomingConcertsPreview.tsx`

이 파일들은 이번 CMS 계약 작업과 무관한 시각 코드일 수 있으므로 바로 삭제하지 않는다. build/test/CSS 참조까지 확인한 뒤 별도 정리 대상으로 남긴다.

## 데이터 계약 위험

현재 `createSiteTextMap`은 DB row가 0개일 때만 모든 기본값을 채우고, 한 행이라도 있으면 누락 key를 전체 기본값으로 채우지 않는다. 따라서 부분 seed 환경과 빈 DB 환경에서 fallback 소유자가 달라진다.

V2에서는:

- `normalizeHomeContentV2`가 항상 동일한 `HOME_CONTENT_DEFAULTS_V2`에서 시작한다.
- DB에는 V2 canonical key만 저장한다.
- legacy key는 `migrateHomeContentV1ToV2`에서만 읽는다.
- public 컴포넌트는 normalized `HomeContentV2`만 소비한다.
- 빈 문자열, 잘못된 boolean/order, 누락 배열은 runtime normalizer가 복구한다.
- 관리자 field definition과 public consumer key를 같은 manifest에서 생성한다.

## 삭제 허용 기준

아래 조건을 모두 만족할 때만 관리자 필드 또는 key를 제거한다.

1. public consumer가 V2 canonical key만 사용한다.
2. 기존 운영자 값이 V2 key에 이관된다.
3. 관리자 UI에서 legacy key를 더 이상 저장하지 않는다.
4. 계약 검증이 deprecated key의 V2 payload 포함을 거부한다.
5. `pnpm check:home-copy-contract`, lint, build가 통과한다.
6. 실제 Home CMS 수정값이 public에 반영되는 것을 확인한다.

이 감사 기준에서는 legacy DB row를 물리 삭제하거나 구형 컬럼을 DROP할 근거가 아직 없다. 따라서 이번 단계는 비활성화와 consumer 제거까지만 수행한다.
