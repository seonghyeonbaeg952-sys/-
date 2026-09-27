# 영어·스크롤바 Figma 승인용 샘플

작성일: 2026-09-18. 아래 제작 기록은 당시의 승인 대기 시안을 설명한다. **2026-09-28 스크롤바 B안은 사용자 승인 후 코드에 적용했으며, 영어 기능은 여전히 승인 대기다. 게시 데이터는 변경하지 않았다.**

## 스크롤바 B 적용 기록 — 2026-09-28

- 사용자 승인: “B안으로 적용해줘”. 홈페이지 우측에만 적용하고 모바일·고대비·CMS 내부 스크롤바는 유지하는 조건이다.
- `src/styles/public-scrollbar.css`: 아이보리 `#fcfaf5`, 웜그레이 `#68665f`, 호버·드래그 `#17171a`. WebKit 계열은 12px 트랙과 8px 유효 손잡이, 표준 CSS 경로는 동일 색상과 OS 기본 너비·형태를 사용한다.
- 1024px 이상 + 마우스 등 정밀 포인터 + 호버 가능 + 고대비 비활성 상태에서만 적용한다. 공개 레이아웃 존재 여부로 범위를 한정하고 CMS 미리보기 배너가 있는 문서는 제외한다.
- 네이티브 스크롤을 그대로 사용한다. 문구·본문 배치·인트로 스크롤 잠금·휠·키보드 동작을 수정하지 않는다. 영어 기능은 이 변경에 포함하지 않는다.
- 새 CSS 계약 테스트를 추가했다. 실제 브라우저 시각·드래그 검증은 사용자의 컴퓨터 유즈 금지에 따라 수행하지 않았다.
- 사용자가 실제 Chrome 캡처에서 미적용을 알려 준 뒤, [Chromium 셀렉터 구현](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/core/css/selector_checker.cc)의 `::-webkit-scrollbar` 상태 한정 규칙 처리 방식을 조사했다. 커스텀 렌더링을 활성화하는 기본 선언을 추가하고 해당 누락을 잡는 회귀 테스트를 추가했다. 수정 후 브라우저 화면 확인 여부는 별도로 보고한다.

## 실제 제작물

전용 페이지: [APPROVAL / English & Scrollbar](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=676-1777)

| 화면 | Figma 프레임 | 범위 |
| --- | --- | --- |
| 홈 | [681:1412](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=681-1412) | 영어 첫 화면, 기존 4행 로고타입과 안내 동선. 기존 갤러리 사진을 사용한 비교용 시안이며 실제 슬라이드 매핑 전 |
| 홈 한국어 비교 | [683:1418](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=683-1418) | 동일 구성의 한국어 비교 상태 |
| 합창단 소개 | [688:1442](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=688-1442) | 소개·창단 이야기, 기존 Figma 구성 기반 영어 변형 |
| 합창단 정신 | [688:1443](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=688-1443) | 음악의 가치·공동체·교육철학, 기존 Figma 구성 기반 영어 변형 |
| 지휘자 | [677:1253](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=677-1253) | 기존 두 사진 구성·프로필의 영어 번역 |
| 반주자 | [695:1444](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=695-1444) | 두 프로필·학력·활동. 승인된 로마자 표기가 없어 인명은 한글 유지 |
| 단원 | [695:1516](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=695-1516) | 현재·이전 단원을 포함한 파트별 아카이브. 기존 이름 비공개 처리 유지 |
| 연혁 | [695:1723](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=695-1723) | 연도 인덱스·펼친 공연 기록. 이전 `To be continued` 마무리는 복제본에서 제거 |
| 공연 | [677:1316](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=677-1316) | 목록·검색·유형·상태·날짜·공통 푸터 |
| 공지 | [677:1514](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=677-1514) | 목록·검색·분류·중요 공지 |
| 갤러리 | [677:1630](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=677-1630) | 사진 목록·분류·사진 확대 문구 |
| 입단 안내 | [677:1762](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=677-1762) | 대상·오디션·연습·FAQ·지원서 진입 |
| 후원·문의 | [677:1918](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=677-1918) | 후원금 안내·문의 입력·후원사 빈 상태·위치 |
| 갤러리 모바일 | [677:2122](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=677-2122) | 390px, 영어 줄바꿈·사진 비율·푸터 |
| 입단 모바일 | [677:2230](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=677-2230) | 390px, 긴 영어 안내·44px 언어 선택 |
| 언어 메뉴 | [680:2605](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=680-2605) | 한국어/English 선택 시각안. 화면별 연결용 복제 메뉴 별도 |
| 스크롤바 A | [680:2616](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=680-2616) | 시스템 기본, 운영체제별 모양 차이 명시 |
| 스크롤바 B | [680:2739](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=680-2739) | 뉴트럴 컬러, 12px 트랙/8px 손잡이 제안 |
| 스크롤 상태 확대 | [685:2776](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5/SMYC?node-id=685-2776) | 기본·호버/드래그·고대비 모드 비교 |

기존 8개 공개 화면 복제에서 고유 한국어 문구 157개, 텍스트 노드 391개를 영어로 바꿨다. 이후 소개·정신·반주자·단원·연혁에 텍스트 노드 200개를 추가로 번역했다. 홈 첫 화면은 별도로 구성했다. 영어 메인 시안은 desktop 12개(홈은 첫 화면), mobile 2개다. 원본 Figma 화면, CMS 메인 시안 648:1688, 홈페이지 코드는 이 작업으로 변경하지 않았다.

## 설계 원칙과 기능 경계

- 기존 사진·배치·색상 토큰·컴포넌트를 재사용한다. 영어 문구 길이 때문에 줄바꿈과 일부 제목 크기를 조정한다.
- 헤더의 `KR / EN`과 모바일 `EN`을 통해 언어 선택을 인지하게 한다. 국기 아이콘으로 언어를 표현하지 않는다.
- 영어 화면 간 주요 메뉴 이동과 메뉴 오버레이 연결은 Figma 프로토타입에 설정했다. 한국어 버튼은 비교할 원본 Figma 시안을 연다. **실제 웹사이트 언어 전환·현재 위치 유지 기능을 구현한 것은 아니다.**
- 영어 번역을 새 CMS 기본값으로 게시하지 않았다. 언어별 임시저장·미리보기·검수·게시 설계가 필요한 상태다.
- 포스터·사진 내부의 한글은 이미지 원본을 유지한다. 영어 설명은 별도 캡션·대체 텍스트로 제공하는 방향이다.
- 영문 이름, 기관/학위 명칭, 모집 조건, 개인정보 동의문은 운영자 최종 검수를 거친다. 원문에 없는 계좌·경력·연락처는 만들지 않는다.
- 고정 연도나 샘플 공연 데이터는 실제 게시 데이터라고 주장하지 않는다. 공연의 `Sample 1–4`는 원본 Figma의 시안 데이터를 명확히 번역한 것이다.
- 스크롤바는 시각 비교만 만든 상태다. JS로 휠 동작을 가로채거나 스크롤 속도를 바꾸지 않는다. 모바일·고대비 모드는 시스템 기본 동작 유지가 전제다.

## 검증과 수정

- Figma 스크린샷으로 홈, 지휘자, 공연, 공지, 입단 desktop, 후원 desktop, 갤러리/입단 mobile, 언어 메뉴, 스크롤바 2안 및 확대 상태를 확인했다.
- 영어 이름 줄바꿈 겹침, `Search` 두 줄 분할, 후원 제목 잘림, 푸터 버튼 글자 길이를 보정했다.
- 홈의 그림자 불투명도와 자동 높이 오류를 발견하고 수정한 뒤 다시 캡처했다.
- 영어 프레임 텍스트의 좌우 및 하단 프레임 경계 초과를 검사했으며 검사 시 0건이었다. 이는 프레임 경계 검사이며 모든 시각적 잘림을 보증하는 것은 아니다.
- 추가 소개·정신·교육철학의 긴 영어 제목과 설명 겹침, 단원 소개 제목의 두 줄 겹침을 스크린샷에서 발견하고 너비·크기·위치를 조정했다. 반주자 인명 및 마스킹된 단원 이름은 임의의 로마자 표기를 만들지 않고 한글로 유지했다.
- Gothic A1·Hahmlet·Cormorant Garamond·Instrument Serif와 원본 컴포넌트의 Noto Sans KR/Inter를 그대로 사용한다. 새 외부 폰트 의존성을 만들지 않았다.
- 프로토타입 연결 속성은 설정·읽기 검증했다. 모든 버튼을 실제 Present 모드에서 클릭한 E2E 검증은 수행하지 않았다.

## 남은 범위

이 결과는 모든 주메뉴와 합창단 세부 소개 화면을 포함한 영어 디자인 검토안이다. 일부는 현재 실제 화면이 아닌 기존 Figma 원본의 구성에 근거하므로 실제 홈페이지와의 1:1 일치를 주장하지 않는다. 홈 하단 전체, 공연·공지 상세, 영상/포스터별 상태, 지원서·후원약정서 전체, 모든 오류/완료 상태의 영어 시안은 아직 이 작업에서 완성하지 않았다. **홈페이지 전체 영문화 완료라고 보고하지 않는다.**

영어 기능은 승인 전 홈페이지에 적용하지 않는다. 스크롤바는 위 적용 기록의 B안 승인 범위만 구현했다.
