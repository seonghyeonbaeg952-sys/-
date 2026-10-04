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

- 런타임은 `package.json`의 Node **24.x**, 패키지 매니저는 **pnpm 10.32.1**로 지정합니다. `vercel.json`에는 Vite preset, 버전 고정·frozen-lockfile 설치, `pnpm build`, `dist`가 명시되어 있습니다. 별도 Corepack 환경변수 없이 설치 명령에서 지정한 pnpm 버전을 사용합니다.
- 현재는 **연결 준비만 하고 배포는 보류**합니다. 이 설정이 포함된 브랜치에서는 `git.deploymentEnabled: false`로 push/PR 자동 배포를 차단합니다. 수동 **Deploy**, CLI 배포, Deploy Hook은 자동 Git 배포 차단과 별개이므로 승인 전 실행하지 않습니다. 나중에 Git 자동 배포를 시작하려면 해당 값을 변경하고 별도로 검수합니다.
- 현재 준비 코드의 브랜치는 **`codex/recover-homepage-work`**입니다. `main`에는 같은 변경이 모두 반영되어 있지 않으므로, 저장소 연결 후 기본 Production Branch가 `main`이라는 이유만으로 최신 작업 코드라고 가정하지 않습니다. 브랜치 병합이나 Production Branch 변경은 따로 결정합니다.
- 버셀 프로젝트와 Git 저장소 연결은 코드 설정이나 Git push만으로 완료되지 않습니다. 연결 도구가 실패하면 실제 프로젝트 연결 상태를 다시 조회하며, 연결·빌드·배포 성공을 구분합니다. 프로젝트 생성 시 **연결만** 하는 옵션을 사용하고, 일반 가져오기 화면의 Deploy 버튼으로 우회하지 않습니다.
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
