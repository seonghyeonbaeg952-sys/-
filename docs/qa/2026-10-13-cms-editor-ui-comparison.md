# 홈페이지 문구 편집 UI · 40개 사례 비교

확인일: 2026-10-13. 대상은 **홈페이지 문구 편집기**이며 다른 CMS CRUD 화면이나 방문자 홈페이지의 전면 리디자인이 아니다.

## 조사 범위와 한계

아래 40개는 공식 에디터 데모·제품 문서·UI 컴포넌트·Figma 키트를 합친 비교 목록이다. **40개의 Figma 파일을 다운로드했다거나 모든 제품에 로그인하여 조작했다는 뜻이 아니다.** 공식 페이지에서 확인 가능한 편집 구조와 상태 설명을 비교했다. 실제 우리 CMS의 선택·입력·배치·저장 흐름은 별도 브라우저 검수 대상이다.

Figma Carbon 커뮤니티 리소스는 로그인된 브라우저에서 직접 열어 제작자 IBM/Lauren Rice와 CC BY 4.0 표기를 확인했다. 연결된 사용자 라이브러리의 에디터 컴포넌트 검색은 결과가 없었다. 상업용 키트의 유료 컴포넌트를 무단 복제하지 않는다. 코드에 직접 사용하는 아이콘은 같은 Carbon 공식 `@carbon/icons` 11.90.0의 Apache-2.0 SVG 4개이며, 라이선스를 함께 보관한다.

평가축: **A** 작업 화면/속성 분리, **B** 툴바 밀도와 명령 그룹, **C** 선택·저장·게시 상태, **D** 작은 화면과 키보드, **E** 기존 편집 엔진에 적용 비용. '판단'은 이 프로젝트에 대한 적용 판단이며 각 제품의 전체 품질 점수가 아니다.

## Figma 에셋/디자인 시스템 5개

| # | 공식 출처 | 관찰 기준 | 이번 CMS에 대한 판단 |
|---|---|---|---|
| 1 | [Carbon Figma v11](https://www.carbondesignsystem.com/getting-started/designing/design-resources) / [Community](https://www.figma.com/community/file/1157761560874207208) | 코드와 연결된 입력·버튼·색·아이콘 라이브러리. | A/B/E: 단정한 컨트롤 그룹과 공식 아이콘 채택. Carbon 프레임워크 전체는 도입하지 않음. |
| 2 | [Frames X WYSIWYG](https://framesxdesign.com/figma-components/wysiwyg-interface) | 편집 도구, 콘텐츠 영역, 하단 컨트롤을 분리한 반응형 에디터 컴포넌트. | B/C/D: 기능별 구획과 점진적 공개 참고. 유료 키트 코드는 복제하지 않음. |
| 3 | [Fluent 2 Figma kits](https://fluent2.microsoft.design/get-started/design) | 코드 대응 속성·변수·계층이 있는 UI 키트. | A/E: 작은 속성 패널과 일관된 입력 단위 참고. 기존 Motet 색/서체 유지. |
| 4 | [Ant Design resources](https://ant.design/docs/resources/) | 생산성 UI의 디자인 리소스 및 도구 목록. | B/E: 폼 밀도·명확한 라벨을 참고하되 디자인 시스템 교체는 제외. |
| 5 | [NSW Figma UI Kit](https://designsystem.nsw.gov.au/get-started/figma-ui-kit.html) | 키트와 사용/동작 가이드를 함께 쓰도록 권고. | D/E: 시각 에셋만 이식하지 않고 실제 키보드·오류·터치 동작을 유지. |

## 텍스트/문서 에디터 15개

| # | 공식 출처 | 관찰 기준 | 이번 CMS에 대한 판단 |
|---|---|---|---|
| 6 | [Tiptap Simple Editor](https://tiptap.dev/docs/ui-components/templates/simple-editor) | 반응형 툴바, 서식 그룹, undo/redo, 찾기/바꾸기. | B/D/E: 짧은 명령 그룹 채택. 기존 글자 범위/기기별 저장 엔진은 교체하지 않음. |
| 7 | [CKEditor 5 demos](https://ckeditor.com/ckeditor-5/demo/) | 여러 편집 UI 및 모바일·협업·이력 구성. | B/C: 편집과 게시 이력은 분리. 고급 도구를 모두 상시 노출하지 않음. |
| 8 | [Quill Snow](https://quilljs.com/docs/quickstart) | 고정 툴바와 본문 영역을 가진 기본 rich-text 에디터. | B/E: 서식 도구의 경계가 선명함. 엔진 추가보다 기존 컨트롤 정리가 적합. |
| 9 | [Lexical](https://lexical.dev/) | 최소 코어와 플러그인, block/editor/rich-input 사례. | C/E: UI와 편집 데이터 상태를 분리. UI 장식 때문에 데이터 모델을 바꾸지 않음. |
| 10 | [Editor.js](https://editorjs.io/) | Toolbox와 Inline Toolbar가 구분된 block 에디터. | A/B: 상자 배치와 선택 글자 서식을 구분. 블록 전체와 글자 범위를 혼동하지 않게 함. |
| 11 | [Milkdown](https://milkdown.dev/) | Markdown 기반, headless/플러그인형 편집. | E: 조합 가능성이 높지만 이번 CMS 문구 데이터 형식과 달라 교체 제외. |
| 12 | [BlockNote](https://www.blocknotejs.org/) | block 기반 React rich-text 편집 제품. | A/B: 상황에 맞는 편집 도구 참고. 홈페이지 고정 문구에는 새 block 모델 불필요. |
| 13 | [TOAST UI Editor](https://ui.toast.com/tui-editor/) | Markdown/WYSIWYG 전환과 live preview/scroll sync. | A/C: 원문과 실제 화면의 관계가 분명함. 홈페이지 단일 미리보기를 우선. |
| 14 | [Mantine RichTextEditor](https://mantine.dev/x/tiptap/) | ControlsGroup, sticky toolbar, subtle 컨트롤 변형. | B/D: 낮은 시각적 무게와 그룹 간격 참고. 기존 44px 목표 유지. |
| 15 | [KendoReact Editor](https://www.telerik.com/kendo-react-ui/components/editor) | React rich-text 에디터와 구성 가능한 도구. | B/E: 필수 명령만 노출. 유료 에디터 런타임 도입 제외. |
| 16 | [DevExtreme HTML Editor](https://js.devexpress.com/React/Demos/WidgetsGallery/Demo/HtmlEditor/Overview/MaterialBlueLight/) | rich-text 편집용 HTML Editor 데모. | B/E: 컨트롤이 많은 예시와 비교; 우리 CMS에 불필요한 명령은 늘리지 않음. |
| 17 | [Summernote](https://summernote.org/) | 기본 WYSIWYG 편집 UI와 커스터마이징 예제. | B/E: 작은 기본 도구 모음 참고. jQuery/기존 엔진 교체 비용 때문에 제외. |
| 18 | [WordPress Block Editor](https://wordpress.org/documentation/article/wordpress-block-editor/) | 상단 툴바, 설정 사이드바, 콘텐츠 영역. 저장과 게시 구분. | A/C: 이번 구조의 주요 참고. 선택 속성 오른쪽, 게시 상태 별도 유지. |
| 19 | [Notion editing basics](https://www.notion.com/help/writing-and-editing-basics) | block 조작, 선택 시 서식, 모바일 키보드 위 도구. | B/D: 문맥 도구와 점진적 공개 참고. hover 전용 조작만 제공하지 않음. |
| 20 | [Froala](https://froala.com/) | 커스터마이징 가능한 WYSIWYG 제품/데모. | B/E: 일관된 툴바 참고. 상업 에디터 설치 없이 현재 엔진을 유지. |

## 시각 편집기/CMS 15개

| # | 공식 출처 | 관찰 기준 | 이번 CMS에 대한 판단 |
|---|---|---|---|
| 21 | [Puck](https://puckeditor.com/) | React에 삽입하는 모듈형 시각 편집기. | A/E: 기존 React 컴포넌트를 편집 대상으로 유지. 별도 페이지 빌더 도입 제외. |
| 22 | [GrapesJS](https://grapesjs.com/) | 페이지·문서에 삽입 가능한 Visual Editor/Studio SDK. | A/E: 캔버스와 속성 편집을 비교. 홈페이지 구조를 바꾸는 새 빌더는 제외. |
| 23 | [Builder Visual Editor](https://www.builder.io/c/docs/visual-editor) | 실제 페이지를 시각적으로 편집하는 작업 공간. | A/C: 미리보기가 작업의 중심이어야 함. 콘텐츠 저장 시스템은 교체하지 않음. |
| 24 | [Sanity Visual Editing](https://www.sanity.io/docs/visual-editing/introduction-to-visual-editing) | 렌더링된 페이지와 원본 콘텐츠 편집을 연결. | A/C: 화면 문구 선택과 정확한 CMS 키 연결을 우선. |
| 25 | [Storyblok Visual Editor](https://www.storyblok.com/docs/concepts/visual-editor) | 실시간 미리보기와 콘텐츠 편집. | A/C: 원문·초안·공개본 상태가 다른 것을 명시. |
| 26 | [Strapi Content Manager](https://docs.strapi.io/cms/features/content-manager) | 콘텐츠 관리 및 Draft & Publish 관련 편집 흐름. | C/E: 저장과 공개를 분리하고 게시 전 변경 내용을 확인. |
| 27 | [Payload Admin Panel](https://payloadcms.com/docs/admin/overview) | 접을 수 있는 사이드바, 초안 미리보기, 버전 비교, 컴포넌트 교체. | A/C/E: 기존 관리자/공개 레이아웃 경계 유지. 전체 CMS 교체 제외. |
| 28 | [Directus Live Preview](https://directus.com/docs/guides/content/live-preview) | 게시 전 변경을 실시간으로 확인하는 미리보기. | A/C: 초안 확인을 우선하고 '저장=게시'로 오해하지 않게 함. |
| 29 | [Tina contextual editing](https://tina.io/docs/contextual-editing/overview) | 페이지 문맥 안에서 콘텐츠를 편집하는 안내. | A/E: 우리 CMS의 화면 선택과 원문 목록을 모두 유지. |
| 30 | [Decap editorial workflows](https://decapcms.org/docs/editorial-workflows/) | Draft·검토·게시 단계의 명시적인 상태. | C: 단순한 두 단계(임시저장/게시)는 유지하고 실패·충돌·입력 중 상태를 구분. |
| 31 | [Contentful Studio](https://www.contentful.com/products/studio/) | 브랜드 콘텐츠를 시각적으로 조합하는 편집 제품. | A/E: 브랜드와 편집 컨트롤을 구분. 상업 제품의 UI/엔진 복제 제외. |
| 32 | [Penpot user guide](https://help.penpot.app/user-guide/) | 레이어·레이아웃·컴포넌트·변형을 분리한 디자인 도구 안내. | A/B: 선택된 대상의 속성을 구획. 홈페이지 CMS에 디자인 도구 전체 기능을 넣지 않음. |
| 33 | [Webflow Design](https://webflow.com/feature/design) | 시각적 사이트 디자인 도구. | A/E: 문맥 선택과 속성 편집을 비교하되 공개 페이지 구조 변경 도구는 제외. |
| 34 | [Framer CMS](https://www.framer.com/cms/) | 사이트 콘텐츠 관리와 시각적 디자인의 연결. | C/E: 콘텐츠 원본의 기존 CRUD와 화면 문구 편집을 섞지 않음. |
| 35 | [Wix Studio](https://www.wix.com/studio) | 반응형 디자인을 다루는 웹사이트 작업 공간. | D/E: 기기 선택은 한 곳에서 처리. 기기별 편집값을 임의로 통합하지 않음. |

## 툴바/문맥 편집 5개

| # | 공식 출처 | 관찰 기준 | 이번 CMS에 대한 판단 |
|---|---|---|---|
| 36 | [Confluence toolbar](https://support.atlassian.com/confluence-cloud/docs/how-to-use-the-new-toolbar-and-insert-elements/) | 본문에 요소를 넣는 툴바와 명령 구성. | B: 사용 빈도가 다른 명령을 모두 같은 무게로 노출하지 않음. |
| 37 | [GitBook Editor](https://www.gitbook.com/features/editor) | 문서 작성과 콘텐츠 구조 편집 제품. | B/E: 문서 편집의 단순함을 참고. 홈페이지 고정 문구에 문서 트리를 추가하지 않음. |
| 38 | [Radix Toolbar](https://www.radix-ui.com/primitives/docs/components/toolbar) | 키보드 접근 가능한 버튼·토글·분리된 그룹 primitive. | B/D: 이름과 포커스 표시를 유지. CSS 정리를 위해 새 컴포넌트 dependency를 추가하지 않음. |
| 39 | [React Aria Toolbar](https://react-spectrum.adobe.com/react-aria/Toolbar.html) | 접근 가능한 도구 그룹의 명령/탐색 패턴. | B/D: 아이콘만으로 바꾸지 않고 라벨과 aria 이름 유지. |
| 40 | [Plate](https://platejs.org/) | 실제 홈페이지에서 Preview/Code, Desktop/Tablet/Mobile, Refresh Preview 컨트롤 확인. | A/D/E: 미리보기 관련 컨트롤의 일관된 그룹 참고. Slate 기반 엔진 교체 제외. |

## 채택한 구성 / 제외한 구성

- 채택: 미리보기 중심, 오른쪽 선택 속성, 단일 기기 선택, 짧은 작업 툴바, 문구 목록/페이지 전체 서식/게시 이력의 점진적 공개, undo/redo의 상시 접근, 저장과 게시 분리.
- 제외: 새 rich-text 엔진, CMS 전체 리디자인, 유료 키트 무단 이식, 아이콘만 있는 모호한 명령, 방문자용 장식/애니메이션을 관리자에 적용.
- 에셋: Carbon 공식 SVG 4개(undo, redo, renew, search)만 로컬 번들에 사용. Figma 리소스는 비교 기준이며 '40개 Figma 에셋을 다운로드·이식'한 것이 아니다.
- 실제 브라우저 자료: 기존 CMS/변경 CMS, Carbon Community, Tiptap demo, Plate 홈페이지. 나머지 자료는 공식 문서·제품 페이지 기반 구조 비교이며 모든 UI의 상호작용 검사를 했다는 의미가 아니다.

## 기능 동시성 기준

| 조합 | 허용 여부 | 이유/처리 |
|---|---|---|
| 문구 입력 + 선택 글자 서식 | 허용(IME 조합 중 제외) | 같은 편집 버퍼에 적용하고 편집 완료 때 하나의 문서 변경으로 반영. |
| 미리보기 스크롤 + 문구 선택 | 허용 | 저장 데이터와 다른 화면 탐색 상태. |
| 문구 편집 중 + 기기/언어/원본 변경·새로고침 | 차단 | 승인되지 않은 입력 버퍼와 편집 키가 바뀌지 않게 함. |
| 문구 편집 중 + 임시저장/게시/초기화 | 차단 | 버튼뿐 아니라 실행 핸들러와 열린 확인창에서도 재검사. |
| 위치·너비·줄간격 숫자 입력 중 + 다른 상자/기준 정렬 | 적용 또는 취소 후 허용 | 아직 반영하지 않은 숫자를 잃지 않게 함. |
| 저장 + 게시/복구/다른 저장 | 차단 | 기존 busyRef와 버전 비교(CAS)를 유지. 중복 쓰기/충돌 방지. |
| 초기화 + 실행 취소 | 허용 | 문구·기기별 서식·줄간격·배치를 같은 이력 트랜잭션으로 복구. |
| 한국어 저장 + 영어 공개본 변경 | 불허 | 기존 분리된 language workspace/storage 및 권한 경계 유지. |

검수 결과와 한계는 별도 실행 기록으로 남긴다. 문서 조사만으로 '사용성 검증 완료'를 주장하지 않는다.
