# 후원사 CMS 관리 가이드

서울모테트청소년합창단 홈페이지의 후원사/협력기관 영역은 광고 배너가 아니라, 다음세대 음악교육을 함께 세우는 동행자를 소개하는 공간입니다.

## 적용해야 하는 SQL

Supabase SQL Editor에서 아래 migration을 실행합니다.

```text
supabase/migrations/2026_add_sponsors.sql
```

이 migration은 `sponsors` 테이블, RLS 정책, 인덱스, `updated_at` 트리거, `site-images/sponsors` Storage 업로드 권한을 추가합니다.

## 관리자 화면

관리자 CMS에서 아래 경로로 관리합니다.

```text
/admin/sponsors
```

관리 가능한 항목:

- 이름
- 표시 이름
- 분류
- 등급
- 설명
- 로고
- 웹사이트 URL
- 후원 시작일
- 후원 종료일
- 공개 동의 확인
- 공개 여부
- 홈 노출
- 후원 페이지 노출
- 푸터 노출
- 정렬 순서
- 관리자 메모

## 공개 조건

방문자 화면에 표시되려면 두 조건이 모두 필요합니다.

```text
is_visible = true
consent_public = true
```

`is_visible`이 켜져 있어도 `consent_public`이 꺼져 있으면 public 화면에 표시되지 않습니다.

## 노출 위치

홈 후원사 스트립:

- `show_on_home = true`
- 공개 조건을 만족한 항목만 표시
- 공개 후원사가 0개면 홈에는 아무 영역도 표시하지 않음

후원·문의 페이지 후원사 섹션:

- `/contact?section=sponsors`
- 공개 조건을 만족한 전체 후원사/협력기관 표시
- 등급별로 묶어서 표시

후원 안내 섹션의 미리보기:

- `/contact?section=support`
- `show_on_support = true`인 항목만 간단히 표시

푸터:

- `show_on_footer = true`
- 최대 6개까지 보조 로고로 표시

## 로고 업로드

관리자 로고 업로드 경로:

```text
site-images/sponsors/{timestamp}-{safeFileName}
```

권장 형식:

- 투명 PNG
- SVG
- JPG 또는 WebP

로고는 public 화면에서 `contain` 방식으로 표시합니다. 로고 일부가 잘리면 안 됩니다.

## 후원약정 정보와의 관계

`support_pledges`에 제출된 후원약정 신청자 정보는 후원사 목록에 자동 공개하지 않습니다.

후원자명 또는 단체명을 홈페이지에 공개하려면 반드시 별도 동의를 확인한 뒤, 관리자가 `/admin/sponsors`에서 직접 등록하고 `consent_public`을 켜야 합니다.

## 배포 전 체크리스트

- Supabase SQL Editor에서 `2026_add_sponsors.sql` 실행
- `pnpm check:supabase-live`에서 sponsors 테이블/컬럼 확인
- 관리자에서 테스트 후원사 1개 등록
- `consent_public`, `is_visible`, `show_on_home`, `show_on_support`, `show_on_footer` 조합 확인
- `/`, `/contact?section=sponsors`, `/contact?section=support`에서 노출 여부 확인
- 로고가 잘리지 않고 원본 비율로 보이는지 확인
- 개인 후원자명 공개 전 별도 동의 여부 확인

## Figma 기준

Figma 파일 `SMYC Global Arts Polish QA`에 후원사/협력기관 기준 프레임과 컴포넌트 보드를 추가했습니다.

추가 프레임:

- `Desktop Sponsors — 1440 × 900`
- `Tablet Sponsors — 820 × 1180`
- `Mobile Sponsors — 390 × 844`
- `Home Sponsor Strip — 1440 × 420`
- `Sponsor Components / React mapping`

React 대응 컴포넌트:

- `SponsorLogoCard / Logo`
- `SponsorLogoCard / TextOnly`
- `SponsorLogoCard / WithDescription`
- `SponsorLogoCard / Compact`
- `SponsorTierSection`
- `SponsorStrip`
- `SponsorsEmptyState`
- `AdminSponsorForm`

디자인 원칙:

- 후원사는 광고 배너가 아니라 `다음세대 음악교육을 함께 세우는 동행자`로 표현합니다.
- 로고 카드는 부드러운 ivory surface 위에 배치하되, 상업 광고처럼 과장된 색이나 배너형 레이아웃은 피합니다.
- 홈에는 후원사가 1개 이상 공개된 경우에만 작은 로고 스트립을 표시합니다.
- `/contact?section=sponsors`에서는 등급별로 묶어서 소개합니다.
