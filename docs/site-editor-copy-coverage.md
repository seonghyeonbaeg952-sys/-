# 공개 화면 편집 연결 범위

2026-09-18 소스·SSR 감사 기준. 이 문서는 새 화면 편집기의 실제 소비 위치를 기록한다. 기존 전용 CMS 콘텐츠를 복제하지 않으며, 아래 연결 수가 홈페이지의 모든 문자열을 뜻하지는 않는다. **전 공개 문자열 100% 편집 완료라는 결론은 아니다.**

## 명시적 카탈로그

`src/content/siteCopyCatalog.ts`가 최종 목록이다. 현재 1,247개 키이며 중복 키는 0개다(실제 Vite SSR 모듈을 로드해 집계). 입력 키는 JSX의 `SiteCopy`/`copyText`, 페이지별 `usePageCopy`, 메뉴 매핑 또는 기존 홈 데이터 어댑터가 읽는다. DOM에서 문자열을 검색·치환하지 않는다. 관리자 카탈로그는 public 홈 런타임 어댑터(`lib/homeEditorOverrides.ts`)와 분리해 방문자에게 내려보내지 않는다.

| 화면 | 키 수 | 실제 소비 위치 |
|---|---:|---|
| 공통 | 113 | 실제 V4 헤더·모바일 메뉴·메가 메뉴, Footer, 지도·브랜드·부팅·404 보조 안내 |
| 홈 | 401 | 기존 기기별 콘텐츠와 홈 섹션들의 고정 안내·접근성 라벨 |
| 합창단 소개 | 103 | AboutOverviewExperience, AboutPage |
| 합창단 정신 | 129 | SpiritHeritageExperience, SpiritPage |
| 지휘자 | 13 | ConductorProfileDocument |
| 반주자 | 14 | AccompanistProfiles |
| 단원 | 45 | MembersArchiveExperience |
| 연혁 | 23 | HistoryCueSheetExperience |
| 공연 목록 | 68 | ConcertsPage, FeaturedStage, ConcertFilterDrawer |
| 공연 상세 | 28 | ConcertDetailPage, ConcertInformation, ConcertPoster |
| 공지 목록 | 35 | NoticesPage |
| 공지 상세 | 20 | NoticeDetailPage |
| 갤러리 | 58 | GalleryPage, GalleryViewer |
| 입단 | 71 | JoinGuide, JoinApplicationForm, JoinPageState |
| 후원·문의 | 126 | ContactPage, ContactInquiryForm, SupportPledgeForm, SponsorsSection |

홈 항목은 기존 `homeAllEditorFields`의 key/sourceKey/device/inputType/min/max/maxLength/defaultValue를 재사용한다. `getSiteCopyDefaults()`는 기존 CMS 값을 `createHomeEditorValues()`로 읽는다. 새 문서는 기존 `site_texts`를 쓰지 않는다. 구조·표시순서·공개값은 기존 정규화를 거치며, 명시적인 편집 텍스트는 그 후 빈 문자열·공백·줄바꿈을 보존한다. 기기별 override가 없는 원본은 기존 렌더러와 같다.

## 기존 전용 CMS가 계속 원본인 내용

- 공연·공지 제목/본문/일정/예매 URL, 사진·영상·포스터 자료
- 인물 이름/사진/약력, 안전한 공개 단원 명단, 연혁 기록
- 모집 안내/기간/FAQ, 후원약정 원문·개인정보 동의·인쇄 안내·후원금·계좌, 후원사·위치·연락처

이 내용의 편집 입구는 `siteEditorPages[].contentLinks`다. 날짜·수량·금액 계산, 라우트/ID/enum 값, 실제 접수 답변과 관리자 보안 오류는 문구 override로 바꾸지 않는다.

## 게시본·초안·미리보기 경계

- public은 `loadPublicEditorPages()`의 게시 문서만 읽는다. 초안·이력 조회를 호출하지 않는다.
- 최초 게시본 조회 때문에 기존 페이지를 숨기거나 새 wrapper/로딩 화면을 추가하지 않는다. 기본 홈페이지는 그대로 렌더링하며 조회된 게시 override만 적용한다. 조회 함수의 8초 제한시간은 실패 처리 경계이며 공개 화면 전체를 8초 숨기는 설정이 아니다. 후속 주기·포커스 갱신도 페이지를 다시 숨기지 않는다.
- iframe 미리보기는 `ready → draft(sequence) → applied(sequence)`로 동작한다. 출처, 부모/자식 창, protocol version, UUID nonce, page, 전체 문서 schema와 증가하는 sequence를 검사한다.
- nonce는 iframe URL과 메모리에만 존재한다. 초안은 브라우저 저장소나 공유 URL에 저장하지 않는다. 라우터가 query를 재구성해도 preview 표시와 제출 차단은 유지된다.
- 미리보기에서는 선택한 페이지 안의 query/anchor만 이동하며 외부·파일·관리자·다른 페이지 링크를 차단한다. 검색 폼은 사용할 수 있고 실제 접수 폼은 capture 단계에서 차단한다. API 진입점 차단은 별도로 적용한다.
- 글꼴/기기별 CSS는 공개 페이지에만 적용한다. 공통 → 해당 페이지 디자인 순서다. 기존 로컬 Gothic A1 서체 별칭을 등록했으며 외부 폰트 URL은 추가하지 않았다.

## 검증과 확인 한계

- preview protocol, nonce 유지, 페이지 판정, 홈 기기별 분리/원문/빈 문자열, 최초 조회 성공·오류·시간초과 테스트를 추가했다.
- About/Spirit 담당의 6개 화면 SSR 비교는 override가 없을 때 기존 렌더링 해시가 동일하며, 도메인 CMS 본문·명단·링크를 교체하지 않음을 검사한다.
- 후원약정의 원문/개인정보/서명/인쇄/중복 제출 회귀 및 라벨 편집만으로 접수가 발생하지 않는 테스트를 실행했다.
- 실제 브라우저의 iframe 크기·렌더링·키보드·게시 흐름 검증은 종합 QA에서 별도로 기록해야 한다. 소스/SSR 검증을 실제 브라우저 확인으로 표현하지 않는다.

## 추가 JSX 연결과 남은 감사 범위

273개의 안정 키를 추가해 48개 파일의 292개 JSX 고정 문자열/속성 사용처를 연결했다. 같은 컴포넌트에서 같은 원문을 반복하는 경우 키를 공유한다. `scripts/public-copy-inventory.mjs`와 계약 테스트가 지정 public import graph의 JSX 텍스트/문자열 속성을 검사한다. 변경 전 마크업 기본값은 `public-copy-default-baseline.json`에 보존했다. 기본 텍스트·속성·링크·JSX 구조는 이 비교에서 동일하며, 6개 소개 화면은 더 이전 기준의 실제 SSR 해시도 그대로 통과했다.

32개 제외 사용처는 과거 독립 시안/벤치마크, 글자별로 구성한 애니메이션 로고, honeypot, 법적 동의 문구다. 개인정보 동의는 디자인용 override로 임의 교체하지 않는다. 특히 과거 접수에 현재 법적 문구를 소급해 넣지 않는다.

JSX 검사만으로 모든 JS 상수·서버 오류까지 전수 연결했다고 주장하지 않는다. 아래 9월 18일 추가 감사에서 직접 조건식과 주요 분류 표시를 보완했다. `about?section=all`은 합성된 소개 화면이므로 appearance는 about 설정을 사용한다. 각 하위 소개 화면의 copy는 고유 페이지 키를 읽고, 개별 appearance는 section 전용 경로에서 적용한다.

## 2026-09-18 실제 누락 보완

총 150개 항목을 추가했다. 기본 문구·링크·enum·디자인은 변경하지 않았다.

- 같은 href지만 다른 라벨인 10곳을 분리했다. 예: `/concerts`의 `공연·소식`/`공연 일정`, 지휘자 링크의 `지휘자·반주자`/`지휘자`/`지휘자 소개`. 기존 route 키는 삭제하지 않았다. 기존 route override는 그 키의 표준 라벨에 남으며 새로 분리한 문맥 라벨에 자동 전파하지 않는다.
- 메가 메뉴 제목 18개, 문의 유형/공지·갤러리·공연 필터 표시 이름 16개를 연결했다. 제출 enum과 URL은 편집값에서 만들지 않는다.
- 18개 파일의 직접 JSX 조건식·빈값 안내 50사용처를 47키로 연결했다. `NEXT PERFORMANCE`/`LATEST RECORD`, 시간·장소 미정, 중요 공지, 모집 전/마감 안내, 포스터 확대/맞추기, 지도 준비 중 등이 포함된다. 실제 CMS 값이 있으면 빈값 안내 override가 덮어쓰지 않는다.
- 분류·브랜드·연결·상태 표시 59개를 연결했다. 홈 두 공지 컴포넌트의 문맥별 분류, 공지 상세/공연/갤러리 분류, 공연 상태, 지도 제공자 버튼, 브랜드 대체 텍스트, 소셜 채널, 후원 연락처 이름, 공개 route 준비 문구, 구형 홈 입단 요약 fallback을 포함한다.

`richCopyKeys`의 명시적 rich 렌더 키는 577개다. 이는 홈 전체 기기별 등록 목록과 별도이며, **577개 모든 사용처가 화면 직접 편집 가능함을 뜻하지 않는다.** 같은 키라도 HTML 속성·placeholder·native option은 일반 문자열로 유지한다. 지도/브랜드 등 일부 문구는 조건에 맞는 화면에서만 나타난다. 기기·원문·카탈로그 권한이 검증되지 않는 동적 fallback은 직접 편집 권한을 추측하지 않는다.

### 소스 분류와 실제 편집 입구

| 원문 종류 / 실제 소비 위치 | 현재 처리 | 범위와 한계 |
|---|---|---|
| 공통 Header/MobileMenu/MegaMenu/Footer | 공통 문구 카탈로그, 실제 visible rich leaf | 라우팅 목적지가 아닌 원래 표시 문맥으로 키를 선택한다. 네 개 과거 route 키는 기존 저장값 호환용이며 현재 rich 목록에서 제외한다. |
| 홈 6개 주요 섹션 / HomeCopy | 기존 home/device 원문 + 명시적 렌더 어댑터 | 원문 slice와 정규화는 별도 projection 검증을 거친다. 혼합 CMS 자료의 제목·설명은 전용 CMS로 간다. |
| About/Spirit/인물/단원/연혁 | 페이지 문구 키 + 기존 데이터 CMS | 단원 공개 이름·상태·개인정보 규칙과 인물 원문은 복제하지 않는다. |
| 공연/공지/갤러리 제목·본문·날짜·이미지 설명 | 공연/공지/자료 CRUD | 자료 원문은 페이지 문구 override로 교체하지 않는다. 알려진 고정 enum 표시만 문구 키다. 사용자 정의 갤러리 분류명은 자료 category 값 자체다. |
| 문의/입단/후원 폼 라벨·placeholder·옵션 | 페이지 문구 카탈로그 | 값/검증/제출 payload는 별도 모델이다. 옵션 및 placeholder는 문자열 편집만 지원한다. |
| 실제 문의 내용·지원자·약정 답변·서명 | 접수 CMS | 검색·일괄치환의 공개 문구 인덱스 대상이 아니다. |
| 계좌·후원금·연락처·위치·모집기간·FAQ | 각 전용 CMS | 계좌/연락처 라벨만 카탈로그, 실제 값의 단일 원본은 유지한다. |
| 개인정보 동의/법적 원문·honeypot | 보호된 원문 또는 접수 정책 | 디자인용 문구 일괄치환에서 제외한다. 기존 접수 당시의 동의를 소급 변경하지 않는다. |
| 이미지/포스터/글자 애니메이션 내부의 글자 | 원본 미디어/그래픽 | DOM 텍스트가 아니며 문구 편집기로 글자를 바꾸지 않는다. 브랜드 이미지 alt/실패 시 텍스트는 별도 연결했다. |

### 재현 가능한 검사 범위

- `node scripts/public-copy-inventory.mjs`: 12개 public entry의 정적 import graph, 157모듈. 원시 JSX 텍스트/문자열 속성 잔여 32사용처는 앞서 명시한 예외다. 과거 샘플을 포함하는 정적 import graph이므로 157개가 현재 화면에 모두 표시되는 것은 아니다.
- `node scripts/public-copy-expressions.mjs`: 같은 graph의 직접 JSX 문자열/조건식/논리 fallback 잔여 0. 판별용 조건 문자열은 편집하지 않으며, 이미 관리되는 HomeCopy/FormattedCopy 자식은 중복 계수하지 않는다.
- 위 두 검사는 함수 반환값·템플릿·임의 상수 데이터의 의미를 자동 추론하지 않는다. 따라서 잔여 0은 **검사한 문법 범위 안에서만** 0이다. App의 공개 route 준비 문구는 graph 바깥이어서 별도 SSR 테스트로 검사한다.
- `node --test src/content/publicCopyCoverage.test.mjs scripts/public-copy-contract.test.mjs`: 새 coverage 14건 + 계약 7건 = 21/21 통과. RED에서 문맥 충돌/옵션/직접 조건문/지도/분류/브랜드/부팅 누락을 확인한 뒤 수정했다.
- 카탈로그 기본값·원문 목록은 실제 모듈 로드로 집계했다. `public-copy-default-baseline.json`의 기존 48파일 비교는 그대로 통과했고 baseline 파일을 수정하지 않았다.
- 현재 변경 전 HEAD 컴포넌트와 실제 SSR 비교: 메뉴 9사례 + 지도/브랜드/JoinPageState/JoinCTA/공연·갤러리·공지·문의/홈공지 17사례, 합계 26사례 기본 HTML 바이트 동일. 브라우저 시각 QA를 대체하지 않는다.
- `node node_modules/typescript/bin/tsc -b`, `pnpm lint` 통과. 실제 브라우저 통합·기기별 확인은 부모 작업의 QA 기록에 별도 기재한다.
- 위 두 파일과 `nonhomeformat`, `siteCopyCatalog`, `siteCopyAboutCatalog`, 문의/입단/후원 폼 관련 테스트를 함께 실행한 묶음은 56/56 통과했다. 실제 접수/DB 쓰기를 하지 않고 원문·개인정보·서명·입력값 보존을 확인했다.

### 아직 편집되지 않는 구체적인 코드 문자열

다음은 확인된 잔여 gap이다. 카탈로그 총계에 포함하거나 완료했다고 표현하지 않는다.

1. **동적 접근성 문장 조합**: `GalleryPage`의 `자료 제목 + ' 사진/포스터 크게 보기'`, `ConcertPoster`의 `제목 + ' 포스터 확대'`, Footer의 새 창 suffix, MapPreview iframe의 `장소명 + ' 지도'` 등. 제목 원문/주요 버튼 라벨은 연결됐지만 문장 suffix 전체는 별도 템플릿 카탈로그가 아니다.
2. **날짜·수량 조합/일부 helper fallback**: ConcertsPage의 `예정 공연 n`/`지난 n`, `yyyy년`, concertScheduleModel의 `날짜 미정`/공연 상세 메타의 시간·장소 fallback, 갤러리 자료 순번. 값과 산술은 자동 계산이며, 단위·템플릿을 바꾸려면 변수 보존 계약이 추가로 필요하다.
3. **공통 상태 컴포넌트의 최후 fallback**: LoadingState/ErrorState/FilterSelect의 default prop 또는 옵션이 비었을 때 `선택`, ResponsiveArchive의 인자가 없는 빈 상태 default. 대부분의 실제 페이지는 이미 편집 가능한 값을 prop으로 전달하지만, 모든 호출 경로의 최후 fallback까지 보장하지 않는다.
4. **전역 SEO·구조화 데이터 fallback**: SeoHead의 siteName/최후 description, ConcertDetailPage의 자동 Event 소개문/organizer 문자열. 페이지별 SEO 문구 키와 별개인 코드 기본값이다.
5. **접수/서버 오류와 검증 메시지**: contact/join/support 모델·intake API가 생성하는 입력 검증/네트워크/권한 오류. 운영 정책과 상태에 연결된 문구이며 이번 appearance/copy 변경으로 수정하지 않았다.

직접 선택이 불가능한 이유(속성/가공/다른 CMS 원문)와 편집 자체가 아직 없는 고정 문자열을 구별해야 한다. 위 항목이 남으므로 “공개 홈페이지 모든 문구 CMS 편집 확인 완료”는 주장하지 않는다.
