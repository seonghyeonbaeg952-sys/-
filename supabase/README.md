# Supabase 설정 가이드

이 폴더는 서울모테트청소년합창단 공식 홈페이지의 Supabase DB schema, RLS 정책, Storage 정책을 준비합니다. 실제 관리자 계정, 비밀번호, Supabase key, Figma token은 이 문서나 SQL에 절대 넣지 않습니다.

## 1. 적용 순서

1. Supabase 프로젝트를 생성합니다.
2. Dashboard에서 `SQL Editor`로 이동합니다.
3. `supabase/schema.sql` 전체 내용을 새 query에 붙여넣고 실행합니다.
4. `supabase/migrations/2026_add_about_sections.sql`을 실행해 소개 섹션 CMS 테이블을 추가합니다.
5. 실행 후 Table Editor에서 테이블과 RLS 활성화 상태를 확인합니다.
6. Storage에서 `site-images` bucket이 생성되었는지 확인합니다.
7. 필요하면 `supabase/seed.example.sql`을 별도로 실행해 공개 placeholder 데이터만 넣습니다.
8. 소개/연혁 예시 콘텐츠가 필요하면 `supabase/seed.about-history.example.sql`을 추가로 실행합니다.

## 2. 관리자 계정

관리자 계정은 반드시 Supabase Auth 공식 방식으로 생성합니다.

- Dashboard > Authentication > Users에서 사용자를 생성하거나 공식 Auth 플로우를 사용합니다.
- 관리자 비밀번호 설정과 변경은 Supabase Auth에서 처리합니다.
- 비밀번호를 DB 테이블, SQL 파일, README, 프론트엔드 코드에 저장하지 않습니다.
- 실제 관리자 이메일도 이 저장소의 SQL/문서에 기록하지 않습니다.

Auth user를 만든 뒤 해당 user id를 `profiles` 테이블과 연결해야 합니다.

```sql
insert into public.profiles (id, email, role)
values ('<auth-user-uuid>', '<admin-email>', 'admin')
on conflict (id) do update
set role = 'admin', email = excluded.email, updated_at = now();
```

위 예시는 placeholder입니다. 실제 값은 Supabase SQL Editor에서 운영자가 직접 넣습니다.

## 3. RLS 정책 요약

- 모든 public schema 테이블은 RLS가 활성화됩니다.
- 방문자는 공개 콘텐츠 테이블에서 `is_visible = true`인 row만 조회할 수 있습니다.
- `is_visible = false` 데이터는 public select 정책으로 노출되지 않습니다.
- 관리자 여부는 `public.profiles.role = 'admin'`으로 판단합니다.
- `public.is_admin()` helper function은 `auth.uid()` 기준으로 현재 사용자의 admin 여부를 확인합니다.
- `contacts`는 방문자가 `privacy_agreed = true`이고 `status = 'new'`인 경우에만 insert할 수 있습니다.
- `contacts` 조회, 수정, 삭제는 admin만 가능합니다.
- 일반 authenticated user는 자기 `profiles` row만 select할 수 있습니다.
- admin은 `profiles`를 포함한 CMS 관리 테이블을 select/insert/update/delete할 수 있습니다.

## 4. 생성되는 테이블

- `profiles`
- `site_settings`
- `about_sections`
- `hero_slides`
- `conductor`
- `accompanist`
- `members`
- `history`
- `locations`
- `concerts`
- `notices`
- `gallery`
- `videos`
- `posters`
- `join_info`
- `faq`
- `contacts`

## 5. Storage 설정

기본 bucket 이름은 `site-images`입니다.

`schema.sql`은 다음 설정으로 bucket 생성을 시도합니다.

- public read: true
- max file size: 10MB
- allowed mime types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml`

SQL Editor에서 bucket insert 권한 문제가 발생하면 Dashboard에서 직접 생성합니다.

1. Dashboard > Storage로 이동합니다.
2. 새 bucket을 만들고 이름을 `site-images`로 설정합니다.
3. Public bucket으로 설정합니다.
4. SQL Editor에서 `schema.sql`의 Storage policy 구간을 다시 실행합니다.

관리자가 업로드할 수 있는 경로는 다음 구조를 가정합니다.

- `hero/`
- `settings/`
- `conductor/`
- `accompanist/`
- `members/`
- `concerts/`
- `gallery/`
- `posters/`
- `notices/`
- `history/`
- `brand/`

Storage 업로드, 수정, 삭제는 `profiles.role = 'admin'`인 사용자만 가능합니다. 프론트엔드에서 `service_role` key를 사용하지 않습니다.

## 6. 환경변수

프론트엔드는 이름만 사용합니다. 실제 값은 `.env.local` 또는 Vercel Environment Variables에만 넣습니다.

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SITE_NAME=서울모테트청소년합창단
VITE_SITE_URL=
```

로컬 개발:

```bash
cp .env.example .env.local
```

그 다음 `.env.local`에 Supabase Project URL과 anon key를 직접 입력합니다. `.env.local`은 git에 커밋하지 않습니다.

Vercel 배포:

1. Vercel Project > Settings > Environment Variables로 이동합니다.
2. `VITE_SUPABASE_URL`을 추가합니다.
3. `VITE_SUPABASE_ANON_KEY`를 추가합니다.
4. Production, Preview 환경에 필요한 값만 설정합니다.
5. `service_role` key는 Vercel 클라이언트 환경변수에 넣지 않습니다.

## 7. seed.example.sql

`seed.example.sql`은 공개 홈페이지 placeholder 데이터만 넣는 선택 파일입니다.

- 실제 관리자 계정 없음
- 실제 비밀번호 없음
- Supabase key 없음
- 개인정보 없음

운영 데이터는 이후 관리자 CMS에서 등록/수정하는 흐름을 기준으로 합니다.

`seed.about-history.example.sql`은 소개 섹션과 연혁 예시 데이터만 포함합니다. 소개 문구는 이후 `/admin/about`에서 수정하고, 연혁은 `/admin/history`에서 관리합니다.

## 8. 운영 전 확인

- Supabase Security Advisor에서 RLS 경고가 없는지 확인합니다.
- Supabase Performance Advisor에서 누락 인덱스 경고를 확인합니다.
- 관리자 계정의 비밀번호는 Supabase Auth에서 운영 전 변경합니다.
- 청소년 단원 정보는 `members.name_display_type`, `members.is_visible` 기준으로 공개 범위를 통제합니다.
