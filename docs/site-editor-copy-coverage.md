# 공개 화면 편집 연결 범위

2026-09-17 구현 기준. 이 문서는 새 화면 편집기의 실제 소비 위치를 기록한다. 기존 전용 CMS 콘텐츠를 복제하지 않으며, 아래 연결 수가 홈페이지의 모든 문자열을 뜻하지는 않는다.

## 명시적 카탈로그

`src/content/siteCopyCatalog.ts`가 최종 목록이다. 현재 1,097개 키이며 중복 키는 0개다(실제 모듈을 로드해 집계). 입력 키는 JSX의 `SiteCopy`/`copyText`, 페이지별 `usePageCopy`, 메뉴 매핑 또는 기존 홈 데이터 어댑터가 읽는다. DOM에서 문자열을 검색·치환하지 않는다. 관리자 카탈로그는 public 홈 런타임 어댑터(`lib/homeEditorOverrides.ts`)와 분리해 방문자에게 내려보내지 않는다.

| 화면 | 키 수 | 실제 소비 위치 |
|---|---:|---|
| 공통 | 72 | 실제 V4 헤더·모바일 메뉴·메가 메뉴, Footer, 지도·404 보조 안내 |
| 홈 | 371 | 기존 기기별 콘텐츠와 홈 섹션들의 고정 안내·접근성 라벨 |
| 합창단 소개 | 103 | AboutOverviewExperience, AboutPage |
| 합창단 정신 | 129 | SpiritHeritageExperience, SpiritPage |
| 지휘자 | 13 | ConductorProfileDocument |
| 반주자 | 14 | AccompanistProfiles |
| 단원 | 45 | MembersArchiveExperience |
| 연혁 | 22 | HistoryCueSheetExperience |
| 공연 목록 | 43 | ConcertsPage, FeaturedStage, ConcertFilterDrawer |
| 공연 상세 | 22 | ConcertDetailPage, ConcertInformation, ConcertPoster |
| 공지 목록 | 27 | NoticesPage |
| 공지 상세 | 13 | NoticeDetailPage |
| 갤러리 | 47 | GalleryPage, GalleryViewer |
| 입단 | 64 | JoinGuide, JoinApplicationForm, JoinPageState |
| 후원·문의 | 112 | ContactPage, ContactInquiryForm, SupportPledgeForm, SponsorsSection |

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

JSX 검사만으로 모든 JS 상수·조건부 문자열·서버 오류까지 전수 연결했다고 주장하지 않는다. 동적 상태/분류 표시와 공통 loading/error 기본값, 법적 동의 원문의 별도 CMS 관리 범위는 추가 감사 대상이다. `about?section=all`은 합성된 소개 화면이므로 appearance는 about 설정을 사용한다. 각 하위 소개 화면의 copy는 고유 페이지 키를 읽고, 개별 appearance는 section 전용 경로에서 적용한다.
