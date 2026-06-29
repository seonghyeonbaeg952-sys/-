# Supabase Schema Sync

이 문서는 Spirit/후원약정/CMS 확장 이후 원격 Supabase DB와 코드 스키마를 맞추기 위한 적용 안내입니다.

## 적용할 Migration

`supabase/migrations/2026_fix_spirit_support_schema.sql`

이 migration은 다음 문제를 보정합니다.

- `support_settings` 테이블 누락으로 `/contact?section=support`에서 발생하던 네트워크 404 제거
- `support_pledges` 후원약정 제출 저장 테이블과 RLS 보강
- 지휘자 공식 프로필 문서형 필드 보강
- 반주자 공개 프로필 기본 필드 보강
- 단원 `member_status`와 `group_type` 운영 기준 보강

## SQL Editor 적용 순서

Supabase Dashboard에서 `SQL Editor`를 열고 아래 순서로 실행합니다.

1. `supabase/schema.sql`이 아직 적용되지 않았다면 먼저 실행
2. 기존 migration을 순서대로 실행하지 않았다면 누락분 실행
3. `supabase/migrations/2026_fix_spirit_support_schema.sql` 실행

이 migration은 `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS`를 사용합니다. 기존 데이터를 삭제하거나 컬럼명을 바꾸지 않습니다.

## 적용 후 확인할 화면

- `/contact?section=support`
- `/admin/support`
- `/admin/support-pledges`
- `/about?section=conductor`
- `/about?section=accompanist`
- `/about?section=members`
- `/spirit`

## 정상 상태

- 브라우저 Network/Console에서 `support_settings` 404가 없어야 합니다.
- `/contact?section=support`는 DB 설정값이 있으면 DB 문구를, 없으면 fallback 문구를 보여야 합니다.
- 후원약정 제출은 `support_pledges`에 저장되어야 합니다.
- public 사용자는 `support_pledges` 목록을 조회할 수 없어야 합니다.
- 관리자는 `/admin/support`에서 문구와 계좌 안내를 저장할 수 있어야 합니다.
- 관리자는 `/admin/support-pledges`에서 접수된 약정의 처리 상태만 변경할 수 있어야 합니다.

## 남는 수동 작업

Codex는 원격 Supabase SQL Editor에 직접 migration을 적용하지 않습니다. 원격 DB의 404를 완전히 없애려면 위 SQL을 Dashboard에서 직접 실행해야 합니다.

실제 계좌번호, 관리자 이메일, 비밀번호, Supabase key, service role key는 migration 또는 문서에 넣지 않습니다.
