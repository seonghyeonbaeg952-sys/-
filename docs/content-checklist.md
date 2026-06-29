# 서울모테트청소년합창단 배포 전 콘텐츠 체크리스트

이 문서는 Vercel 배포 전 관리자 CMS와 Supabase Storage에 실제 콘텐츠를 채운 뒤 확인해야 할 항목을 정리한다. 실제 계정, 비밀번호, Supabase key, Figma token, API key는 이 문서에 기록하지 않는다.

## 1. 필요한 사진 목록

- Home Hero 사진 최소 3장
- 합창단 단체 사진 1장
- 지휘자 사진 1장
- 반주자 사진 1장
- 공연 포스터 최소 3장
- 갤러리 사진 최소 6장
- 포스터 아카이브 이미지
- 필요 시 연혁 관련 사진

## 2. 권장 이미지 비율

- Hero: 16:9 또는 21:9
- 공연 포스터: 3:4 또는 A 포스터 비율
- 갤러리: 자유 비율 가능, 단 그리드에서 주요 피사체가 잘리지 않아야 함
- 프로필: 1:1 또는 4:5
- 로고: 투명 PNG 또는 SVG 권장

## 3. 권장 이미지 크기

- Hero: 가로 1920px 이상, 3MB 이하 권장
- 단체 사진: 가로 1600px 이상
- 프로필: 가로 800px 이상
- 공연 포스터: 세로 1600px 이상
- 갤러리: 긴 변 1600px 이상
- 로고: 표시 크기의 2배 이상 해상도

## 4. CMS 업로드 위치

- Home Hero: 관리자 CMS의 `홈 슬라이드 관리`(`/admin/hero-slides`)
- 합창단 단체 사진: 갤러리 또는 소개 섹션 보조 이미지
- 지휘자 사진: 지휘자 관리
- 반주자 사진: 반주자 관리
- 공연 포스터: 공연 관리 또는 포스터 관리
- 갤러리 사진: 갤러리 관리
- 영상 썸네일/링크: 영상 관리
- 연혁 관련 사진: 연혁 관리

## 5. 단원 사진/이름 공개 주의사항

- 단원은 청소년이므로 공개 전 보호자 동의 여부를 확인한다.
- `name_display_type`은 `full`, `partial`, `hidden` 중 운영 기준에 맞게 설정한다.
- 공개하지 않을 단원 또는 사진은 `is_visible=false`로 둔다.
- 민감한 개인정보, 학교, 연락처, 주소, 개인 SNS 계정은 public 화면에 넣지 않는다.
- 단체 사진도 식별 가능성이 있으므로 사용 허가 범위를 확인한다.

## 6. 로고 asset 체크리스트

- `public/images/brand/smyc-logo-transparent.png`
- `public/images/brand/smyc-symbol-transparent.png`
- `public/images/brand/smf-logo-transparent.png`
- `public/images/brand/smf-symbol-transparent.png`
- `public/images/brand/qa-smyc-on-navy.png`
- `public/images/brand/qa-smyc-on-ivory.png`
- `public/images/brand/qa-smf-on-navy.png`
- `public/images/brand/qa-smf-on-ivory.png`
- 어두운 Hero 배경과 밝은 배경 양쪽에서 로고 가독성 확인
- Header, Footer, Admin Login, Admin Sidebar에서 로고 비율 확인

## 7. Home Hero 슬라이드 등록

- `/admin/hero-slides`에서 최소 3개 슬라이드를 등록한다.
- 각 슬라이드는 제목, 부제, 설명, 이미지, 이미지 대체 텍스트, 1차/2차 CTA 문구와 링크를 확인한다.
- 권장 이미지 비율은 16:9 또는 21:9이며, 주요 인물이 중앙에서 너무 잘리지 않도록 한다.
- 공개할 슬라이드만 `is_visible=true`로 설정한다.
- `display_order`가 낮은 슬라이드부터 public Home에 표시되는지 확인한다.
- 이미지가 없는 슬라이드도 navy/gold gradient fallback으로 깨지지 않는지 확인한다.

## 8. public 페이지별 최종 확인

- `/`: Hero 사진, 제목, CTA, About Preview, 공연/공지/갤러리 preview 확인
- `/about`: 소개 문구, 지휘자/반주자, 단원 공개 방식, 연혁, 오시는 길 확인
- `/concerts`: 공개 공연만 표시되는지 확인
- `/notices`: 공개 공지와 중요 공지 표시 확인
- `/gallery`: 사진/영상/포스터 탭과 확대 모달 확인
- `/join`: 입단 안내, FAQ, 문의 CTA 확인
- `/contact`: 문의 폼, 개인정보 동의, 전송 성공/실패 메시지 확인

## 9. 실제 Supabase 연결 후 확인

- `.env.local` 또는 Vercel 환경변수에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`만 설정
- service_role key가 프론트엔드에 없는지 확인
- 관리자 Auth 유저와 `profiles.role='admin'` 연결 확인
- `hero_slides`, `about_sections`, `history`, `concerts`, `notices`, `gallery`의 `is_visible=false` 데이터가 public에 보이지 않는지 확인
- Storage 업로드, 수정, 삭제가 관리자에게만 가능한지 확인
- 문의 폼이 `contacts.status='new'`로 insert되는지 확인
- 운영 전 관리자 비밀번호 변경 완료 여부 확인

## 10. 관리자 CMS 실제 콘텐츠 입력 목록

- Home Hero 슬라이드 3개 이상
- 합창단 소개 문구
- 연혁
- 지휘자 정보
- 반주자 정보
- 단원 정보
- 공연 정보
- 공지사항
- 갤러리 사진
- 영상 링크
- 포스터
- 입단 안내
- 오시는 길
- Footer 연락처
- 후원/문의 정보

## 11. 사진 준비 상세

- Hero 사진 최소 3장
- 단체 사진
- 지휘자 사진
- 반주자 사진
- 공연 포스터
- 갤러리 사진
- 포스터 아카이브
- 연혁 관련 이미지

업로드 전 파일명에 개인 연락처, 학교명, 내부 행사 코드 등 공개하지 않을 정보가 들어 있지 않은지 확인한다.

## 12. 개인정보 공개 최종 확인

- 단원 이름 공개 방식이 `full`, `partial`, `hidden` 중 의도대로 설정되어 있는지 확인
- 단원 사진 공개 동의 여부 확인
- 미성년자 사진 사용에 대한 보호자 동의 여부 확인
- 연락처와 이메일 공개 여부 확인
- 문의 데이터가 public 화면에 노출되지 않는지 확인
- `is_visible=false` 데이터가 public 페이지에 보이지 않는지 확인

## 13. live Supabase 검증 연결 문서

- 실제 Supabase 연결 순서는 `docs/supabase-live-checklist.md`를 따른다.
- Storage bucket은 `site-images`를 기준으로 확인한다.
- `/admin/hero-slides`에서 Hero 사진 3장을 업로드하고 public 홈 반영을 확인한다.
- `/contact` 문의 폼은 `contacts.status='new'` 저장과 `/admin/contacts` 조회를 함께 확인한다.

## 14. 배포 직전 QA

- `pnpm lint` 통과
- `pnpm build` 통과
- desktop 1440px, tablet 768px, mobile 390px 화면 확인
- 브라우저 콘솔 치명 오류 없음
- 주요 이미지 alt 문구 확인
- 긴 제목/긴 공지/빈 데이터 상태 확인

## 15. UI 후속 TODO

- 실제 Hero 사진 업로드 후 주요 인물 위치가 CTA와 겹치면 `hero_slides.image_position` 같은 선택 필드를 추가할지 검토한다.
- live Supabase 연결 후 관리자 Dashboard에 공연 수, 공지 수, 갤러리 수, 새 문의 수, 홈 슬라이드 수 요약 카드를 추가할지 검토한다.
- 실제 iOS Safari와 Android Chrome에서 갤러리 모달, 관리자 사이드바, 이미지 업로드 터치 흐름을 추가 확인한다.

## 16. 성능 기준 이미지 업로드 체크

- Hero 이미지는 데스크톱 기준 전체 화면을 채우므로 1920x1080 또는 2560x1440 비율을 권장하되, 업로드 전 1MB 안팎으로 압축한다.
- 공연 포스터는 1200x1600 또는 3:4 비율을 권장하고, 목록 썸네일 로딩을 위해 1MB 이하로 압축한다.
- 갤러리 사진은 긴 변 1600~2000px, 1MB 이하를 권장한다. 원본 보관이 필요하면 홈페이지 업로드용과 별도 보관용을 분리한다.
- 프로필 사진은 1000x1250 또는 4:5 비율, 700KB 이하를 권장한다.
- 가능하면 jpg/png보다 webp를 우선 사용한다. 로고는 투명 PNG 또는 SVG를 사용한다.
- CMS에 올린 뒤 public 홈, 갤러리, 공연 목록에서 이미지가 늦게 보이거나 레이아웃이 밀리면 이미지 용량을 먼저 줄인다.
