# 영문 샘플 검증 기록 — 2026-09-28

## 범위 및 판단 기준

사용자의 최종 범위는 `/sample/`의 영문 전환과 이를 편집하는 독립 CMS입니다. 원본 방문자 디자인과 한국어 게시 데이터는 변경하지 않습니다. 한국어 기본, 명시적 언어 선택 기억, 미번역 신규 글은 한국어 유지로 결정했습니다.

“홈 섹션별 한글 폰트 분석” 작업에 히어로·현재 승인 시안·서체·오브젝트·모션·원문 매핑 등에 관한 10개 인계 질문을 보냈고, 받은 답변을 반영했습니다. Figma `nz8fKU1RqfasYhsIQEIVF5`의 히어로 `1090:9159`와 최신 입단 정렬 `1130:8658`을 확인했습니다. 오래된 프레임의 절대 좌표나 가짜 행사 날짜로 현재 홈페이지를 교체하지 않았습니다. 게시되지 않은 Spirit v8 문구는 원문과 일치할 때의 번역 자료로만 사용합니다.

UX Writing의 일관된 영문 표현·문맥 구분, React의 상태 유지·조건부 로딩, 완료 전 검증 지침을 적용했습니다. 이미지·오선·악보·궤도·서명은 유지하고, 번역으로 길어진 문구에는 샘플 영어 전용 줄바꿈 규칙을 적용했습니다.

## 20개 검증 회차

각 회차는 다른 위험을 확인하는 검사 묶음입니다. 같은 검사를 20번 실행한 것이 아닙니다. 발견한 문제를 고친 뒤 해당 검사와 주변 회귀를 다시 실행했습니다. 컴퓨터 유즈 금지에 따라 아래의 화면 관련 근거는 **서버 렌더링과 코드 계약**이며 실제 브라우저 시각 검증을 뜻하지 않습니다.

| 회차 | 확인 대상 | 수행한 검사·수정 |
|---|---|---|
| 1 | 원본 제외 | 원본 경로에서 URL·저장값이 영어여도 번역 비활성. 원본 CMS API 기본값 회귀. |
| 2 | 샘플 경계 | `/sample` 하위만 활성, 유사 접두사·관리자 경로 제외. |
| 3 | URL 입력 | 한국어 기본, 명시적 언어 우선, 잘못된 값 거부. |
| 4 | 선택 기억 | 샘플 전용 메모리·저장 키. 잘못된 URL은 기존 선택을 덮어쓰지 않음. |
| 5 | 필터·앵커 | 갤러리 탭, 공연 필터, 입단 section/hash 유지. |
| 6 | 뒤로·앞으로 | URL 이력마다 언어 재계산, 문서 lang 복구, 새로고침 기준 확인. |
| 7 | 입력 상태 | 언어별 페이지 remount 금지. 후원 입력·동의·검토 상태와 서명 회귀. |
| 8 | 모션·스크롤 | 언어 변경 시 scroll reset 금지. 빠른 안내 카드의 제목 기반 key를 안정된 ID로 수정. 기존 인트로·악보·갤러리·정신 모션 회귀. |
| 9 | 공통 UI | 언어 버튼 이름·aria-pressed·44px 최소값, 헤더·메뉴·푸터·샘플 경로 유지. |
| 10 | 홈 히어로 | 원래 4줄 워드마크·사진 선택·종이 오브젝트 유지. 빠져 있던 eyebrow·CTA 기본 문구 연결. |
| 11 | 홈 소개·입단 | 기기별 제목·강조 역할·기존 태그/개행 유지. 누락된 모집·보호자 기본 안내 수정. |
| 12 | 악보·정신·기록·후원 | 이미지/벡터/캔버스 구조 대조. 궤도 5개 라벨과 후원 용도 기본값 누락 수정. |
| 13 | 정신·소개·프로필 | 승인된 원본 렌더 해시 유지. 다른 지휘자에게 기본 인물 약력·사진을 붙이지 않도록 영문에서 보호. |
| 14 | 목록·상세 | 공연·공지·갤러리 날짜/건수/유형 및 빈 상태. 공연 메타 래퍼의 원본 분기를 복원. |
| 15 | 입단 접수 | 7개 필수 항목·유효성·기존 payload 회귀. 샘플 전송은 API 접근 전에 차단. |
| 16 | 문의·약정 | 동의/서명/검토/출력 내용 회귀. 원래 저장된 성공 메시지 보존. 샘플 실접수 차단. |
| 17 | 번역 자료 | 한국어 기본 필드 1,055개 누락 0. 게시된 한국어 문구 54개 원문 일치 확인. 미번역 공개 콘텐츠 목록 제공. |
| 18 | 반응형 구성 | 12개 주요 경로 × 390/768/1440px SSR 및 원본 홈 오브젝트 비교 37개 검사. 실제 넘침·줄바꿈 시각 검증은 미실시. |
| 19 | CMS/DB 격리 | 독립 저장/반영/복원/버전 충돌/관리자·비관리자·익명 권한. 모바일 기본값 불일치, URL 번역 노출, 누락 팝업 원문 목록, 미리보기 nonce/편집 중 갱신 문제 수정. |
| 20 | 최종 회귀 | 전체 테스트·타입/빌드·린트·HTTP 응답, 원본 마크업 승인 기준 유지, 테스트 데이터 및 원본 DB 무변경 재확인. |

## 검사 명령과 근거

- `pnpm test`: **911개 중 909개 통과, 실패 0, 실제 브라우저 검사 2개 건너뜀**, exit 0. 기존 회귀 목록에 샘플 언어/라우트/편집기 검사를 추가했습니다.
- `pnpm lint`: exit 0.
- `pnpm build` (`tsc -b` 포함): exit 0. 번역 자료는 별도 lazy chunk로 분리되며 원본에서 선로딩하지 않습니다.
- `node --test src/features/sample-language/sampleLanguage.test.mjs`: 20개 언어/원본 격리 계약.
- `node --test src/features/sample-language/sampleRoutes.test.mjs`: 37개 서버 렌더링/오브젝트 검사.
- `node --test src/features/sample-language/SampleLanguageProvider.test.mjs`: 실제 provider 함수를 상태/라우터 하네스에서 호출. 언어 전환·기억·복구·미리보기 잠금 확인.
- `node --test src/features/sample-language/sampleEnglishEditor.test.mjs`: 기기별 원문과 편집 grant 일치, 원본 불변, 1회 기본값 조회, 팝업 목록 포함.
- 원문 감사의 승인 기준 JSON은 변경하지 않았습니다. 번역 훅이 원본에서는 항등 함수임을 검증하는 제한적인 감사 어댑터와, 원본 링크/클래스/문구/이미지를 바꾸면 실패하는 반례를 추가했습니다.
- 로컬 서버 `/`, `/sample/`와 주요 샘플 경로, `/admin/editor-english`, 두 진입 모듈 GET은 모두 HTTP 200. 이는 인증된 CMS의 실제 클릭 시험을 의미하지 않습니다.

## DB 검증과 정리

적용한 신규 마이그레이션은 `20260927163328_add_sample_english_editor.sql`입니다. 원본 테이블·권한·게시 RPC는 변경하지 않았습니다.

`scripts/verify-sample-english-editor.sql`을 트랜잭션 전체로 실행했습니다. 관리자 임시저장/반영/복원, 미게시 초안 비공개, 오래된 버전 거부, HTML 입력 거부, 비관리자·익명 쓰기 거부를 확인했습니다. 마지막 `ROLLBACK`으로 모든 테스트 행을 취소했습니다. 후속 조회에서 영문 페이지 0건·이력 0건을 확인했습니다. 원본 초안+게시본 해시도 실행 전후 같았습니다.

보안 Advisor에서 새 두 테이블의 RLS/정책 누락은 없었습니다. 공개된 영문 문서만 반환하는 고정 RPC 및 관리자 검증을 수행하는 쓰기 RPC에는 SECURITY DEFINER 실행 권한 경고가 표시됩니다. 의도된 제한적 인터페이스이며 실제 역할별 접근 검사를 함께 수행했습니다. 기존 프로젝트의 유출 비밀번호 보호 비활성 경고는 이번 작업에서 변경하지 않았습니다.

- [공개 SECURITY DEFINER 점검 기준](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [로그인 사용자 SECURITY DEFINER 점검 기준](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [유출 비밀번호 보호 안내](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

## 조사 자료

- [W3C: 번역 시 텍스트 길이 변화](https://www.w3.org/International/articles/article-text-size/) — 고정된 원문 글자 수를 영어의 길이 제한으로 재사용하지 않음.
- [W3C: HTML 언어 선언](https://www.w3.org/International/questions/qa-html-language-declarations), [WCAG 언어 부분](https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts) — 문서 언어와 남겨 둔 한국어 원문 표시.
- [GOV.UK 언어 탐색](https://design-system.service.gov.uk/components/language-navigation/) — 명시적 언어 선택과 현재 언어 식별.
- [React: 상태 유지](https://react.dev/learn/preserving-and-resetting-state) — 언어 변경으로 폼 트리를 교체하지 않음.
- [MDN Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) — 실제 날짜 값을 유지하며 표시만 변경.
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [RPC](https://supabase.com/docs/reference/javascript/rpc) — 기존 관리자 판별 재사용, 초안 비공개, 원본과 분리된 제한적 RPC.

## 캡처 후 추가 수정 검증 — 2026-09-28

보내주신 영문 캡처의 겹침·잘림 구조를 수정하고, 후원약정 날짜와 개별 CMS 콘텐츠의 언어 버전을 보완했습니다. 자세한 20개 관점의 재검토 및 실제 참고 자료는 `docs/sample-english-research-and-review.md`에 기록했습니다. 이 기록은 실제 브라우저 조작 20회를 의미하지 않습니다.

- 최신 `pnpm test`: **941개 중 939개 통과, 실패 0, 실제 브라우저 검사 2개 건너뜀**, exit 0.
- 최신 `pnpm lint`: exit 0.
- 최신 `pnpm build` (`tsc -b` 포함): exit 0.
- English CSS 계약 9개, 콘텐츠/날짜 모델 9개, 콘텐츠 API 6개, CMS 영문 저장/게시 상태 4개, 언어 provider 6개를 별도로 확인했습니다. 기존 원본 마크업/서명/접수/모션 회귀도 전체 검사에 포함했습니다.
- Windows에서 병렬 Vite SSR worker가 네이티브 종료 코드 `0xC0000005`로 종료하는 현상을 확인했습니다. 개별 검사에서는 통과했고, Windows 전체 회귀는 모든 테스트를 유지하며 순차 실행하도록 변경한 뒤 통과했습니다.
- 신규 `sample_english_content`와 저장/게시 RPC는 실제 DB 트랜잭션으로 역할·버전·미게시 초안·동일 제목 독립성·숨김/삭제 원본 제외를 검사했습니다. fixture는 모두 ROLLBACK했으며 영문 콘텐츠 0건을 확인했습니다.
- 원본 공지·갤러리·공연·CMS 문서의 전체 행 해시는 검사 전후 같았습니다.
- 익명 REST: 공개 영문 조회 HTTP 200/0건, 초안 직접 조회 HTTP 401로 거부.
- `/`, 주요 English sample 경로, CMS 공지·갤러리 진입, 보완 CSS 모듈 GET은 모두 HTTP 200. 인증된 관리자의 실제 클릭 또는 픽셀 검사는 아닙니다.

## 남은 확인 한계

실제 Chrome/Safari/모바일 장치의 픽셀 배치·포커스 이동·드래그·애니메이션 재생·인쇄 창은 조작하지 않았습니다. 사용자 금지 지시에 따른 미검증 범위입니다. 번역되지 않은 신규 글과 공식 표기가 없는 이름/기관명은 원문을 유지합니다. 기존 FAQ의 파트 선택 설명과 실제 폼 선택지 불일치, 약력의 상대 기간·모호한 학위 표현도 사실 확인 없이 바꾸지 않았습니다. 번역 검토는 법률 또는 공식 인명 표기 인증을 대신하지 않습니다.

## 영문 줄바꿈·운영 UX 추가 점검 — 2026-09-28

추가 캡처에서 홈 소개의 `community.` 한 단어가 별도 줄로 밀리는 현상, 긴 악보·궤도 제목, 정신 페이지의 한국어 기준 고정 줄 높이, 소개 페이지의 강조 글자 가림, 입단 버튼 폭 문제를 재검토했습니다. 홈 소개 영문은 문장 길이를 줄여 각각 완결된 생각으로 만들고, 악보·궤도와 소개의 긴 제목은 짧은 구절로 고쳤습니다. 정신 제목의 여러 조각은 영어에서 자연스러운 문장 흐름으로 합쳐 높이가 내용에 따라 늘어나게 했습니다. 공지·갤러리·문의·입단·후원의 긴 설명문과 향후 정신 문구의 불필요한 강제 개행도 제거했습니다. 주요 본문에는 영문 샘플 전용 `text-wrap: pretty`를 제한적으로 적용했습니다. 한국어 원본 CSS와 원본 방문자 문구는 변경하지 않았습니다.

CMS에서는 현재 페이지의 영문 상태 필터, 작성 진행률·변경 요약·글자/단어 수, 영문 날짜 지우기, 네 가지 운영 설정의 독립 English 편집, 입단지원서·후원약정 목록의 **상세·인쇄** 진입을 확인했습니다. 영문 검토 담당자 역할은 추가하지 않았습니다. 운영 설정 DB 검증은 트랜잭션 뒤 `ROLLBACK`하여 테스트 행을 남기지 않았습니다.

- `node --test src/features/sample-language/sampleLanguage.test.mjs src/features/sample-language/sampleEnglishLayout.test.mjs`: 39개 통과. 영문 번역 목록에서 문단 구분을 제외한 긴 강제 개행이 다시 생기면 실패합니다.
- 변경 주변 CMS 집중 검사 7개 통과. 전체 검사에서 드러난 것은 테스트 하네스의 신규 모듈 누락으로, 하네스를 보완한 뒤 재검증했습니다.
- 최신 `pnpm test`: **965개 중 963개 통과, 실패 0, 브라우저 전용 검사 2개 건너뜀**, exit 0.
- 최신 `pnpm lint`: exit 0. `pnpm build` (`tsc -b` 포함): exit 0.
- 원본과 영문 샘플, 주요 CMS 경로 20개의 개발 서버 HTTP 응답은 모두 200. 이는 SPA 진입 응답이며, 로그인 상태의 실제 화면 렌더링이나 픽셀 배치를 증명하지 않습니다.
- 사용자 요청에 따라 컴퓨터 유즈·실제 브라우저 조작은 수행하지 않았습니다. 따라서 390/768/1440px의 마지막 줄바꿈, 인쇄 미리보기, 모션 재생 결과는 여전히 직접 시각 확인이 필요합니다.

영문 줄바꿈 결정은 [MDN의 `text-wrap` 설명](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-wrap)을 참고했습니다. 짧은 제목은 `balance`, 길이가 변할 수 있는 본문은 필요한 곳에만 `pretty`를 사용하며, 브라우저가 지원하지 않으면 기본 줄바꿈으로 돌아갑니다.
