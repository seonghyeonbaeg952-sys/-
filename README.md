# 서울모테트청소년합창단 공식 홈페이지

React, Vite, TypeScript, Tailwind CSS 기반의 공식 홈페이지와 관리자 CMS 프로젝트입니다.

## 주요 기능

- 방문자용 public 페이지: 홈, 소개, 공연, 공지, 갤러리, 입단 안내, 후원·문의
- 관리자 CMS: Supabase Auth 기반 로그인, `profiles.role = 'admin'` 권한 확인, 콘텐츠 CRUD
- Supabase Database: 공개 데이터는 `is_visible = true`만 조회
- Supabase Storage: `site-images` bucket 기준 이미지 업로드
- 청소년 개인정보 보호: 단원 이름 공개 방식과 공개 여부 관리

## 로컬 실행

```bash
pnpm install
pnpm check:supabase-env
pnpm dev
```

## 검증

```bash
pnpm lint
pnpm build
```

## 환경변수

실제 값은 `.env.local` 또는 배포 플랫폼의 Environment Variables에만 넣습니다. 실제 관리자 이메일, 비밀번호, Supabase key, service role key, Figma token, API key는 코드와 문서에 기록하지 않습니다.

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SITE_NAME=서울모테트청소년합창단
VITE_SITE_URL=
```

Supabase 환경변수가 없으면 public 화면은 fallback 데이터로 안전하게 표시되고, 관리자 화면은 설정 안내를 표시합니다.

로컬 연결 상태는 아래 명령으로 확인합니다. 실제 값은 출력하지 않고 `[set]` 또는 `[missing]`만 표시합니다.

```bash
pnpm check:supabase-env
```

실제 Supabase REST/Storage 연결은 아래 명령으로 읽기 전용 점검합니다. 이 명령도 URL/key 값은 출력하지 않습니다.

```bash
pnpm check:supabase-live
```

## Supabase 적용 문서

- SQL/RLS/Storage 기본 설명: `supabase/README.md`
- live 프로젝트 연결 및 검증 절차: `docs/supabase-live-checklist.md`
- 배포 전 콘텐츠 준비: `docs/content-checklist.md`

관리자 계정은 Supabase Dashboard의 Authentication에서 생성하고, 생성된 Auth user id를 `profiles.role = 'admin'`으로 연결합니다. 비밀번호는 Supabase Auth에서만 관리합니다.

## 배포 전 주의

- 실제 운영 사진과 콘텐츠를 CMS에 등록한 뒤 배포합니다.
- `is_visible=false` 데이터가 public 페이지에 보이지 않는지 확인합니다.
- `site-images` Storage 업로드, public read, admin-only mutation 정책을 확인합니다.
- `contacts` 문의 데이터는 public 화면에 노출하지 않습니다.
