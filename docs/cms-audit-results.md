# CMS 종합 개선 — 구현·검증 현황

2026-09-17. 복구 기준 `ab6fb5a9acf6cd042533912c79a4698f72e96b86`, 작업 브랜치 `codex/recover-homepage-work`.

**전체 요구 완료 보고서가 아니다.** 적용한 코드, 운영 DB에 실제 적용한 변경, 격리 검증, 남은 배포·보안 경계를 구분한다. 미검증 항목을 테스트 수로 대신하지 않는다.

## 적용한 기능

| 영역 | 현재 구현 및 근거 |
|---|---|
| CMS 디자인 | Figma Quiet Workspace 18개 대표 화면, 10차례 관점별 검토 후 관리자 shell/modal 전용 스타일 적용. `cms-design-review.md` 참조 |
| 홈페이지 편집 | 15개 편집 대상, 1,097개 고유 키, 공통/모바일/태블릿/데스크톱 문구·글꼴·색. 명시적 소비 키만 사용하며 DOM 일괄 치환 없음 |
| 저장·게시 | 로컬 입력/서버 초안/게시본 구분, 버전 CAS, 원자적 게시, 이전 게시본을 초안으로 복원, 겹친 변경 항목별 비교 |
| 미리보기 | 실제 페이지 iframe, 기기별 viewport, 출처·source·nonce·schema·sequence 검증. 링크 이동 범위 제한 및 실제 접수 차단 |
| 편집 편의 | 검색어를 수정해도 입력창 유지, 20개씩 추가 표시, 페이지/기기 변경 시 검색 범위 초기화. 입력 초안은 부모 세션에 유지 |
| 공통 폼 | 업로드 선택/진행/실패 상태 연결, 미완료 저장 차단, 중복 요청 잠금, 저장 실패 입력 보존, 빠른 입력 직후 뒤로가기 경고 |
| 모달 | 문서 순서의 초기 포커스, 최상위 모달만 Escape/Tab 처리, 중첩 스크롤 잠금과 닫기 후 원복 |
| 접수함 | 25개 범위 조회·안정 정렬, 읽기 전용 답변, 상태/메모 관리, 입단 보관, 지원서·후원약정 인쇄 |
| 후원 원문 | 신규 접수 당시 약정의 서버 스냅샷, 기존 서명 원본 보존. 스냅샷 없는 옛 약정은 현재 문구로 소급 대체하지 않음 |
| 운영 설정 | 중복 위치 편집 입구 정리, 접힌 접수 보호 설정, 종류별·연락처별 한도의 서버 현재값/CAS 저장 |
| 대시보드 | 실제 입단 상태 집계, 보관 제외, 일부 요청 실패 시 다른 집계 보존 |

사용 설명서는 `cms-operator-guide.md`에 실제 버튼 이름으로 작성했다. 콘텐츠 원본의 기존 즉시 저장과 새 문구·디자인 편집기의 임시저장/게시를 구분한다.

## 운영 DB 변경

실제 접수 개인정보를 테스트에 사용하지 않았다. 아래 계약 테스트의 합성 자료는 트랜잭션 rollback으로 원복했다.

1. `20260916161055_add_site_editor.sql`: 관리자 전용 초안/이력과 공개 게시본 RPC. SQL Editor 계약 검사 및 익명 GET에서 게시본 200, 초안/이력 401.
2. `20260916164136_protect_sponsor_notes_and_retire_legacy_intake.sql`: 안전한 후원사 공개 projection, 원래 이름/내부 메모 raw 조회 차단, 사용하지 않는 입단 v1 업로드·직접 제출 경로 폐쇄. 과거 첨부 파일은 유지.
3. `20260916172006_secure_public_intake.sql`: 문의/약정 서버 검증·멱등성·요청 제한·당시 약정 원문, 입단 v2 제한 보완. 문의/약정 직접 INSERT 차단. 실제 운영 제한값을 임의로 바꾸지 않음.
4. `20260916201527_harden_timestamp_and_deduplicate_text_index.sql`: 원래 `set_updated_at()` 본문/권한/invoker 모드는 보존하고 빈 search_path 고정. `site_texts_key_unique` 제약을 유지하며 정의·속성·의존성을 대조한 중복 `site_texts_key_uidx` 하나만 제거. 데이터 행 삭제 없음. 동일 정의로 인덱스를 재생성할 수 있음.
5. `20260916203156_restrict_site_image_listing.sql`: 익명/비관리자의 `site-images` 목록 조회 차단. 관리자 SELECT와 기존 공개 URL은 유지. 원복 트랜잭션에서 anon/일반 인증 역할은 0건, 관리자 역할은 전체 객체 수와 같은지 확인한 뒤 적용했다. 별도 실제 SDK 목록 요청은 변경 전 1건 반환/실패 → 변경 후 0건/통과. 파일 업로드·삭제·다운로드 없음. **공개 URL을 아는 사용자의 이미지 조회와 비공개 초안 문제는 여전히 해결되지 않았다.**

4번은 변경 전 경로 검사 실패 → 원복 트랜잭션에서 수정/기존 타임스탬프 트리거 동작 PASS → 적용 후 `fixed_path`, `duplicate_removed`, `unique_constraint_kept` 모두 true를 확인했다.

SQL Editor로 적용했으므로 **CLI migration history 동기화는 완료되지 않았다.** CLI 2.117.0 도움말 확인 후 remote migration list를 시도했지만 `LegacyPlatformAuthRequiredError`가 반환되었다. 브라우저 로그인 토큰을 추출하거나 내부 이력 테이블을 임의 조작하지 않았다.

### Auth 운영 설정

코드에 `signUp()` 소비자가 없고 PRD도 방문자 회원가입을 제외하며 README는 관리자 계정을 Dashboard에서 생성하도록 정하고 있다. 이에 따라 9/17 Auth의 `Allow new users to sign up`만 껐다. 기존 이메일 로그인, 이메일 확인, 관리자 프로필 권한은 유지했다. 실제 공개 `/auth/v1/settings` GET에서 `disable_signup=true`, `external.email=true`, `external.anonymous_users=false`를 확인했다. 검증을 위해 실제 계정을 만들거나 비밀번호를 변경하지 않았다.

`Prevent use of leaked passwords`는 Dashboard와 공식 문서 모두 Pro 이상 조건을 명시한다. 요금제 결제/변경은 하지 않았다. `Secure password change`/`Require current password`도 기존 비밀번호 변경 화면의 재인증 연동을 먼저 보완해야 하므로 무작정 켜지 않았다.

## 보안·최적화 검증

- 의존성 감사: 변경 전 high 9/moderate 2, 변경 후 `pnpm audit --json` 알려진 advisory 0. React Router 8.0.1→8.3.0 및 기존 major 범위의 5개 전이 의존성만 좁게 고정. Router 공지는 이 앱에서 사용하지 않는 RSC 모드 경로이며 이 사이트에서 공격 재현했다고 주장하지 않음.
- 이미지 업로드: 명시된 MIME/확장자 충돌, 빈 파일, 비정상 용량 설정, HTML의 PNG 위장, 비정상 폴더를 업로드 호출 전에 거부. MIME 없는 정상 PNG는 올바른 Content-Type으로 업로드. 덮어쓰기 금지 유지. 이는 클라이언트 안전 검사이며 서버 파일 검사/악성코드 검사를 대체하지 않음.
- 서명 표시: 저장된 임의 외부 URL/SVG를 서명 이미지로 로드하지 않음. 정상 PNG는 유지. 원본 저장 행은 변경하지 않음.
- `pnpm check:supabase-live`: GET-only 37개 점검 성공. 원본 단원 정보, 후원사 비공개 필드, 접수 테이블 권한 거부 확인. private row 내용은 읽지 않음.
- `node scripts/check-site-editor-live.mjs`: 게시본 읽기·초안/이력 비공개 3개 성공.
- `node scripts/check-storage-listing-live.mjs`: 목록만 확인하는 읽기 전용 POST 1회. public URL 조회와 구분해 결과 표시. 현재 익명 반환 항목 0개.
- `pnpm test`: 최종 등록 목록 **340/340**, `pnpm lint`, `pnpm build` 통과. 기본 목록에서 빠졌던 공개 Provider DOM 보존 검사 4개를 추가했다. 초기 중복 coverage 검사는 문서화된 예외를 포함한 확장 AST 계약 검사로 통합했으며, 이때 실제 확인한 이전 검사 실패와 통합 이유는 `cms-cleanup-results.md`에 기록했다. 실행 범위 밖의 옛 시안 테스트나 실기기·운영 다중 세션 검증을 이 수에 포함하지 않음.
- 공개 초기 번들에서 CMS catalog/UI 분리. 같은 작업본의 index JS gzip 43.77→40.46kB. 실제 통신 전체나 체감 로딩 시간 감소로 과장하지 않음.
- 두 홈 hold effect: 80개 연속 scroll 이벤트가 다음 프레임의 한 계산으로 합쳐지는 테스트, 마지막 위치·모바일·모션 감소·pageshow·cleanup 5개 통과. CSS/기준 위치/애니메이션 시간은 변경하지 않음.
- 미사용 10개 소스 삭제는 `cms-cleanup-results.md`의 참조 검사와 복구 근거를 따른다. 원본 사진은 삭제하지 않음.

## 실제 화면 확인

`cms-browser-qa-progress.md`에 구체적인 입력·이동·인쇄/미리보기 검증과 한계를 기록했다. 운영 홈페이지의 버튼을 눌러 실제 문의/지원서/약정을 제출하지 않았다. CMS 쓰기 시나리오는 5177의 외부 연결 차단 합성 transport로 실행했다.

## 아직 남은 항목

| 항목 | 이유 / 안전한 다음 조건 |
|---|---|
| 공개 이미지의 비공개 초안 경계 | `site-images` public GET은 RLS를 우회함. 목록 차단만으로 해결되지 않음. 소비자·이전 빌드·관리자 미리보기·서명 URL 만료 대응과 배포 순서 검증 후 전환해야 함 |
| 기존 이미지 분류 | 실제 객체 25개 중 읽기 전용 1차 참조 대조에서 공개 콘텐츠 참조 13개, 미매칭 12개. 미매칭은 삭제 가능 판정이 아님. 이전 게시본/문서/코드 참조 추가 대조 필요 |
| 서버 업로드 내용 검사 | 브라우저 MIME/시그니처 검사는 우회 가능. 기존 SVG 로고 지원을 보존했으며 활성 SVG 제거·이미지 재인코딩 서버는 아직 도입하지 않음 |
| 배포 보안 헤더 | 배포 대상/설정이 저장소에 확인되지 않음. 개발 서버의 헤더를 운영 CSP/HSTS 적용으로 표현하지 않음 |
| Auth leaked-password 보호 | Advisor 비활성 경고, Dashboard와 공식 문서의 Pro 이상 조건 확인. 유료 플랜 변경 미실행. 현재 비밀번호 자체는 변경하지 않음 |
| 실제 DB 다중 세션 경합 | 단일 rollback 계약은 통과. 실제 두 세션 동시 저장·게시/제출, 시간 경계·전역 한도/입단 한도 추가 검증 필요 |
| 전체 문구 연결 | 1,097키/JSX 연결은 확인했으나 JS 조건부·모델 상수·시스템 오류/법적 원문 전수 편집 완료는 아님. 명시적 잔여 범위는 `site-editor-copy-coverage.md` |
| 최종 UI 검사 | 모든 화면의 200% 확대·실물 인쇄·모바일 실기기·전체 상호작용/사진 로딩 후 시각 대조는 미완료 |
| 정리·인계 | 검증 서버 5177/탭은 종료. 소유권 manifest·정확한 절대 경로·reparse point 부재 확인 후 임시 폴더 삭제를 시도했으나 실행 정책에 거부되어 24개 파일(약 5.48MB)이 남음. 검증 증거는 문서로 보존. 전체 요구 coverage와 최종 인계는 미완료 |
| 후속 Figma | 원래 계획 완료 전에는 스크롤바/영어 전체 시안을 착수하지 않음. 둘은 별도 사용자 확인 대상이며 코드 미적용 |

20,000개 자료를 실제 검토했다거나 보안상 완벽하다고 주장하지 않는다. Advisor의 공개 SECURITY DEFINER 함수 경고는 최소 공개 projection/검증 RPC의 의도된 인터페이스도 포함하므로 무조건 execute 권한을 제거하지 않는다. 다중 permissive policy도 기능과 성능을 구분해 검토해야 한다.

삭제가 거부된 대상은 `C:/Users/seong/AppData/Local/Temp/motet-site-editor-qa-4ba53e3c97474614b8dc2043d3ff7435` 한 곳이다. 다른 도구로 우회 삭제하지 않았다. 기존 `motet-contact-qa` 등 과거 자료는 이번 삭제 시도에 포함하지 않았다. 현재 홈페이지 서버 5175와 사용자 브라우저 탭은 종료하지 않았다.

## Git 검증 체크포인트

`7849450`에 CMS·보안·문서 변경을 커밋하고 기존 `origin/codex/recover-homepage-work` 브랜치로 푸시했다. 비밀값 패턴 검사에서 209개 변경 경로의 일치 0, 추적된 `.env` 0, 새 binary 0을 확인했다. 이는 패턴 검사 결과이지 비밀값이 절대 없다는 수학적 보증은 아니다. 이후 누락된 Provider 테스트 등록과 초기 중복 coverage 정리를 후속 커밋으로 기록한다. 전체 계획을 완료했거나 운영 웹 배포까지 끝냈다는 의미는 아니다.

## 확인한 공식 근거

- [Supabase 공개/비공개 버킷](https://supabase.com/docs/guides/storage/buckets/fundamentals): public retrieval의 권한 경계.
- [Supabase Storage 접근 제어](https://supabase.com/docs/guides/storage/security/access-control): 정책과 작업별 접근.
- [Supabase 다운로드](https://supabase.com/docs/guides/storage/serving/downloads): 서명 URL 만료와 유지 조건.
- [OWASP 파일 업로드](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html): MIME·확장자·시그니처 단독 의존 금지.
- [React Router 보안 공지](https://github.com/advisories/GHSA-qwww-vcr4-c8h2), [8.3.0 변경 기록](https://github.com/remix-run/react-router/releases/tag/react-router%408.3.0): 적용 버전과 RSC 영향 범위.
- [PostCSS 보안 공지](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp): 수정 버전.
- [pnpm 설정](https://pnpm.io/settings): 좁은 전이 의존성 overrides와 lockfile.
- [PostgreSQL ALTER FUNCTION](https://www.postgresql.org/docs/current/sql-alterfunction.html): 함수 본문·권한을 유지하는 설정 변경.
- [Supabase Auth 일반 설정](https://supabase.com/docs/guides/auth/general-configuration), [비밀번호 보안](https://supabase.com/docs/guides/auth/password-security): 미사용 공개 가입 차단, 기존 로그인 유지, 유료 기능 조건과 재인증 연동.
