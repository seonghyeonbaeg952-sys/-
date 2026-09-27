# 피그마 영문·반응형 샘플 페이지

작성일: 2026-09-27

## 2026-09-28 사용자 승인 후 원래 디자인 복원

- 위 자동 정렬 구조 수정은 사용자 요청에 따라 되돌렸습니다. 현재 상태는 이 복원 기록을 기준으로 합니다.
- 원래 첫 줄 행 높이 57.60009px, 제목 높이 119.60010px, 제목–본문 간격 17.2px, 네 단계의 144×22.5px 배치 틀과 수동 배치 방식을 복원했습니다.
- 첫 제목 줄과 긴 세 번째 영문 단계명 두 곳의 가로 위치만 최소 보정했습니다. 나머지 단계의 원래 3.60156px 위치 효과도 유지했습니다.
- 원래 수정 전 캡처와 복원본 1536×972 PNG를 비교했습니다. 두 텍스트 가로 보정 영역 밖의 픽셀 차이 0, 최대 채널 차이 0입니다. 글자·폰트·굵기·색·이미지·장식·버튼은 바꾸지 않았습니다.
- 공통 컴포넌트 112개 노드의 콘텐츠·시각 스타일 변화 0건, 기존 영문 시안/새 샘플 두 곳의 복원 좌표 검사 통과. 새 구성요소 생성 0개입니다.
- 보존한 원래 줄 간격 때문에 제목 텍스트 상자 일부는 겹칩니다. 원래 해상도 PNG에서는 실제 글자 충돌·잘림이 없음을 확인했습니다. 상자 겹침 0건이라고 주장하지 않습니다.
- 이번 복원은 PC 홈 입단 영역만 해당합니다. 태블릿·모바일은 변경하지 않았고 이번 턴에서 새로 렌더링하지 않았습니다. 홈페이지 코드·CMS·배포도 변경하지 않았습니다.
- [복원된 Figma 샘플](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1087-1984) · [복원 검증 기록](2026-09-28-join-design-restoration-proof.json)


## 2026-09-28 정렬 수정 — 이전 검증의 한계

- 이전의 차이 0건은 원본과 복제본이 같다는 검사였으며, 영문 타이포그래피가 올바르다는 검증은 아니었습니다. 홈 입단 첫 줄의 수동 위치 오류를 놓쳤습니다.
- 영문 입단 공통 컴포넌트 842:9170을 수정해 기존 승인 시안 842:9276과 새 샘플 1087:1984에 함께 반영했습니다. 한글 페이지·홈페이지 코드·CMS는 변경하지 않았습니다.
- 첫 줄의 중앙 오차 187.59375px를 0px로, 긴 세 번째 단계명의 중앙 오차 39.10235px를 0.001px 미만으로 수정했습니다. 문구·Hahmlet 굵기는 유지했습니다.
- 최종 데스크톱 표시 텍스트 32개에서 겹침·누락 폰트 0건, 제목과 본문 간격 12.8px입니다. 768px/390px 입단 영역도 원래 해상도로 렌더링해 확인했습니다. 172개 시안 전체의 새 타이포그래피 검증을 의미하지 않습니다.
- [수정한 입단 샘플](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1087-1984) · [상세 검증 기록](2026-09-28-join-alignment-proof.json)


[샘플 찾아보기](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1093-8658) · [홈 PC](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1087-1981) · [문구 정리본](2026-09-27-copybook.md) · [검증 기록 JSON](2026-09-27-sample-page-proof.json)

## 변경한 내용

- 같은 파일에 새 페이지 **샘플 / 영문·반응형 / 2026-09-27** (1086:7082)를 만들었습니다.
- 기존 영문 화면 161개, 한글 팝업 새 디자인 5개, 한글 Home/Spirit 비교 초안 6개를 재사용해 총 172개 시안을 모았습니다. 이번에 172가지 UI를 새로 디자인했다는 뜻은 아닙니다.
- 51개 페이지·상태 묶음을 만들고, 데스크톱·태블릿·모바일을 원래 폭으로 배치했습니다. 1536/768/390을 기본으로 하되 원본에 다른 폭이 있는 뷰어/탭은 그 크기도 보존했습니다.
- 사진·배경·장식·푸터와 기존 구성요소 연결을 유지했습니다. 텍스트만 남긴 문구판으로 바꾸지 않았습니다.
- 홈페이지 코드, CMS 문구/게시, 배포, 원래 Figma 영문/한글 시안 페이지는 의도적으로 수정하지 않았습니다. 글꼴 로딩에 따른 기존 HUG 영역의 자동 측정값 갱신은 문구/디자인 편집으로 취급하지 않습니다.

## UX 개선점

- 샘플 찾아보기의 51개 링크로 각 페이지와 상태 묶음을 찾을 수 있습니다.
- 지원서·문의·후원 약정의 작성/검토/완료/오류는 실제 페이지 맥락이 유지된 예시입니다. 예시 신청자와 후원자 값은 실제 접수 데이터가 아닙니다.
- 한글 팝업 디자인과 영문 샘플을 구분했고, 한글 비교 초안은 현재 게시 화면과 같은 승인 상태로 표시하지 않았습니다.
- 기존 auto-layout와 글꼴, 색상·간격 토큰을 재사용했습니다. 운영 화면에 새로운 UI나 디자인 토큰을 추가한 작업이 아닙니다.

## 검증한 내용

- 172개 시안의 원본/새 화면 전체 트리를 대조했습니다. 숨긴 상태가 포함된 26,810개 노드, 표시 상태 TEXT 10,806개, IMAGE 채움 226개입니다. IMAGE 수에는 숨겨진 상태의 채움도 포함되므로 서로 다른 사진 226장을 뜻하지 않습니다.
- 글자·폰트·이미지 채움·노드 구조·좌표/크기 대조에서 감지된 차이 0건. 좌표 비교 허용 오차는 0.02px입니다.
- 누락 폰트 0건, 섹션끼리 겹침 0건, 묶음 래퍼가 섹션을 넘어가는 경우 0건. 목차 링크 51개를 기록했습니다.
- 처음에는 숨긴 인스턴스 자식이 제외되거나 글꼴 자동 너비가 갱신되기 전후를 비교해 차이로 잡혔습니다. 전체 인스턴스 자식을 읽고 글꼴을 먼저 로드한 후 대조하여 실제 차이가 없는 것을 확인했습니다. 임의의 아이콘/텍스트 좌표 수정은 하지 않았습니다.
- Home/Spirit 3개 기기 각 화면, 모바일 입단 검토, 모바일 후원 오류, 모바일 팝업, 목차 등 10개를 PNG로 렌더링·다운로드했습니다. 긴 페이지는 잘라 조합해 상단부터 푸터까지 검토했습니다.
- 이전 로컬 참조 PNG 6개와는 크기가 같지만 픽셀 단위로 완전히 같지는 않습니다: 달라진 픽셀 0.056–2.518%, 최대 RGBA 채널 차이 30. 이를 무시하고 “픽셀 완전 동일”이라고 주장하지 않습니다. 현재 원본 구조/폰트/이미지 대조 결과와 시각 검토를 함께 사용했습니다.
- Figma-only 작업이므로 pnpm lint/build, 브라우저/E2E, 실제 폼 제출·재생·결제 검증은 하지 않았습니다. 목차의 URL 값은 검사했지만 실제 링크 클릭 흐름을 테스트한 것은 아닙니다.
- PNG는 로컬 임시 폴더에 있으며, 실제 시안과 영구 참조는 Figma에 있습니다.

## 조사한 내용

- 기존 Figma 화면의 구성요소 61개 및 기존 SMYC Color/Dimensions 변수·텍스트 스타일을 확인했습니다. Code Connect 매핑 파일은 발견되지 않았습니다.
- React/Vite 라우팅·샘플 화면과 기존 홈페이지 폰트 규칙을 읽었지만 수정하지 않았습니다.
- Figma 화면 생성 지침에 따라 기존 화면/구성요소를 재사용했습니다. 최초 웹 캡처가 아니라 기존 Figma 화면을 정리한 작업이라 새 브라우저 캡처나 컴퓨터 유즈는 하지 않았습니다.
- Figma Plugin API 타입과 글꼴/레이아웃 지침을 확인했습니다. 추가 인터넷 조사는 하지 않았습니다.

## 남은 리스크

- Spirit v8 및 한글 비교용 v8은 미게시/참고 초안입니다. 한글 Home 비교본을 현재 게시된 Home의 새 캡처로 해석하면 안 됩니다.
- 공연 포스터 원본 미확보 6개, 정지 썸네일 영상, 시안의 일정·갤러리 자료·인명/학력 영문 승인 대기는 기존 한계로 남습니다.
- 정적 Figma 샘플입니다. 실제 사이트의 모든 스크롤 모션·폼 동작·플레이어 로딩 상태를 검증한 라이브 영문 홈페이지가 아닙니다.
- 새 샘플에는 기존 컴포넌트 인스턴스 연결이 남아 있으므로 원본 컴포넌트가 나중에 바뀌면 시안에도 영향이 있을 수 있습니다.

## 화면 묶음 색인

| 번호 | 묶음 | 시안 수 | 바로가기 |
| --- | --- | --- | --- |
| 1 | 홈 — 전체 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7086) |
| 2 | Spirit — 전체 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7089) |
| 3 | 소개 — 개요 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7092) |
| 4 | 소개 — 지휘자 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7095) |
| 5 | 소개 — 반주자 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7098) |
| 6 | 소개 — 단원 기록 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7101) |
| 7 | 소개 — 연혁 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7104) |
| 8 | 입단 안내 — 기본 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7107) |
| 9 | 입단 지원서 — 작성 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7110) |
| 10 | 입단 지원서 — 검토 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7113) |
| 11 | 입단 지원서 — 접수 완료 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7116) |
| 12 | 입단 지원서 — 모집 마감 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7119) |
| 13 | 입단 지원서 — 이전 요청 결과 확인 오류 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7122) |
| 14 | 공연 — 목록 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7125) |
| 15 | 공지 — 목록 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7128) |
| 16 | 공지 — 상세 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7131) |
| 17 | 공지 — 분류 선택 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7134) |
| 18 | 공지 — 검색 결과 없음 | 2 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7137) |
| 19 | 갤러리 — 사진 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7140) |
| 20 | 갤러리 — 영상 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7143) |
| 21 | 갤러리 — 포스터 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7146) |
| 22 | 공연 — 포스터 없는 상세 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7149) |
| 23 | 공연 — 포스터 상세 / 원본 미확보 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7152) |
| 24 | 공연 — 포스터 뷰어 / 원본 미확보 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7155) |
| 25 | 갤러리 — 사진 뷰어 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7158) |
| 26 | 갤러리 — 영상 뷰어 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7161) |
| 27 | 후원·문의 — 기본 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7164) |
| 28 | 후원·문의 — 공연 의뢰 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7167) |
| 29 | 후원·문의 — 일반 문의 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7170) |
| 30 | 후원·문의 — 후원사 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7173) |
| 31 | 후원·문의 — 오시는 길 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7176) |
| 32 | 문의 — 접수 완료 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7179) |
| 33 | 문의 — 접수 결과 확인 오류 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7182) |
| 34 | 후원 약정 — 개인 작성 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7185) |
| 35 | 후원 약정 — 단체 작성 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7188) |
| 36 | 후원 약정 — 개인 검토 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7191) |
| 37 | 후원 약정 — 단체 검토 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7194) |
| 38 | 후원 약정 — 접수 완료 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7197) |
| 39 | 후원 약정 — 제출 오류 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7200) |
| 40 | 입단 안내 — 입단 문의 FAQ 펼침 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7203) |
| 41 | 입단 안내 — 연습 시간 FAQ 펼침 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7206) |
| 42 | 공통 — 펼친 메뉴 | 2 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7209) |
| 43 | 공통 — 404 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7212) |
| 44 | 홈 — 정신 탭 5개 | 5 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7215) |
| 45 | Spirit — 태도 탭 4개 | 12 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7219) |
| 46 | Spirit — 성장 탭 5개 | 15 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7225) |
| 47 | 홈 — 프로그램 노트 펼침 | 1 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7232) |
| 48 | 팝업 새 디자인 — 한글 유지 | 5 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7235) |
| 49 | 홈 — 히어로 단독 시안 | 1 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7239) |
| 50 | 한글 참고 — 홈 v8 초안 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7242) |
| 51 | 한글 참고 — Spirit v8 초안 | 3 | [Figma](https://www.figma.com/design/nz8fKU1RqfasYhsIQEIVF5?node-id=1086-7245) |
