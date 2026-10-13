---
name: Motet CMS Text Editor
description: 기존 관리자 디자인을 유지하는 한글·영어 홈페이지 문구 편집 작업 공간
colors:
  admin-accent: "#68233a"
  admin-paper: "#fcfaf5"
  admin-canvas: "#f2efe8"
  admin-ink: "#17171a"
  admin-muted: "#68665f"
  admin-line: "#d8d2c7"
  control-white: "#fff"
typography:
  body:
    fontFamily: '"SMYC Admin", system-ui, sans-serif'
    fontSize: "14px"
    lineHeight: 1.6
  title:
    fontSize: "20px"
    lineHeight: 1.4
rounded:
  formal: "4px"
components:
  button-primary:
    backgroundColor: "{colors.admin-accent}"
    textColor: "{colors.admin-paper}"
    rounded: "{rounded.formal}"
  field:
    backgroundColor: "{colors.control-white}"
    textColor: "{colors.admin-ink}"
    rounded: "{rounded.formal}"
---

# 서울모테트 CMS 문구 편집기

## Overview

적용 범위는 `/admin/editor`, `/admin/editor-english`의 **CMS 문구 편집기만**이다. 홈페이지 public 디자인, CMS 전체 디자인, 저장된 문구·서식의 새 기준으로 확대하지 않는다. 아래 값은 구현에서 추출한 기록이며 새로운 런타임 토큰을 추가하지 않는다.

기존 관리자 화면의 아이보리 바탕, 흰 조작 면, 버건디 선택색과 Gothic A1 서체를 유지한다. 화면·적용 기기를 고르고, 캔버스의 문구를 선택해 속성을 조절한 뒤, 임시저장과 별도 게시로 이어지는 작업 순서가 기준이다. 미리보기 iframe 안의 홈페이지 표현은 관리자 UI 색·글꼴 규칙의 적용 대상이 아니다.

구현 근거:

- [관리자 토큰·글꼴](../../../styles/admin-workspace.css), [기존 편집기 스타일](../../../styles/admin-site-editor.css), [문구 편집 작업 공간 스타일](../../../styles/admin-site-editor-workspace.css).
- [페이지 구성·저장·게시](../../../pages/admin/AdminSiteEditorPage.tsx), [캔버스](EditorPreview.tsx), [속성 패널](EditorWorkSurface.tsx), [도구 펼침](EditorToolMenu.tsx), [배치 속성](EditorPlacementToolbar.tsx).
- [배치 도구 기본 스타일](editor-placement-toolbar.css), [기존 글꼴 창 스타일](editor-canvas-toolbar.css), [구현 계획·범위](../../../../docs/superpowers/plans/2026-10-13-cms-editor-workspace.md).

## Colors

Primary는 기존 `admin-accent` 버건디다. 적용 기기의 선택 상태, 주요 작업, 포커스와 캐럿에 사용한다. 선택 상태는 `aria-pressed`, `aria-current`, 글자 굵기 또는 밑줄을 함께 사용한다.

Neutral은 `admin-paper` 작업 바탕, `admin-canvas` 캔버스 주변 면, `control-white` 입력·도구·속성 면, `admin-ink` 본문, `admin-muted` 보조 문구, `admin-line` 경계로 나눈다. `control-white`는 반복 사용되는 CSS 리터럴이며 다른 항목은 기존 관리자 CSS 변수 이름을 그대로 따른다. 편집기 내부의 `--editor-*` 값은 같은 관리자 색을 사용한다.

성공·주의·오류는 기존 편집기 상태 스타일과 문장, `role="status"` 또는 `role="alert"`를 유지한다. 글자 색상 편집용 팔레트는 홈페이지 콘텐츠 서식이며 관리자 UI 팔레트로 전용하지 않는다.

## Typography

UI 서체 `SMYC Admin`은 프로젝트의 Gothic A1 파일을 불러오는 별칭이다. Regular(400), SemiBold(600), Bold(700–900 선언)와 system-ui/sans-serif fallback을 기존 관리자 스타일에서 공급한다.

작업 공간 제목은 frontmatter의 title 크기이며 캔버스·배치 제목은 (14px), 문서 도구 제목은 (15px), 속성 패널 제목은 (13px)이다. 일반 조작·설명은 (12–14px), 기기·언어 보조 표시와 짧은 안내는 (11px)를 사용한다. 좌표·기기 수치에는 tabular numerals를 유지한다. 홈페이지의 편집 가능한 서체를 관리자 UI에 적용하지 않는다.

## Layout

제목·언어 → 화면·적용 기기 → 문서 명령 → 캔버스·선택 속성 → 저장 상태 순서로 구성한다. 문구·페이지 전체 서식·게시 이력은 기본 캔버스를 밀어내지 않는 접이식 문서 도구에 있다. 간격과 내부 여백은 실제 스타일에 반복되는 (8/12/16/24px)를 따르며 별도 spacing scale을 도입하지 않는다.

| 화면 조건 | 구현된 배치 |
| --- | --- |
| 1100px 초과 | 캔버스와 오른쪽 속성 패널. 속성 폭 (288px), 접으면 (76px), 열 간격 (16px). 속성 패널은 상단 (16px)에 sticky. |
| 1100px 이하 | 캔버스 아래에 전체 폭 속성 패널. 속성 영역 높이는 최대 (50dvh), 내부 스크롤. |
| 767px 이하 | 적용 기기를 native select로 선택. 실행 취소·다시 실행은 이름 있는 아이콘 버튼으로 압축하고, 찾기·보기 옵션은 이름 있는 native disclosure를 유지. 문서 목록과 입력 영역은 한 열. |
| 600px 이하 | 기존 글꼴 편집 창은 하단에 배치하고 최대 높이 (46dvh), 안전 영역과 내부 스크롤을 유지. |

캔버스 스크롤 영역은 최대 `min(70dvh, 760px)`이다. 화면 맞춤은 `clientWidth`를 기준으로 계산하므로 `scrollbar-gutter: stable`을 유지한다. 미지원 브라우저에는 `overflow-y: scroll` fallback을 둔다. 높이 경계에서 스크롤바가 반복 출몰하면 가용 폭과 맞춤 배율이 번갈아 바뀐다.

하단 저장 바는 고정 위치이며 데스크톱에서 관리자 사이드바 이후 영역에 놓인다. 모바일은 상태 문구 아래에 두 열의 작업 버튼을 배치하고 하단 safe-area를 반영한다. 본문의 기존 하단 여백도 함께 유지해 마지막 조작이 저장 바에 가리지 않게 한다.

## Elevation & Depth

기본 작업 면은 그림자 대신 종이·캔버스·흰 면의 차이와 얇은 경계(1px)로 구분한다. 찾기·보기 옵션의 메뉴도 경계로 표현한다. 기존 비모달 글꼴 편집 창의 떠 있는 상태만 기존 그림자(`0 12px 40px rgb(23 23 26 / 15%)`)를 유지한다. 게시 확인은 공통 `AdminModal`의 기존 표현과 동작을 사용한다.

## Shapes

일반 버튼·입력·선택·속성 면은 frontmatter의 formal 모서리를 사용한다. 문서 명령과 캔버스가 맞닿는 경계는 하나의 작업 면처럼 이어진다. 기존 떠 있는 글꼴 편집 창의 모서리(8px)와 색상 견본의 원형은 별도 컴포넌트에 이미 있는 형태다.

## Components

- **문맥 선택:** 화면 선택과 적용 기기를 한 영역에 놓고 현재 언어를 상단 링크와 캔버스 표시에 명시한다. 기기별 배치와 공통 문구 편집의 적용 범위를 안내한다.
- **버튼·입력:** 조작 높이 최소 (44px), 아이콘 전용 조작 폭 최소 (44px)를 유지한다. Carbon 아이콘은 장식용이며 버튼의 텍스트 또는 `aria-label`이 이름을 공급한다. 버건디 포커스선(2px), 비활성 상태, 처리·오류 문장을 유지한다.
- **찾기·보기 옵션:** `details/summary`로 펼친다. 메뉴 안 Escape는 summary로 포커스를 돌리고 일반적인 바깥 포커스 이동은 메뉴를 닫는다. portal 모달이 열리면 트리거를 숨기지 않아 모달 종료 후 포커스가 복원되도록 한다. 모달에서 발생한 Escape를 바깥 disclosure가 가로채지 않는다.
- **캔버스:** 공개본/초안, 화면 편집/둘러보기, 화면 맞춤/실제 크기는 각각 분리된 이름 있는 선택 상태다. 연결·반영 상태와 오류는 캔버스 곁에서 알려준다. 문구 선택 안내와 선택 목록은 접이식 영역에서 접근 가능하다.
- **선택 속성:** 선택 문구 이름, 위치, 크기·줄간격, 글자 정렬, 다른 문구 맞춤을 구분한다. 숫자는 적용 전 입력 상태와 적용 버튼을 유지하며 입력 취소·배치 복구·마침을 제공한다. 기존 글자·글꼴 편집 창과 박스 배치의 책임을 섞지 않는다.
- **접기·펼치기:** 문서 도구, 캔버스, 속성 패널의 시각적 접기는 `hidden`으로 처리해 해당 버퍼와 iframe을 유지한다. 숫자 미적용 입력·글자 편집·IME 조합 중에는 문맥 변경과 관련 접기를 잠근다. 단순 접기를 페이지/기기 변경이나 미리보기 새로고침으로 구현하지 않는다.
- **저장·게시:** 미저장/임시저장 완료/게시 전 변경을 하단 상태 문장으로 구분한다. 임시저장과 게시 버튼은 별도이며 게시 전 저장된 변경을 확인하는 기존 모달을 유지한다. 한글·영어의 독립 세션과 충돌 복구 흐름을 보존한다.

## Do's and Don'ts

- **Do** 기존 관리자 토큰과 CSS 범위를 사용하고 문구 편집 작업 공간의 override를 기준으로 유지한다. 배치 도구 기본 CSS만 보고 현재 속성 패널의 폭·모서리·여백을 판단하지 않는다.
- **Do** 한국어·영어 각각 (390/768/1440px)에서 화면·기기 선택, 문구 선택, 속성 입력·적용·취소, 접기, 문서 도구, 모달 종료 후 포커스 복귀를 확인한다. 가로 overflow와 저장 바에 가리는 조작이 없어야 한다.
- **Do** 캔버스 맞춤을 점검할 때 스크롤바 경계의 폭·높이·배율을 여러 프레임에 걸쳐 확인한다. 2026-10-13의 여섯 언어·기기 조합은 각 (120프레임) 동안 폭·높이 변화와 전환이 없었다. 유지보수 시에도 같은 안정성을 확인한다.
- **Do** 변경 시 `pnpm lint`, `pnpm build`와 관련 편집기 회귀 테스트를 수행한다. 사용자 초안에 임의 저장·게시하지 않고 UI를 검증한다.
- **Don't** 접기 때문에 미적용 입력을 unmount하거나 IME·숫자 입력 잠금을 우회하지 않는다.
- **Don't** 관리자 화면 개선을 public 문구·타이포그래피·사진·Auth/RLS·DB schema 변경으로 확대하지 않는다. 새 디자인 토큰, tonal ramp, 이미지, dependency는 이 기록이 요구하지 않는다.
