# 서울모테트청소년합창단 공식 홈페이지

React, Vite, TypeScript, Tailwind CSS 기반의 공식 홈페이지와 관리자 CMS 프로젝트입니다.

## 주요 기능

- 방문자용 public 페이지: 홈, 소개, 공연, 공지, 갤러리, 입단 안내, 후원·문의
- 관리자 CMS: Supabase Auth 기반 로그인, `profiles.role = 'admin'` 권한 확인, 콘텐츠 CRUD
- Supabase Database: 공개 데이터는 `is_visible = true`만 조회
- Supabase Storage: `site-images` bucket 기준 이미지 업로드
- 청소년 개인정보 보호: 단원 이름 공개 방식과 공개 여부 관리
- 공개 홈페이지의 한국어 기본·영어 전환 및 독립 영문 CMS: [사용 안내](docs/sample-english-guide.md) (`/?lang=en`, `/sample/`, `/admin/editor-english`)

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

### Vercel 준비

- **2026-10-06 검색 노출 보류:** 운영 배포와 주소 직접 접속은 유지하지만, 사용자가 검색 노출을 별도로 승인할 때까지 모든 응답에 `X-Robots-Tag: noindex`를 적용합니다. Search Console 등록·색인 요청·사이트맵 제출은 하지 않습니다. `noindex`는 비밀번호나 접근 제어가 아니며, 검색엔진이 다시 수집해야 반영됩니다. 검색봇이 이 헤더를 읽을 수 있도록 `robots.txt`로 수집을 차단하지 않습니다.
- 운영 방문 주소는 **https://seoulmotetyouthchoir.com**으로 통일합니다. `www`는 기존 프로젝트 도메인 설정에서, `*.vercel.app`은 `vercel.json`의 호스트 조건에서 본 도메인으로 이동합니다. Vercel 기본 주소의 기존 SSO 보호는 유지하고, 로컬 편집 서버는 영향을 받지 않습니다.
- 런타임은 `package.json`의 Node **24.x**, 패키지 매니저는 **pnpm 10.32.1**로 지정합니다. `vercel.json`에는 Vite preset, 버전 고정·frozen-lockfile 설치, `pnpm build`, `dist`가 명시되어 있습니다. 별도 Corepack 환경변수 없이 설치 명령에서 지정한 pnpm 버전을 사용합니다.
- **2026-10-06 사용자 승인으로 운영 배포와 자동 배포를 활성화**합니다. `git.deploymentEnabled`는 `main: true`, `**: false`로 설정해 `main` 커밋·푸시만 자동 배포합니다. `**`는 `codex/` 같은 경로형 이름까지 포함해 다른 브랜치와 복구용 브랜치의 자동 배포를 차단합니다.
- 최신 운영 코드는 **`main`**에 반영되며, **`codex/recover-homepage-work`**는 복구용으로 보존합니다. GitHub 기본 브랜치와 Vercel의 Production Branch는 별도 설정이므로 Vercel Production Branch가 실제로 `main`인지 확인합니다. 자동 배포는 Git에 커밋·푸시된 변경만 반영하며, 미커밋 파일을 자동 저장하거나 커밋하지 않습니다.
- Vercel 프로젝트와 Git 저장소 연결은 코드 설정이나 Git push만으로 완료되지 않습니다. 기존 `motet-homepage` 프로젝트 연결과 운영 환경변수를 확인하고, 원격 빌드·배포의 `READY` 상태를 확인합니다. 연결·빌드·배포 성공은 구분하며, 이전 연결 준비 계획의 배포 보류 지침은 이번 승인으로 대체됩니다.
- GitHub 저장소를 연결할 때 프로젝트 루트를 이 폴더로 지정하고, Framework Preset은 **Vite**, Build Command는 `pnpm build`, Output Directory는 `dist`로 확인합니다. `pnpm-lock.yaml`을 함께 사용합니다.
- `vercel.json`은 React Router의 `/spirit`, `/join`, `/sample/`, `/admin/login` 같은 주소를 직접 열거나 새로고침해도 Vite의 `index.html`로 들어가게 합니다.
- Vercel 프로젝트의 Environment Variables에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 Production과 필요한 Preview 환경별로 등록합니다. `.env.local`은 업로드되지 않습니다. `VITE_SITE_NAME`, `VITE_SITE_URL`도 해당 환경의 실제 값으로 설정할 수 있으며, 주소가 정해지기 전에는 임의 URL을 넣지 않습니다.
- `VITE_` 접두사 변수는 브라우저 번들에 포함되므로 `service_role` 또는 다른 비밀키를 넣지 않습니다. Supabase RLS, 공개 데이터, Storage 권한은 별도로 확인합니다.
- Vercel의 기본 Production Branch가 `main`인지 확인합니다. 작업 브랜치를 연결하면 먼저 Preview로 점검하고, 운영 반영은 검증 후 Production Branch에서 결정합니다. 저장소 연결·환경변수 등록·배포는 이 코드 설정만으로 자동 수행되지 않습니다.
- Preview에서 홈뿐 아니라 `/spirit`, `/join`, `/sample/`, `/admin/login`을 각각 직접 열고 새로고침한 뒤 관리자 로그인·CMS 게시·사진 업로드를 확인합니다.

- 전체 공개 사진 교체: 관리자 메뉴 **홈페이지 사진 관리** (`/admin/photos`). 사용 방법과 초안·게시·언어 분리는 `docs/site-photo-cms-guide.md`를 참고합니다.

- 실제 운영 사진과 콘텐츠를 CMS에 등록한 뒤 배포합니다.
- `is_visible=false` 데이터가 public 페이지에 보이지 않는지 확인합니다.
- `site-images` Storage 업로드, public read, admin-only mutation 정책을 확인합니다.
- `contacts` 문의 데이터는 public 화면에 노출하지 않습니다.
