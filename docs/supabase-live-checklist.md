# Supabase live 연결 및 배포 전 검증 체크리스트

이 문서는 실제 Supabase 프로젝트에 SQL, RLS, Storage, 관리자 CMS를 연결한 뒤 배포 전에 확인할 항목을 정리한다. 실제 관리자 이메일, 비밀번호, Supabase URL, anon key, service role key, Figma token, API key는 이 문서에 기록하지 않는다.

## 1. 프로젝트 생성 후 준비

- Supabase 프로젝트를 생성한다.
- Project Settings에서 Project URL과 anon public key를 확인한다.
- 로컬에서는 `.env.local`에만 값을 넣는다.
- `.env.local`은 `.gitignore`에 포함되어 있어야 하며 커밋하지 않는다.
- 배포 플랫폼에는 Environment Variables로만 값을 넣는다.
- `service_role` key는 프론트엔드 환경변수에 절대 넣지 않는다.

필요한 환경변수 이름:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SITE_NAME=서울모테트청소년합창단
VITE_SITE_URL=
```

로컬 env 상태는 값 노출 없이 아래 명령으로 확인한다.

```bash
pnpm check:supabase-env
```

출력은 `[set]` 또는 `[missing]`만 확인한다. 실제 Project URL, anon key, 관리자 이메일, 비밀번호는 터미널 출력이나 문서에 남기지 않는다.

로컬 네트워크에서 실제 Supabase REST/Storage 연결을 읽기 전용으로 점검하려면 아래 명령을 실행한다.

```bash
pnpm check:supabase-live
```

`[missing-table-or-bucket]`이 나오면 SQL 또는 Storage bucket 적용 상태를 확인한다. `[blocked-by-auth-or-rls]`가 나오면 anon key, grants, RLS policy를 확인한다. `[network-error]` 또는 `[timeout]`은 현재 네트워크/방화벽/프록시 상태를 먼저 확인한다.

## 2. SQL 실행 순서

Supabase Dashboard > SQL Editor에서 아래 순서대로 실행한다.

1. `supabase/schema.sql`
2. `supabase/migrations/2026_add_about_sections.sql`
3. `supabase/seed.example.sql` 선택 실행
4. `supabase/seed.about-history.example.sql` 선택 실행

seed 파일은 공개 가능한 예시 데이터만 넣는다. 실제 운영 DB에 seed를 넣기 전에는 문구, 날짜, 공개 여부를 반드시 확인한다. 실제 관리자 계정 정보는 seed에 넣지 않는다.

## 3. RLS 확인

Table Editor에서 public schema의 모든 CMS 테이블에 RLS가 활성화되어 있는지 확인한다. SQL로 확인할 때는 아래 쿼리를 사용할 수 있다.

```sql
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

public 페이지 데이터는 `is_visible = true` 조건으로만 조회되어야 한다. 관리자 CRUD는 `public.is_admin()` 기준으로만 허용되어야 한다.

## 4. 관리자 계정 생성 및 role 연결

관리자 계정은 Supabase Auth 공식 화면에서 생성한다.

1. Supabase Dashboard에 접속한다.
2. Authentication > Users로 이동한다.
3. 관리자 계정을 생성한다.
4. 생성된 user id를 복사한다.
5. SQL Editor에서 `profiles.role = 'admin'`으로 연결한다.
6. `/admin/login`에서 로그인한다.
7. `/admin/account`에서 운영 전 비밀번호 변경 기능을 확인한다.

placeholder SQL 예시:

```sql
-- 실제 이메일/비밀번호를 여기에 쓰지 말 것.
-- Supabase Auth에서 생성된 user id를 확인한 뒤 아래 id와 email placeholder를 운영자가 직접 교체한다.

insert into public.profiles (id, email, role, display_name)
values (
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  'admin',
  '관리자'
)
on conflict (id) do update
set role = 'admin',
    updated_at = now();
```

위 SQL은 placeholder다. 비밀번호는 Supabase Auth에서만 관리한다.

관리자 연결 확인:

- `/admin/login`에서 로그인한다.
- 로그인 후 `/admin`으로 이동되는지 확인한다.
- `profiles.role`이 `admin`이 아니면 관리자 화면 접근이 차단되는지 확인한다.
- `/admin/account`에서 비밀번호 변경 UI가 표시되는지 확인한다.

## 5. Storage bucket 확인

확인할 bucket:

- `site-images`

확인할 폴더:

- `hero`
- `settings`
- `conductor`
- `accompanist`
- `members`
- `concerts`
- `gallery`
- `posters`
- `notices`
- `history`
- `brand`

bucket 설정 확인 쿼리:

```sql
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'site-images';
```

Storage policy 확인 쿼리:

```sql
select
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
```

검증 기준:

- `site-images` bucket이 존재한다.
- public read가 가능하다.
- admin만 upload/update/delete 가능하다.
- 비로그인 사용자는 upload/delete가 차단된다.
- 파일 크기와 MIME 제한이 동작한다.
- 업로드된 public URL이 public 페이지에서 표시된다.
- 이미지 교체 또는 제거 후 DB URL이 의도대로 저장된다.

## 6. 관리자 CMS live CRUD 검증

아래 페이지에서 실제 Supabase DB를 대상으로 확인한다.

- `/admin/settings`
- `/admin/about`
- `/admin/hero-slides`
- `/admin/conductor`
- `/admin/accompanist`
- `/admin/members`
- `/admin/concerts`
- `/admin/notices`
- `/admin/gallery`
- `/admin/videos`
- `/admin/posters`
- `/admin/history`
- `/admin/location`
- `/admin/join`
- `/admin/contacts`
- `/admin/account`

공통 검증:

- 목록 조회
- 추가
- 수정
- 삭제
- `is_visible` 토글
- `display_order` 변경
- 저장 중 버튼 disabled
- 저장 성공 메시지
- 실패 시 사용자용 오류 메시지
- 모바일 관리자 화면 overflow 없음

단일 레코드 upsert 검증:

- `site_settings`
- `conductor`
- `accompanist`
- `locations`
- `join_info`

## 7. Home Hero 슬라이드 live 검증

`/admin/hero-slides`에서 확인한다.

- 슬라이드 3개 이상 등록
- 각 슬라이드 이미지 업로드
- title, subtitle, description, CTA 문구와 링크 입력
- `display_order`를 1, 2, 3으로 설정
- `is_visible=true` 설정
- public 홈에서 순서대로 표시되는지 확인
- 하나를 `is_visible=false`로 바꿨을 때 public 홈에서 사라지는지 확인
- 이미지 없는 슬라이드는 gradient fallback으로 표시되는지 확인
- mobile 390px에서 Hero 텍스트, CTA, indicator가 겹치지 않는지 확인

## 8. ImageUploader live 검증

ImageUploader 사용 페이지:

- `/admin/hero-slides`
- `/admin/conductor`
- `/admin/accompanist`
- `/admin/members`
- `/admin/concerts`
- `/admin/notices`
- `/admin/gallery`
- `/admin/posters`
- `/admin/history`

각 페이지에서 확인한다.

- 이미지 선택 가능
- drag/drop 가능
- 업로드 진행 상태 표시
- 업로드 성공 후 public URL 저장
- 저장 후 목록 preview 표시
- public 페이지에서 이미지 표시
- 이미지 로딩 실패 시 fallback 표시
- 이미지 교체 가능
- 이미지 URL 제거 가능
- Storage 권한 오류 시 명확한 오류 메시지 표시

## 9. public 페이지 live DB 검증

검증 대상:

- `/`
- `/about`
- `/concerts`
- `/concerts/:id`
- `/notices`
- `/notices/:id`
- `/gallery`
- `/join`
- `/contact`

검증 기준:

- `is_visible=true` 데이터 표시
- `is_visible=false` 데이터 숨김
- 데이터 없음 상태 표시
- Supabase 오류 시 ErrorState 또는 fallback 표시
- 이미지 URL이 있으면 이미지 표시
- 이미지 URL이 깨졌으면 fallback 표시
- 잘못된 상세 id 접근 시 NotFound 또는 EmptyState 표시
- mobile 390px에서 overflow 없음
- desktop 1440px에서 layout 깨짐 없음

## 10. Contact form live insert 검증

`/contact`에서 확인한다.

- 필수값 validation
- 이메일 형식 validation
- 개인정보 동의 validation
- 정상 입력 시 `contacts` insert
- `status='new'` 저장
- `/admin/contacts`에서 문의 확인 가능
- status 변경 가능
- 삭제 가능
- 비로그인 사용자도 `privacy_agreed=true`일 때만 insert 가능
- honeypot 필드가 채워진 요청은 DB에 저장되지 않음

관리자에서 문의 데이터를 확인할 때 문의자의 개인정보는 public 화면에 노출하지 않는다.

## 11. 로컬 렌더링 smoke 검증

dev 서버를 재시작한 뒤 아래 경로를 확인한다.

- `/`
- `/admin/login`
- `/admin/hero-slides`
- `/contact`

검증 기준:

- Supabase env가 비어 있으면 관리자 설정 안내가 표시된다.
- Supabase env가 설정되어 있으면 관리자 로그인 폼이 표시된다.
- public 화면은 env 누락 시에도 빈 화면으로 죽지 않는다.
- 브라우저 콘솔에 Vite/React 치명 오류가 없다.
- mobile 390px과 desktop 1440px에서 가로 overflow가 없다.

## 12. 배포 전 최종 확인

- 실제 운영 사진과 문구가 CMS에 등록되어 있다.
- `docs/content-checklist.md`의 사진, 콘텐츠, 개인정보 항목을 확인했다.
- `pnpm lint`가 통과한다.
- `pnpm build`가 통과한다.
- 브라우저 콘솔 치명 오류가 없다.
- 실제 key/token/비밀번호가 코드와 문서에 없다.
- 배포 전 관리자 비밀번호 변경을 완료했다.
- public 페이지에서 `is_visible=false` 데이터가 보이지 않는다.

이번 문서는 live 검증을 위한 절차 문서이며, Vercel 배포 실행은 포함하지 않는다.
