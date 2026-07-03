# Home V6 Video Failure Analysis

## 영상에서 확인한 문제

- 합창단 정신 영역에 남색 책등처럼 보이는 중앙 오브젝트가 남아 콘텐츠를 가렸다.
- 공연 섹션이 프로그램 템플릿이 아니라 여러 카드가 좁은 칼럼 안에서 찌그러진 형태로 보였다.
- 첫 주요 정보 카드의 문구가 일부 잘리는 상태가 있었다.
- 왼쪽 진행표에 실제 홈 흐름과 맞지 않는 `동행` 라벨이 있어 중간 상태가 건너뛰는 것처럼 보였다.

## 수정 방향

- `HomeSpiritScoreBook`에서 `spirit-scorebook-spine` DOM을 제거했다.
- `ConcertTemplatePanel`은 전체 폭을 쓰는 3분할 프로그램 템플릿으로 보정했다.
- 열린 공연 패널에서 커버가 텍스트를 가리지 않도록 커버 잔여 폭을 2%로 축소했다.
- `home-v6-fixes.css`를 `globals.css` 뒤에 로드해 레거시 grid/flex 규칙 충돌을 안정적으로 덮었다.
- 진행표에서 `동행` 라벨을 제거했다.

## MotionLab 기준

- 중앙 책등이 보이면 실패.
- 공연 패널 내부 leaf가 100px 이하로 찌그러지면 실패.
- 모바일에서 가로 overflow가 생기면 실패.
- hover/click/focus 중 하나로 공연 패널이 열리지 않으면 실패.

## QA 결과

- 1440px desktop: 공연 패널 전체 폭 1166px, 내부 leaf 407/440/318px 수준으로 정상화.
- 열린 공연 패널: 커버 clip-path `inset(0 98% 0 0 round 28px)`, 텍스트 겹침 없음.
- 390px mobile: horizontal overflow 0.
- `pnpm lint` 통과.
- `pnpm build` 통과.

