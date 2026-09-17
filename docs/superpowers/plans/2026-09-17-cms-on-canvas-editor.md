# CMS On-Canvas Editor Implementation Plan

> **For agentic workers:** 구현 단계에서는 설치된 `executing-plans` 스킬을 사용해 아래 작업을 검증 단위별로 수행한다. 현재 단계는 상세 설계와 Figma 시안 설계이며, 구현은 아래 설계·검증 게이트 이후 진행한다. 진행 상태는 체크박스로 기록한다.

**Goal:** 관리자가 실제 홈페이지의 제목·문단·버튼 문구를 화면에서 선택하고 직접 입력하며, 선택한 글자에 글꼴과 크기를 적용하는 편집 경험을 제공한다.

**Architecture:** 기존 public React 화면을 같은 출처의 관리자 캔버스 안에서 렌더링하고, 검증된 편집 세션에서만 선택·입력 계층을 활성화한다. 명시적인 화면 블록과 원문 키·UTF-16 범위 매핑을 통해 기존 `copy`, `deviceCopy`, `textStyles`와 연결하며, 편집 문서의 최종 권한은 관리자 부모 창에 둔다. 기존 초안 저장·게시 RPC와 버전 비교를 유지한다.

**Tech Stack:** React 19, TypeScript, Vite, 기존 Supabase Auth/RPC/RLS, 브라우저 Selection/Range 및 composition 이벤트. 새로운 production dependency 도입을 전제하지 않는다.

**Spec:** 이 대화에서 사용자가 요구한 실제 홈페이지 위의 PPT 방식 편집, 상세 계획과 Figma 샘플 우선, 기존 public 디자인 유지. 관련 기존 계획은 `docs/superpowers/plans/2026-09-17-cms-character-editor.md`이며, 그 문서의 별도 입력창 중심 조작을 이번 계획의 주 사용자 흐름으로 사용하지 않는다.

## Global Constraints

- 이번 산출물은 계획 문서와 별도 담당자가 만드는 Figma 시안이다. 이 문서를 작성하면서 앱 코드는 수정하지 않는다.
- 실제로 열어 확인한 공식 문서는 아래 10개다. 50,000건을 조사한 것으로 표현하지 않으며 다른 담당자의 연구 수량과 합산하지 않는다.
- public 기본 문구, 기존 강조 요소, 줄바꿈, 폰트, 라우팅, 사진·포스터 원본 비율, 모바일 레이아웃을 유지한다.
- 관리자 인증, `profiles.role = 'admin'`, `ProtectedAdminRoute`, 기존 RLS를 완화하지 않는다.
- 프론트엔드에서 `service_role`을 사용하지 않으며 비밀키·토큰·관리자 비밀번호를 문서나 메시지에 포함하지 않는다.
- 초안 저장과 공개 반영을 분리한다. 캔버스 수정·미리보기·Figma 검토는 공개 승인을 대신하지 않는다.
- 모바일 터치 영역은 프로젝트 지침의 최소 44px을 유지한다.
- 장식 모션은 `prefers-reduced-motion`에서 비활성화하며 편집 중 움직이는 글자와 배경은 선택을 방해하지 않도록 정지한다.
- public 방문자에게 편집 UI나 관리자 문서가 노출되지 않는다. public 경로의 기존 조회 결과는 계속 공개된 데이터만 사용한다.
- DOM 전체에서 같은 문자열을 검색해 치환하는 구현, raw HTML 저장, 임의 CSS 입력, 전체 문서 `contenteditable` 적용을 금지한다.
- 없는 Figma 파일·노드 ID를 만들지 않는다. 시안 생성 담당 작업에서 실제 URL과 노드 링크를 이 문서에 추가한다.

---

## 1. 조사 기록: 독립적인 공식 문서 10건

확인일: 2026-09-17. 방법: 공식 문서를 검색한 뒤 아래 각 URL을 실제로 열고 관련 본문을 확인했다. 같은 문서의 재열람·본문 검색은 추가 건수로 세지 않았다. 경쟁 제품을 직접 조작한 테스트, 사용자 인터뷰, 50,000개 사례 수집을 수행한 것은 아니다.

| 번호 | 실제 연 공식 자료 | 확인된 내용 | 이번 설계 판단 |
|---|---|---|---|
| 1 | [Microsoft: Change the font size](https://support.microsoft.com/en-au/office/fonts/change-the-font-size) | 선택한 텍스트의 크기 변경, 숫자 직접 입력, 미니 도구 모음 | 선택 범위와 글꼴·크기를 한 도구 모음에서 조절한다. Office의 허용 크기 상한을 웹사이트에 그대로 복사하지 않는다. |
| 2 | [Microsoft: PowerPoint keyboard shortcuts](https://support.microsoft.com/en-us/accessibility/powerpoint/use-keyboard-shortcuts-to-create-powerpoint-presentations) | 문자·단어 범위 선택, 실행 취소와 다시 실행, 서식 단축키 | 포인터 없이 선택·입력·서식 변경·되돌리기가 가능해야 한다. |
| 3 | [Canva: Add and edit text](https://www.canva.com/help/add-and-edit-text/) | 텍스트 상자 더블클릭으로 편집, 도구 모음으로 서식 변경, 바깥 클릭으로 종료 | 화면의 글자를 직접 편집하는 흐름을 채택한다. 바깥 클릭 종료는 그대로 채택하지 않고, 현재 입력을 유지하며 명시적인 편집 마침을 유도한다. 모바일의 모든 제스처를 직접 확인한 것으로 표현하지 않는다. |
| 4 | [Figma: Guide to text in Figma Design](https://help.figma.com/hc/en-us/articles/360039956434-Guide-to-text-in-Figma-Design) | 선택한 텍스트 레이어에 Enter 또는 더블클릭으로 편집 진입, Typography 속성 조절 | 요소 선택과 글자 입력을 구분하고 명시적인 키보드 진입 방법을 제공한다. 폰트가 달라지면 레이아웃도 달라질 수 있음을 미리보기로 확인한다. |
| 5 | [Webflow: Canvas overview](https://help.webflow.com/hc/en-us/articles/33961319255059-Webflow-canvas-overview) | 호버 윤곽선, 선택 요소 이름, 계층 탐색, 편집 불가능한 미리보기, 기기 프레임 확인 | 실제 화면의 선택 윤곽선과 읽기 쉬운 이름을 제공한다. 편집 모드와 실제 동작을 확인하는 미리보기 모드를 분리한다. |
| 6 | [Framer: Using on-page editing](https://www.framer.com/help/articles/on-page-editing/) | 렌더링된 페이지에서 콘텐츠 편집, 편집 가능 항목 강조, 비노출 필드 별도 편집, 검토·게시 후 공개 | 주 작업면은 홈페이지다. 화면에 없는 접근성 설명·메타데이터는 보조 관리 항목으로 둔다. 편집 완료를 즉시 공개와 연결하지 않는다. |
| 7 | [Framer: Using text styles](https://www.framer.com/help/articles/how-to-use-text-styles/) | 텍스트 일부에 스타일 적용, Desktop/Tablet/Mobile별 타이포그래피 | 현재 보는 화면 크기와 변경 적용 범위를 각각 명시한다. 공유 스타일을 바꿀 때 영향 범위를 보여준다. |
| 8 | [Wix: Customizing your text](https://support.wix.com/en/article/wix-editor-changing-your-text-font) | 요소 선택·Edit Text·특정 단어 강조·크기 및 글꼴 조절 | 부분 선택은 부분 서식으로 연결한다. 아무 선택이 없을 때 전체 문단으로 적용 범위를 조용히 확대하지 않는다. |
| 9 | [Wix: Adding and customizing text on your mobile site](https://support.wix.com/en/article/wix-editor-adding-and-customizing-text-on-your-mobile-site) | 데스크톱에서 가져온 텍스트와 모바일 전용 텍스트 구분, 모바일 전용 표시 | 기존 홈의 기기별 문구 소스를 구분해 보여준다. 모바일 미리보기를 선택했다는 이유만으로 다른 화면의 문구를 덮어쓰지 않는다. |
| 10 | [MDN: compositionend](https://developer.mozilla.org/en-US/docs/Web/API/Element/compositionend_event) | IME 조합 시작·변경·완료 이벤트와 완료 또는 취소 시점 | 한글 조합 중 입력 노드를 교체하지 않는다. 조합 종료는 활성 입력 버퍼의 내부 경계이고 부모 로컬 초안 확정은 별도의 편집 마침 동작이라는 것이 이 프로젝트의 구현 권고다. |

공식 자료가 직접 말하는 동작과 이 프로젝트에 대한 제안은 위 표에서 구분했다. 터치 하단 도구 모음, 원문 범위 매핑, 저장 충돌 처리 세부 설계는 아래의 프로젝트별 설계 판단이다.

## 2. 해결할 문제와 제외할 확장

현재 편집기는 문구 목록·별도 입력창·iframe 미리보기가 분리되어 있다. 글자 서식 데이터와 public 렌더링은 존재하지만, 사용자는 페이지에서 원하는 문구를 직접 선택하는 방식으로 작업하지 못한다. 새 작업의 성공 기준은 글자를 찾고 입력창을 찾는 과정을 없애는 것이다.

이번 편집기의 대상은 기존 홈페이지의 콘텐츠와 글자 서식이다. 요소 자유 이동, 회전, 새 섹션 생성, 임의 HTML 편집, CSS 클래스 작성, 결제·접수 폼 실행, 이미지 전체 편집기로의 확장은 포함하지 않는다. 문구를 고르는 테두리에 크기 조절·회전 핸들을 붙이지 않는다.

Figma 샘플은 실제 편집 경험을 검토하는 시안이며, 브라우저의 한글 입력·저장·게시가 작동하는 구현이라고 소개하지 않는다.

## 3. 주 화면과 사용자 흐름

### 데스크톱

1. 관리자가 홈페이지 편집을 열면 실제 페이지 캔버스가 주 영역을 차지한다. 상단에는 페이지, 편집/미리보기, 화면 크기, 저장 상태, 실행 취소·다시 실행, 초안 저장, 공개를 둔다.
2. 왼쪽 탐색은 페이지·섹션으로 이동하는 용도로 사용한다. 공개 문구를 모두 나열한 입력 폼을 기본 화면에 펼치지 않는다.
3. 편집 가능한 제목·문단·버튼 위에 포인터를 올리면 얇은 윤곽선이 나타난다. 선택 이름은 `소개 · 제목`처럼 설명하고 코드 키는 노출하지 않는다.
4. 한 번 클릭하면 논리적인 텍스트 블록이 선택된다. 더블클릭, Enter, 또는 보이는 `글자 편집` 동작으로 그 자리에서 입력한다.
5. 드래그하거나 Shift+방향키로 글자를 선택한다. 도구 모음은 `선택한 글자`, 글꼴, 숫자 크기, 크기 증감, 서식 초기화를 표시한다. 다른 서식이 섞인 값은 `혼합`, 상속 중인 값은 `기본 서식`으로 표시한다.
6. 도구 모음을 조작해도 원래 글자 선택을 유지한다. 변경 후 문구는 같은 위치에서 즉시 보이고 입력 위치가 갑자기 맨 앞으로 이동하지 않는다.
7. `Ctrl+Enter` 또는 `편집 마침`으로 현재 활성 입력 트랜잭션을 부모의 로컬 초안에 반영하고 블록 선택 상태로 돌아간다. `Esc`는 현재 활성 입력 트랜잭션만 취소해 입력 진입 전 문구·서식과 블록 선택 상태로 복귀한다. 이전에 확정한 다른 변경에는 영향을 주지 않는다. 두 동작 모두 서버 초안 저장·공개와 별개다.
8. 미리보기로 전환하면 윤곽선과 편집 입력을 제거한다. 접수·업로드 등 실제 전송은 기존 미리보기 차단 정책을 유지한다.

도구 모음 클릭은 선택 범위를 유지한 채 현재 입력 버퍼의 서식을 바꾼다. 다른 블록이나 빈 캔버스를 클릭해도 현재 입력을 조용히 버리거나 확정하지 않는다. 선택 이동 의도를 보관하고 `편집 마침` 또는 `편집 취소`를 인라인으로 안내한 뒤 이동한다. 미리보기·페이지·기기 전환도 미완료 입력이 있으면 같은 원칙을 따른다.

### 터치

- 한 번 탭해 블록을 선택하고, 44px 이상인 `글자 편집`으로 입력한다. 더블탭만 알아야 사용할 수 있는 구조로 만들지 않는다.
- 편집 진입 후 기본 텍스트 선택 핸들을 사용한다. 스크롤 제스처를 요소 드래그로 해석하지 않는다.
- 글꼴·크기 도구 모음은 화면 하단 또는 키보드 위 사용 가능한 영역에 둔다. 선택 문구·확인 버튼·기본 선택 메뉴를 가리지 않는다.
- 편집한 글자는 페이지 안에서 유지한다. 글을 고치기 위해 별도 textarea 모달로 이동시키지 않는다.
- 화면에 보이는 `편집 마침`은 부모 로컬 초안에 반영하고 `편집 취소`는 현재 입력 트랜잭션만 되돌린다. 바깥 탭이나 키보드 닫힘만으로 입력을 버리지 않는다.
- 가상 키보드가 열리면 선택 영역이 보이도록 최소한만 스크롤한다. 키보드가 닫힐 때 페이지의 기존 위치를 불필요하게 초기화하지 않는다.
- 이 흐름은 제안이다. 실제 iOS Safari·Android Chrome에서 검증하기 전 터치 지원이 완료되었다고 말하지 않는다.

### 키보드와 접근성

- 캔버스 진입·탈출과 선택 가능한 블록 간 이동 경로를 제공한다. iframe 안에 포커스를 가두지 않는다.
- 블록 선택 상태의 Enter는 입력 진입, 입력 상태의 Enter는 허용된 줄바꿈이다. `Ctrl+Enter`는 편집 마침, 조합 중이 아닌 `Esc`는 현재 활성 입력 트랜잭션 취소다. 블록 선택 상태의 Esc는 선택 해제이며 이전 초안 변경을 취소하지 않는다.
- 선택 범위가 없을 때 Delete가 문단 전체를 지우지 않는다. 블록 삭제 기능은 이번 범위에 없다.
- 글자 선택은 브라우저 기본 키보드 조작을 유지하고, 서식 도구 모음은 Tab으로 접근한다. 화면에는 포커스 표시가 남는다.
- 실행 취소·다시 실행 버튼에 이름을 제공하고 Ctrl/Cmd+Z, Ctrl+Y 또는 플랫폼에 맞는 다시 실행을 연결한다.
- 선택한 블록과 적용 범위는 화면과 접근성 이름에 함께 표시한다. 선택한 모든 글자를 매 키 입력마다 live region으로 낭독하지 않는다.

## 4. 상태, 저장, 공개의 계약

| 상태 | 보이는 피드백 | 허용되는 다음 동작 |
|---|---|---|
| 연결 준비 중 | `편집 화면을 연결하고 있어요` | 페이지 탐색·재시도. 입력·공개는 비활성화하고 이유를 표시한다. |
| 블록 선택 | 선택 테두리, `소개 · 제목` | 글자 편집, 명시적인 블록 전체 서식 선택, 선택 해제 |
| 입력·부분 선택 | 커서/선택 영역, 범위에 맞는 도구 모음, `편집 마침`·`편집 취소` | 입력·부분 서식·버퍼 내 되돌리기. 마침은 부모 로컬 초안 반영, 취소는 해당 트랜잭션만 복원 |
| 미완료 입력에서 바깥 클릭 | 기존 입력 유지, 마침/취소 인라인 안내 | 도구 모음이면 선택 유지. 다른 블록 이동은 명시적인 마침 또는 취소 후 수행 |
| 초안 변경됨 | `저장하지 않은 변경` | 초안 저장·미리보기·되돌리기 |
| 저장 중 | `초안 저장 중` | 로컬 입력은 유지하되 중복 저장·공개를 막는다. 저장 응답이 새 입력을 덮어쓰지 않는다. |
| 초안 저장됨 | 저장 시각과 `공개 전 변경` | 미리보기·공개 |
| 저장 실패 | 연결 문제와 `다시 저장` | 현재 입력 유지·재시도·이동 시 미저장 안내 |
| 다른 관리자와 충돌 | 영향을 받은 문구와 내 변경/서버 변경 | 문구와 글자 서식을 묶어 선택. 충돌 해소 전 공개 불가 |
| 공개 중/완료 | 진행 상태/실제 완료 시각 | 실패 시 저장된 초안 유지. 완료 응답 후에만 공개 완료 표시 |

편집 마침 전의 활성 입력 버퍼와 부모의 확정된 로컬 초안을 구분한다. 미완료 입력이 있으면 저장·공개 버튼은 먼저 `현재 글자 편집을 마쳐 주세요`라고 안내하며 부분 입력을 임의로 저장하지 않는다. 초기 버전은 현재의 명시적인 초안 저장 동작을 유지한다. 자동 저장을 추가하려면 별도의 상태·재시도·충돌 검증을 통과해야 하며, 시안에서 자동 저장을 약속하고 구현은 수동 저장으로 두지 않는다. 페이지·기기 전환은 사용자 입력을 조용히 버리지 않는다.

## 5. 현재 코드 경계와 재사용 대상

| 기존 파일 | 확인한 책임 | 계획상 역할 |
|---|---|---|
| `src/pages/admin/AdminSiteEditorPage.tsx` | 화면·기기·범위·패널 선택과 공개 확인 | 캔버스 중심 배치로 변경하되 기존 workspace와 게시 흐름 재사용 |
| `src/components/admin/site-editor/EditorPreview.tsx` | 동일 출처 iframe, nonce, ready/draft/applied, viewport scale | 캔버스 호스트와 선택/입력 메시지 연결의 기반 |
| `src/components/admin/site-editor/useEditorWorkspace.ts` | 페이지별 세션, 저장·게시·복원 | 변경 문서의 유일한 부모 소유자 유지 |
| `src/components/admin/site-editor/editorSessionModel.ts` | copy/textStyle 원자적 충돌 처리와 세션 조정 | 캔버스 트랜잭션 적용·undo와 연결 |
| `src/lib/siteEditorPreview.ts` | origin/source/nonce/page/sequence 검증 | 기존 미리보기 프로토콜을 유지하고 캔버스용 계약을 별도로 검증 |
| `src/lib/siteEditorApi.ts` | expected version을 쓰는 저장·게시·복원 RPC | 저장 CAS와 관리자 권한 경계를 유지 |
| `src/components/site-editor/SiteEditorProvider.tsx` | 공개 문서/미리보기 문서, 제출 차단 | 미리보기에서만 편집 runtime을 활성화 |
| `src/components/site-editor/SiteCopy.tsx`, `FormattedCopy.tsx` | 명시적 문구와 부분 서식 렌더링 | 원문 신원·선택 구간 등록, 기존 public 기본 출력 유지 |
| `src/components/home/HomeCopy.tsx`, `src/lib/homeCopySlices.ts` | 홈 source key, slice, multipart·공백 정규화 | 화면 범위와 원문 범위의 양방향 매핑 출발점 |
| `src/content/richCopyKeys.ts`, `homeRichCopyKeys.ts` | 서식 지원 키 목록 | 스타일 지원과 직접 입력 지원을 별도 capability로 확장 |
| `scripts/public-copy-contract.test.mjs` | 캡처된 기본 JSX 비교 | 기존 기본 디자인의 회귀 검증 유지 |

현재 홈의 서식 지원 목록은 데스크톱 83개·태블릿 51개·모바일 49개 원문 키다. 이것은 이번 작업에서 읽은 로컬 목록의 수량이며 화면 블록 수, 직접 입력 지원 수 또는 다른 페이지까지 포함한 완성도를 뜻하지 않는다.

## 6. 원문과 화면 선택 범위 매핑

### 공통 계약

화면의 한 제목·한 문단·한 버튼 이름을 하나의 논리적 블록으로 등록한다. `span`, `em`, `strong`, 반복된 글자, `SiteCopy` 분할 때문에 사용자 선택이 끊기면 안 된다. DOM 문자열 일치로 필드를 추정하지 않고 React adapter가 등록한 블록·세그먼트 신원으로 찾는다.

다음 타입과 함수는 구현 단계에서 생성할 계약이다. 현재 구현되어 있다고 가정하지 않는다.

```ts
type CanvasSourceIdentity = {
  ownerPage: EditorPageId
  scope: 'shared' | EditorDevice
  key: string
}

// renderer가 관측한 값이다. 쓰기 권한이나 CAS 기준으로 신뢰하지 않는다.
type CanvasSource = CanvasSourceIdentity & {
  text: string
}

type CanvasSegment = {
  source: CanvasSource | null
  sourceStart: number
  sourceEnd: number
  visibleStart: number
  visibleEnd: number
  transform: 'exact' | 'slice' | 'collapse-whitespace' | 'literal'
}

type CanvasBlock = {
  id: string
  label: string
  visibleText: string
  segments: CanvasSegment[]
  capabilities: { format: boolean; replaceText: boolean }
  revision: number
}

type CanvasSelection = { blockId: string; start: number; end: number; revision: number }
type CanvasSourceRange = { source: CanvasSource; start: number; end: number }

type CanvasTextEditResult =
  | { ok: true; changes: Array<{ source: CanvasSource; nextText: string }> }
  | { ok: false; reason: 'stale' | 'unmapped' | 'non-reversible' }

declare function mapCanvasRange(block: CanvasBlock, selection: CanvasSelection): CanvasSourceRange[]
declare function applyCanvasTextEdit(block: CanvasBlock, selection: CanvasSelection, insertedText: string): CanvasTextEditResult
```

- 모든 offset은 UTF-16 기준이고 실제 선택 경계는 기존 `snapTextSelection`으로 완성된 grapheme에 맞춘다.
- DOM Range의 anchor/focus 노드는 등록된 텍스트 노드와 연결한다. Node → 세그먼트 참조를 사용하고 같은 문구를 페이지에서 다시 검색하지 않는다.
- `CanvasBlock.id`는 해당 화면의 논리적 occurrence 식별자다. 같은 key가 다른 위치에 다시 나오면 별도 occurrence를 등록하고, 같은 제목의 강조·행 조각만 명시적으로 같은 블록에 묶는다. key나 문자열만으로 그룹을 추정하지 않는다.
- 등록된 원문 snapshot·revision은 부모의 catalog·허용 source 매핑·현재 원문 해석 결과와 대조한다. iframe이 전달한 text·capability·revision을 그대로 권한이나 기준 상태로 채택하지 않는다. 직접 입력은 7절의 부모 발급 edit grant를 받은 뒤에만 시작한다.
- 실제 iframe 경로의 `previewPage`와 저장 문서의 `ownerPage`를 구분한다. 공통 메뉴 편집은 `previewPage='home'`, `ownerPage='common'`일 수 있으며, 부모가 허용한 `(previewPage, ownerPage, scope, key, occurrence)` 조합만 등록한다.
- 여러 세그먼트의 같은 원문 키는 중복 적용하지 않도록 정렬·병합한다. 서로 다른 키에 걸친 스타일 변경은 한 트랜잭션으로 적용한다.
- 1차의 한 블록·트랜잭션은 같은 `ownerPage` 안의 여러 key만 묶는다. 서로 다른 문서 소유자에 걸친 원자적 저장은 기존 페이지별 RPC가 제공하지 않으므로, 그런 블록은 분리하거나 관련 capability를 비활성화한다.

### exact

단일 원문이 그대로 보이는 제목·문단·버튼이다. visible offset과 source offset이 동일하다. `aria-label`, `alt`, placeholder, URL에는 글자 서식 노드를 넣지 않는다.

### sliced

하나의 원문에서 제목의 한 행, 쉼표 앞 문구, trim된 행만 보이는 경우다. 원문 전체 snapshot과 명시적인 시작·끝 offset을 보관한다. 같은 단어가 두 번 나와도 두 번째 행 선택은 두 번째 원문 구간에만 연결한다. 표시하지 않는 원문 앞뒤 내용은 부분 편집 시 유지한다.

### multipart와 공백 정규화

홈 About 본문과 태블릿 입단 설명처럼 여러 원문이 연결되는 경우다. 각 part의 source key, 원문 snapshot, slice offset, 출력 구간을 유지한다. 렌더링 결과를 연결한 값이 현재 블록의 visibleText와 정확히 같을 때만 매핑을 사용한다.

공백 축약에서는 출력된 한 공백이 원문의 어떤 공백 구간을 대표하는지 저장한다. 단순 서식 투영에는 현재 규칙인 첫 원문 공백의 서식을 사용한다. 문자 교체·삭제에서는 해당 visible 구간에 대응하는 전체 원문 구간을 사용하고, 화면 밖 trim 구간은 보존한다. CRLF·연속 공백·빈 줄·이모지·결합 문자를 각각 검증한다.

여러 원문 키를 함께 바꾸는 cross-source multiwrite는 최종 목표에 포함한다. 다만 1차 구현에서는 선택한 문장을 보고 원문별 배분을 추측해 반영하지 않는다. 서식 투영이 가능하다는 이유만으로 내용 교체도 가능하다고 선언하지 않는다. literal 구분자, 다른 원문 키에 걸친 붙여넣기, 숨겨진 원문이 있는 범위는 역변환과 원자적 반영 정책을 검증해야 한다. 검증 전에는 capability를 보수적으로 제한해 `replaceText: false` 또는 해당 범위의 명확한 입력 제한으로 알리고, 이미 안전하게 지원되는 부분 서식은 유지한다. 핵심 제목·본문의 이런 제한을 문서에 남긴 채 전체 PPT 방식 편집이 완료됐다고 말하지 않는다.

## 7. 편집 runtime, 메시지, 저장 보안

- 관리자 부모가 문서·undo·저장 버전을 소유한다. iframe은 블록 등록, 현재 선택, 입력 의도를 보내며 서버 저장·게시 권한을 갖지 않는다.
- 저장 문서는 기존 `SiteEditorDocument.schemaVersion: 1`과 optional `textStyles`를 재사용한다. 이 작업 때문에 저장 스키마나 기존 RPC를 변경하지 않는다.
- 기존 `smyc-editor:ready/draft/applied` preview 프로토콜 1은 전체 초안 전송에 그대로 사용한다. 캔버스 명령은 별도 `siteEditorCanvasProtocol.ts`의 `channel='smyc-canvas'`, `version: 1` 계약이며 저장 스키마 버전·preview 버전과 별개다. 양쪽이 같은 엄격한 parser를 사용하고 다른 프로토콜로 자동 해석하지 않는다.
- 새 메시지 종류와 방향은 Task 3의 union으로 제한한다. 등록·선택·편집 시작 요청·최종 commit/cancel은 iframe→부모, mode 설정·edit grant·서식 명령은 부모→iframe이다. 명령 결과는 요청을 받은 쪽이 응답하되 operation ID와 방향을 대조한다.
- 모든 방향에서 정확한 origin, 예상 `contentWindow` 또는 `window.parent`, 현재 nonce, `previewPage`, 방향별 monotonically increasing sequence를 검증한다. 캔버스 송신·수신 sequence와 기존 preview draft sequence는 별도의 카운터다. 알 수 없는 키·프로토타입 오염 키·비정상 수량·범위 밖 offset은 거부한다.
- 프로토콜 nonce는 인증 토큰이 아니다. 등록되지 않은 public 브라우저가 nonce만으로 관리자 쓰기를 수행할 수 없다.
- URL query나 storage에 draft 전체·개인정보·인증 토큰을 넣지 않는다. 기존 nonce query는 연결 bootstrap에만 사용하고, edit grant·operation 결과·버퍼는 메모리에만 보관한다.
- 부모는 `canvas-editbegin`의 블록과 마지막 실제 적용된 draft sequence를 검증한 뒤 `editId`, 고정된 device/scope, 허용된 원문 범위와 필드별 `fieldVersion`을 발급한다. 동시에 하나의 활성 edit grant만 둔다. 등록 메시지만 받은 상태에서는 contenteditable을 활성화하지 않는다.
- `fieldVersion`은 부모가 관리하는 불투명 CAS 토큰이다. 부모 ledger는 각 필드의 copy override 존재 여부와 값, textStyles override 존재 여부와 정확한 text/runs, 해석된 원문·runs, 사용한 shared/device 상속 및 fallback 의존 값을 canonical snapshot으로 보관한다. 같은 text에서 runs만 바뀌거나 override/상속/fallback이 바뀌어도 토큰을 갱신한다. JSON 객체 키 순서 차이는 변경으로 취급하지 않는다.
- Commit 시 모든 필드 토큰을 부모의 최신 상태와 다시 비교한다. 관련 없는 다른 필드의 변경은 허용하지만, 대상 필드가 달라졌으면 전체 트랜잭션을 거절하고 활성 버퍼를 보존한다. 기존 DB `p_expected_version`은 서버 저장의 별도 CAS이며 이 로컬 필드 CAS를 대체하지 않는다.
- Commit은 grant에 포함된 원문 범위의 replacement text/runs만 받는다. 부모가 보관한 원문에 정렬된 비중첩 edit를 원자적으로 적용하고, 범위 밖 원문·서식을 보존한 최종 schema-1 문서를 다시 검증한다. iframe의 전체 문서 교체나 grant 밖 key/scope/range는 거절한다.
- 각 사용자 명령은 operation ID를 갖는다. 같은 ID·같은 정규화 payload의 재시도는 저장된 결과만 돌려주고 history를 다시 만들지 않는다. 같은 ID·다른 payload는 거절한다. 재시도는 새 송신 sequence와 원래 operation ID를 사용한다.
- 새 캔버스 연결은 부모가 새 nonce를 발급해 시작하고 이전 grant를 폐기한다. 재연결 전에 미완료 버퍼의 마침/취소를 먼저 처리한다. 불가피한 연결 손실은 입력 유실 위험을 표시하고 완료로 처리하지 않는다. 이전 nonce의 메시지는 카운터 재설정 여부와 관계없이 거절한다.
- 저장·게시·복원은 기존 `p_expected_version`을 계속 사용한다. 다른 관리자 충돌 시 문구와 범위 서식을 같은 그룹으로 보관하고 자동 덮어쓰지 않는다.
- 임의 HTML·JS·CSS를 메시지로 받지 않는다. 글꼴 enum과 기존 크기 범위 10–120px, 원문 길이·run 수 제한을 재사용한다.
- 편집 모드에서 링크 클릭은 선택 동작이다. 미리보기 모드에서도 실제 지원서·문의·후원 전송과 파일 첨부 차단을 유지한다.
- 같은 출처 iframe은 격리된 보안 영역이 아니다. origin/source/nonce 검증은 잘못된 창·오래된 메시지·재생을 막는 경계이며 같은 출처에서 실행되는 악성 스크립트까지 방어한다고 주장하지 않는다.

## 8. IME, 선택 유지, undo

DOM 보호 범위는 `compositionstart`–`compositionend`보다 길다. 부모의 edit grant로 입력을 시작한 때부터 commit/cancel의 결과와 재동기화 초안을 확인할 때까지 활성 입력 host와 그 소스 매핑을 고정한다. 입력 이벤트마다 React children·innerHTML을 다시 쓰지 않고, browser가 소유하는 plaintext 편집 DOM과 ref의 text/runs 버퍼를 사용한다. 조합 중 Enter·Ctrl+Enter·Esc·Backspace를 편집 완료·취소·일반 단축키로 가로채지 않는다. `compositionend`는 한글 입력을 활성 버퍼 안에서 확정하는 시점이며 부모 로컬 초안에 편집을 반영하거나 서버에 저장하는 동작이 아니다. 최종 한글 한 음절의 조합을 여러 undo 항목으로 쪼개지 않는다.

활성 트랜잭션 동안 새 preview draft뿐 아니라 공개 데이터 polling·focus refresh·폰트/페이지 데이터 갱신이 활성 입력 DOM을 교체하지 못하게 한다. 가장 최근 대기 snapshot과 sequence만 큐에 보관하고 `canvas-draft-status: deferred`로 부모에게 알린다. 기존 `smyc-editor:applied`는 실제 렌더링 이후에만 보낸다. 부모는 deferred sequence를 applied와 별도로 추적해 기존 10초 반영 확인 타임아웃을 해당 편집 동안 유예하고 `글자 편집을 마치면 최신 초안을 반영합니다` 상태를 표시한다. Commit 승인 또는 cancel 결과의 `resumeDraftSequence` 이상인 권위 있는 부모 초안이 도착해야 freeze를 해제하고 applied를 보낸다. 결과나 재동기화가 실패하면 버퍼를 유지한 채 재시도·충돌 안내를 하며 오래된 큐 내용을 먼저 화면에 덮어쓰지 않는다.

활성 입력 동안 내용과 서식 변경을 같은 버퍼 history에 보관한다. `Ctrl+Enter` 또는 `편집 마침`은 최종 text+runs replacement들을 `canvas-commit` 한 건으로 제출하고, 부모 CAS 승인 후에만 확정된 로컬 초안 변경으로 취급한다. 조합 중이 아닌 `Esc` 또는 `편집 취소`는 `outcome='cancel'`로 활성 grant를 닫는다. 취소는 부모 문서를 쓰지 않으며 부모 상태가 이미 바뀌어 CAS가 오래됐어도 가능해야 한다. 입력 진입 snapshot으로 돌아가는 것은 iframe 버퍼뿐이고, 재동기화 시에는 부모의 최신 초안을 표시한다. 이전 확정 트랜잭션은 건드리지 않는다. 단순 포인터 선택이나 호버는 undo 항목으로 기록하지 않는다. 확정 트랜잭션에는 변경 전후 문서와 선택 위치를 보관하며 동일 필드의 copy와 runs를 따로 복원하지 않는다. 부모의 명령 반영이 iframe에 다시 도착해 동일 변경이 두 번 기록되는 것도 방지한다.

도구 모음 조작 전 선택을 원문 범위로 저장하고, 적용 후 최신 렌더링의 같은 원문 위치로 복원한다. 포커스만 되돌리고 이전 DOM Range 객체를 재사용하지 않는다. 새로 입력한 글자의 서식은 커서의 현재 typing style을 따르되, 다른 source field로 옮겼을 때 그 필드의 서식을 명시적으로 다시 계산한다.

## 9. 구현 파일 배치와 작업 순서

새 파일은 실행 단계에서만 만든다. 각 작업은 실패하는 의미 있는 테스트 → 최소 구현 → 통과 확인 순서로 진행한다. 코드 텍스트를 grep하는 테스트 대신 실제 parser·변환·렌더링·사용자 흐름을 검증한다.

### Task 1: Figma 시안과 상태 계약 검토

**Files:** 이 계획 문서의 실제 Figma 링크 및 검토 결과만 갱신. 앱 파일 변경 없음.

**Produces:** 기본 화면, 요소 선택, 부분 글자 선택/서식 변경, 모바일 입력, 초안 저장/공개 전 확인의 다섯 상태와 아래 10개 검토 축에 대한 결과.

- [x] 기존 홈페이지 제목·본문을 시안 캔버스에 사용하고 기존 방문자 디자인을 재설계하지 않는다.
- [x] 실제 페이지 위의 선택 영역, 글자 도구 모음, 기기 적용 범위, undo와 공개 전 상태를 보여준다.
- [x] `공지사항 제목에서 ‘공지’만 선택한 68→72px 변경 예시`를 사용하여 글꼴·크기 도구와 편집 마침·저장 단계의 관계를 보여준다. 임의 입력·드롭다운의 실제 조작까지 구현한 프로토타입은 아니다.
- [x] `모바일을 확인하고 초안을 저장하되 공개하지 않기`의 종료 상태를 보여준다.
- [x] 실제 Figma URL과 해당 프레임 링크, 자체 검토 결과를 기록했다. 구현 검증이 끝난 것으로 간주하지 않는다.

시안은 기존 `CMS / Quiet Workspace / 2026-09-17` 페이지에 별도로 추가했다. 기존 시안과 방문자 홈페이지를 덮어쓰지 않았다.

- [화면 직접 편집 · 데스크톱](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=648-1688)
- [문구 선택에서 시작](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=655-1758)
- [태블릿](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=652-1722), [모바일](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=652-1727)
- [모바일 초안 저장·공개 안 함](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=664-2015)
- [전체 10개 상태·10축 검토와 제약 기록](../../cms-on-canvas-figma-review.md)

시안 구조 검사에서 관리자 UI 범위 이탈·44px 미만 버튼·잘못된 연결 목적지는 각각 0개였다. 연결된 17개 동작은 시안 단계 이동이며 실제 저장·공개 요청이 아니다. 기본 public 출력 계약 테스트 6개는 통과했다. 실제 입력·IME·보안·저장 테스트는 Task 2 이후에 수행한다.

### Task 2: 순수한 원문 범위 모델과 역변환

**Files:** Create `src/lib/siteEditorCanvasModel.ts`, `src/lib/siteEditorCanvasModel.test.mjs`; Modify `src/lib/homeCopySlices.ts` only if sharing existing projection removes duplication.

**Consumes:** `EditorPageId`, `EditorDevice`, `snapTextSelection`, 기존 원문 key/part 정보.

**Produces:** 위 6절의 `CanvasBlock`, `CanvasSelection`, `mapCanvasRange`, `applyCanvasTextEdit`.

- [ ] 단일·반복·slice·multipart 선택을 실제 fixture로 작성한다. 다음 판정은 화면에서 두 번째 단어가 선택되었는지를 확인한다.

```ts
const source = { ownerPage: 'home', scope: 'desktop', key: 'home.current.about.title', text: '노래\n노래' } as const
const block: CanvasBlock = {
  id: 'home-about-title', label: '소개 제목', visibleText: '노래', revision: 2,
  capabilities: { format: true, replaceText: true },
  segments: [{ source, sourceStart: 3, sourceEnd: 5, visibleStart: 0, visibleEnd: 2, transform: 'slice' }],
}
assert.deepEqual(mapCanvasRange(block, { blockId: block.id, start: 0, end: 2, revision: 2 }), [{ source, start: 3, end: 5 }])
assert.deepEqual(applyCanvasTextEdit(block, { blockId: block.id, start: 0, end: 2, revision: 2 }, '합창'), {
  ok: true, changes: [{ source, nextText: '노래\n합창' }],
})
```

- [ ] `node --test src/lib/siteEditorCanvasModel.test.mjs`로 올바른 원인의 실패를 확인한다.
- [ ] grapheme 경계, 원문 snapshot, revision, capability를 검사하고 매핑을 구현한다. 불일치는 `stale`/`unmapped`/`non-reversible`로 구분한다.
- [ ] CRLF, leading/trailing whitespace, 같은 단어 반복, 두 key에 걸친 스타일, literal 경계 삭제, 선택 방향 역전의 기대 결과를 추가한다.
- [ ] cross-source 텍스트 교체는 원문별 삭제·삽입 범위와 전체 원자성을 증명한 fixture에만 허용한다. 그 외 범위는 `non-reversible`로 거부하고 capability가 직접 입력 가능으로 표시되지 않는지 검증한다.
- [ ] 테스트 통과 후 독립 리뷰에서 source 밖 문자 변경이 없는지 확인한다.

### Task 3: 검증된 양방향 캔버스 프로토콜

**Files:** Create `src/lib/siteEditorCanvasProtocol.ts`, `src/lib/siteEditorCanvasProtocol.test.mjs`; Modify `EditorPreview.tsx`, `SiteEditorProvider.tsx`.

**Consumes:** Task 2의 블록·선택·edit result, 부모의 catalog/source 해석과 필드 CAS ledger, 기존 origin/source/nonce 검증 방식.

**Produces:** `parseCanvasMessage(value: unknown): CanvasMessage | null`, `acceptCanvasMessage(event, expected): CanvasMessage | null`. 전자는 구조만 확인하고, 후자는 발신 방향·연결을 확인한다. 쓰기 승인 전 부모 handler가 catalog, grant, 필드 CAS, 범위, 최종 문서 검증을 추가로 수행한다.

```ts
type CanvasEnvelope = {
  channel: 'smyc-canvas'
  version: 1
  nonce: string
  previewPage: EditorPageId
  sequence: number // 이 방향의 canvas 메시지 카운터; preview draft 순서와 별개
}

type CanvasFieldGrant = {
  source: CanvasSourceIdentity
  fieldVersion: string // 부모 발급; 정확한 기준 snapshot은 부모 ledger에 보관
  text: string
  runs: EditorTextRun[]
  ranges: Array<{ start: number; end: number }> // 이 기준 원문에서 허용한 범위
}
type CanvasEditGrant = {
  editId: string
  blockId: string
  blockRevision: number
  ownerPage: EditorPageId
  scope: 'shared' | EditorDevice
  device: EditorDevice
  baseDraftSequence: number
  fields: CanvasFieldGrant[]
}
type CanvasSourcePatch = {
  source: CanvasSourceIdentity
  fieldVersion: string
  edits: Array<{
    start: number; end: number // grant 기준 원문의 비중첩 UTF-16 범위
    text: string
    runs: EditorTextRun[] // replacement text의 0 기준 범위
  }>
}
type CanvasRejection = 'stale' | 'invalid' | 'unsupported' | 'busy' | 'composing'

type CanvasFrameMessage = CanvasEnvelope & (
  | { type: 'canvas-ready' }
  | { type: 'canvas-register'; appliedDraftSequence: number; blocks: CanvasBlock[] }
  | { type: 'canvas-selection'; editId: string | null; localRevision: number; selection: CanvasSelection | null }
  | { type: 'canvas-editbegin'; requestId: string; blockId: string; blockRevision: number; appliedDraftSequence: number }
  | { type: 'canvas-commit'; editId: string; operationId: string; baseDraftSequence: number; outcome: 'apply'; changes: CanvasSourcePatch[] }
  | { type: 'canvas-commit'; editId: string; operationId: string; outcome: 'cancel' }
  | { type: 'canvas-draft-status'; editId: string; draftSequence: number; status: 'deferred' }
  | { type: 'canvas-command-result'; action: 'mode'; operationId: string; accepted: boolean; reason?: CanvasRejection }
  | { type: 'canvas-command-result'; action: 'format'; editId: string; operationId: string; accepted: boolean; localRevision: number; selection: CanvasSelection | null; reason?: CanvasRejection }
)
type CanvasParentMessage = CanvasEnvelope & (
  | { type: 'canvas-mode'; operationId: string; mode: 'edit' | 'preview'; scope: 'shared' | EditorDevice; device: EditorDevice }
  | { type: 'canvas-editgrant'; requestId: string; accepted: true; grant: CanvasEditGrant }
  | { type: 'canvas-editgrant'; requestId: string; accepted: false; reason: CanvasRejection }
  | { type: 'canvas-format'; editId: string; operationId: string; expectedLocalRevision: number; selection: CanvasSelection; patch: EditorTextStyle | null }
  | { type: 'canvas-command-result'; action: 'commit'; editId: string; operationId: string; status: 'committed' | 'cancelled'; resumeDraftSequence: number }
  | { type: 'canvas-command-result'; action: 'commit'; editId: string; operationId: string; status: 'rejected'; reason: CanvasRejection }
)
type CanvasMessage = CanvasFrameMessage | CanvasParentMessage
type CanvasMessageExpectation = {
  origin: string; source: MessageEventSource; nonce: string
  previewPage: EditorPageId; lastSequence: number
  direction: 'frame-to-parent' | 'parent-to-frame'
}
declare function parseCanvasMessage(value: unknown): CanvasMessage | null
declare function acceptCanvasMessage(event: Pick<MessageEvent, 'origin' | 'source' | 'data'>, expected: CanvasMessageExpectation): CanvasMessage | null
```

parser 테스트의 기본 메시지는 `{ channel: 'smyc-canvas', type: 'canvas-ready', version: 1, nonce: 'c61ca8a9-0912-4f19-a4fb-b30a54fa6068', previewPage: 'home', sequence: 1 }`로 고정한다. 추가 키 `html`, 음수 sequence, 같은 sequence 재수신, 다른 nonce·previewPage·발신 방향을 각각 거부해야 한다. `canvas-register`의 key는 catalog와 실제 renderer capability의 교집합에 있어야 하며, text와 source 범위는 부모가 같은 draft/fallback으로 계산한 원문과 정확히 같아야 한다. snapshot이 불명확하거나 부모에서 원문을 해석할 수 없으면 grant를 주지 않고 동기화 안내를 한다.

원문 범위·replacement runs·operation ID·블록 수·세그먼트 수·총 payload에 각각 상한을 둔다. 상한은 기존 10,000 code point/500 run/512KB 문서 제한을 낮추거나 유지하는 범위에서 실제 최대 등록량을 측정해 결정하고 fixture에 근거를 기록한다. Commit의 여러 edits는 모두 동일한 grant 원문을 기준으로 하며 부모가 뒤쪽부터 적용한다. 한 edit라도 잘못됐거나 한 fieldVersion이라도 달라졌으면 일부만 반영하지 않는다. Grant의 다른 필드도 바뀌었으면 cross-source 선택의 해석이 달라질 수 있으므로 그 트랜잭션 전체를 다시 확인한다.

최초 연결과 부모 UI의 모드·범위 변경은 `canvas-mode`로 전달한다. 활성 grant가 있으면 이를 거절하고 마침/취소를 먼저 안내한다. 해당 명령은 문서를 쓰지 않으며 iframe이 스스로 scope를 바꾸는 경로는 제공하지 않는다. 일반 키 입력과 IME 중간 결과는 로컬 버퍼에만 반영한다. 부모 toolbar의 `canvas-format`은 저장된 선택과 `expectedLocalRevision`이 현재 버퍼와 같을 때만 iframe이 반영하고 format 결과를 응답한다. 조합 중이거나 revision이 달라진 명령은 거절하며 새 선택으로 재시도한다. Commit/cancel 결과의 `resumeDraftSequence`는 부모가 실제 기존 preview `draft` 경로로 전송하는 권위 있는 snapshot을 가리킨다. 결과를 먼저 받았다는 이유만으로 기존 `applied`를 보내지 않는다.

- [ ] 올바른 메시지는 수락하고 channel·origin·window source·nonce·previewPage·방향·sequence를 각각 하나만 변경한 메시지는 거절하는 테스트를 작성한다.
- [ ] `node --test src/lib/siteEditorCanvasProtocol.test.mjs`의 실패를 확인한다.
- [ ] iframe이 grant/result 방향을 사칭하거나 등록된 key의 text·capability·ownerPage·scope·범위를 바꿔 보내도 부모 문서가 변하지 않는 테스트를 작성한다.
- [ ] `previewPage='home'`에서 승인된 `ownerPage='common'` 메뉴 편집은 허용하고, 허용되지 않은 다른 문서·기기 조합은 거절한다.
- [ ] 동일 text에서 runs만 변경, override 생성/삭제, shared/device 상속 및 fallback 변경을 각각 만들어 field CAS가 commit 전체를 거절하고 입력을 보존하는지 확인한다. 무관한 다른 key 변경은 허용해야 한다.
- [ ] 승인된 operation의 같은 payload 재시도는 결과만 재전송하고 history를 한 번만 생성하며, 같은 operation ID의 다른 payload는 거절한다.
- [ ] 재연결·빠른 페이지 변경·같은 sequence 재전송·이전 nonce·폐기한 editId·잘못된 원문 snapshot을 테스트한다.
- [ ] 정확한 grant 원문 밖의 숨겨진 문자/runs 변경, 겹친 edit, 다른 필드가 stale인 multipart commit을 모두 원자적으로 거절한다.
- [ ] 기존 `siteEditorPreview.test.mjs`, `editorPreviewModel.test.mjs`도 통과시켜 기존 읽기 미리보기 연결이 유지됨을 확인한다.

### Task 4: 편집 모드에서만 블록을 등록하는 runtime

**Files:** Create `src/components/site-editor/CanvasEditorRuntime.tsx`, `CanvasEditorRuntime.test.mjs`, `canvas-editor-preview.css`; Modify `SiteEditorProvider.tsx`, `SiteCopy.tsx`, `FormattedCopy.tsx`, `src/components/home/HomeCopy.tsx` 및 필요한 명시적 소비자.

**Consumes:** 검증된 연결, Task 2 블록 정보. 등록은 읽기 전용 public 속성 문자열과 분리한다.

**Produces:** 블록 등록·선택·편집 lifecycle. 활성 블록만 그 자리에서 입력 가능하며 전체 `document`는 편집 가능해지지 않는다.

```ts
type CanvasRuntimeProps = {
  enabled: boolean
  mode: 'edit' | 'preview'
  nonce: string
  previewPage: EditorPageId
  appliedDraftSequence: number
  activeGrant: CanvasEditGrant | null
  onMessage: (message: CanvasFrameMessage) => void
}
declare function CanvasEditorRuntime(props: CanvasRuntimeProps): ReactNode
```

`enabled`는 검증된 부모 연결 상태에서만 true다. 모드·범위는 승인한 `canvas-mode`에서, 활성 입력은 승인한 `canvas-editgrant`에서 파생한다. `mode='preview'`에서는 contenteditable·선택 장식·편집용 키보드 가로채기를 제거하지만 기존 미리보기 전송 차단은 계속 적용한다.

- [ ] 편집 연결이 없는 렌더링과 기존 baseline의 DOM이 같다는 SSR 테스트를 먼저 작성한다.
- [ ] 선택 테두리·블록 이름·비활성 사유가 실제 선택된 요소를 따라가는 테스트를 작성한다.
- [ ] runtime은 preview에서만 lazy load하고, 블록 ref·텍스트 노드 등록을 사용한다. 공개 모드에서는 등록 UI·이벤트·추가 wrapper를 만들지 않는다.
- [ ] styled `smyc-text`/`smyc-copy`와 기존 강조 span을 등록에 포함하되, 기본 `span` 레이아웃 규칙이 새 선택 UI에 전파되지 않게 격리한다.
- [ ] 부모 grant 전에는 등록/선택만 가능하며 contenteditable은 비활성인지 확인한다. iframe origin이 같다는 사실이나 유효한 nonce만으로 입력 grant를 대체하지 않는다.
- [ ] `입력 시작 → compositionend → 새 draft/공개 polling/focus refresh → toolbar 조작 → commit 또는 cancel` 전 구간에서 활성 DOM 노드·caret·버퍼가 보존되는 테스트를 작성한다.
- [ ] deferred 상태에서는 기존 applied ACK가 발생하지 않고, 10초가 지나도 연결 실패로 오표시하지 않으며, resumeDraftSequence의 문서를 실제 적용한 뒤에만 applied를 보내는지 확인한다.
- [ ] 스크롤·캔버스 scale·브라우저 zoom·폰트 로딩 후에도 실제 글자와 윤곽선이 맞는지 브라우저에서 확인한다.

### Task 5: 직접 입력, 한글 조합, 통합 실행 취소

**Files:** Create `src/components/admin/site-editor/editorCanvasHistory.ts`, `editorCanvasHistory.test.mjs`; Modify `CanvasEditorRuntime.tsx`, `editorSessionModel.ts`, `useEditorWorkspace.ts`.

**Consumes:** 명시적인 원문 변경 결과, 세션 문서와 선택 위치.

**Produces:** `commitCanvasTransaction`, `undoCanvasTransaction`, `redoCanvasTransaction`의 동일 history 경로. 각 함수는 문서와 선택을 함께 반환하며 서버 저장을 직접 호출하지 않는다.

```ts
type CanvasHistoryState = { ownerPage: EditorPageId; document: SiteEditorDocument; selection: CanvasSelection | null }
type CanvasTransaction = {
  id: string
  kind: 'text' | 'format'
  before: CanvasHistoryState
  after: CanvasHistoryState
}
type CanvasHistory = { past: CanvasTransaction[]; present: CanvasHistoryState; future: CanvasTransaction[] }
declare function commitCanvasTransaction(history: CanvasHistory, transaction: CanvasTransaction): CanvasHistory
declare function undoCanvasTransaction(history: CanvasHistory): CanvasHistory
declare function redoCanvasTransaction(history: CanvasHistory): CanvasHistory
```

완료된 트랜잭션 ID는 승인된 commit의 operation ID이며 재수신은 동일 history를 반환한다. before/after의 ownerPage는 같아야 하고 grant의 ownerPage와 일치해야 한다. 새 편집 확정은 redo 목록을 비우고, 저장 성공만으로 과거 트랜잭션을 삭제하지 않는다. 다른 서버 버전과 reconcile한 뒤에는 더 이상 안전하게 적용할 수 없는 history 항목을 구분해 안내하고 오래된 문서 전체로 되돌리지 않는다.

- [ ] `초기 문구 → 활성 버퍼에서 한글 조합 완료 → 부분 크기 변경 → 편집 마침 → undo → redo`에서 문구·서식·선택 위치가 함께 복구되는 테스트를 작성한다.
- [ ] `기존 확정 변경 → 새 입력 진입 → 입력·서식 변경 → Esc`에서 새 트랜잭션만 취소되고 기존 확정 변경은 유지되는 테스트를 작성한다.
- [ ] Ctrl+Enter/편집 마침은 부모 로컬 초안을 바꾸지만 저장·공개 RPC를 호출하지 않는지 확인한다. 도구 모음·다른 블록·빈 캔버스 클릭은 활성 입력을 조용히 버리거나 확정하지 않아야 한다.
- [ ] 조합 중 새 draft 도착, 조합 완료 후 미확정 상태의 새 draft 도착, 조합 완료 직후 도구 모음 클릭, 조합 취소의 테스트를 작성한다.
- [ ] grant 시작부터 최종 결과와 재동기화까지 활성 입력 노드를 교체하지 않는다. 조합 종료는 버퍼에만 반영하고, 명시적인 편집 마침과 부모 필드 CAS 승인 후 원문 변경 트랜잭션을 만든다. 리치 HTML 붙여넣기는 plain text로만 받고 원래 HTML/CSS를 보관하지 않는다. 별도 허용 서식 변경은 검증된 toolbar 경로로만 수행한다.
- [ ] commit 거절/응답 유실 때 버퍼와 선택을 보존하고 같은 operation ID 재시도로 중복 history가 생기지 않는지 확인한다. 서버 변경 후 cancel은 최신 부모 초안을 쓰거나 과거 snapshot으로 되돌리지 않아야 한다.
- [ ] 동일 트랜잭션의 echo를 history에서 제외한다. undo 중 CAS 저장 응답이 도착해도 최신 로컬 문서를 덮어쓰지 않는다.
- [ ] 실제 한국어 IME로 `서울모테트`, 받침 변경, 문장 중간 삽입, 선택 후 덮어쓰기와 undo를 확인한다. 합성 이벤트 통과만으로 IME 완료를 선언하지 않는다.

### Task 6: 캔버스 중심 도구 모음과 기기·범위 표시

**Files:** Create `src/components/admin/site-editor/EditorCanvasToolbar.tsx`, `EditorCanvasToolbar.test.mjs`; Modify `AdminSiteEditorPage.tsx`, `EditorPreview.tsx`, `src/styles/admin-site-editor.css`.

**Consumes:** 현재 블록·선택·capability·mixed style·device·scope·busy 상태.

**Produces:** 원문 범위를 유지하는 글꼴·크기 명령, 명시적인 편집/미리보기 전환, 터치 대응 배치.

```ts
type CanvasFormattingCommand = {
  editId: string
  operationId: string
  expectedLocalRevision: number
  selection: CanvasSelection
  patch: EditorTextStyle | null
}
type EditorCanvasToolbarProps = {
  selection: CanvasSelection | null
  blockLabel: string | null
  fontFamily: EditorFont | 'mixed' | 'inherited'
  fontSize: number | 'mixed' | 'inherited'
  device: EditorDevice
  scope: 'shared' | EditorDevice
  disabledReason: string | null
  onFormat: (command: CanvasFormattingCommand) => void
}
```

`patch=null`은 선택 범위의 서식 초기화다. 부모가 grant의 capability·소유 문서·기기 scope를 확인하고 위 명령을 `canvas-format`으로 보낸다. iframe은 현재 버퍼의 local revision·선택 경계·조합 상태를 다시 확인하며 서식 변경을 로컬 버퍼 history에만 반영한다. 결과 응답이 와도 부모 초안은 바꾸지 않고 최종 commit에서만 text+runs를 함께 반영한다. 블록 전체 적용도 먼저 edit grant를 받고 명시적으로 전체 선택을 만든 뒤 같은 명령 경로로 처리한다.

- [ ] 두 서식이 섞인 선택의 `혼합`, 상속 상태의 `기본 서식`, 선택이 없는 서식 적용 방지를 실제 렌더 테스트로 작성한다.
- [ ] 글꼴·크기 조작 후 원래 글자가 선택 상태를 유지하고 해당 범위만 변경되는 브라우저 흐름을 검증한다.
- [ ] 별도 textarea는 기본 작업면에서 제거하고 비노출 필드·접근성 설명 등 보조 관리 용도로만 접근시킨다.
- [ ] 기기 미리보기와 수정 scope를 각각 표시한다. 홈 sourceDevice와 공통 메뉴 범위는 기존 정의를 사용한다.
- [ ] 390/768/1440px에서 도구 모음·하단 안전 영역·가상 키보드·긴 글꼴명·숫자 직접 입력 오류를 확인한다.

### Task 7: 저장·공개·충돌·접수 차단의 통합

**Files:** Modify `EditorPreview.tsx`, `useEditorWorkspace.ts`, `AdminSiteEditorPage.tsx`; Test existing `editorSessionModel.test.mjs`, `siteEditorApi.test.mjs`, `siteEditorSubmissionGuard.test.mjs` and new `src/components/admin/site-editor/editorCanvasIntegration.test.mjs`.

**Consumes:** 부모가 소유한 최신 문서, 기존 server version, 유효성 검사와 공개 변경 목록.

**Produces:** 4절 상태표와 일치하는 저장·공개·복원 흐름.

- [ ] `저장 요청 시작 → 사용자 추가 입력 → 이전 저장 성공 응답` 후 추가 입력이 남는 회귀 테스트를 작성한다.
- [ ] 다른 관리자의 같은 key 수정은 copy와 runs를 함께 충돌로 처리하고, 서로 다른 key의 안전한 변경은 기존 reconcile 방식대로 보존한다.
- [ ] DB 버전이 그대로인 로컬 서식 변경, shared/device override 제거, fallback 갱신도 필드 CAS에서 감지하는지 확인한다. 기존 expected server version 검증은 별도로 유지한다.
- [ ] 공통 메뉴를 home iframe에서 편집해도 common 문서만 바뀌고 home 문서/history에는 오기록되지 않는지 확인한다.
- [ ] 부모의 저장·공개·복원·기기 전환·iframe 새로고침 guard가 부모의 dirty count뿐 아니라 활성 edit grant와 미완료 버퍼도 인지하는지 확인한다.
- [ ] 권한 만료·서버 미설치·연결 끊김·응답 형식 오류·버전 충돌을 각기 다른 기존 오류 결과로 표시한다.
- [ ] 공개 전 변경 목록은 사람이 이해할 블록 이름과 기기 범위를 보여준다. 미완료 활성 입력·저장 실패·불완전 조합·미해결 충돌이 있으면 공개하지 않는다.
- [ ] 미리보기에서 지원서/문의/후원 폼 전송과 업로드가 계속 차단되는지 확인한다. 실제 운영 접수 데이터로 검증하지 않는다.

### Task 8: 화면별 coverage와 출시 검증

**Files:** Modify `src/content/richCopyKeys.ts`, `homeRichCopyKeys.ts`, `src/content/siteCopyCatalog.ts` only for explicit capabilities; add `src/components/site-editor/CanvasEditorCoverage.test.mjs`; register new tests in `scripts/run-tests.mjs`; record results in this plan.

**Consumes:** 실제 등록 가능한 블록과 키 목록. 단순히 text 타입이라는 이유만으로 직접 입력 가능하게 표시하지 않는다.

**Produces:** 페이지·기기별 format/replaceText/보조관리/연결된 CMS 구분과 실제 검증 결과.

- [ ] 모든 캔버스 editable key가 존재하는 catalog·source key와 대응하고, URL/aria/alt/placeholder가 잘못된 리치 편집 대상으로 노출되지 않는 테스트를 작성한다.
- [ ] 홈의 exact 제목, sliced 제목, normalized About 본문, tablet multipart 설명을 필수 시나리오로 검증한다.
- [ ] 동적 공연·갤러리·단원·후원 데이터는 기존 전용 CMS 소유권을 표시한다. 고정 page-copy와 혼동해 다른 항목을 변경하지 않는다.
- [ ] 아래 릴리즈 검증을 모두 수행하고 실패 원인을 기록한다. 사용자가 요청한 핵심 텍스트에 직접 입력이 안 되는 항목이 남으면 범위를 축소해 완료라고 보고하지 않는다.

## 10. 검증 게이트

| 게이트 | 실행·관찰 | 통과 기준 |
|---|---|---|
| 타입·정적 검사 | `pnpm exec tsc -b`, `pnpm lint` | 새 오류 0건. 관련 없는 기존 실패도 숨기지 않고 기록 |
| 전체 회귀 | `pnpm test` | 등록된 기존·신규 테스트 통과 |
| 빌드 | `pnpm build` | production 빌드 통과, public 기본 경로에 관리자 전용 코드가 불필요하게 포함되지 않음 |
| 기본 출력 | `node --test scripts/public-copy-contract.test.mjs src/components/site-editor/SiteEditorProvider.test.mjs src/components/site-editor/FormattedCopy.test.mjs src/components/home/HomeCopy.test.mjs` | 기존 default 문구·DOM·원본 강조 보존. baseline JSON을 새 디자인에 맞춰 덮어써 통과시키지 않음 |
| 화면 회귀 | `/`, `/spirit`, `/about?section=spirit`, `/about?section=conductor`, `/about?section=accompanist`, `/about?section=members`, `/join`, `/contact?section=support` | 주요 버튼·읽기·탐색 흐름 유지 |
| 뷰포트 | 390px 모바일, 768px 태블릿, 1440px 데스크톱, 브라우저 확대/축소 | 가로 overflow·주요 버튼 겹침·도구 모음 화면 이탈 없음 |
| 직접 편집 | 블록 선택 → 부분 글자 선택 → 글꼴·크기 → 편집 마침 → undo → 입력 → 편집 마침 → 저장 → 새로고침 | 선택 위치·내용·서식·저장 범위 일치. Esc는 현재 활성 입력만 취소 |
| 원문 매핑 | 반복 단어, 행 trim, CRLF, 두 필드 결합, 이모지, 결합 글자 | 선택하지 않은 원문과 숨겨진 원문이 변하지 않음 |
| 키보드·터치 | Enter/Ctrl+Enter/Esc/Tab, 편집 마침·취소, 기본 선택 핸들, 가상 키보드 | 마침/취소 계약 일치, 바깥 클릭 시 입력 보존, 조합 중 단축키 가로채기 없음, 터치 타깃 44px 이상 |
| 보안·충돌 | 잘못된 origin/source/nonce/방향, ownerPage 혼동, grant 밖 범위, 오래된 fieldVersion, 권한 만료 | 메시지 거부·활성 버퍼 보존·게시 차단. 같은 text의 runs/상속 변경도 감지. public draft 노출 없음 |
| 연결·트랜잭션 | editbegin→grant→입력/서식→commit/cancel, 중복 operation, 응답 유실, 새 nonce 재연결 | commit 전 부모 초안 불변, 승인 후 한 번만 반영, 취소는 부모 무변경, 이전 연결 메시지 거부 |
| 활성 입력 보호 | 한글 조합 종료 후에도 새 draft/polling 도착, deferred ACK, 10초 대기, 재동기화 | 입력 마침·취소 결과와 resumeDraftSequence 적용까지 DOM/caret 보존. 적용하지 않은 snapshot을 applied로 알리지 않음 |

Figma 시안만 완료된 단계에서는 위 구현·브라우저·저장 게이트를 통과했다고 표시하지 않는다. 실제 기기가 없는 경우에는 기기 검증을 `미실시`로 남긴다.

## 11. Figma 디자인 리뷰 10개 축

| 축 | 검토 질문 | 시안에서 보여야 하는 증거 |
|---|---|---|
| 1. 작업 직접성 | 원하는 홈페이지 글자를 고치기 위해 별도 입력창을 찾아야 하는가? | 실제 문구 위에서 커서·선택·변경이 이어지는 연결 |
| 2. 선택 단위 | 한 번 클릭·더블클릭·글자 선택의 차이가 보이는가? | 블록 테두리, 입력 커서, 부분 선택의 세 상태 |
| 3. 기본 디자인 충실도 | 기존 홈페이지의 폰트·강조·줄바꿈이 바뀌지 않았는가? | 같은 public 문구와 layout을 가진 기본 캔버스 |
| 4. 시각적 우선순위 | 페이지 콘텐츠보다 관리자 패널이 더 크게 시선을 빼앗는가? | 넓은 캔버스, 간결한 상단 도구 모음, 접을 수 있는 탐색 |
| 5. 적용 범위 | 보는 기기와 수정되는 기기·공통 문구를 구별할 수 있는가? | 화면 크기 표시와 별도의 적용 범위 표시 |
| 6. 키보드·접근성 | 마우스 없이 선택·입력·서식·확정·취소가 가능한가? | 포커스 표시, Enter 진입·Ctrl+Enter 마침·Esc 현재 입력 취소 안내 |
| 7. 터치·작은 화면 | 키보드와 도구 모음이 문구를 가리지 않는가? | 390px 상태, 선택 핸들 영역, 44px 동작, 안전 영역 |
| 8. 입력·복구 신뢰성 | 한글 조합·실수·되돌리기 때 사용자가 상황을 이해하는가? | 입력 중 상태와 undo/redo 결과, 원문 보존 설명 |
| 9. 저장·공개·충돌 | 저장과 공개, 다른 관리자의 변경을 혼동하지 않는가? | 저장됨/공개 전 변경/공개 완료/충돌의 다른 상태 |
| 10. 범위와 유지보수 | 직접 수정할 수 없는 요소를 편집 가능한 것처럼 보여주지 않는가? | 동적 CMS 항목·비노출 필드·역변환 미지원에 대한 정직한 연결 |

각 축은 `통과 / 수정 필요 / 구현에서 확인`으로 기록한다. 시안으로 검증할 수 없는 보안·IME·성능을 시각적 완성도만으로 통과시키지 않는다.

## 12. 남은 제약과 전달 기준

- 브라우저의 실제 selection geometry, 한글 IME, 터치 키보드, 폰트 로딩 후 재배치는 Figma만으로 검증되지 않는다.
- public에서 보이는 모든 문구가 같은 CMS 소유권을 갖지 않는다. 동적 운영 데이터는 연결된 관리 흐름을 유지한다.
- exact/slice/multipart의 서식 지원과 안전한 원문 교체 지원은 별도 capability다. cross-source multiwrite는 목표에 포함하지만 1차에서는 추측 반영하지 않으며, 역변환·원자성이 증명되지 않은 영역의 capability를 보수적으로 제한한다.
- 부모가 renderer와 같은 fallback·상속 원문을 재현하지 못하는 항목은 field CAS 기준을 만들 수 없다. iframe이 보낸 snapshot을 기준으로 대신 신뢰하지 않고 직접 입력을 제한한 뒤 원문 해석 경로를 먼저 맞춘다.
- 같은 소유 문서의 여러 key는 원자적 로컬 트랜잭션으로 처리하지만, 서로 다른 ownerPage의 원자적 서버 저장은 이 계획의 기존 RPC 재사용만으로 보장하지 않는다.
- 지원하지 않는 브라우저, 연결 손실, 실제 IME·contenteditable·selection의 플랫폼 차이는 실제 검증 전 지원 완료로 표시하지 않는다. 미완료 로컬 버퍼의 연결 손실 복구를 영속 저장으로 보장하는 기능은 현재 계약에 포함되어 있지 않다.
- 전역 외형 변경, 자유 배치, 요소 삭제, 이미지 디자인 도구는 이번 콘텐츠 편집 목표의 완료 조건이 아니다.
- 이 문서의 작성 완료는 설계 산출물 완료다. 실제 구현 완료 보고에는 변경한 내용, UX 개선점, 실행한 검증, 조사한 내용, 남은 리스크를 각각 적는다.
- 실제 Figma 프레임은 Task 1과 별도 검토 기록에 연결했다. 시안 완료와 구현 완료를 구분한다.

### 문서 자체 검토

- [x] 실제 열어 확인한 공식 문서 10개만 독립 ledger로 기록했다.
- [x] desktop/touch/keyboard, 기본 public 디자인 보존, 초안·게시 구분을 계획에 포함했다.
- [x] exact/sliced/multipart, IME, undo, 메시지 검증, CAS를 각각 작업과 테스트 게이트에 연결했다.
- [x] 직접 입력 지원의 미확정 범위를 완료된 기능처럼 표현하지 않았다.
- [x] Figma 디자인 리뷰 축을 10개로 구체화했다.
- [x] 독립 리뷰의 네 가지 계약 결함을 계획에 반영했다: begin/grant/commit/cancel과 서식 명령, 부모 필드 CAS, previewPage/ownerPage 분리, 활성 트랜잭션 전체 DOM freeze와 deferred ACK. 이는 문서 검토 완료이며 구현 테스트 통과 표시가 아니다.
- [x] 실제 Figma 파일·프레임 링크와 시안 리뷰 결과를 연결했다.
- [ ] 구현 단계의 테스트·브라우저·실기기 검증 결과를 기록한다.
