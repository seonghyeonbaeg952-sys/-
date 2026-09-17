# CMS 문서형 화면 편집 — 20회 검증 기록

날짜: 2026-09-18. 대상: 현재 작업 브랜치의 CMS 편집기. 운영 홈페이지 문구를 게시하는 테스트는 하지 않는다.

## 범위와 판단 기준

- 한/글 11개·Microsoft 8개 공식 문서를 직접 확인한 원장은 `docs/research/2026-09-18-office-editor-{hancom,microsoft}.md`에 있다. 조사 수를 50,000개로 부풀리지 않는다.
- UI/UX Pro Max의 UX/React 검색을 실행했다. 포커스 표시, 키보드 대체, 44px 터치, 선택 유지, effect 정리 기준을 채택했다. 별도 디자인 시스템을 복사하지 않고 기존 CMS 토큰을 유지한다.
- Harness review는 단일 에이전트가 저장소 지침·실제 diff·완료 게이트·실패 기록을 대조하는 읽기 전용 검토로 사용했다. 독립 에이전트는 구체적인 버퍼/런타임/브리지 검토와 회귀 테스트를 담당했다. 새 Harness 템플릿이나 불필요한 의존성은 설치하지 않았다.
- Interaction Design은 비모달 플로팅 창, 단계적 도구 공개, 드래그 대체 버튼에 적용했다. TDD·systematic-debugging·verification-before-completion은 실패 재현→수정→재실행에 사용했다.
- React Best Practices에 따라 canvas 코드는 관리자 iframe에서만 지연 로드한다. 공개 기본 렌더링에 새 편집 컨테이너를 넣지 않는다.
- Impeccable 검출기는 기존 성공/주의 메시지와 기존 선택 목록의 3px 왼쪽 선을 지적했다. 이들은 현재 상태 전달용이며 이번 새 플로팅 창 장식이 아니다. 공개 디자인을 바꾸라는 근거로 사용하지 않았다.

20회는 같은 테스트를 이름만 바꿔 반복한 수가 아니다. 아래는 서로 다른 위험을 대상으로 검토하고 필요 시 수정한 20개 회차다. 자동 테스트, 실제 Chromium 조작, 문서 검토를 구분한다. 실제 Windows 한글 IME·iOS 키보드를 검증한 것으로 간주하지 않는다.

| 회차 | 대상 / 방법 | 발견·수정·재검증 |
|---|---|---|
| 1 | 문서 앱 동작 / 공식 자료 | Esc를 입력 삭제로 처리하던 설계 수정. Esc/F2/편집 마침은 로컬 초안 반영, 명시 되돌리기만 취소. Ctrl+Y 제품별 차이와 Ctrl+Enter 쪽 나누기 충돌 기록. |
| 2 | 기능 폭 / 모델·서버 테스트 | 글꼴·크기 외 색/굵기/기울임/장식 허용 목록 추가. HTML·임의 CSS·외부 글꼴 URL 거절. 기존 v1 서식 유지. |
| 3 | 변경 감지 / RED→GREEN | 새 서식 속성이 dirty 비교와 게시 변경 요약에서 누락되던 부분 수정. color-only 변경·서식 충돌·사람이 읽는 요약 검증. |
| 4 | 원문 소유권 / controller 테스트 | catalog·페이지·기기·source snapshot·fieldVersion을 부모가 검증. 미등록 키, 다른 소유자, 숨은 device override, stale grant 거절. |
| 5 | iframe 신뢰 경계 / protocol 테스트 | origin/source/nonce/방향/순서/크기/알 수 없는 속성 거부. parent grant 밖 데이터 쓰기 불가. |
| 6 | DOM 선택 / DOM 함수 테스트 | BR·빈 마지막 줄·역선택·이모지·스타일 경계를 같은 UTF-16 순회로 읽고 복원. HTML 문자열 삽입 안 함. |
| 7 | 반복 문자 / 독립 재현→회귀 | AAA 첫 글자 삭제 시 빨강이 다음 A로 이동하던 결함 수정. 실제 입력 직전 범위로 splice하고 바깥 글자 보존. |
| 8 | 한글 조합 / 모델·runtime 테스트 | 조합 중간 문자열 누적 diff로 서식이 사라지던 결함 수정. composition 시작 snapshot 기준, 취소 시 runs/undo/redo 보존, 조합 중 Esc/서식 보류. 실제 OS IME는 미검증. |
| 9 | 새 글자 서식 / RED→GREEN | 이미 서식이 있는 단어에 입력하면 새 문자도 시작 서식을 따르도록 수정. 조합/붙여넣기도 같은 규칙, 바깥 원문 범위는 변경하지 않음. |
| 10 | 반영 대기 / runtime 실제 모듈 테스트 | commit 대기 중 paste/composition으로 보낸 내용과 버퍼가 달라지던 결함 수정. 대기 중 추가 입력 차단, 실패 시 버퍼 유지. |
| 11 | ACK·재시도 / runtime·bridge 테스트 | resume draft 실제 적용 전 overlay 제거 방지. 같은 operation 재시도는 한 번만 반영. 미등록 nonempty selection으로 조기 unlock되는 결함도 RED→GREEN. |
| 12 | 문구 선택 줄바꿈 / 실제 Chromium | glyph 폭 대신 원래 문단 line box 사용. 제목의 전후 좌표 84/174.8/243.45/98.4 동일. 두 줄 본문 y=293.4/323.4와 각 너비도 동일. word-break 등 원래 타이포 속성 복사. |
| 13 | CMS 캔버스 폭 / 실제 Chromium | flex 전환 후 align-items:start가 1440px 내재 폭을 유지하던 overflow 수정. stretch 적용 후 부모 문서 가로 overflow=false 확인. |
| 14 | 플로팅 도구 / SSR·실제 Chromium | 400px 비모달 창, 선택 유지, 드래그/방향키/좌우 버튼/초기화/접기. 자동 포커스 이동 없음. Escape는 도구 창만 접기. |
| 15 | 작은 화면 / 실제 Chromium | 390×844 하단 창 358px, 44px 미만 컨트롤 0. 768×350 창 초기위치 overflow 발견 후 viewport clamp 수정·재확인. 실제 모바일 키보드/Safari는 미검증. |
| 16 | 부분 서식 / 실제 Chromium | ‘공지’만 고운 바탕·32px·버건디 적용, ‘사항’ 원문 유지. 잘못된 HEX 오류 표시, undo/redo로 부분 서식 복원. |
| 17 | 마침 후 복구 / 모델·실제 Chromium | 로컬 문서 단위 50개 이력 추가. 마침 후 실행 취소로 서식 변경 복원, 이후 변경/다른 관리자 snapshot 불일치 시 덮어쓰기 거절. |
| 18 | 저장·게시 / 격리 실제 앱 | 5177 실제 React 앱+메모리 DB에서 초안 저장·재로드, 공개 전 상태 분리 확인. 게시 후에만 desktop 제목·굵기 반영, 모바일 제목은 기존값 유지. 운영 요청 0. Ctrl+S는 임시저장만, 활성 문구는 먼저 마치도록 안내. |
| 19 | 운영 서버 validator / 실제 SQL | 스타일 검증 함수만 확장. 기존/6속성 허용, 위험 값 7종 거부. pages=1/revisions=0 전후 동일, anon/authenticated helper 실행 불가, RLS 유지=true. 테스트는 rollback, 운영 접수/문구 수정 없음. |
| 20 | 최종 통합·공개 회귀 | 390/768/1440px에서 주요 공개 경로 8개씩 총 24개 렌더링 점검: 가로 overflow·Vite 오류·공개 editable target 모두 0. 격리 데이터의 빈 상태 포함이며 운영 데이터 전체 내용 검수는 아님. 전체 lint/test/build 결과는 아래 기록한다. |

## 실패 기억 / 재발 방지

- 선택 영역의 glyph bounding rect를 편집기의 폭으로 쓰지 않는다. `canvasLayout.test.mjs`와 실제 제목·본문 rect 비교가 방어선이다.
- 문자열 공통 prefix/suffix만으로 같은 글자의 정체성을 추측하지 않는다. `CanvasEditBuffer.test.mjs`의 반복 문자/조합 취소 테스트가 방어선이다.
- ‘성공 ACK 수신’과 ‘해당 초안을 실제 렌더링’은 다른 사건이다. `canvasRuntime.test.mjs`와 `useCanvasBridge.test.mjs`가 freeze·resume·중복 반영을 검증한다.
- DOM 읽기/그리기, 데이터 모델, 메시지 검증, 부모 CAS를 서로 대신하는 검증으로 취급하지 않는다.
- 새 테스트를 `scripts/run-tests.mjs`의 정상 완료 게이트에 등록했다. 네트워크 없는 결정적 테스트는 정상 게이트, 브라우저·운영 SQL은 별도 증거로 구분한다.

## 실제 지원 범위 / 남은 제약

- 한 원문의 exact/slice 문구는 직접 편집한다. 아직 역변환을 증명하지 못한 normalized/multipart HomeCopy와 동적 공연·단원·법적 원문은 문구 목록/원본 콘텐츠 관리로 연결한다. 모든 홈페이지 문구가 이미 직접 편집 가능하다고 주장하지 않는다.
- 공개 홈페이지 기본 디자인, 이미지, 기존 게시 문구는 변경하지 않았다. 영어·스크롤바는 별도 Figma 승인 시안이며 코드에 적용하지 않았다.
- 브라우저 새로고침 후 undo는 영속 저장되지 않는다. 저장된 문구/서식은 다시 불러오며 게시 이력은 기존 서버 기능을 이용한다.
- 서버 함수는 프로젝트 bhawjbkyvnezqynprxfu의 새 SQL 탭에서 적용했다. 로컬 migration은 재현용이며, 과거 수동 적용으로 생긴 remote migration history 차이를 이번에 임의 repair하지 않았다.
- 본 기록은 현재 문서형 편집 개선 범위의 20회 점검이다. 과거의 전체 CMS 개편 계획 전체 완료나 모든 실기기 검증을 뜻하지 않는다.

## 추가 공식 근거

- [Microsoft Mini toolbar](https://support.microsoft.com/en-us/word/use-the-mini-toolbar-to-format-text): 선택한 문자 가까이에 주요 서식 도구를 두는 방식.
- [W3C Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html): 드래그 외 단일 포인터 조작이 가능해야 하므로 좌/우 배치 버튼 추가.
- [MDN contentEditable](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/contentEditable): 일반 텍스트 입력과 허용 서식 모델 분리.
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions): security invoker와 제한된 실행 권한 유지. changelog.md도 별도 읽어 관련 breaking change를 확인했다.

## 최종 게이트

최종 게이트(마지막 UI·타입 수정 후 다시 실행):

- `pnpm lint`: exit 0.
- `pnpm test`: 총 506개, 통과 504, 실패 0, skip 2. skip은 외부 shell Playwright 환경변수를 요구하는 선택적 테스트이며 이번 검증에서는 CUA 실제 브라우저를 사용했다.
- `pnpm build`: TypeScript + Vite production build exit 0. 편집기 runtime은 별도 lazy chunk로 출력된다. Vite plugin timing 알림은 성능 측정 안내이며 빌드 실패가 아니다.
- `git diff --check`: whitespace 오류 없음.
- 공개 원문·DOM 보존 계약은 전체 회귀에 포함됐다. 24개 경로는 `/`, `/spirit`, `/about?section=spirit`, `/about?section=conductor`, `/about?section=accompanist`, `/about?section=members`, `/join`, `/contact?section=support` × 3개 너비다. 공식 `5175/` 서버도 HTTP 200 확인했다.
- 실제 운영 validator 변경 전후 `site_editor_pages=1`, `site_editor_revisions=0` 동일. 합성 저장·게시 흐름은 5177 메모리 DB에서만 실행했고 운영 요청 0을 별도 status API로 확인했다.
- 최종 브라우저에서 활성 문구의 Ctrl+S는 마침 안내만 표시하고 입력 유지, Esc 후 Ctrl+S는 초안만 저장되는 것을 확인했다. 저장 후 상태는 `게시 전 변경 1개`였고 게시 버튼은 별도로 남았다.
- 실기기 Windows IME·모바일 가상 키보드·Safari는 미실시. IAB에서 `Input.imeSetComposition`은 지원되지 않아 테스트했다고 기록하지 않았다. 조합 이벤트/버퍼/DOM identity는 자동 테스트로 확인했다.

Figma 결과는 별도 원본 프레임에서 복제했고 원래 프레임을 삭제하지 않았다. 메인 에이전트가 영어 홈·입단 안내·스크롤바 확대 및 CMS 플로팅 desktop/mobile 스크린샷을 독립 확인했다.

## Harness Review Report

Invocation: harness review (사용자의 스킬 기반 재검증 요청).

Reviewer mode: single-agent. 저장소 가이드와 최종 diff에 대한 Harness 판단은 메인 에이전트가 수행했다. 별도 코드 리뷰·결함 재현은 독립 에이전트로 보완했다.

Findings:

- P1 해결: selection 폭을 편집 폭으로 재사용하는 줄바꿈 변화. layout 회귀와 실제 glyph 비교 추가.
- P1 해결: 반복 문자/IME 취소 시 서식 소실, pending paste 입력 유실, 조기 ACK unlock. 자동 회귀를 정상 테스트 게이트에 등록.
- P2 남음: normalized/multipart 직접 편집 coverage는 기존 계획보다 좁다. 이를 숨기지 않고 명시적인 목록 편집 fallback과 남은 범위로 기록했다.

Open Questions: 추가 사용자 권한 질문 없음. 영어·스크롤바는 기존 요구대로 승인 대기.

Missing Checks Or Evidence: 실제 Windows IME·iOS/Safari·가상 키보드; 모든 동적 CMS 원문의 직접 편집 coverage. Figma의 전체 프로토타입 버튼 E2E도 별도 미실시.

Overreach / Source-of-Truth Risks: 공개 기본 디자인·콘텐츠·인증/RLS는 유지. 연구 템플릿으로 기존 토큰이나 아키텍처를 교체하지 않음. 이전 수동 migration history를 일괄 repair하지 않음.

Summary: 현재 exact/slice 직접 편집, 플로팅 서식, 저장/게시 경계를 검증했다. 원본 설계의 모든 확장 범위가 완료되었다는 판정은 아니다.

Recommended Next Actions:

1. 실제 OS IME와 모바일 키보드 검증.
2. 복합 HomeCopy의 역변환·권한·기본 배치 보존을 증명한 뒤 직접 편집 coverage 확장.
3. 승인받은 뒤에만 영어 및 스크롤바 홈페이지 구현.

Task outcome evidence: 이 문서와 정상 `pnpm lint/test/build` 게이트에 기록. 작업용 5177 서버 종료로 이번 메모리 테스트 데이터가 정리됐고, 검증 탭 두 개를 닫았다. 공식 5175 서버는 종료하지 않았다.
