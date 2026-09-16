# CMS 정리·성능·보안 패치 독립 검토 기록

검토일: 2026-09-17. 범위: 계획 7.1의 20개 정리 후보, 테스트 실행 목록, GET 전용 Supabase 점검 스크립트, 지정된 sponsor/legacy intake/CMS 삭제 패치. 운영 DB에는 접속하지 않았다. 공개 홈페이지의 디자인·문구·애니메이션 코드는 수정하지 않았다.

## 정리 기준과 결과

- TypeScript AST로 `src`의 import/export, `import()`와 `require()`의 문자열 경로 및 index 모듈 해석을 확인했다.
- 비문자열 import는 테스트 내부의 transpile/data URL 모듈 로더뿐이었다. 런타임 `import.meta.glob`/`require.context` 참조는 없었다.
- 저장소 전체 문자열 검색(문서·테스트 포함)과 삭제 직전 `git status --porcelain -- <각 파일>`을 다시 확인했다. 삭제 대상 모두 기존 Git 추적 파일이며 변경 중인 파일은 아니었다.
- 파일명만 같은 실제 `src/components/admin/AdminLayout.tsx` 및 `src/components/sample/home-v4/*Menu*`는 그대로 유지했다.
- 10개, 원본 소스 25,789 bytes/759 lines 제거. 모두 `apply_patch`로 제거했고 Git의 기존 추적본에서 복구할 수 있다. 데이터·사진·원본 asset·fixture는 삭제하지 않았다.

| 계획의 후보 | 판단 | 근거 |
|---|---|---|
| `src/components/admin/AdminPlaceholderPage.tsx` | 삭제 | importer/문서 소비자 없음, 미구현 안내용 보조 컴포넌트 |
| `src/components/admin/AdminPrivateFileLink.tsx` | 삭제 | importer/문서 소비자 없음, 실제 비공개 첨부 표시·인쇄 흐름과 별개 |
| `src/components/common/Badge.tsx` | 보존 | 보존한 NoticePreview/UpcomingConcertsPreview가 import |
| `src/components/common/Spirit.tsx` | 보존 | 런타임 importer는 없지만 SupportPledgeForm 테스트의 기존 모의 모듈 참조가 남아 있어 이번 정리에서 보류 |
| `src/components/common/StaffDivider.tsx` | 삭제 | importer 없음; Footer 테스트는 해당 장식이 **없음**을 검사하며 파일을 읽거나 실행하지 않음 |
| `src/components/home/ConcertTemplatePanel.tsx` | 보존 | concert-template-panel, home-book-motion-system 및 Figma/기존 시안 문서의 명시적 자료 |
| `src/components/home/NoticePreview.tsx` | 보존 | home-copy-v2-audit의 기존 콘텐츠/시안 자료로 기록됨 |
| `src/components/home/SupportCTA.tsx` | 보존 | home-copy-v2-audit의 기존 콘텐츠/시안 자료로 기록됨 |
| `src/components/home/UpcomingConcertsPreview.tsx` | 보존 | home-copy-v2-audit의 기존 콘텐츠/시안 자료로 기록됨 |
| `src/components/join/JoinInquiryForm.tsx` | 보존 | 과거 전체 지원서·사진 첨부·동의 계약 및 2026-09-08 계획에 명시됨; 최신 v2에서 쓰지 않는다는 이유로 구핵심 원본을 삭제하지 않음 |
| `src/components/layout/AdminLayout.tsx` | 삭제 | 현재 `components/admin/AdminLayout`을 재수출하는 미사용 1행 alias |
| `src/components/layout/Header.tsx` | 삭제 | importer 없음; 실제 공개 레이아웃은 V4 header 사용 |
| `src/components/layout/MegaMenu.tsx` | 삭제 | 미사용 Header만 import하는 고립 묶음 |
| `src/components/layout/MobileMenu.tsx` | 삭제 | 미사용 Header만 import하는 고립 묶음 |
| `src/components/spirit/SpiritSections.tsx` | 보존 | design-qa-figma에 명시된 과거 시안 자료 |
| `src/constants/joinFaqDefaults.ts` | 보존 | 사용하지 않는 FAQ지만 기존 입단 안내 원문 성격이 있어 임의 폐기하지 않음 |
| `src/hooks/useScrollProgress.ts` | 삭제 | importer/문서 소비자 없는 과거 보조 hook; 현재 animation hook은 유지 |
| `src/hooks/useSiteText.ts` | 삭제 | importer/문서 소비자 없는 wrapper; 실제 getSiteText/usePageCopy 유지 |
| `src/types/index.ts` | 삭제 | 디렉터리 index import까지 해석한 결과 소비자 없음; 실제 admin/content 타입 모듈 유지 |
| `src/utils/collectionLayout.ts` | 보존 | design-qa-figma의 컬렉션 시안 자료로 명시됨 |

공개 자산의 CMS 문자열·직접 URL 참조는 로컬 import graph만으로 확정할 수 없으므로 모든 원본 자산을 남겼다. 실제 홈페이지를 구현하는 sample 디렉터리, conductor hand frame 20장, 지원서/약정 인쇄·서명 코드는 삭제하지 않았다.

## 테스트 목록

`package.json`의 `pnpm test`는 이제 `scripts/run-tests.mjs`의 명시적 회귀 목록을 실행한다. 기존 기본 목록은 유지하고 CMS 저장·업로드·삭제, 홈 기기별 원문/이미지, site editor 모델/API/프로토콜/게시/접수 차단, 공개 catalog, sponsor API, GET 점검 스크립트 테스트를 등록했다. 47개 파일을 최대 4개 동시 실행한다.

전체 glob으로 과거 시안 계약을 무조건 포함하지 않았다. 과거 미등록 시안 테스트 및 유효한 회귀 테스트를 삭제하거나 성공으로 위장하지 않았다. 다른 담당자가 작업 중인 신규 intake 테스트는 경로 확정·개별 검증 후 같은 목록에 추가하는 것으로 전달했다.

## GET 전용 운영 점검 스크립트

`scripts/check-supabase-live.mjs` 변경:

- 후원사 공개 조회는 `GET /rest/v1/rpc/get_public_sponsors?limit=1`만 사용한다. 알려진 공개 필드 밖의 필드 또는 숨김 행을 받으면 실패한다.
- 원래 후원사 이름과 내부 메모는 raw table에서 각각 `select=name&limit=0`, `select=internal_notes&limit=0`으로 권한 거부(401/403)를 확인한다. 200과 빈 배열은 권한 거부가 아니므로 실패다. 민감 행의 실제 값을 가져와 점검하지 않는다.
- 기존 members/접수 테이블의 민감 컬럼 점검도 `limit=0`으로 바꿨다. 단원 안전 RPC는 stable GET으로 읽는다.
- 모든 HTTP 요청 메서드는 GET으로 고정했다. 실제 접수·업로드·삭제는 없다. env 값·응답의 개인정보는 출력하지 않는다.
- Storage 목록 API는 POST가 필요하므로 이 스크립트에서 제외하고 `[not-checked]`로 명시한다. 이제 이 명령의 성공은 Storage 목록/자산의 안전성을 검증했다는 뜻이 아니다. Storage는 별도 검증 범위다.
- 실제 스크립트를 제어된 env reader/fetch로 실행하는 테스트 4개를 먼저 실패시킨 후 수정하여 통과시켰다. 실 DB 명령 `pnpm check:supabase-live`는 이 작업에서 실행하지 않았다.

## 보안 패치 독립 검토

대상: `20260916164136_protect_sponsor_notes_and_retire_legacy_intake.sql`, `publicData.getPublicSponsors`, `cms.deleteRow` 및 이를 설명하는 기존 정책·호출자·회귀 테스트. 새 전체 보안 scan이나 원격 DB 조사는 하지 않았다.

1. 발견 및 전달: 최초 migration의 익명 호환 column grant에는 `name`이 포함되어 있었다. 새 RPC가 `display_name`으로 name을 치환해도 익명 사용자는 raw `/sponsors?select=name,display_name`으로 원래 이름을 읽을 수 있었다. `internal_notes` 차단과는 별개의 alias 우회다. 루트 담당자가 RPC-only 공개 경로로 바꾸기로 했으며 SQL 수정·원격 적용은 해당 담당자가 소유한다. 이 문서 작성 시 최초 검토본에서 확인한 문제이며, 최종 수정본의 별도 재검토/DB 증거와 구분한다.
2. `getPublicSponsors`는 고정 GET RPC, 명시적 공개 필드, 표시 위치 필터, 정렬·limit을 유지한다. 누락 RPC 때 raw table로 되돌아가지 않는다. RPC 먼저 설치 → 소비자 배포 → raw 읽기 차단의 순서를 지켜야 이전 빌드와의 배포 공백을 피할 수 있다.
3. v1 직접 INSERT policy와 결합되지 않은 첨부 INSERT policy 제거는 현재 v2 `submit_join_application_v2` execute와 관리자 과거 첨부 SELECT를 지우지 않는다. 기존 admin-only RLS는 유지된다. 실제 DB에 존재하는 추가 정책/권한의 검증은 이 정적 리뷰로 대체할 수 없다.
4. `cms.deleteRow('join_applications',...)`는 DB/Storage 호출 전에 보관 안내 오류를 반환하여 선행 파일 삭제 문제를 차단한다. 다른 테이블은 `count:'exact'`의 삭제 1건만 성공이다. 이것은 CMS helper의 삭제 사고 방지이며 권한 있는 관리자의 DB DELETE 권한 전체를 회수한 것은 아니다.
5. 위 alias 우회 외에 지정된 변경에서 추가로 입증한 권한 우회·데이터 손실 회귀는 없다. 기존 접수 서비스 전체의 rate limit/서버 입력 검증을 이 좁은 패치 리뷰가 보장하지는 않는다.

공식 문서 확인: Supabase [Column Level Security](https://supabase.com/docs/guides/database/postgres/column-level-security)에서 테이블 grant와 column grant의 합산 및 wildcard 제한을 확인했고, [Database Functions](https://supabase.com/docs/guides/database/functions)에서 함수 실행 권한·definer 경계를 확인했다. changelog.md 읽기는 도구의 markdown content-type 제한으로 실패했으며 changelog 확인 완료로 주장하지 않는다.

## 빌드·성능 기록

삭제 직전과 직후 같은 워크스페이스에서 `pnpm build`가 통과했다. 둘 다 782 modules/105 JS·CSS assets였다. 수치는 전체 출력 합계이며 첫 화면 전송량이 아니다.

| 항목 | 삭제 전 | 삭제 후 | 차이 |
|---|---:|---:|---:|
| JS 원본 bytes | 1,418,808 | 1,418,808 | 0 |
| JS gzip bytes 합계 | 431,305 | 431,348 | +43 (chunk hash 참조 등; 속도 개선 주장 없음) |
| CSS 원본 bytes | 850,575 | 846,233 | -4,342 |
| CSS gzip bytes 합계 | 145,921 | 145,389 | -532 |

전체 index CSS의 미사용 Tailwind utility만 줄었고 다른 CSS chunk 15개는 바이트 단위로 동일했다. 제거된 theme 변수 `--container-5xl`/`--ease-out`은 남은 CSS에 참조가 없다. 실제 JS 모듈은 원래도 번들에 연결되지 않았으므로 삭제 소스 용량을 런타임 JS 절감으로 주장하지 않는다. 이번 정리 후 별도 브라우저 화면·네트워크 계측은 수행하지 않았으므로 시각 회귀 최종 확인은 루트 종합 QA 범위다.

RAF는 수정하지 않았다. `HomeV4SamplePage.tsx`의 첫 hold effect와 `HomeSectionFlowSamplePage.tsx`는 resize에서는 기존 `queueUpdate`를 쓰지만 scroll에서는 `update`를 직접 호출한다. scroll 등록/해제를 기존 queue로 함께 맞추는 후보를 루트에 전달했다. 적용하려면 burst scroll 프레임당 계산 수, 마지막 스크롤 위치, pageshow 복원, reduced-motion, unmount의 pending frame 취소를 함께 검증해야 한다. 측정 없이 부드러워졌다고 주장하지 않는다.

## 검증·잔여 범위

후속 통합 검사에서 초기 `siteCopyCoverage.test.mjs`의 예외 없는 0건 가정이 법적 동의·honeypot·그래픽 로고/독립 시안 32개와 충돌함을 실제로 확인했다. 이를 성공으로 숨기지 않고, 현재 문서화한 예외 외에는 미연결을 모두 실패시키는 `scripts/public-copy-contract.test.mjs`의 동등·확장 검사로 통합하여 중복 초기 파일을 제거했다. DOM 결과/기존 공백/래퍼 비추가/관리자 분리를 검사하는 `SiteEditorProvider.test.mjs` 4개는 별도 실행 통과 후 기본 runner에도 등록했다. 전체 문구 전수 편집의 잔여 범위는 계속 coverage 문서에 남긴다.

- `pnpm test`: 284/284 통과(47개 명시 파일).
- `node --test scripts/check-supabase-live.test.mjs`: RED 4/4 확인 후 GREEN 4/4.
- `pnpm exec eslint scripts/check-supabase-live.mjs scripts/check-supabase-live.test.mjs scripts/run-tests.mjs`: 통과.
- 삭제 전후 `pnpm build`: 둘 다 통과(타입 체크 포함).
- 전체 `pnpm lint`: 실행 결과를 추가 기록한다.
- 실제 DB·권한 프로브·접수 공격 테스트·배포·커밋·푸시는 하지 않았다.
- Temp QA 폴더는 이전 증거와 manifest 그대로 보존했다. 최종 정리는 루트 담당자만 수행한다.
