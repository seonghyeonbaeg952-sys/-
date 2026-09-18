# 문구 상자 배치 검증 함수 운영 적용

적용·검증 시각: 2026-09-18 02:22–02:24 UTC / 11:22–11:24 KST.
대상: 운영 프로젝트 `bhawjbkyvnezqynprxfu`.

## 적용한 범위

- Supabase 커넥터의 `apply_migration`으로 준비된 DDL 한 개만 실행했다. 응답은 `success: true`.
- 원격 이력: `20260918022232`, 이름 `add_site_editor_text_layouts`.
- 로컬 파일: [20260918022232_add_site_editor_text_layouts.sql](../../supabase/migrations/20260918022232_add_site_editor_text_layouts.sql).
- 파일은 CLI `migration new`로 먼저 생성했고, 적용 후 확인된 원격 버전에 맞춰 이름만 정렬했다. 다른 과거 마이그레이션 이력은 수정하지 않았다.
- 적용 SQL SHA-256: `527e1f7b848e0341593f62a26bc9bc1005292854f8df4804e0beef7ae54ec825`.

신규 private helper `validate_site_editor_text_layouts(jsonb)`와 기존 `validate_site_editor_document(jsonb)`의 optional `textLayouts` 허용/검증 호출만 추가했다. 테이블·콘텐츠 행·Auth 설정·RLS·기존 API 권한은 변경하지 않았다. 마이그레이션 도구의 이력 기록 외에 실제 CMS 데이터 INSERT/UPDATE/DELETE, 저장 또는 게시 RPC는 실행하지 않았다. 사용자 브라우저와 기존 SQL 쿼리 탭도 변경하지 않았다.

## 사전 확인

운영 `validate_site_editor_document` 본문과 로컬 이전 마이그레이션의 본문을 문자열 리터럴을 보존한 SQL 토큰으로 비교했다. 720개 토큰이 동일했다. 새 helper는 적용 전에 없었다.

이전 마이그레이션 목록 조회는 빈 목록이었다. 이번 작업은 다른 로컬 pending 파일을 자동 적용하지 않았으며 기존 SQL Editor 적용분의 이력을 추정해 복구하지 않았다.

## 적용 후 실제 검증

1. 두 함수의 운영 본문이 적용 파일과 SQL 토큰 단위로 일치했다.
2. 두 함수 모두 `SECURITY INVOKER` (`prosecdef=false`), `IMMUTABLE` (`provolatile=i`), `search_path=''`였다.
3. 두 함수의 ACL은 `{postgres=X/postgres,service_role=X/postgres}`였고 `anon`/`authenticated`의 직접 EXECUTE는 모두 false였다.
4. [배치 검증 계약](../../supabase/tests/site_editor_text_layouts_contract.sql)을 실제 실행했고 `text_layouts_contract_passed`를 받았다. 공유 scope·임의 CSS·범위 밖 숫자·잘못된 키·500개 초과 항목은 거부하고, 허용된 기기/값과 구형 문서는 수용했다. 이 계약은 rollback-only이며 콘텐츠 행을 만들지 않는다.
5. [기존 글자 서식 계약](../../supabase/tests/site_editor_text_styles_contract.sql)도 실제 실행하여 `existing_text_styles_contract_passed`를 받았다.
6. 기존 초안 1개, 게시본 0개, 게시 이력 0개를 새 문서 validator로 검증했다. 오류 문서는 없었다. 원문 데이터는 출력하거나 문서에 복사하지 않았다.

## 데이터·권한 불변 확인

적용 전후 각 행의 `row_to_json` MD5를 기본키 순으로 집계한 해시와 행 수를 비교했다.

| 대상 | 전후 행 수 | 전후 동일한 집계 해시 |
|---|---:|---|
| site_editor_pages | 1 | `0f428d7aec4ecd849973c8d4c9d42c90` |
| site_editor_revisions | 0 | `d41d8cd98f00b204e9800998ecf8427e` |

두 테이블의 `relrowsecurity=true`, `relforcerowsecurity=true`, 테이블 ACL과 SELECT 관리자 정책도 전후 동일했다. 기존 `get_public_site_editor_pages`, `save_site_editor_draft`, `publish_site_editor_page`, `restore_site_editor_revision`의 본문 해시·ACL·SECURITY DEFINER 설정과 `validate_site_editor_text_styles`의 본문·ACL은 모두 같았다. 기존 관리자 판정과 버전 CAS를 우회하지 않았다.

## 보안 Advisor와 남은 운영 사항

적용 후 Security Advisor를 조회했다. 이번 두 validator는 노출 경고 대상이 아니었다. 그 외에 다음 항목은 남아 있으며 이번 제한된 DDL 작업에서 변경하지 않았다.

- private 접수 receipts 테이블의 RLS 정책 없음 INFO 1건: [진단 기준](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- 기존 SECURITY DEFINER RPC 실행 권한 경고: 익명 7건, 로그인 역할 10건. 공개 조회/접수 RPC와 관리자 RPC에 대한 의도 및 함수 내부 권한 검증을 별도 검토해야 하며, 이번에는 권한을 임의 회수하지 않았다. [익명 진단 기준](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [로그인 역할 진단 기준](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- 유출 비밀번호 보호 비활성 WARN 1건: [설정 안내](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Auth 설정은 미변경이다.

따라서 이 기록은 전체 보안 경고가 없다는 보고가 아니다. 새 앱의 호환 reader가 배포되기 전에는 운영 `textLayouts` 콘텐츠를 게시하지 않는다. 이번 작업에서는 배치 콘텐츠를 생성하거나 게시하지 않았으며, 실제 저장·재열기·게시 UI 검증은 격리된 fixture QA와 구분한다.
