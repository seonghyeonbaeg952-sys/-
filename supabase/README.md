# Supabase 운영 가이드

이 디렉터리는 서울모테트청소년합창단 홈페이지의 Database, Auth, Storage, RLS 설정을 관리합니다. 실제 계정 정보, 비밀번호, Supabase 키는 SQL이나 문서에 기록하지 않습니다.

## 2026-09-17 CMS 보완 적용 기록

운영 프로젝트에는 다음 5개 변경을 SQL Editor에서 검증 후 적용했다. **같은 운영 DB에 전체 schema/seed/migration을 다시 실행하지 않는다.** 코드 Git 복구점은 DB 백업이 아니다.

- `20260916161055_add_site_editor.sql`: 비공개 초안/이력, 공개 게시본, 버전 충돌 검사.
- `20260916164136_protect_sponsor_notes_and_retire_legacy_intake.sql`: 후원사 최소 필드 공개 RPC 및 옛 입단 업로드 경계 폐쇄.
- `20260916172006_secure_public_intake.sql`: 문의/약정 검증·멱등성·한도·원문 스냅샷, 입단 v2 한도 보완.
- `20260916201527_harden_timestamp_and_deduplicate_text_index.sql`: 타임스탬프 함수 검색 경로 고정 및 검증된 중복 인덱스 하나 제거. 원본 행과 unique 제약 유지.
- `20260916203156_restrict_site_image_listing.sql`: 관리자 전용 이미지 목록 조회. 공개 URL 조회는 그대로이며 비공개 초안 파일 경계 해결과 구분.

`tests/` SQL은 합성 데이터와 rollback 계약이다. 실제 접수 자료로 테스트하거나 테스트 파일의 `rollback`을 `commit`으로 바꾸지 않는다. 공개 조회는 `pnpm check:supabase-live`, 초안 보호는 `node scripts/check-site-editor-live.mjs`로 GET-only 검증한다.

SQL Editor 적용과 CLI migration history는 별개다. 현재 CLI 인증이 없어 원격 이력 동기화가 끝나지 않았다. 인증 후 실제 함수 정의·권한·이력을 대조한 다음 해당 버전만 정식 repair 절차로 정리한다. 내부 migration 테이블에 추정 INSERT를 하지 않는다.

보안 rollback 때 공개 직접 INSERT나 과거 익명 업로드를 다시 열지 않는다. 클라이언트 문제가 나면 검증된 새 RPC 사용 코드를 고치거나 원본을 보존한 채 해당 접수 기능을 잠시 중단한다. 이전 빌드로 단순 되돌리면 이전 API와 새 권한의 호환성이 깨질 수 있다.

Storage의 `site-images`는 아직 공개 버킷이다. 관리자 이미지 업로더의 파일 검사만으로 비공개 보관이 구현된 것은 아니다. 기존 공개 URL 호환·원본 자산 참조·초안 미리보기·URL 만료를 검증하지 않고 버킷을 private으로 바꾸거나 미매칭 파일을 삭제하지 않는다. 상세 현황은 `docs/cms-audit-results.md`를 참조한다.

## 신규 프로젝트 적용 순서

1. Supabase Dashboard의 SQL Editor에서 `supabase/schema.sql`을 실행합니다.
2. `supabase/migrations`의 SQL 파일을 파일명 순서대로 실행합니다.
3. Storage에서 `site-images` 버킷과 정책을 확인합니다.
4. 관리자 계정을 Supabase Auth로 만든 뒤 해당 사용자 UUID를 `profiles`의 `admin` 역할에 연결합니다.
5. 로컬에서 `pnpm check:supabase-env`와 `pnpm check:supabase-live`를 실행합니다.

기존 프로젝트에는 아직 적용하지 않은 migration만 순서대로 실행합니다. 이미 적용한 migration을 다시 실행하기 전에는 SQL의 멱등성 여부를 확인합니다.

## 현재 migration 목록

- `2026_add_about_sections.sql`
- `2026_add_conductor_profile_document_fields.sql`
- `2026_add_home_content_fields.sql`
- `2026_add_location_contact_fields.sql`
- `2026_add_location_image_fields.sql`
- `2026_add_location_map_embed_url.sql`
- `2026_add_member_university_group.sql`
- `2026_add_popup_notices.sql`
- `2026_add_site_texts.sql`
- `2026_add_sponsors.sql`
- `2026_add_support_settings.sql`
- `2026_fix_spirit_support_schema.sql`
- `2026_repair_admin_backend_flows.sql`
- `2026_seed_spirit_sections.sql`
- `2026_update_member_group_types_staff_alumni.sql`
- `20260712_seed_join_faq.sql`
- `20260715_add_missing_home_site_text_keys.sql`
- `20260716_protect_public_members.sql`

## 관리자 계정

관리자 계정은 Supabase Auth로 생성하고 `profiles.role = 'admin'`으로 연결합니다.

2026-09-17 기준 공개 self-signup은 비활성화했습니다. 방문자 회원가입이 없는 사이트이므로 기존 관리자 이메일 로그인만 유지합니다. 신규 관리자는 운영 책임자가 Dashboard의 관리자 사용자 생성 절차를 사용하고 역할을 부여합니다. 일반 signup을 다시 열어 관리자 계정을 만들지 마세요.

```sql
insert into public.profiles (id, email, role)
values ('<auth-user-uuid>', '<admin-email>', 'admin')
on conflict (id) do update
set role = 'admin', email = excluded.email, updated_at = now();
```

위 값은 예시 placeholder입니다. 실제 UUID와 이메일은 Dashboard에서 직접 입력하며 저장소에 남기지 않습니다.

## 권한 원칙

- 공개 콘텐츠는 필요한 테이블에서 `is_visible = true`인 행만 익명 조회를 허용합니다.
- 청소년 단원의 원본 이름·사진·소개문은 관리자만 조회합니다. 공개 화면은 로그인 상태와 무관하게 `get_public_members()` RPC만 사용하며, 공개 동의가 반영된 `public_display_name`과 비식별 명단 필드만 받습니다.
- `contacts`, `join_applications`, `support_pledges`의 목록 조회와 수정은 관리자만 가능합니다.
- 관리자 여부는 `auth.uid()`와 `profiles.role = 'admin'`으로 판정합니다.
- 프론트엔드에는 anon key만 사용하며 `service_role` 키를 절대 넣지 않습니다.
- RLS를 임시로 해제해 오류를 해결하지 않습니다.

## Storage

기본 버킷은 `site-images`입니다. 공개 이미지는 읽을 수 있지만 업로드, 교체, 삭제는 관리자만 가능해야 합니다.

주요 경로:

- `hero/`
- `settings/`
- `conductor/`
- `accompanist/`
- `concerts/`
- `gallery/`
- `posters/`
- `notices/`
- `history/`
- `locations/`
- `brand/`
- `join-applications/`

업로드 제한과 허용 MIME 타입은 `schema.sql` 및 후속 migration을 기준으로 유지합니다.

## 환경변수

실제 값은 `.env.local`에만 저장합니다.

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SITE_NAME=
VITE_SITE_URL=
```

`.env.local`은 Git에 커밋하지 않습니다. `service_role`, 데이터베이스 비밀번호, SMTP/API 키를 Vite 환경변수로 만들지 않습니다.

## 운영 검증

```bash
pnpm check:supabase-env
pnpm check:supabase-live
pnpm test
pnpm lint
pnpm build
```

`check:supabase-live`는 공개 스키마와 주요 필드, Storage 버킷, 비공개 테이블의 익명 접근 차단을 확인합니다. 관리자 쓰기와 실제 파일 업로드는 로그인된 관리자 화면에서 별도의 테스트 데이터로 확인해야 합니다.

운영 점검 시 다음도 확인합니다.

- Supabase Security Advisor의 RLS 경고
- Performance Advisor의 인덱스 경고
- 관리자 로그아웃 후 `/admin` 접근 차단
- 공개 화면에 비공개 문의, 답변, 메모가 노출되지 않는지
- 테스트 데이터만 삭제하거나 보관 처리했는지
