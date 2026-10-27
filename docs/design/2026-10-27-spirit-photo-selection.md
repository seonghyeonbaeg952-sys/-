# 합창단 정신 사진 선정 — 2026-10-27

사용자가 제공한 2025 유스비전투어 사진 중 지원되는 단체 사진 612장을 10개 contact sheet로 검토하고, 아래 세 원본을 개별로 열어 확인했다. 장소나 공연의 명칭은 사진만으로 추정하지 않았다.

| 원본 파일 (`5. 준식카메라/단체사진/` 기준) | 배치 | 사진에서 확인한 근거 | 웹 배포 파일 |
| --- | --- | --- | --- |
| `DSC_1169.JPG` | 첫 화면 | 연주복을 입은 단원들이 악보와 지휘에 집중하는 모습으로 음악에 대한 태도를 보여준다. | `choir-performance.webp`, 1800×1200, 182,830 bytes |
| `DSC_2318.JPG` | 이어 온 정신 | 나란히 앉아 악보를 보는 연습 장면으로 함께 배우는 과정을 보여준다. | `choir-rehearsal.webp`, 1400×933, 114,094 bytes |
| `DSC_1892.JPG` | 함께 부르는 공동체 | 야외에서 같은 파란 옷을 입고 악보를 보며 함께 노래하는 단체 장면이다. | `singing-together.webp`, 2200×1467, 340,686 bytes |

원본은 모두 6000×4000이며 수정하지 않았다. 비율을 보존해 WebP 파생본만 만들고 EXIF를 제거했다. 색 보정이나 생성 이미지 합성은 하지 않았다. 파생본 합계는 637,610 bytes이다.

CMS의 기존 사진 교체·초점 설정을 우선한다. 첫 화면에는 별도 `spirit-tour-performance` 슬롯을 사용해 홈·브로슈어 공유 사진에 영향을 주지 않는다. 연습·공동체 슬롯은 이전 소스 별칭도 유지한다. 단원 명단은 사진 중심 소개로 바꾸지 않았다.

## 최종 범위

합창단 정신은 첫 화면, 이어 온 정신, 함께 부르는 공동체, 참여 안내의 네 구간만 남긴다. 첫 화면은 단색 파랑, 공동체는 흰색, 참여 안내는 옅은 파랑으로 정리했다. 기존 CMS 문구와 유지 구간의 모션은 보존한다. 제거된 구간의 저장 데이터는 삭제하지 않으며 이전 앵커는 가장 가까운 유지 구간으로 연결한다.

## 검증 근거

- [MDN object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit), [object-position](https://developer.mozilla.org/en-US/docs/Web/CSS/object-position): 사진 상자의 채움과 크롭 기준.
- [MDN clamp](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp): 홈 히어로·퀵메뉴 크기의 화면 비율 대응.
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions): 기존 권한과 명시적인 공개 필드만 유지한 단원 RPC 확장.
- Impeccable 탐지기의 두 경고는 수정 전부터 있던 브로슈어·사진 캡션의 한쪽 테두리이다. 이번 사용자 요청과 무관한 기존 장식을 자동 변경하지 않았다.
