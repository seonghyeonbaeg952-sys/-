# 001 — 기록물의 단일 오브젝트 연속성을 만든다

- **Status**: TODO
- **Commit**: dc92eb0
- **Severity**: HIGH
- **Category**: Physicality, cohesion, performance, accessibility
- **Estimated scope**: 3 files, standalone sample only

## Problem

현재 샘플은 장면별 DOM을 통째로 교체하고 복사 영역의 CSS 애니메이션을 강제로 재시작한다. 같은 사진이 촬영·네거티브·인화·보관 단계마다 새 오브젝트처럼 보이므로 사용자가 기록의 변환 과정을 따라가기 어렵다.

```js
// public/archive-exposure-current.html:279 — current
document.querySelectorAll(".archive-exposure__scene").forEach((scene) => {
  scene.setAttribute("aria-hidden", String(!scene.classList.contains(`archive-exposure__scene--${stage.id}`)));
});

copy.style.animation = "none";
void copy.offsetWidth;
copy.style.animation = "";
```

장면 전환도 각각의 장면을 페이드/이동시키는 방식이라 중간에 두 상태가 겹치고, 실제 한 장의 사진이 이동하거나 변형되는 광학적 인과관계가 없다.

```css
/* src/styles/home-archive-exposure.css:241 — current */
.archive-exposure__scene {
  opacity: 0;
  visibility: hidden;
  transform: translateY(14px) scale(0.992);
  transition:
    opacity 360ms ease,
    transform 560ms cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s linear 560ms;
}
```

스캔선과 타임라인 점은 `top`/`left`를 애니메이션해 매 프레임 레이아웃 또는 페인트 비용을 만들 수 있다.

```css
/* src/styles/home-archive-exposure.css:700 — current */
@keyframes archiveScan {
  0% { top: 20%; opacity: 0; }
  100% { top: 76%; opacity: 0; }
}

@keyframes archiveTimelinePoint {
  from { left: 24%; }
  to { left: 76%; }
}
```

## Target

- 같은 사진 DOM 한 개를 `ready → exposure → archive`의 3막 동안 유지하되, exposure 안에서 초점 호흡·노광 확산광·연속 프레임·인화를 끊김 없이 중첩한다.
- 장면 전환은 Anime.js `createTimeline()` 하나로 동기화하고, 복사·주요 기록물·보조 광학 레이어를 명시적 라벨과 콜백으로 제어한다.
- 버튼 피드백은 140ms, 복사 전환은 220–460ms, 오브젝트 이동은 600–900ms, 인화 설명 모션은 1,200–1,800ms를 사용한다.
- 진입은 `cubic-bezier(0.23, 1, 0.32, 1)`, 화면 안 이동은 `cubic-bezier(0.77, 0, 0.175, 1)`, 이탈은 `cubic-bezier(0.4, 0, 1, 1)`을 사용한다.
- 활성 모션은 `transform`과 `opacity` 중심으로 구현한다. 스캔선과 진행점은 `translate3d()`를 사용하고 `top`/`left`를 프레임마다 바꾸지 않는다.
- 동시에 움직이는 주 오브젝트는 화면 요소의 1/3 이하로 유지한다. 보조 프레임 stagger 총예산은 500ms 미만이다.
- `prefers-reduced-motion: reduce`에서는 위치 이동을 생략하고 완성 상태를 200ms opacity 전환으로 보여준다.
- 최종 상태에서 사진·포스터·영상 프레임은 전부 잘리지 않고 `object-fit: contain`으로 보인다.

## Repo conventions to follow

- 색과 활자 토큰은 현행 기록 섹션의 `#fffdf9`, `#fcf7ee`, `#d84b17`, `#f4b89f`, `#3b1733`, `#6e554b`, `AritaBuri`를 유지한다.
- 기록 섹션 이미지는 원본 비율 보존을 우선하며 `object-fit: contain`을 사용한다.
- Anime.js 4.5.0이 이미 설치되어 있으므로 새 의존성을 추가하지 않는다.
- 메인 V4와 모바일/태블릿 기록 섹션은 수정하지 않는다.

## Steps

1. `public/archive-exposure-current.html`의 장면별 중복 사진을 하나의 지속 오브젝트로 재구성한다.
2. `public/archive-exposure-current.css`를 만들어 단독 샘플 전용 레이아웃·광학 레이어·최종 기록 프레임 스타일을 둔다.
3. 설치된 Anime.js ESM 번들을 `public/vendor/anime.esm.min.js`에 복사하고, 하나의 타임라인으로 3막과 세부 모션·접근성 상태를 연결한다.
4. 중복 클릭을 막고 재시작 시 기존 타임라인을 `revert()` 또는 `cancel()`한 뒤 초기 상태를 복원한다.
5. `?autoplay=1`과 `?stage=archive` 검증 모드를 추가해 초기/완료 장면을 자동 캡처할 수 있게 한다.
6. 배경은 별도 장식 도형을 늘리지 않고 저채도 아이보리 확산광·미세 입자·느린 광량 호흡을 두어 주 기록물보다 낮은 속도로 반응하게 한다.

## Boundaries

- Do NOT touch `src/components/home/ArchivePageStack.tsx`.
- Do NOT touch `src/styles/home-archive-exposure.css`.
- Do NOT touch the V4 wave transition or any other homepage section.
- Do NOT add a new production dependency.
- Do NOT crop the source photograph, poster, or video thumbnail.

## Verification

- **Mechanical**: `node --check`로 standalone script 구문 검사, 모든 로컬 asset HTTP 200 확인, `pnpm build` 통과.
- **Feel check**: 데스크톱 1440×900에서 실행하고 확인한다.
  - 처음부터 끝까지 중심 사진이 사라졌다가 새로 나타나지 않고 같은 물체로 이어진다.
  - exposure 막의 보조 프레임은 30–80ms 간격으로 중심에서 바깥쪽 순서로만 나타난다.
  - 인화 베일 뒤로 사진이 온전히 드러나며 버튼이나 문구에 가려지지 않는다.
  - 최종 상태에서 사진·포스터·영상 프레임이 모두 화면 안에 들어온다.
  - 빠른 중복 클릭과 재시작으로 타임라인이 중첩되지 않는다.
  - reduced-motion에서는 이동 없이 최종 기록이 표시된다.
- **Done when**: 초기·중간·최종 캡처의 오브젝트 연속성, 겹침, 잘림, 최종 CTA 접근성이 모두 확인되고 메인 V4 파일 변경이 없다.
