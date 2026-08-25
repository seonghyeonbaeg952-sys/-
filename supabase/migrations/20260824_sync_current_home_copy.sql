-- Registers the copy currently rendered by the white/orange production home.
--
-- Previous-home about/join/archive rows are retained for audit, but are no
-- longer active. Current-home rows use a separate namespace so deploying the
-- component connection cannot expose stale CMS copy before this migration runs.

begin;

with current_copy (
  key,
  section,
  label,
  value,
  description,
  input_type,
  sort_order
) as (
  values
    ('home.current.about.eyebrowKo', 'home.about', '소개 한글 라벨', '소개', '소개 섹션의 접근성·운영 라벨입니다.', 'text', 300),
    ('home.current.about.eyebrowEn', 'home.about', '소개 영문 라벨', 'ABOUT', '소개 섹션 제목 위에 표시됩니다.', 'text', 301),
    ('home.current.about.title', 'home.about', '소개 제목', '함께 빚어가는 화음,
다음 세대의 노래', '홈 소개 섹션의 큰 제목입니다.', 'textarea', 302),
    ('home.current.about.paragraphs.1', 'home.about', '소개 본문 1행', '서울모테트청소년합창단은 음악과 신앙, 공동체의 가치를 통해', '현재 소개 본문에서 줄바꿈되는 첫 번째 행입니다.', 'textarea', 303),
    ('home.current.about.paragraphs.2', 'home.about', '소개 본문 2행', '청소년의 삶을 아름답게 세워갑니다.', '현재 소개 본문에서 줄바꿈되는 두 번째 행입니다.', 'textarea', 304),
    ('home.current.about.ctaLabel', 'home.about', '소개 CTA', '합창단 소개 보기', '합창단 소개 페이지로 이동하는 버튼 문구입니다.', 'text', 305),
    ('home.current.about.globalTagline', 'home.about', '소개 하단 영문 문구', 'VOICE · LEARNING · STAGE', '소개 CTA 옆에 표시되는 영문 문구입니다.', 'text', 306),

    ('home.current.join.eyebrowKo', 'home.joinLetter', '입단 한글 라벨', '입단', '현재 홈 입단 섹션에 표시되는 문구입니다.', 'text', 500),
    ('home.current.join.eyebrowEn', 'home.joinLetter', '입단 영문 라벨', 'JOIN · NEXT VOICE', '현재 홈 입단 섹션에 표시되는 문구입니다.', 'text', 501),
    ('home.current.join.title', 'home.joinLetter', '입단 제목', '함께 배우고,
함께 무대에 서는
다음 목소리를 기다립니다', '현재 홈 입단 섹션의 큰 제목입니다.', 'textarea', 502),
    ('home.current.join.description', 'home.joinLetter', '입단 설명', '발성·악보 읽기·파트 연습부터 공연까지, 청소년이 음악 안에서 자신을 발견하고 함께 성장하는 과정입니다.', '현재 홈 입단 섹션의 전체 설명입니다.', 'textarea', 503),
    ('home.current.join.compactDescription', 'home.joinLetter', '입단 모바일 요약', '음악 안에서 함께 성장하는 과정입니다.', '작은 화면에서 설명 두 번째 행에 표시됩니다.', 'textarea', 504),
    ('home.current.join.ctaLabel', 'home.joinLetter', '입단지원 CTA', '입단지원서 작성하기', '입단지원서로 이동하는 버튼 문구입니다.', 'text', 505),
    ('home.current.join.secondaryCtaLabel', 'home.joinLetter', '입단 절차 CTA', '모집 일정·절차 확인', '입단 절차로 이동하는 버튼 문구입니다.', 'text', 506),

    ('home.concertProgram.desktopConcertsCtaLabel', 'home.concertProgram', '공연 데스크톱 전체 일정 CTA', '전체 일정', '데스크톱 공연 섹션의 전체 일정 버튼 문구입니다.', 'text', 605),

    ('home.current.archive.eyebrowKo', 'home.archive', '기록 한글 라벨', '기록', '기록 섹션의 접근성·운영 라벨입니다.', 'text', 1000),
    ('home.current.archive.eyebrowEn', 'home.archive', '기록 영문 라벨', 'ARCHIVE', '기록 섹션 제목 위에 표시됩니다.', 'text', 1001),
    ('home.current.archive.title', 'home.archive', '기록 모바일 제목', '포스터 · 사진 · 동영상', '작은 화면의 기록 섹션 제목입니다.', 'text', 1002),
    ('home.current.archive.desktopTitle', 'home.archive', '기록 데스크톱 제목', '한 번의 무대는
세 가지 기록으로
오래 남습니다', '데스크톱 기록 섹션의 큰 제목입니다.', 'textarea', 1003),
    ('home.current.archive.leadDescription', 'home.archive', '기록 첫 설명', '사진은 순간을 붙잡고, 포스터는 사람을 부르며, 영상은 마지막 음 이후의 시간을 이어갑니다.', '데스크톱 기록 섹션의 강조 설명입니다.', 'textarea', 1004),
    ('home.current.archive.description', 'home.archive', '기록 둘째 설명', '한 장의 공연 사진이 빛을 담고, 필름을 지나, 오래 남을 기록이 되는 과정을 따라갑니다.', '기록 섹션의 이어지는 설명입니다.', 'textarea', 1005),
    ('home.current.archive.expandLabel', 'home.archive', '기록 펼치기 문구', '기록 현상하기', '기록 인터랙션의 펼치기 문구입니다.', 'text', 1006),
    ('home.current.archive.collapseLabel', 'home.archive', '기록 접기 문구', '접기', '기록 인터랙션의 접기 문구입니다.', 'text', 1007),
    ('home.current.archive.ctaLabel', 'home.archive', '갤러리 CTA', '갤러리 보기', '갤러리로 이동하는 버튼 문구입니다.', 'text', 1008),
    ('home.current.archive.emptyTitle', 'home.archive', '기록 빈 상태 제목', '공개된 갤러리 자료가 없습니다', '공개 기록이 없을 때 표시되는 제목입니다.', 'text', 1009),
    ('home.current.archive.emptyDescription', 'home.archive', '기록 빈 상태 설명', '현재 공개된 공연·연습 기록이 없습니다.', '공개 기록이 없을 때 표시되는 설명입니다.', 'textarea', 1010)
)
insert into public.site_texts (
  key,
  group_name,
  page,
  section,
  label,
  value,
  default_value,
  description,
  input_type,
  value_type,
  sort_order,
  is_active
)
select
  key,
  section,
  'home',
  section,
  label,
  value,
  value,
  description,
  input_type,
  input_type,
  sort_order,
  true
from current_copy
on conflict (key) do update
set
  group_name = excluded.group_name,
  page = excluded.page,
  section = excluded.section,
  label = excluded.label,
  value = case
    when btrim(public.site_texts.value) = ''
      or public.site_texts.value = public.site_texts.default_value
      then excluded.value
    else public.site_texts.value
  end,
  default_value = excluded.default_value,
  description = excluded.description,
  input_type = excluded.input_type,
  value_type = excluded.value_type,
  sort_order = excluded.sort_order,
  is_active = true;

-- Keep prior-home values recoverable while preventing them from appearing as
-- editable/current public copy.
update public.site_texts
set is_active = false
where is_active = true
  and (
    key like 'home.about.%'
    or key like 'home.joinLetter.%'
    or key like 'home.archive.%'
  );

commit;
