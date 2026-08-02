# Performance carousel research — source set B

- Candidates fetched: 216
- Successful individual pages: 206
- Access-limited/failed: 10

## Domain distribution

- muz.li: 133
- onepagelove.com: 68
- figma.com: 5

## Pattern distribution

- 큐레이션·시각 위계: 147
- 미니멀·에디토리얼 위계: 26
- 모션·상호작용: 18
- 3D·공간 깊이: 10
- 건축 프레이밍·전시: 4
- 캐러셀·갤러리 전환: 1

## Access caveat

Figma Community individual resources may return robots/login restrictions. Those rows remain in the ledger with explicit limitations and do not count as directly inspected successes unless HTTP 200 was returned.

## Most relevant 10

1. [Figma Parallax Scrolling Example](https://www.figma.com/community/file/1337383844852052585/parallax-scrolling-example) — 동일 레이어 이름과 Smart Animate 기반의 짧은 상태 전환에 적합. 실제 스크롤 트리거가 아닌 프로토타입 상태 전환으로 제한한다.
2. [Figma Sites launch](https://www.figma.com/blog/introducing-figma-sites/) — Scroll parallax/transform, hover, pressed 상태를 설계-구현 계약으로 분리하는 근거. 공연 캐러셀은 레이아웃을 흔들지 않고 transform 중심으로 둔다.
3. [Muzli Weekly #443](https://muz.li/blog/weekly-designers-update-443/) — “Add depth and illusion” 사례군. 단일 소실점과 광원 방향을 모든 레이어가 공유해야 한다.
4. [Muzli Weekly #502](https://muz.li/blog/weekly-designers-update-502/) — cinematic scroll과 3D theater world 사례군. 장면 전체 회전 대신 중앙 템플릿의 전진/후퇴로만 공간감을 준다.
5. [Muzli Weekly #499](https://muz.li/blog/weekly-designers-update-499/) — virtual space와 subtle scroll animation 조합. 움직임을 정보 전환에 종속시키고 과도한 장식 모션은 배제한다.
6. [Muzli Weekly #520](https://muz.li/blog/weekly-designers-update-520/) — Hover Exploration 사례. 보조 템플릿 hover는 2–3% scale과 그림자 변화 범위로 제한한다.
7. [Architecture of Socialist-Era Belgrade](https://onepagelove.com/belgrade-architecture) — 건축을 콘텐츠 배경이 아니라 스토리텔링 프레임으로 사용. 원본 개구부 자체를 하나의 연속 구조로 보존한다.
8. [Johny Vino](https://onepagelove.com/johny-vino) — 수평 슬라이더 안에서 프로젝트별 디자인 체계를 유지. 01/02/03은 같은 CMS 템플릿 계약을 공유한다.
9. [Ma / Negative Space](https://onepagelove.com/ma) — 비어 있는 공간이 시각적 리듬과 집중을 만든다는 근거. 양쪽 보조 템플릿 주위의 ‘공기층’을 벽이나 기둥으로 채우지 않는다.
10. [Experience.Lab](https://onepagelove.com/experience-lab) — motion-led 구성과 hover를 정보 탐색에 연결. 중앙 항목과 왼쪽 공연 정보가 항상 같은 상태로 바뀌도록 한다.

## Rebuild implications

- 기준 PNG는 픽셀 정확도를 담당하는 잠금 베이스로 보존한다.
- 레이어 순서는 `rear/recess base → 좌·우 보조 템플릿 → 중앙 템플릿 → front facade mask → controls`로 고정한다.
- 전면 가리개는 별도 기둥처럼 보이면 안 되며, 기준 PNG에서 추출한 같은 픽셀을 마스크로 재사용한다.
- 좌우 템플릿은 전체 면을 유지한 채 마스크 뒤로 이동시키고, destructive crop은 사용하지 않는다.
- 동일한 perspective origin, 동일한 광원 방향, 동일한 접촉 그림자를 사용한다.
