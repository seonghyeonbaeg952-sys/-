# 서울모테트청소년합창단 홈페이지 작업 지침

## 프로젝트 성격

이 프로젝트는 React, Vite, TypeScript, Tailwind CSS, Supabase 기반의 서울모테트청소년합창단 공식 홈페이지다. 방문자용 public 홈페이지, 관리자 CMS, Supabase Auth, Supabase Database, Supabase Storage, RLS가 함께 연결되어 있다.

## 보안 원칙

- `.env`, `.env.local`, Supabase key, Figma token, 관리자 비밀번호를 코드나 문서에 직접 넣지 않는다.
- 프론트엔드에서 Supabase `service_role` key를 사용하지 않는다.
- 기존 Supabase Auth, `profiles.role = 'admin'`, `ProtectedAdminRoute` 구조를 완화하지 않는다.
- public 화면은 `is_visible = true` 데이터만 보여준다.
- 단원은 청소년이므로 public 화면에서 사진 중심 소개를 만들지 않는다.
- 단원 public 화면은 이름 공개 설정, 파트, 그룹, 활동 상태 중심으로 표현한다.
- 새 production dependency는 꼭 필요할 때만 추가하고, 기존 코드 패턴으로 해결 가능한지 먼저 확인한다.

## 구현 원칙

- 기존 라우팅, publicData/usePublicData, Admin CRUD, Storage 패턴을 우선한다.
- public 화면과 admin 화면의 레이아웃을 섞지 않는다.
- 데이터가 없거나 Supabase schema migration이 아직 적용되지 않아도 화면이 깨지지 않게 fallback 또는 EmptyState를 둔다.
- 이미지가 인물 사진이나 포스터일 때는 원본 비율 보존을 우선하고, 분위기 배경 이미지에만 제한적으로 cover를 사용한다.
- decorative animation은 `prefers-reduced-motion`에서 비활성화되도록 한다.
- 모바일 터치 영역은 최소 44px 이상을 유지한다.
- 작업 후 가능한 범위에서 `pnpm lint`, `pnpm build`, 주요 route 렌더링을 확인한다.

## 디자인 방향

- Deep Navy 무대감, Warm Gold 조명감, Ivory paper 질감을 중심으로 한다.
- 방문자 페이지는 감성적이고 격조 있게, 관리자 페이지는 실용적이고 명확하게 유지한다.
- 합창단 정신은 정직한 음악, 교회음악의 바른 이상, 함께 부르는 공동체, 다음 세대 교육, 지성·인성·영성을 핵심 축으로 다룬다.
- 모바일 우선으로 설계하고, 고정 높이 때문에 텍스트가 잘리지 않게 한다.

## 검증 기준

- `pnpm lint` 통과
- `pnpm build` 통과
- `/`, `/spirit`, `/about?section=spirit`, `/about?section=conductor`, `/about?section=accompanist`, `/about?section=members`, `/join`, `/contact?section=support` 확인
- 390px 모바일, 768px 태블릿, 1440px 데스크톱에서 가로 overflow와 주요 버튼 겹침이 없는지 확인
