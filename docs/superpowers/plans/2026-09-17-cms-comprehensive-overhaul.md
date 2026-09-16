# CMS 전체 점검·안전 편집·최적화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비개발 운영자가 실제 공개 위치를 보면서 홈페이지의 문구와 기기별 글꼴·크기·색을 수정하고, 임시저장·미리보기·명시적 게시·복원까지 안전하게 수행하게 한다.

**Architecture:** 기존 React/Vite/Supabase CMS와 전용 콘텐츠 테이블은 보존한다. 공통 화면 편집기는 명시적인 문구 카탈로그, 검증된 디자인 속성, 관리자 전용 초안/이력, 게시본만 반환하는 공개 API로 확장한다. 공통 폼의 저장·업로드·이탈 흐름을 보강하고, 런타임 참조가 없는 코드만 근거를 남겨 삭제한다.

**Tech Stack:** React 19, React Router 8, TypeScript 6, Vite 8, Tailwind CSS 4, Supabase Auth/Postgres/Storage, Node test runner. 신규 production dependency 없음.

**Spec:** 이 문서의 1–10절은 사용자 요청과 실제 코드 점검에 기반한 상세 제품 명세다. 실행자는 전체 명세와 해당 작업을 함께 읽는다. 기존 운영 명세는 `docs/PRD.md`, 권한 규칙은 `AGENTS.md`, `supabase/README.md`를 따른다.

## Global Constraints

- **최신 사용자 지시 우선:** CMS 디자인은 `조사 → Figma 샘플 → 에이전트의 10차례 검토·수정 → 통과 시안의 CMS 코드 적용 → 회귀 검증` 순서다. 사용자가 CMS 적용을 맡겼으므로 CMS 디자인에 대한 별도 사용자 승인을 기다리지 않는다. 현재 기능 작업용 UI가 있다는 사실을 최종 디자인 완료로 간주하지 않는다.
- **방문자용 홈페이지 디자인 변경 금지:** 레이아웃·색·서체·크기·간격·장식·이미지 비율·애니메이션을 이번 CMS 개편의 미관 개선 대상으로 바꾸지 않는다. 기능 연결·보안·최적화도 기존 표현을 보존해야 한다. 공개 시각 차이가 발견되면 승인 없이 새 디자인으로 정당화하지 않고 원인을 해결한다.
- **확인 대상 분리:** 우측 홈페이지 스크롤바와 영어 전환 시안은 기존 계획 완료 후 제시하고 각각 명시적인 사용자 확인을 받는다. 확인 전에는 기존 스크롤바를 유지한다. CMS 자율 적용 허용은 공개 홈페이지·스크롤바·영어 기능 코드 변경 승인으로 확대 해석하지 않는다. 영어 전환은 여전히 Figma 샘플만이며 구현에는 별도 명시적 요청이 필요하다.
- 기존 Supabase Auth, `profiles.role = 'admin'`, `ProtectedAdminRoute` 구조를 완화하지 않는다.
- public 화면은 `is_visible = true` 데이터만 보여준다. 단원 공개는 기존 안전 RPC를 계속 사용한다.
- 지원서·문의·후원약정·서명 등 개인정보를 공개 미리보기, 로그, 스크린샷 fixture 외 데이터, localStorage에 복제하지 않는다.
- 기존 문구·기존 디자인은 override가 없으면 한 글자도 자동 교체하지 않는다. 후원약정 원문과 서명 기능, 지원서 인쇄를 보존한다.
- 사용자가 확정한 방식: **임시저장과 게시 분리**. 저장은 공개 화면 변경이 아니다.
- 사용자가 확정한 진행 방식: **현재 작업본 커밋·푸시 후 현재 폴더에서 진행**. 기준 커밋 `ab6fb5a`, 브랜치 `codex/recover-homepage-work`.
- DB migration은 추가형이어야 한다. 운영 테이블 DROP/TRUNCATE, 일괄 데이터 삭제, RLS 해제, service_role의 프론트엔드 사용을 금지한다.
- 지울 데이터는 이 작업이 생성한 fixture임을 식별할 수 있는 것만 대상이다. 이름에 ‘테스트’가 있다는 이유로 운영 자료를 삭제하지 않는다.
- 저장소 파일은 apply_patch로 수정한다. 기존 의도와 무관한 대규모 포맷 변경을 하지 않는다.
- 이미지·포스터·인물 원본 비율을 유지한다. CMS URL로 사용될 수 있는 자산은 정적 검색만으로 삭제하지 않는다.
- 기본 확인 크기: 모바일 390px, 태블릿 768px, 데스크톱 1440px. 기기 분기는 `<768`, `768–1023`, `>=1024`.
- 모바일 터치 영역 44px 이상, 키보드 포커스, 읽기 가능한 오류, reduced-motion 보존.
- 작업 중 실접수하지 않는다. 제출 테스트는 네트워크 fixture 또는 트랜잭션 rollback 테스트만 사용한다.

---

## 1. 현재 상태와 점검 근거

### 1.1 확보한 복구 기준

- `ab6fb5a`에 기존 미커밋 34개 파일을 보존하고 origin에 push 완료.
- `pnpm test`: 125/125 통과.
- 기기별 홈 문구/초안/미리보기·이미지·타이포 추가 테스트: 47/47 통과.
- `pnpm lint`, `pnpm build`: 통과.
- `pnpm check:supabase-live`: 공개 스키마·필드 정상, members 민감 필드 및 contacts/join_applications/support_pledges 익명 접근 차단 확인.
- 과거 V4 시안 계약 테스트는 91개 중 17개가 현재 production 연동과 불일치한다. 기본 실행 목록 밖에 있는 기존 실패이며 새 기능 성공으로 위장하거나 무작정 테스트를 삭제하지 않는다.

### 1.2 구조

- 실제 홈 `/`는 `pages/sample/HomeV4SamplePage.tsx`의 production export다. 디렉터리 이름만 보고 sample 전체를 지우면 홈페이지가 사라진다.
- 일반 공개 화면은 PublicLayout, 홈은 별도 public shell을 사용한다.
- 데이터는 `publicData/usePublicData`, 관리 CRUD는 `cms/useCrudItem/useCrudList`, 업로드는 Storage 공통 컴포넌트를 사용한다.
- 현재 홈 편집은 기기별 값을 분리하고 저장 중 새 입력을 보존하지만, iframe은 **저장된 화면**만 읽는다.
- Footer 정의와 AboutOverviewExperience 등 실제 화면 사이에 CMS 연결 누락이 있다. 단순히 입력칸을 추가하는 것으로 해결되지 않는다.
- 일부 전역 CSS는 font/color를 직접 선언하므로 루트 CSS 변수만 바꾸는 구현은 불충분하다.

### 1.3 먼저 고칠 위험

| 우선순위 | 현상/근거 | 변경 원칙 |
|---|---|---|
| P1 | AdminLocationPage가 저장 오류에도 폼을 unmount | 읽기 실패와 저장 실패 분리; 입력 보존 |
| P1 | ImageUploader의 선택/업로드 상태가 부모 폼과 분리 | 미완료 이미지가 있으면 저장 방지; 명확한 단계 안내 |
| P1 | 지원서 삭제가 Storage 먼저, DB 나중 | 일반 UI는 보관/복원; 위험한 영구 삭제 경로 차단 |
| P1 | 중복 submit은 state 갱신 전 동시 실행 가능 | 동기 ref lock + finally 해제 |
| P1 | 문구/디자인 저장과 게시가 같은 개념 | 독립된 초안·게시본·게시 이력 |
| P2 | section_key 자유 입력, 기술 중심 메뉴 | 실제 공개 페이지와 한글 항목명 중심 탐색 |
| P2 | iframe이 draft가 아니라 saved only | 같은 출처 검증된 draft 메시지 전달 |
| P2 | 전체 자료 fetch, 중복 CSS/과거 로직 | 실제 사용 그래프와 계측 후 국소 최적화 |

## 2. 사용자와 작업 기준

### 2.1 사용 장면

주 운영자는 코드·DB·CSS를 모르는 직원/봉사자다. 데스크톱에서 공지·공연·문구를 관리하고, 휴대폰에서는 접수 확인과 작은 수정이 가능해야 한다. 공개 홈페이지의 감성적인 표현과 달리 관리자 화면은 **Operate** 모드다: 작업명, 현재 상태, 다음 행동이 장식보다 먼저 보인다.

### 2.2 성공 흐름

1. 관리 홈에서 ‘홈페이지 편집’을 선택한다.
2. ‘어느 화면인가요?’에서 홈/소개/공연/공지/갤러리/입단/후원 등 실제 페이지를 고른다.
3. ‘문구’ 또는 ‘디자인’을 고른다. 검색으로 현재 화면에 보이는 문장을 찾는다.
4. 공통 문구 또는 모바일/태블릿/데스크톱 값을 편집한다.
5. CMS 안의 미리보기 창에서 즉시 결과를 본다. 미리보기에서는 실제 신청·문의·후원 접수를 할 수 없다.
6. ‘임시저장’으로 다른 작업 전 초안을 보관한다. 공개 홈페이지는 그대로다.
7. 변경 요약을 확인하고 ‘홈페이지에 게시’를 명시적으로 확정한다.
8. 게시된 화면을 확인하고, 잘못됐으면 과거 게시본을 **초안으로 복원**한 뒤 다시 확인·게시한다.

### 2.3 용어

- 임시저장: 관리자만 볼 수 있는 초안을 서버에 저장.
- 게시: 현재 초안을 공개 화면에 적용.
- 기본값으로 되돌리기: 현재 필드 override를 없앰. 임시저장/게시 전에는 공개 영향 없음.
- 이전 버전 불러오기: 과거 게시 문구/디자인을 초안으로 복원. 즉시 공개하지 않음.
- 보관: 업무함의 자료를 일반 목록에서 제외하되 복원 가능.
- 삭제: 보관과 다르며 영구 소실 가능. 삭제할 수 없는 업무 자료는 버튼을 노출하지 않음.
- 별도 콘텐츠 관리: 공연별 제목/일시/포스터, 인물 약력, 연혁, 모집정책, 후원약정 원문 등은 기존 전용 CMS가 실제 원본이다. 화면 편집기에서 해당 관리 화면으로 안내한다.

## 3. 편집 범위와 단일 원본

| 페이지 ID | 공개 위치 | 문구 편집 | 기존 데이터 원본 |
|---|---|---|---|
| common | 헤더·푸터·공통 안내 | 메뉴, 버튼, 푸터 안내, 공통 빈 상태 | site_settings, navigation, 공통 컴포넌트 |
| home | `/` | 현재 홈의 기기별 문구와 공통 버튼 | 기존 home.* site_texts, hero_slides |
| about | `/about?section=overview` | 합창단 소개/가치/교육/활동 고정 문구 | about_sections 및 기존 소개 기본문구 |
| spirit | `/spirit` | 정신 페이지 고정 문구 | about_sections |
| conductor | `/about?section=conductor` | 표제/역할 라벨/안내 | conductor 약력·현직·사진 |
| accompanist | `/about?section=accompanist` | 표제/역할 라벨/안내 | accompanist 프로필 |
| members | `/about?section=members` | 소개/검색/필터/안내 | 안전한 공개 단원 RPC |
| history | `/about?section=history` | 소개/연도 안내/열기·닫기 | history 기록 |
| concerts | `/concerts` | 소개/검색/분류/빈 상태/목록 버튼 | concerts |
| concert-detail | 공연 상세 | 상세 라벨/버튼/미등록 안내 | concerts 개별 행 |
| notices | `/notices` | 소개/검색/분류/빈 상태 | notices |
| notice-detail | 공지 상세 | 라벨/뒤로가기/첨부 안내 | notices 개별 행 |
| gallery | `/gallery` | 소개/사진·영상·포스터/필터/보기 안내 | gallery/videos/posters |
| join | `/join` | 화면 표제/입력 라벨/작업 안내 | join_info, faq, 입단 원문 |
| contact | `/contact` 및 섹션 | 섹션 제목/양식 라벨/안내 | support_settings, sponsors, locations, site_settings |

‘모든 문구’는 공개 페이지의 고정 안내·제목·버튼·빈 상태와, 기존 CMS가 보유한 실제 콘텐츠 원문을 모두 포함한다. 다음은 문구 편집 대상이 아니다: 관리자 보안 경고, DB 오류의 내부 코드, URL/ID, validation을 결정하는 enum 값, 실제 개인정보 접수 답변, 동적 날짜/금액/수량 계산값. 이런 값은 문구처럼 바꾸지 않고 별도 기능으로 관리한다. 법적 동의/약정 원문은 기존 관리 위치를 유지하고 임의로 요약하지 않는다.

### 문구 키 원칙

- 명시적 안정 키를 사용한다. DOM 전체 텍스트를 검색해서 바꾸는 사후 치환 금지.
- key 예: `common.nav.join`, `contact.inquiry.title`, `gallery.empty.photos`.
- 기본값은 현재 코드/CMS 문구다. 빈 데이터에 새 홍보 문구나 실적을 만들어 넣지 않는다.
- `copy`는 공통 override, `deviceCopy.mobile/tablet/desktop`은 해당 기기 override다.
- 기기별 override가 없으면 공통 override → 기존 기기별 CMS 값/원래 문구 순서로 내려간다. 다른 기기 초안을 덮어쓰지 않는다.
- 링크 목적지와 기능 enum은 카피와 분리한다. ‘입단신청’을 고쳐도 접수 라우트는 바뀌지 않는다.
- 텍스트는 React text로 렌더링하며 HTML 삽입을 허용하지 않는다.

## 4. 디자인 설정

### 4.1 노출할 속성

- 글꼴: 이미 로드하는 서체 목록만 선택한다. 외부 font URL·임의 CSS는 받지 않는다.
- 본문/큰 제목/중간 제목/작은 제목/라벨 크기: px 숫자, 유효 범위 안내.
- 굵기: 300/400/500/600/700/800/900 중 선택. 지원하지 않는 서체 굵기는 브라우저 합성 가능성을 안내한다.
- 줄간격: 1.1–2.4, 자간: -0.04–0.2em.
- 본문/제목/보조문구/강조/배경 색: HEX 선택기 + 직접입력. 검증 실패는 저장하지 않는다.
- 기본 디자인 유지: 초기값은 override 없음이다. 편집기 진입 자체가 디자인을 바꾸지 않는다.
- 기기 탭마다 값과 변경 개수를 구분하고, ‘이 기기만 초기화’와 ‘공통값 사용’을 구분한다.
- 작은 글자·낮은 색 대비에 안내를 표시한다. 임의 CSS로 화면 전체를 숨기거나 클릭을 막는 설정은 없다.

### 4.2 미리보기 창

- 관리자 페이지 내부에 실제 public route를 iframe으로 표시한다.
- 390/768/1440px 고정 레이아웃을 창 폭에 맞춰 축소한다. 실제 viewport와 단순 CSS 축소를 혼동하지 않는다.
- ‘화면에 맞춤’, ‘실제 크기’, ‘새로고침’, 미리보기 펼침/접힘을 제공한다.
- 문구 입력/디자인 조절은 메모리 초안을 전달해 즉시 반영한다. DB publish를 호출하지 않는다.
- 창이 좁으면 편집/미리보기 탭으로 전환한다. 데스크톱에서는 나란히 배치하되 텍스트 입력 폭을 확보한다.
- 게시본/초안 구분을 명시한다. draft는 공유 URL로 노출하지 않는다.
- iframe origin, event.source, protocol version, nonce, page ID, JSON schema를 모두 확인한다.
- preview는 Auth 세션 저장·갱신을 하지 않는다. 관리자 경로는 preview 대상으로 허용하지 않는다.
- 링크는 허용된 공개 페이지 이동만, 외부 링크·파일 제출·지원/문의/약정 저장은 차단하거나 안내한다.

## 5. 데이터 모델과 게시 계약

### 5.1 공통 TypeScript 계약

```ts
type EditorDevice = 'mobile' | 'tablet' | 'desktop'
type EditorPageId = 'common' | 'home' | 'about' | 'spirit' | 'conductor' | 'accompanist' | 'members' | 'history' | 'concerts' | 'concert-detail' | 'notices' | 'notice-detail' | 'gallery' | 'join' | 'contact'
type EditorFont = 'system' | 'gothic-a1' | 'hahmlet' | 'arita-buri' | 'gowun-batang' | 'grandiflora'
type EditorAppearance = {
  fontFamily?: EditorFont; headingFontFamily?: EditorFont;
  fontSize?: number; h1Size?: number; h2Size?: number; h3Size?: number; labelSize?: number;
  fontWeight?: number; lineHeight?: number; letterSpacing?: number;
  textColor?: string; headingColor?: string; mutedColor?: string; accentColor?: string; backgroundColor?: string;
}
type SiteEditorDocument = {
  schemaVersion: 1;
  copy: Record<string, string>;
  deviceCopy: Partial<Record<EditorDevice, Record<string, string>>>;
  appearance: Partial<Record<'shared' | EditorDevice, EditorAppearance>>;
}
type SiteEditorPageRecord = {
  page_key: EditorPageId; draft: SiteEditorDocument; published: SiteEditorDocument | null;
  version: number; updated_at: string; published_at: string | null;
}
type SiteCopyDefinition = {
  key: string; page: EditorPageId; section: string; label: string; defaultValue: string; multiline?: boolean;
  inputType?: 'text' | 'textarea' | 'url' | 'boolean' | 'number';
  sourceKey?: string; sourceDevice?: EditorDevice; min?: number; max?: number; maxLength?: number;
}
```

입력 제한: 문서 512KB 이하, 각 문구 10,000자 이하, key 120자 이하. 타입 오류·알 수 없는 속성/페이지/기기/서체를 거부한다. HTML은 일반 문자열로만 취급하며 렌더링에 사용하지 않는다.

### 5.2 추가 테이블 — 기존 테이블 변경 없음

- `site_editor_pages`: page_key 기본키, draft jsonb, published jsonb nullable, version bigint, updated_at, updated_by, published_at.
- `site_editor_revisions`: id UUID, page_key, document jsonb, published_at, published_by. 게시 이력을 자동 삭제하지 않는다.
- 두 테이블 모두 RLS 활성화, admin만 읽기 가능. 익명·일반 사용자에게 초안/이력 SELECT를 허용하지 않는다.
- 관리자도 직접 REST INSERT/UPDATE/DELETE하지 못하게 테이블 쓰기 GRANT를 회수한다. 모든 변경은 검증된 RPC만 통과하며 version·게시 이력을 우회할 수 없다.
- 공개 GET RPC는 게시본만 반환한다. draft·updated_by·관리자 신원을 반환하지 않는다.
- 기존 데이터를 옮기면서 원문을 바꾸지 않는다. 처음에는 override 없이 기존 홈페이지가 표시된다.

### 5.3 RPC 인터페이스

```ts
get_public_site_editor_pages() // GET; [{page_key, document: published, published_at}]
save_site_editor_draft(p_page_key, p_document, p_expected_version) // admin; 충돌 검증; 레코드 반환
publish_site_editor_page(p_page_key, p_expected_version) // admin; 저장된 초안만 원자적으로 게시
restore_site_editor_revision(p_revision_id, p_expected_version) // admin; 초안으로만 복원
```

- 클라이언트가 정확한 version을 보내고, 충돌하면 다른 관리자 변경을 덮어쓰지 않는다.
- 저장 응답은 제출한 스냅샷의 기준만 갱신한다. 응답 도착 전 추가 입력을 잃지 않는다.
- 미저장 변경이 있으면 게시 전에 임시저장을 요구한다. 서버 초안과 다른 로컬 값을 게시했다고 오인시키지 않는다.
- 공개 API가 없으면 기존 화면을 그대로 표시한다. CMS는 설치 필요·재시도를 표시하며 저장 성공이라고 속이지 않는다.
- 함수에 search_path 고정, public.is_admin() 확인, JSON 입력 검증, version 비교, 트랜잭션 단위 업데이트를 적용한다.

### 5.4 독립 검토로 보강한 구현 계약

- 최초 행이 없으면 `version=0`, 빈 override 문서를 반환한다. 최초 저장은 원자적 insert이며 같은 페이지를 동시에 만들면 한 요청만 성공한다. 저장·게시·복원은 각각 version을 증가시킨다.
- UTF-8 바이트로 512KB를 검사한다. 문구의 실제 저장값은 trim하지 않고 공백·줄바꿈을 유지한다. 검증용 빈 값 판정과 저장값을 구분한다. 키 삭제는 기본값 복원, 빈 문자열은 명시적인 빈 문구로 구분한다.
- HTML 태그 형태는 실수 방지를 위해 저장 검증에서 거부한다. 어떤 경로에서도 `innerHTML`로 편집 문구를 삽입하지 않는다.
- 기존 홈 어댑터는 sourceKey/sourceDevice/inputType/min/max/maxLength를 보존한다. 실제 `resolveHomeContentForDevice()` 입력에 합성하고, 원본 데이터에 저장하지 않는다.
- 스타일은 전체 페이지·현재 페이지의 텍스트 역할 단위다. 본문/제목/라벨/보조/강조 및 내부 span·input·select에 맞는 명시적 selector를 사용한다. 개별 글자마다 임의 CSS를 입력하는 기능은 제공하지 않는다.
- preview 프로토콜은 `ready → 최신 draft(sequence) → applied(sequence)`다. load 이전 메시지 유실과 이전 iframe의 응답을 거부한다. 내부 경로 변경·새로고침에도 preview 표시를 유지하고 세 공개 제출 API 진입점에서도 접수를 차단한다.
- 상세 화면에 공개된 공연/공지 ID가 없으면 실제 항목 등록 링크와 미리보기 불가 안내를 보여준다. 존재하지 않는 ID나 가상 공연을 공개 목록에 만들지 않는다.
- 게시 버튼은 ‘이 화면 게시’라고 부르고 변경 페이지 이름을 표시한다. 다른 페이지의 초안을 함께 게시하지 않는다.
- 현재 공개 창은 게시 후 캐시 무효화, 재포커스와 짧은 TTL로 갱신한다. 이미 열려 있던 다른 기기의 화면까지 즉시 바뀐다고 보장하지 않는다.
- 이력 복원은 ‘이 편집기의 문구·디자인 설정’을 복원한다. 공연/프로필 등 전용 콘텐츠 원문이나 코드 버전까지 과거 시점으로 되돌린다고 표현하지 않는다.
- 페이지 이동·복원·경합 후 재조회에서 임시저장/버리기/취소 또는 메모리 초안 유지 정책을 적용한다. 다른 페이지 초안을 조용히 잃지 않는다.

## 6. CMS 작업 흐름과 디자인 통일

아래 디자인 규칙은 Figma에서 검토할 설계 방향이다. 6.4의 10차례 검토·수정을 먼저 수행한 뒤 CMS 코드에 적용한다. 비시각적 보안·데이터 작업은 기존 계획대로 분리하되, 기능 테스트용 화면을 완성된 관리자 디자인으로 발표하지 않는다.

### 6.1 메뉴

1. 관리 홈: 시작 안내·처리할 일·자주 쓰는 작업.
2. 홈페이지 편집: 페이지 선택·문구·디자인·미리보기·게시 이력.
3. 콘텐츠 관리: 공연·공지·사진·영상·포스터·연혁·프로필·단원.
4. 접수함: 입단지원서·일반/공연 문의·후원약정.
5. 운영 설정: 모집 안내·후원 원문·후원사·오시는 길·기본 연락처·계정.

기존 URL은 보존하거나 목적이 동일한 화면으로 연결한다. `/admin/home`과 `/admin/site-texts`는 새 화면 편집기의 홈 편집으로 연결한다. 기존 `home.*` 데이터는 초기 표시의 읽기 전용 기준으로 유지하며, 옛 즉시 공개 저장창을 병행 노출해 임시저장/게시 구분을 우회하지 않는다.

디자인 상속 순서는 `common.appearance.shared → common.appearance[device] → 현재 페이지.appearance.shared → 현재 페이지.appearance[device]`다. 마지막으로 지정한 속성만 덮어쓰며 빈 속성은 기존 CSS를 유지한다. ‘공통값 사용’은 기기 override 삭제를 뜻하고, ‘기본 디자인’은 해당 범위의 override 전체 삭제를 뜻한다.

### 6.2 공통 화면 규칙

- 제목 → 할 수 있는 일 → 적용 위치/미리보기 → 본문 → 저장 상태.
- 한글 UI sans, 본문 14–16px, 고정 크기 제목. 공개 홈페이지 서체·색 설정이 CMS에 전파되지 않는다.
- 흰 편집면, 옅은 회색 바탕, 진한 글자, 기존 브랜드 강조색. 카드 안 카드 반복 금지.
- 주 행동 하나만 강조. 삭제를 주요 저장 버튼과 동등하게 강조하지 않는다.
- 성공·실패·진행을 텍스트와 색으로 함께 표시한다.
- 자료가 없는 상태와 검색 결과가 없는 상태를 구분한다.
- 모달은 상세·확인에 사용하고 focus trap/Escape/복귀를 보존한다. 긴 편집은 화면 안에서 처리한다.

### 6.3 저장·업로드·이탈 안전성

- 동기 요청 lock으로 두 번 클릭/Enter 반복을 차단한다.
- 이미지 선택, 업로드 중, 실패, 업로드 성공·저장 전 상태를 부모 폼이 안다.
- 이미지가 미완료인 동안 이전 URL로 저장되지 않게 막는다.
- 저장 실패 후 폼과 값을 유지하고 재시도를 제공한다.
- beforeunload와 기존 내부 이동 보호를 유지한다. back/forward까지 보장하려면 BrowserRouter 제약을 해결하고 별도 검증한다. 생략하면 완료표에 명시한다.
- 지원서 파일부터 먼저 지우는 위험한 영구 삭제는 일반 화면에서 차단한다. 보관·복원은 유지한다.
- 기술적인 section_key 자유 입력 대신 정해진 한글 선택지를 제공한다.

### 6.4 CMS Figma 선행 설계와 10차례 검토·수정 게이트

**현재 상태:** 편집·임시저장·게시·충돌 처리 등 기능 작업용 CMS UI가 일부 구현되어 있다. 이는 최종 시안이 아니며, Figma 선행 설계와 아래 10차례 검토 전 최종 디자인 코드 적용은 보류한다. CMS는 별도 사용자 확인 없이 적용하도록 위임받았다. 기존 작업물과 데이터를 임의로 삭제하거나 되돌리지 않는다.

**조사 범위:** 사용자가 지적한 ‘난잡한 디자인’은 CMS를 가리킨다. 관리자 도구·콘텐츠 편집기·접수 관리·디자인 시스템·Figma Community를 폭넓게 조사한다. 사용자의 20,000개 조사 요청은 실제 확인 근거가 필요한 별도 목표로 기록한다. 아직 20,000개를 확인한 상태가 아니며, 검색 결과 수·템플릿 요소 수·중복 링크를 확인한 사례 수로 부풀리지 않는다.

- [ ] 조사 기록에 고유 URL, 확인일, 자료 종류, 직접 확인한 범위, 채택/배제 이유를 남긴다. 실제 확인 수와 미확인 후보 수를 분리한다.
- [ ] CMS의 실제 메뉴·역할·작업을 목록화한다. 읽지 않은 자료까지 조사 완료라고 쓰거나 조사 수를 맞추려고 무관한 사례를 포함하지 않는다.
- [x] 기존 Figma 파일에 CMS 전용 시안 페이지를 만든다. 홈페이지 시안과 분리하고 기존 프레임을 덮어쓰지 않는다.
- [x] 관리 홈, 공통 탐색, 문구·디자인 편집, 기기별 편집/미리보기, 공연·공지 등 콘텐츠 목록/편집, 이미지 업로드, 입단지원·문의·후원약정 접수함, 상세/인쇄, 운영 설정을 포함한다.
- [x] 목록/폼/상세/확인창에 동일한 글자 체계·간격·컨트롤·상태 표현을 적용한다. 반복 카드·과도한 테두리·중첩 탭·불필요한 영문 장식을 줄이고, 실제 작업과 다음 행동을 먼저 보이게 한다.
- [x] 미저장, 임시저장 완료, 게시 전 확인, 게시 완료, 업로드 대기/실패, 권한 없음, 빈 자료/검색 없음, 저장 충돌, 이전 게시본 초안 복원을 각각 프레임 또는 컴포넌트 상태로 보여준다.
- [x] 390/768/1440px 대표 프레임을 만든다. 휴대폰에서는 편집/미리보기 전환을 단순하게 하고, 태블릿·PC에서는 입력 폭과 미리보기의 실제 viewport를 구분한다.
- [x] 클릭 가능한 프로토타입으로 `페이지 찾기 → 문구 수정 → 모바일 미리보기 → 임시저장 → 변경 확인 → 게시`와 `지원서 찾기 → 상세 확인 → 인쇄/보관` 흐름을 보여준다. 실제 접수 개인정보는 사용하지 않는다.
- [x] Figma 프레임 ID·시안 버전·검토일과 아래 회차별 발견 사항/수정/재확인 증거를 기록한다. 같은 화면을 그대로 열 번 보는 것은 10차례 검증으로 집계하지 않는다.
- [x] 10차례 검토와 수정 사항 재확인이 완료되면 Task 5/6의 CMS 디자인을 적용한다. Figma 링크와 검토 결과는 공유하되, CMS 적용을 위해 사용자 응답을 기다리지 않는다.

**10차례 디자인 재검토:** 각 회차에서 이전 회차의 수정이 다른 화면에 만든 문제도 함께 확인한다. 발견 → 수정 → 재확인 결과를 기록하며, 막힌 핵심 흐름·데이터 손실·권한 오류·사용 불가 수준의 잘림이 남으면 회차 수를 채웠더라도 적용하지 않는다. Figma에서 확인할 수 없는 실제 저장/권한/브라우저 동작은 적용 후 기능 테스트를 별도로 수행한다.

| 회차 | 검토 초점 | 재확인할 결과 |
|---|---|---|
| 1 | 전체 정보 구조 | 비개발자가 메뉴 이름만으로 문구 편집·콘텐츠 관리·접수 확인을 구분 |
| 2 | 첫 사용/대표 업무 흐름 | 페이지 찾기→편집→미리보기→임시저장→게시가 끊기지 않음 |
| 3 | 시각적 위계·밀도 | 중복 제목·중첩 카드·경쟁하는 강조 버튼을 정리하고 주 행동이 분명함 |
| 4 | 글자·간격·정렬·색 | 일관된 타이포·라벨·컨트롤과 긴 한글/숫자의 읽기 쉬운 배치 |
| 5 | 390px 모바일 | 탐색/편집/접수 확인에서 가로 넘침과 가려진 행동 없음, 44px 터치 영역 |
| 6 | 768px 태블릿·1440px PC | 불필요한 빈 공간·좁은 입력 폭·중첩 스크롤을 정리하고 미리보기 크기 구분 |
| 7 | 저장·게시·이력 상태 | 미저장/임시저장/게시됨을 혼동하지 않으며 복원이 곧 게시가 아님을 이해 |
| 8 | 실패·권한·빈 상태·업로드 | 오류 위치와 복구 행동이 명확하고 입력 보존/중복 조작 방지가 설계됨 |
| 9 | 키보드·포커스·접근성·인쇄 | 포커스 순서/닫기/색 외 상태 표시/오류 안내, 지원서·서명 인쇄 흐름 포함 |
| 10 | 독립 통합 재검토 | 이전 지적의 해결 증거, 프레임 간 일관성, 공개 홈페이지와 스타일 경계 확인 |

**적용 경계:** 검토 통과 후 `src/pages/admin/`, `src/components/admin/`, 관리자 전용 스타일과 관리자 탐색만 대상으로 옮긴다. 공유 컴포넌트를 바꾸어야 할 때는 관리자 범위 스타일을 분리한다. 공개 페이지의 기본 스타일 토큰이나 원본 문구를 CMS 시안에 맞추어 바꾸지 않는다.

**합격 기준:** CMS는 검토 통과한 시안과 같은 정보 구조·비율·상태를 보이고, 공개 홈페이지는 같은 데이터·viewport·스크롤/상호작용 상태에서 변경 전과 같은 디자인을 유지한다. 정적 영역 비교와 실제 상호작용 검증을 병행하며, 애니메이션 중간 프레임 차이를 디자인 변경 또는 불변의 증거로 오판하지 않는다. 공개 디자인 설정의 시험은 격리된 fixture/미리보기에서만 수행하고 운영 홈페이지에 테스트 스타일을 게시하지 않는다.

## 7. 정리·최적화 정책

### 7.1 삭제 후보

런타임 import graph에서 미연결이고 현재 변경과 겹치지 않는 다음 후보를 확인했다. 실제 삭제 직전에 다시 참조·테스트·변경 여부를 검사한다.

```text
src/components/admin/AdminPlaceholderPage.tsx
src/components/admin/AdminPrivateFileLink.tsx
src/components/common/Badge.tsx
src/components/common/Spirit.tsx
src/components/common/StaffDivider.tsx
src/components/home/ConcertTemplatePanel.tsx
src/components/home/NoticePreview.tsx
src/components/home/SupportCTA.tsx
src/components/home/UpcomingConcertsPreview.tsx
src/components/join/JoinInquiryForm.tsx
src/components/layout/AdminLayout.tsx
src/components/layout/Header.tsx
src/components/layout/MegaMenu.tsx
src/components/layout/MobileMenu.tsx
src/components/spirit/SpiritSections.tsx
src/constants/joinFaqDefaults.ts
src/hooks/useScrollProgress.ts
src/hooks/useSiteText.ts
src/types/index.ts
src/utils/collectionLayout.ts
```

- 새 구현에서 재사용하는 파일은 후보에서 제외한다.
- public 자산은 CMS 경로·동적 파일명·문서·직접 URL까지 확인한다. 정적 검색 결과가 없다고 삭제하지 않는다.
- conductor hand frame 20장은 동적 사용이므로 유지한다.
- 실제 홈페이지가 사용하는 sample/와 문서화된 독립 시안을 일괄 삭제하지 않는다.
- 원본일 가능성이 있는 대용량 이미지, CMS 참조를 확정할 수 없는 이미지, 실제 공개 파일은 남기고 이유를 기록한다.
- 이전 검증 임시 자료는 정확한 경로가 확인된 `Temp/motet-contact-qa`, `join-print-qa-20260916*`, `motet-location-image-qa-20260917*`, `motet-spirit-*-20260917*`만 대상으로 한다.
- 기존 최종 보고의 임시 이미지 링크가 사라질 수 있음을 알린다. 새 작업 증거는 별도 위치에 보관한다.
- 회귀 테스트 코드는 테스트 데이터가 아니다. 유효한 테스트를 ‘쓸모없음’으로 삭제하지 않는다.

### 7.2 성능

- 게시 문서만 공통 1회 조회하고 동시 요청을 합친다.
- 초안 전달은 debounce/메모리 상태로 처리하고 키 입력마다 iframe을 reload하지 않는다.
- 기기 판정은 matchMedia 경계로 처리하고, 스타일 문자열은 문서 변경 때만 생성한다.
- 공개 번들에 관리자 편집 UI를 포함시키지 않는다.
- 기존 RAF queue로 scroll 이벤트의 프레임당 반복 레이아웃 계산을 줄인다.
- 변경 전후 build bytes/gzip과 실제 네트워크·JS 오류·스크롤 동작을 기록한다.
- 이미 요청하지 않던 파일을 지운 용량을 첫 화면 속도 향상으로 과장하지 않는다.

## 8. 보안 업그레이드·백엔드 보완 — 추가 요청 반영

### 8.1 Codex Security 점검

- 사용자 지정 Codex Security 플러그인으로 기준 저장소 Standard 보안 점검을 시작한다.
- 권한 경계, 개인정보, 공개 쓰기, 저장소 업로드·삭제, URL/HTML 처리, 인증 세션, 게시 초안 유출을 소스 기반으로 확인한다.
- 근거가 없는 발견을 취약점이라고 보고하지 않는다. 실제 공격 경로와 반증을 함께 검토한다.
- 운영 서버에 공격성 요청·부하·실제 악성 업로드를 보내지 않는다. 로컬 재현 또는 rollback 검증을 사용한다.
- 플러그인 보고서와 실제 수정 결과를 연결한다. 미검증 항목과 잔여 위험을 숨기지 않는다.

### 8.2 ‘강력한 알고리즘’의 구체적 구현 기준

새로운 자체 암호화나 복잡한 규칙을 붙이지 않는다. 다음 검증 가능한 원칙으로 강화한다.

| 경계 | 보완 방식 | 검증 |
|---|---|---|
| 권한 | 기본 거부, 서버 admin 확인, RLS·GRANT 일치 | 익명/일반 사용자/관리자 허용·거부 |
| 동시 편집 | version compare-and-swap, 행 잠금, 원자적 게시 | 같은 버전 동시 요청에서 한 건만 성공 |
| 중복 제출 | 지원서 기존 submission ID 유지, 누락 경로는 재사용 가능한 멱등성 키 검토 | 동일 키 같은 내용 재전송, 다른 내용 거부 |
| 입력 | 클라이언트 UX 검증 + 서버 길이/타입/enum/범위 검증 | 직접 API 요청으로 UI 우회해도 거부 |
| 악용·스팸 | 기존 honeypot 한계 점검; 서버측 빈도 제한이 가능한 경계 확인 | 클라이언트 시계/임의 헤더에 의존하지 않음 |
| 파일 | 크기·MIME·확장자·경로 확인, 공개/비공개 bucket 분리 | 경로 조작·잘못된 형식·업로드 실패 |
| 원문/서명 | 기존 저장 계약 보존, 위험한 외부 URL·스크립트 삽입 방지 | 실제 원문과 서명 데이터 유지 |
| 게시 | 초안 비공개, 공개 RPC 최소 필드, 감사 이력 | 공개 API에서 draft/관리자 신원 미노출 |
| 삭제 | 보관 우선, 부분 실패가 데이터 손실을 만들지 않음 | Storage 실패·DB 실패·중복 클릭 |
| 웹 응답 | 배포 환경에 맞는 보안 헤더·CSP 검토 | 지도/폰트/서명/미리보기 기능과 함께 확인 |
| 의존성 | 잠금파일 기준 취약 패키지·불필요한 의존성 점검 | 무조건 최신 메이저 업그레이드하지 않음 |

- 신뢰할 수 있는 서버 경계 없이 브라우저 localStorage만으로 ‘보안 rate limit’을 만들지 않는다.
- CAPTCHA·메일 발송·서버 비밀키가 필요한 기능은 계정/설정 없이 작동한다고 주장하지 않는다.
- 새 권한이나 민감 데이터 접근이 필요한 변경은 별도 승인을 받는다. 기존 권한을 넓혀 오류를 우회하지 않는다.
- 보안 스키마 변경은 기능 코드와 함께 버전 관리한다. 배포 순서와 되돌리기 절차를 남긴다.

## 9. 실행 작업과 파일 소유권

### Task 1: 복구 기준·명세 확정

**Files:** 이 문서, 최종 `docs/PRD.md`.

- [x] dirty 상태/remote/비밀키 포함 여부 확인.
- [x] 기본125+추가47 테스트, lint/build, Supabase 읽기 점검.
- [x] `ab6fb5a` 커밋·push.
- [x] 사용자 확정: 임시저장/게시 분리.
- [x] CMS·문구 연결·정리 감사.
- [ ] 전체 요구와 최종 결과의 coverage 대조.

### Task 2: 타입·검증·클라이언트 API

**Files:** Create `src/types/siteEditor.ts`, `src/lib/siteEditorModel.ts`, `src/lib/siteEditorApi.ts`, 각각의 `.test.mjs`.

**Interfaces:** `emptySiteEditorDocument()`, `validateSiteEditorDocument(value): string | null`, `getEditorDevice(width)`, `resolveEditorCopy(documents,page,key,fallback,device)`, `buildEditorCss(documents,page)`, `loadEditorPage(page)`, `saveEditorDraft(page,doc,version)`, `publishEditorPage(page,version)`, `loadEditorRevisions(page)`, `restoreEditorRevision(id,version)`. 반환은 `{data,error}`.

- [x] RED: 잘못된 page/device/font/HEX/NaN/범위 밖 크기/과대 문구가 거부되는 테스트.
- [x] RED: 기기별 → 공통 → 기존 기본값 순서와 다른 기기 보존을 독립 기대값으로 검증.
- [x] GREEN: 검증·안전한 CSS 생성·정규화·API 요청 구성.
- [x] null/false/빈 응답을 성공으로 처리하지 않음.
- [x] DB 미설치·권한 없음·경합·네트워크 실패 테스트.

```ts
assert.notEqual(validateSiteEditorDocument({...emptySiteEditorDocument(), appearance:{mobile:{fontSize:-1}}}), null)
assert.equal(resolveEditorCopy({contact:doc}, 'contact', 'contact.title', '후원·문의', 'mobile'), '모바일 문구')
assert.equal(buildEditorCss({}, 'contact'), '')
```

### Task 3: DB 초안·게시·이력

**Files:** Create `supabase/migrations/20260916161055_add_site_editor.sql` (Supabase CLI가 생성한 UTC timestamp 이름), `supabase/tests/site_editor_contract.sql`, `scripts/check-site-editor-live.mjs`; Modify `supabase/README.md`.

**Interfaces:** 5.3의 네 RPC, 관리자 전용 테이블.

- [x] transaction/RLS/GRANT/search_path/admin/JSON/version 검증 구현.
- [x] 읽기 전용 조회로 실제 프로젝트와 기존 권한 구조 확인.
- [x] 추가 migration만 Supabase UI로 적용. 기존 행 삭제·수정 없음.
- [x] rollback fixture로 관리자 저장→게시→초안 복원, 오래된 버전 거부, 비관리자 차단 검증. 서로 다른 세션의 동시 요청 검증은 별도 종합 검증에 남긴다.
- [x] 익명 API에서 게시본 GET 200, 초안·이력 테이블 조회 401 확인.
- [ ] 초기 공개 문구·색상·원본 데이터 불변 확인.

### Task 4: 공개 렌더링과 전체 문구 연결

**Files:** Create `src/content/siteEditorCatalog.ts`, `src/content/siteCopyCatalog.ts`, `src/components/site-editor/SiteEditorProvider.tsx`, `SiteCopy.tsx`, `src/lib/siteEditorPreview.ts`, tests; Modify App, homePreviewMode, 실제 공개 소비 컴포넌트.

**Interfaces:** `siteEditorPages`, `siteCopyDefinitions`; `useSiteEditor(): {copy(page,key,fallback):string,isPreview:boolean}`; `<SiteCopy page="contact" id="contact.title" fallback="후원·문의" />`. 페이지 항목은 label/previewPath/contentLinks를 가진다.

- [x] 공개 고정 문구와 기존 전용 CMS 원문을 분류.
- [x] RED: override 없음은 원문 그대로, 지정 key만 변경, 다른 page/device 불변.
- [x] GREEN: 명시적 key 연결. DOM 전체 검색 치환 금지.
- [x] 홈의 기존 기기별 정의를 어댑터로 재사용하고 기존 저장값을 덮어쓰지 않음.
- [ ] 헤더·푸터·공개 화면 고정 문구 연결; URL/기능 enum 분리.
- [x] preview origin/source/nonce/page/schema 검증과 실접수 차단.
- [x] API 미설치 fallback, 공개는 게시본만 소비.
- [x] field coverage 목록 기록. 미연결 항목을 완료라고 부르지 않음.

### Task 5: 초보 관리자용 화면 편집기

**선행 조건:** 6.4의 CMS Figma 샘플과 10차례 검토·수정 완료. 현재 기능 작업용 구현은 보존하되, 최종 디자인 적용은 검토 통과한 프레임을 기준으로 별도 진행한다. 별도 사용자 확인은 요구하지 않으며, 기존 기능 테스트만으로 디자인 검토까지 완료 표시하지 않는다.

**Files:** Create `src/pages/admin/AdminSiteEditorPage.tsx`, `src/components/admin/site-editor/EditorPreview.tsx`, `EditorCopyPanel.tsx`, `EditorAppearancePanel.tsx`, `EditorPublishHistory.tsx`, `src/styles/admin-site-editor.css`; Modify navigation/routes.

**Interfaces:** Task2 API/타입, Task4 카탈로그와 preview protocol. 중복 저장 모델·중복 카탈로그를 만들지 않는다.

- [x] RED: 로컬 편집은 공개 쓰기 없음, 임시저장/게시 호출 분리, 저장 중 추가 입력 보존, 다른 기기 초안 보존.
- [x] CMS Figma 전체 화면/상태 샘플과 10차례 검토·수정 증거 기록.
- [x] 검토 통과 시안의 관리자 전용 스타일 적용; 공개 페이지 스타일 변경 없음.
- [x] 페이지·섹션·문구 검색, 공통/기기 탭, 문구·디자인 패널.
- [x] 수치/색/서체 입력, 항목 복원, 페이지 초기화 확인.
- [x] 실제 viewport 미리보기와 축소, 로딩/실패/재시도, 검증된 draft 전달.
- [x] 미저장·저장된 초안·게시 차이와 시각 표시.
- [x] 게시 확인, 이력 조회, 초안 복원, 충돌 시 덮어쓰기 금지.
- [x] 기존 URL 보존 및 새 메뉴 연결.
- [ ] 390/768/1440, 긴 문구, 키보드, resize, 오류 상태 확인.

### Task 6: 공통 CMS 저장·업로드·관리 UX

**선행 조건:** 저장·권한·업로드 안전성 로직과 시각 디자인을 구분한다. 관리자 shell·목록·폼·모달의 시각 재설계는 6.4의 Figma 선행 검토 통과 이후에만 적용한다.

**Files:** AdminRecordForm, ImageUploader, useCrudItem, useCrudList, AdminLocationPage, AdminJoinApplicationsPage, AdminAboutPage, AdminSettingsPage, admin navigation/header/dashboard, focused tests.

- [x] RED→GREEN: 위치 정보 저장 실패에도 폼·입력 보존.
- [x] pending file/upload 상태 부모 연결, 미완료 저장 차단.
- [x] 요청 ref lock, finally 해제, 기존 저장 API 계약 유지.
- [ ] 원문·서명·인쇄·공개 설정 회귀 확인.
- [x] 위험한 지원서 영구 삭제 UI 차단, 보관·복원 안내.
- [x] section_key 선택지와 중복 위치 편집 입구 정리.
- [x] 관리자 shell/설명/retry/빈 상태 일관성.
- [x] back/forward 보호의 실제 구현·검증 범위 명시.

### Task 7: 보안·백엔드 보완

**Files:** Codex Security가 확인한 정확한 위험 지점, 추가 보안 migration/tests, 공개 제출 API 및 배포 헤더 설정. 실제 발견 전 불필요한 파일을 만들지 않는다.

- [x] 플러그인 preflight 완료 후 위협 경계·독립 감사.
- [x] 후보의 재현·반증·공격 경로 검증, 확정된 결과만 보고서화.
- [x] 접수 RPC의 서버 검증·쓰기 최소 권한·입력 크기·멱등성·행/종류별 잠금 보완. Storage 비공개 경계와 실제 다중 세션 검증은 별도 미완료.
- [ ] 공개 이미지 신규 업로드/초안/게시 경계와 기존 URL의 안전한 전환.
- [ ] 운영 배포 보안 헤더, Auth leaked-password 보호, CLI 이력 동기화.
- [ ] 로컬 검증으로 고쳐졌음을 확인. 실운영 개인정보를 테스트에 사용하지 않음.
- [ ] 권한 검사를 완화하지 않는지 독립 검토.
- [x] 전후 증거와 잔여 위험 기록. 보안 취약점과 일반 UX 문제를 구분.

**접수 보호 운영 항목:** 추가된 `intake_limits`의 한 시간 전체/동일 연락처 제한을 CMS 기본 설정의 접힌 고급 영역에서 확인·수정한다. DB가 없으면 저장 불가 안내를 표시한다. 기본값을 임의 변경하지 않고, 10–10,000/1–100 범위와 전체 이하 조건, 두 수치의 비교 후 갱신(CAS), 오류 시 입력 보존·중복 저장 방지·미저장 이탈 보호를 적용한다. 이 제한은 네트워크 DDoS 방어나 연락처 본인인증이 아님을 명시한다. 같은 기본 설정 화면의 중복 위치 편집 폼은 기존 ‘오시는 길’ 관리 링크로 통합한다.

### Task 8: 불필요 코드·자산·fixture 정리와 최적화

**Files:** 7.1 후보, 관련 문서, HomeV4SamplePage/HomeSectionFlowSamplePage 및 목적 있는 감사 스크립트.

- [x] 삭제 직전 import graph/참조/테스트/미커밋 상태 재확인.
- [x] 소규모 묶음 삭제 후 타입·린트·기능 검증.
- [x] 자산은 CMS 참조 확인된 것만 정리, 불확실한 원본 유지.
- [x] RAF 병합을 동작 테스트로 개선, cleanup/reduced motion/스크롤 복원 확인.
- [x] 유효한 미등록 테스트를 기본 runner에 등록.
- [ ] 폐기한 옛 시안 계약은 대체 보호 테스트 여부를 확인한 후 정리.
- [ ] 전용 Temp 자료만 절대 경로 검증·manifest로 마지막에 정리.
- [ ] 같은 조건에서 빌드 크기/gzip·요청 수를 비교.

### Task 9: 종합 검증·운영 가이드·인계

**Files:** `docs/cms-operator-guide.md`, `docs/cms-audit-results.md`, `docs/PRD.md`, 이 계획서.

- [ ] 초보자 시나리오: 모바일 입단 제목 수정→미리보기→임시저장→새로고침→PC 불변→게시→공개 확인→과거 초안 복원.
- [ ] 신규/빈/긴 문구/불법 값/실패/중복/충돌/익명·일반 사용자·관리자 상태 검증.
- [ ] 세 viewport의 공개 주요 route·CMS editor·업로드·모달·인쇄 회귀.
- [ ] CMS 검토 통과 시안 대조 및 공개 홈페이지 디자인 불변 검증. 운영 게시본에 테스트 문구·색·서체가 남지 않았는지 확인.
- [ ] pnpm test/lint/build, 관련 추가 테스트, 공개 DB 읽기 감사.
- [ ] fixture rollback/정리 결과 확인.
- [ ] 권한·초안 비노출·preview 접수 차단의 독립 review.
- [x] 한국어 운영 가이드와 실제 화면 이름으로 인계.
- [ ] 완료/미완료/보류/검증 한계를 구분.
- [ ] 최종 secret/fixture 혼입 확인 후 사용자가 허용한 같은 브랜치에 커밋·푸시.

## 10. 인수 테스트 상세

| 경우 | 조작 | 합격 조건 |
|---|---|---|
| 첫 진입 | 편집기 열기 | 기존 디자인·문구 불변. 미설치면 안내 |
| CMS 디자인 검토 | Figma 샘플 10차례 검토·수정 | 회차별 증거와 핵심 문제 해결 후 CMS 자율 적용, 사용자 승인 대기 없음 |
| 공개 디자인 보존 | 동일 자료·viewport·상태 전후 비교 | 홈페이지 레이아웃·서체·색·간격·사진 비율·상호작용 디자인 불변 |
| 스크롤바 승인 | 별도 시안 비교 | 스크롤바 자체에 대한 확인 전 기존 스타일 유지 |
| 문구 | 고정 제목 변경 | 지정 위치의 초안만 변경, 공개 불변 |
| 기기 | 모바일만 변경 | PC/태블릿 불변, 재진입 후 초안 보존 |
| 디자인 | 색·크기·서체 변경 | 실제 viewport 반영, 관리자 CSS 불변 |
| 잘못된 값 | HTML/CSS/NaN/거대한 값 | 렌더링·저장 경계에서 안전하게 거부 |
| 저장 실패 | 네트워크 실패 | 입력 보존, 실패 표시, 재시도 |
| 충돌 | 두 창에서 같은 version 저장 | 후착 거부, 먼저 저장한 값 보존 |
| 저장 중 입력 | 응답 전에 추가 편집 | 새 입력 유지 |
| 게시 | 초안 저장→확인→게시 | 명시적 게시 시점에만 공개 반영 |
| 이력 | 이전 게시본 선택 | 초안만 복원, 재게시 전 공개 불변 |
| 미리보기 | 창에서 폼 제출 | 실접수·약정 제출 없음 |
| 권한 | 익명/일반 사용자 | 초안·이력·쓰기 차단 |
| 업로드 | 선택만/진행/실패 | 예전 URL 저장 방지, 복구 안내 |
| 삭제 | 지원서 관리 | 보관·복원 유지, 위험한 선행 파일 삭제 없음 |
| 긴 문구 | 긴 한글/URL | 가로 넘침·원문 손실 없음 |
| 인쇄 | 지원서/서명 약정 | 마지막 줄과 서명까지 출력 |
| 이동 | 메뉴/뒤로/새로고침 | 미저장 보호 범위를 실제 검증하고 명시 |
| 서버 우회 | UI 대신 직접 API | 서버 검증·권한·version 확인이 작동 |

## 11. 완료 정의와 위험 관리

- 조사·계획만을 적용 완료라고 부르지 않는다.
- CMS Figma 샘플·10차례 검토 및 수정·검토 통과 시안 적용·회귀 검증이 끝나기 전 CMS 디자인을 완료라고 부르지 않는다. 기능 작업용 UI와 최종 디자인을 구분한다.
- 입력칸은 있지만 공개 화면이 읽지 않는 항목을 남기지 않는다.
- 초안 저장이 불가능한 상태를 CMS 적용 완료라고 보고하지 않는다.
- 기존 콘텐츠 테이블을 유지하므로 새 runtime을 비활성화하면 기존 문구/CSS로 복귀할 수 있다.
- 기기 분리는 데이터/스타일 override이지, 기존 홈페이지 세 벌을 복제하는 방식이 아니다.
- 보안 경계와 운영 데이터 안전을 편의보다 우선한다.
- iOS Safari 실기기·실물 프린터·실접수는 fixture만으로 보장하지 않는다.
- 삭제 여부가 불분명한 파일은 보류 목록과 이유를 남긴다.
- 실제 발견한 기존 실패와 이번 수정으로 생긴 실패를 구분한다.

## 12. 참고 문서

- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Database Functions: https://supabase.com/docs/guides/database/functions
- MDN postMessage: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
- React Router useBlocker: https://reactrouter.com/api/hooks/useBlocker
- 조사 사실: RLS와 GRANT를 함께 점검해야 하며, 공개 테이블의 기본 grant를 그대로 믿지 않는다. preview 메시지는 출처와 source를 모두 확인한다. useBlocker는 현재 BrowserRouter에 hook만 추가할 수 없다.

## 13. 후속 요청 — 기존 계획 완료 후에만 착수

**사용자 지정 순서:** 6.4의 CMS Figma 선행 설계·10차례 검토를 포함한 Task 1–9의 구현·검증·운영 가이드·정리와 인계를 먼저 마친다. 아래 후속 항목은 현재 작업을 대체하거나 병렬로 앞당기지 않는다. CMS Figma는 기존 CMS 작업의 선행 단계이며 이 절의 후속 영어 홈페이지 시안과는 별개다. 기존 작업에 미완료 항목이 있으면 이를 명시하며, 완료로 간주하고 후속 디자인을 시작하지 않는다.

### 후속 A: 우측 스크롤바 디자인

**범위와 승인:** 홈페이지의 우측 문서 스크롤바를 현재 홈페이지의 배경·강조색·톤과 어울리게 설계하되, Figma 샘플로 먼저 보여주고 **스크롤바에 대한 별도 사용자 확인**을 받는다. 확인 전 실제 홈페이지 코드는 바꾸지 않는다. 확인 후에도 승인한 스크롤바만 예외로 적용할 수 있으며 홈페이지의 나머지 디자인은 그대로다. CMS 편집 패널·미리보기 iframe의 내부 스크롤바와 구분한다.

- [ ] 현재 문서 스크롤바 및 중첩 스크롤 영역의 스타일·overflow·레이아웃 이동을 확인한다.
- [ ] 실제 홈페이지의 색상 토큰을 기준으로 track/thumb/hover 상태를 정한다. 커서 추적식 가짜 스크롤바나 새로운 스크롤 라이브러리를 도입하지 않는다.
- [ ] 기존 화면 위에 스크롤바만 다르게 표현한 Figma 비교 시안과 기본/hover/드래그 상태를 제시한다. OS·브라우저별 표현 한계도 설명한다.
- [ ] 스크롤바에 대한 사용자 확인과 승인 프레임을 기록한다. CMS 자율 적용과 별도이며, 확인 전 구현하지 않는다.
- [ ] 네이티브 스크롤·휠·키보드·드래그 동작을 유지하고 숨기거나 지나치게 얇게 만들지 않는다. 고대비/강제 색상에서는 시스템 표현을 우선한다.
- [ ] Chrome/Edge 및 Firefox 지원 범위를 공식 문서로 확인하고, 모바일 OS의 오버레이 스크롤바는 기본 동작을 보존한다.
- [ ] 390/768/1440px와 브라우저 확대 상태에서 가로 넘침·콘텐츠 폭 변화·모달 스크롤 잠금·CMS 미리보기 회귀를 검증한다.
- [ ] 별도 확인을 받은 경우에만 기존 전역 CSS 선언을 최소 수정한다. 기존 계획의 최종 기준 커밋 이후 별도 변경 묶음으로 적용하고 검증 결과를 기록한다.

### 후속 B: 홈페이지 전체 영어 전환 Figma 시안만 제작

**코드 변경 금지:** 이 후속 작업은 Figma 디자인 샘플이다. 홈페이지에 언어 전환 버튼, 번역 데이터, i18n 라이브러리, 라우팅, DB 언어 필드, 자동 번역 기능을 구현하지 않는다. 실제 영문 홈페이지가 작동한다고 보고하지 않는다.

**산출물:** 기존 Figma 파일에 별도 언어 전환 시안 페이지를 만들고, 한국어/영어 상태 및 모바일·태블릿·데스크톱 대표 프레임을 제공한다. 승인받지 않은 원본 시안을 덮어쓰지 않는다.

- [ ] 기존 계획 완료 시점의 실제 공개 페이지와 CMS 문구 목록을 읽기 전용으로 대조해 시안 대상과 번역 목록을 확정한다.
- [ ] 공통 헤더·모바일 메뉴·푸터에 한국어/English 전환 위치, 현재 언어 표시, 열림·닫힘·키보드 포커스 상태를 설계한다. 국기만으로 언어를 표시하지 않는다.
- [ ] 홈, 합창단 정신, 합창단 소개, 지휘자, 반주자, 단원, 연혁, 공연 목록/상세, 공지 목록/상세, 갤러리 사진/영상/포스터, 입단 안내/지원서, 후원·문의/후원약정/오시는 길을 모두 포함한다.
- [ ] 각 화면의 제목·본문·버튼·필터·검색·날짜·폼 라벨·필수 표시·검증 오류·빈 상태·로딩·완료 메시지를 영어 상태로 설계한다. 한국어 UI 한 장의 제목만 바꾼 샘플로 축소하지 않는다.
- [ ] 한국어보다 길어지는 영어 문구, 줄바꿈, 버튼 폭, 표·목록 밀도, 포스터 원문, 긴 공연명과 이름 표기를 검증한다. 고유명사·연혁 사실을 새로 만들지 않는다.
- [ ] 법적 동의·후원약정·개인정보 문구는 원문을 보존하고 영문은 검토용 번역 초안임을 구분한다. 미확인 공식 영문 명칭은 확인 필요 목록에 둔다.
- [ ] Figma 프로토타입에서 언어 전환 후 현재 페이지 맥락 유지와 폼 작성 중 전환 안내를 보여준다. CMS 다국어 구현은 별도 후속 승인 대상으로 설명한다.
- [ ] 390/768/1440px의 대표 화면과 전체 페이지 영문 프레임을 시각 검수하고, 누락 화면·번역 검토 항목·개발 미적용 상태를 명확히 인계한다.
- [ ] 사용자에게 영어 전환 시안을 별도로 확인받는다. 시안 확인만으로 홈페이지 영어 기능을 코드에 구현하지 않으며, 구현을 원할 경우 별도의 명시적 요청 이후 범위를 확정한다.

## 실행 기록

### 2026-09-17 현재 증거 정리

완료 표시를 기능별 실행 증거에 맞춰 갱신했다. 전체 요구 완료가 아니다. 상세 결과는 `docs/cms-audit-results.md`, 관리자 안내는 `docs/cms-operator-guide.md`에 기록한다.

- Figma 18개 대표 화면/상태, D01–D10 검토 후 CMS 전용 스타일 적용.
- 1,097개 명시적 편집 키, 서버 초안/게시/이력, 기기별 미리보기와 접수 차단. JS 조건부 표시·시스템 오류·법적 원문 전수 연결은 남아 있다.
- 입력 보존/빠른 뒤로가기/모달 포커스·중첩 잠금, 25개 목록 조회, 20개씩 문구 펼치기, 검색 중 입력창 유지, 접수 한도 설정과 후원 원문 인쇄를 검증했다.
- 의존성 advisory 11→0, 업로드 MIME/확장자·래스터 signature·폴더 검사, 홈 hold 계산 RAF 병합.
- 운영 DB에서는 새 편집기/접수 보완과 후원 비공개 필드 보호에 이어 타임스탬프 함수 경로/중복 인덱스를 검증 후 적용했다. 원본 행 삭제 없음.
- 운영 GET 점검 37개 및 게시본/초안 비공개 3개 통과. 실제 DB 다중 세션 경합·Storage 전환·배포 헤더·최종 시각 검증·임시 자료 정리·최종 커밋/푸시는 남은 항목이다.

2026-09-17: 기존 코드·공개 DB를 감사하고 125+47 테스트/lint/build를 검증했다. 기존 작업을 ab6fb5a로 커밋·푸시했다. 임시저장/게시 분리 확정. 구현 전에 상세 계획서를 작성했으며 보안·백엔드 요청을 8절과 Task7에 추가했다.

2026-09-17 추가 요청: 우측 스크롤바 디자인 및 전체 홈페이지 영어 전환 Figma 시안을 13절에 후속 작업으로 등록했다. 사용자의 순서 지시에 따라 기존 Task 1–9 완료 전에는 착수하지 않는다. 영어 전환은 홈페이지 코드에 구현하지 않는다.

2026-09-17 최신 범위 변경: ‘난잡한 디자인’의 대상은 CMS임을 확인했다. CMS는 Figma 샘플을 먼저 만들고 사용자 확인 후 적용하는 절차를 6.4, Task5/6 및 인수 기준에 추가했다. 방문자 홈페이지 디자인 변경을 금지하며, 스크롤바도 별도 시안 확인 전에는 변경하지 않는다. 현재 일부 CMS 기능용 UI는 존재하나 최종 디자인 승인·완료 상태가 아니다. 20,000개 조사 요청은 미달성으로 기록하고 실제 확인한 자료만 집계한다. 이 계획 변경에서는 홈페이지/CMS 구현 코드를 수정하지 않는다.

2026-09-17 후속 정정(이전 CMS 승인 대기 절차를 대체): 사용자는 CMS 디자인을 에이전트가 약 10차례 재귀 검증한 뒤 적용하도록 위임했다. CMS는 Figma 샘플→10차례 검토·수정→자율 적용→회귀 검증으로 갱신했다. 사용자 확인은 스크롤바·영어 전환 시안에만 요구하며, 방문자 홈페이지 디자인 불변과 영어 전환의 Figma 전용 범위는 유지한다. 아직 10차례 검토를 실행한 것은 아니다.

2026-09-17 구현: Task2 타입·모델·API 30개 테스트 및 Task5 상태 모델을 작성했다. Task3 DB 미구현 실패를 확인한 다음 전체 DDL+저장/게시/복원/잘못된 입력/권한 테스트를 한 트랜잭션에서 실행하고 rollback을 확인했다. 검증한 추가 저장소를 SQL Editor로 설치했다. 기존 콘텐츠/접수 행은 변경하지 않았으며 테스트 행은 남기지 않았다. 공개 API 읽기 점검 3/3 통과. SQL Editor 적용이므로 CLI migration history에 자동 기록된 것은 아니다. 새 편집기의 공개/관리자 화면 통합과 종합 검증은 아직 진행 중이다.
