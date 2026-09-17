# 2026-09-17 글자별 편집·팝업 검증

## 구현 범위

- 문구 검색/선택 목록과 한 문구 편집기로 변경. 문자 선택 후 글꼴/10–120px 크기, 선택 서식 삭제, 실행 취소/다시 실행, 한글 조합 단위 실행 취소.
- 기존 문서에 선택적 `textStyles` 추가. HTML/CSS 문자열을 저장하지 않고 허용된 글꼴·크기와 범위만 저장. 공통/모바일/태블릿/데스크톱 분리.
- 실제 연결 목록: 홈 이외 398개 키, 홈 desktop 83/tablet 51/mobile 49 source fields. URL/대체 문구/숨김 라벨/아직 연결하지 않은 동적 문구는 일반 텍스트 편집. 모든 CMS 키가 글자별 서식을 지원한다고 주장하지 않음.
- 기존 제목의 `span` 장식 CSS나 grid anonymous text item을 깨뜨리지 않도록 명시적 `smyc-text`/`smyc-copy` inline 출력 사용. 무서식일 때 기존 DOM 반환.
- 팝업 시작/종료일 역전 검사, 한국어 필드 오류/포커스, 기존 DATE/null/같은 날 허용 보존. CMS 폼 네 구역과 원본 비율의 중립적인 이미지 미리보기.

## 검증 증거

- 최종 기능 회귀 `pnpm test`: **391 passed, 0 failed** (39.55초). 실패를 먼저 재현한 선택 서식/IME/팝업 날짜 회귀 포함.
- `pnpm lint` 통과, `pnpm build` 통과. 기본 JSX 비교 기준 JSON은 변경하지 않았음. 기존 48개 파일 기본 마크업 계약 및 실제 공개 컴포넌트 SSR 테스트 통과.
- PGlite: 기존 SQL + 신규 검증 migration + 신규/기존 save/publish/restore 계약 테스트 통과. 운영 데이터 없이 rollback 계약 확인.
- 격리 브라우저 `127.0.0.1:5177`: 실제 앱 코드와 로컬 대체 데이터 연결 사용. '공지사항' 중 '공지'만 함렛/36px; 본문 나머지 유지. undo/redo, 잘못된 150px 거절, 서식 해제, 임시저장/새로고침/게시 확인창/게시 성공 확인. 모바일 설정이 데스크톱 미리보기에서 적용되지 않음.
- 390/768/1440 CSS viewport: 문서 폭 375/753/1425, 편집 도구 가로 overflow 0. 모바일·데스크톱 스크린샷 확인. OS 브라우저 외곽 캡처 배율이 CSS viewport와 다를 수 있어 DOM 치수도 확인함.
- 팝업 브라우저: 종료 2026-09-16, 시작 2026-09-17로 저장 시 한국어 오류와 종료일 포커스. 종료일을 17일로 수정하면 오류 해제. 실제 운영 팝업을 만들거나 변경하지 않음. 격리 transport는 팝업 저장을 허용하지 않으므로 유효 날짜의 실제 저장 계약은 단위/통합 테스트로 검증.
- 브라우저 관련 콘솔 오류/경고 0 확인. 검증 페이지는 운영 데이터 요청을 차단함.

## Supabase 실제 적용

`20260917134224_add_site_editor_text_styles.sql`의 검증 함수 두 개만 SQL Editor에서 적용. 기존 page/draft/published/revision 데이터를 수정하는 구문 없음. 기존 validator 권한 및 관리자 CAS RPC 유지.

실제 DB 검증: 기존 버전 문서와 새 서식 문서 수용, 999px 거절, 기존 저장 초안/게시 문서 검증 성공. 행 수 적용 전/후 `site_editor_pages=1`, `site_editor_revisions=0`. 익명 helper 실행과 authenticated validator 직접 실행 권한 없음. SQL Editor 적용이므로 기존에 남아 있는 CLI migration 이력 동기화 작업은 별도 잔여 사항임.

## 실제 남은 한계

- PPT 파일 편집기가 아니라 웹 문구를 선택해 글자 서식을 지정하는 편집기. 홈페이지 안에서 텍스트 상자를 끌어 옮기는 기능은 아님.
- 직접 터치 기기, Safari, 스크린리더, 모든 페이지의 모든 서식 조합은 검증하지 않았음. 구형 브라우저에서 Intl.Segmenter 미지원 시 앱이 죽지 않고 일반 텍스트로 동작.
- 새 크기가 크게 지정되면 실제 배치가 달라질 수 있으므로 기기별 미리보기 후 게시 필요. 기존 기본 디자인·운영 콘텐츠는 자동 변경하지 않음.
- 이전 전체 CMS 계획의 별도 미완료 항목을 이번 작업 완료로 간주하지 않음. 스크롤바·영어 버전 Figma 시안은 아직 미작성/미적용이며 사용자 확인 대상.

## 참고

- MDN: https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement/selectionStart
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/Selection
- MDN: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date
- PostgreSQL CHECK: https://www.postgresql.org/docs/current/ddl-constraints.html
- Supabase JSON: https://supabase.com/docs/guides/database/json

피그마·계획·TDD·검증 지침에 따라 시안 3개, 10개 설계 점검 축, 실패 재현/회귀 테스트를 적용했다. 10회 사용자 테스트나 수천 건 조사 완료라는 의미는 아니다.
