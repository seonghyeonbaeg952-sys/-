-- Adds homepage CMS keys introduced after the initial site_texts rollout.
-- Existing administrator-authored values are never overwritten.

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
values
  (
    'home.hero.title.line3',
    'home.hero',
    'home',
    'home.hero',
    '히어로 제목 3행',
    '',
    'YOUTH',
    '홈 히어로의 세 번째 큰 영문 문구입니다.',
    'text',
    'text',
    21,
    true
  ),
  (
    'home.hero.title.line4',
    'home.hero',
    'home',
    'home.hero',
    '히어로 제목 4행',
    '',
    'CHOIR',
    '홈 히어로의 네 번째 큰 영문 문구입니다.',
    'text',
    'text',
    22,
    true
  ),
  (
    'home.hero.subtitle',
    'home.hero',
    'home',
    'home.hero',
    '히어로 설명',
    '',
    '서울모테트청소년합창단은 청소년이 합창을 배우고 정기 연습과 공연을 경험하는 음악교육 공동체입니다.',
    '히어로 제목 아래에 표시되는 보조 문구입니다.',
    'textarea',
    'textarea',
    30,
    true
  ),
  (
    'home.gallery.empty.title',
    'home.gallery',
    'home',
    'home.gallery',
    '갤러리 빈 상태 제목',
    '',
    '등록된 갤러리 자료가 없습니다',
    '홈 갤러리 미리보기의 빈 상태 제목입니다.',
    'text',
    'text',
    650,
    true
  ),
  (
    'home.gallery.empty.description',
    'home.gallery',
    'home',
    'home.gallery',
    '갤러리 빈 상태 설명',
    '',
    '사진과 영상이 등록되면 이 공간에 표시됩니다.',
    '홈 갤러리 미리보기의 빈 상태 설명입니다.',
    'textarea',
    'textarea',
    660,
    true
  )
on conflict (key) do update
set is_active = true
where public.site_texts.is_active is false;
