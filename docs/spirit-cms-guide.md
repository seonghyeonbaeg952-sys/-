# 합창단 정신/교육철학 CMS 운영 가이드

이 문서는 `about_sections`와 `support_settings`를 사용해 공개 화면 문구를 관리하는 기준입니다.

## about_sections 섹션 키

- `foundation`, `education`, `activities`, `mission`: `/about?section=overview`의 기관 소개 카드
- `spirit_hero`: `/about?section=spirit` 첫 문장 블록
- `spirit_manifesto`: `/spirit`의 풍부한 선언문 문단
- `spirit_motet`: 모테트 의미 설명
- `spirit_education`: 합창 교육 철학
- `spirit_peace`: 음악과 나눔/평화 메시지
- `spirit_cta`: 입단/후원 문의 연결 블록
- `home_spirit`: 홈 화면의 짧은 정신 소개 블록

`spirit_*`와 `home_spirit`은 일반 기관 소개 카드 목록에 섞이지 않고 각각 정해진 화면에 표시됩니다.

## 구조화 문구

본문 맨 위에 아래 형식으로 값을 넣으면 화면의 보조 문구와 버튼을 바꿀 수 있습니다.

```text
subtitle: 보조 제목
quote: 강조 문장
cta_label: 버튼 문구
cta_url: /contact
secondary_cta_label: 보조 버튼 문구
secondary_cta_url: /join

본문은 여기부터 입력합니다.
```

## 후원약정 문구

후원 페이지는 `support_settings`에서 제목, 설명, 후원 취지, 계좌 안내, 개인정보 안내, 제출/인쇄 버튼 문구를 관리합니다.

온라인 제출은 `support_pledges` 테이블에 약정 내용을 저장하는 기능입니다. 실제 자동이체 출금이나 결제 처리는 하지 않습니다.

## 개인정보 기준

단원 소개는 공개 상태(`is_visible=true`)인 데이터만 표시합니다. 단원 사진은 공개 화면에 사용하지 않으며, 이름은 `name_display_type` 설정에 따라 실명, 부분 공개, 비공개로 표시됩니다.
