-- Optional public placeholder seed for local/dev setup only.
-- No real admin account, password, Supabase key, service key, or private data is included.

insert into public.site_settings (
  id,
  site_title,
  hero_title,
  hero_subtitle,
  about_summary,
  support_text,
  join_cta_text,
  email,
  phone,
  fax,
  address,
  instagram_url,
  youtube_url,
  is_visible
)
values (
  '00000000-0000-0000-0000-000000000101',
  '서울모테트청소년합창단',
  '서울모테트청소년합창단',
  '맑은 목소리로 전하는 깊은 울림',
  '서울모테트음악재단 청소년아카데미 부설 합창단으로, 청소년들이 합창을 통해 음악의 가치와 함께하는 마음을 배우도록 돕습니다.',
  '공연 초청과 후원 문의를 통해 서울모테트청소년합창단의 음악 여정에 함께해 주세요.',
  '서울모테트청소년합창단과 함께 노래할 단원을 기다립니다.',
  null,
  '02-579-7295',
  '02-579-7293',
  '서울특별시 서초구 사임당로 8길 17 서주빌딩 B1',
  null,
  null,
  true
)
on conflict (id) do update
set
  site_title = excluded.site_title,
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  about_summary = excluded.about_summary,
  support_text = excluded.support_text,
  join_cta_text = excluded.join_cta_text,
  email = excluded.email,
  phone = excluded.phone,
  fax = excluded.fax,
  address = excluded.address,
  instagram_url = excluded.instagram_url,
  youtube_url = excluded.youtube_url,
  is_visible = excluded.is_visible,
  updated_at = now();

insert into public.support_settings (
  id,
  title,
  subtitle,
  description,
  message,
  individual_amounts,
  corporate_amounts,
  allow_custom_amount,
  bank_name,
  bank_account_number,
  bank_account_holder,
  bank_note,
  enable_online_submission,
  form_note,
  privacy_notice,
  print_note,
  print_button_label,
  submit_button_label,
  success_message,
  contact_phone,
  contact_email,
  homepage_url,
  organization_name,
  footer_note,
  is_visible
)
values (
  '00000000-0000-0000-0000-000000000151',
  '후원약정',
  '서울모테트청소년합창단을 후원하겠습니다.',
  '청소년들이 음악을 통해 성장하고, 나눔과 사랑을 실천할 수 있도록 후원에 동참해 주세요.',
  '여러분들의 후원이 다음 세대를 세웁니다. 청소년들이 창의적인 음악 교육과 공동체 훈련을 통해 음악적 능력과 인성을 함께 성장시킬 수 있도록 후원에 동참해 주세요.',
  '10000
20000
30000
50000',
  '100000
200000
300000
500000
1000000',
  true,
  null,
  null,
  null,
  '후원 계좌 정보는 관리자 CMS에서 등록한 뒤 표시됩니다.',
  true,
  '입력한 후원약정 정보는 관리자에게만 전달되며 공개 화면에는 표시되지 않습니다.',
  '작성하신 개인정보는 후원 안내 및 약정 확인 목적으로만 사용되며, 관리자만 조회할 수 있습니다.',
  '작성 후 인쇄하거나 PDF로 저장할 수 있습니다. 온라인 제출 시 동일한 내용이 관리자 CMS에 저장됩니다.',
  '약정서 인쇄하기',
  '후원약정 제출',
  '후원약정이 접수되었습니다. 확인 후 연락드리겠습니다.',
  null,
  null,
  null,
  '서울모테트청소년합창단',
  '입력 내용은 서버에 저장되지 않으며, 브라우저 인쇄 기능으로만 출력됩니다.',
  true
)
on conflict (id) do update
set
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  message = excluded.message,
  individual_amounts = excluded.individual_amounts,
  corporate_amounts = excluded.corporate_amounts,
  allow_custom_amount = excluded.allow_custom_amount,
  bank_name = excluded.bank_name,
  bank_account_number = excluded.bank_account_number,
  bank_account_holder = excluded.bank_account_holder,
  bank_note = excluded.bank_note,
  enable_online_submission = excluded.enable_online_submission,
  form_note = excluded.form_note,
  privacy_notice = excluded.privacy_notice,
  print_note = excluded.print_note,
  print_button_label = excluded.print_button_label,
  submit_button_label = excluded.submit_button_label,
  success_message = excluded.success_message,
  contact_phone = excluded.contact_phone,
  contact_email = excluded.contact_email,
  homepage_url = excluded.homepage_url,
  organization_name = excluded.organization_name,
  footer_note = excluded.footer_note,
  is_visible = excluded.is_visible,
  updated_at = now();

insert into public.hero_slides (
  id,
  title,
  subtitle,
  description,
  image_url,
  image_alt,
  primary_cta_label,
  primary_cta_href,
  secondary_cta_label,
  secondary_cta_href,
  display_order,
  is_visible
)
values
  (
    '00000000-0000-0000-0000-000000000201',
    '서울모테트청소년합창단',
    '맑은 목소리로 전하는 깊은 울림',
    '청소년의 순수한 목소리와 클래식 합창의 깊이를 무대 경험으로 이어갑니다.',
    '/images/hero/hero-01.svg',
    '서울모테트청소년합창단 공연 장면',
    '공연 일정 보기',
    '/concerts',
    '입단 안내 보기',
    '/join',
    1,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '함께 배우고 함께 노래하는 시간',
    '음악 안에서 자라는 지성과 인성',
    '정기연습과 무대 경험을 통해 청소년들이 합창의 가치와 협력의 기쁨을 배웁니다.',
    '/images/hero/hero-02.svg',
    '서울모테트청소년합창단 연습 장면',
    '합창단 소개',
    '/about',
    '입단 안내 보기',
    '/join',
    2,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000203',
    '무대 위에서 이어지는 나눔',
    '정기연주와 초청연주, 봉사연주',
    '다양한 연주 활동을 통해 합창의 아름다움과 따뜻한 메시지를 전합니다.',
    '/images/hero/hero-03.svg',
    '서울모테트청소년합창단 무대 장면',
    '갤러리 보기',
    '/gallery',
    '후원·문의',
    '/contact',
    3,
    true
  )
on conflict (id) do update
set
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  primary_cta_label = excluded.primary_cta_label,
  primary_cta_href = excluded.primary_cta_href,
  secondary_cta_label = excluded.secondary_cta_label,
  secondary_cta_href = excluded.secondary_cta_href,
  display_order = excluded.display_order,
  is_visible = excluded.is_visible,
  updated_at = now();

insert into public.locations (
  id,
  place_name,
  address,
  phone,
  is_visible
)
values (
  '00000000-0000-0000-0000-000000000301',
  '서울모테트청소년합창단',
  '서울특별시 서초구 사임당로 8길 17 서주빌딩 B1',
  '02-579-7295',
  true
)
on conflict (id) do update
set
  place_name = excluded.place_name,
  address = excluded.address,
  phone = excluded.phone,
  is_visible = excluded.is_visible,
  updated_at = now();

insert into public.join_info (
  id,
  title,
  description,
  target,
  parts,
  audition_process,
  preparation,
  rehearsal_time,
  rehearsal_location,
  application_url,
  is_visible
)
values (
  '00000000-0000-0000-0000-000000000401',
  '입단 안내',
  '서울모테트청소년합창단과 함께 노래할 청소년 단원을 기다립니다.',
  '초등, 중등, 고등 청소년',
  '소프라노, 알토, 테너, 베이스',
  '지원 문의 후 오디션 일정을 개별 안내합니다.',
  '자유곡 또는 지정곡 준비',
  '관리자 CMS에서 최신 연습 정보를 등록할 예정입니다.',
  '관리자 CMS에서 최신 연습 장소를 등록할 예정입니다.',
  null,
  true
)
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  target = excluded.target,
  parts = excluded.parts,
  audition_process = excluded.audition_process,
  preparation = excluded.preparation,
  rehearsal_time = excluded.rehearsal_time,
  rehearsal_location = excluded.rehearsal_location,
  application_url = excluded.application_url,
  is_visible = excluded.is_visible,
  updated_at = now();

insert into public.faq (
  id,
  question,
  answer,
  category,
  display_order,
  is_visible
)
values
  (
    '00000000-0000-0000-0000-000000000501',
    '입단 문의는 어디에서 하나요?',
    '후원·문의 페이지 또는 공식 연락처를 통해 문의할 수 있습니다.',
    'join',
    1,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000502',
    '연습 시간은 어디에서 확인하나요?',
    '운영 전 관리자 CMS에서 최신 연습 정보를 등록할 예정입니다.',
    'join',
    2,
    true
  )
on conflict (id) do update
set
  question = excluded.question,
  answer = excluded.answer,
  category = excluded.category,
  display_order = excluded.display_order,
  is_visible = excluded.is_visible,
  updated_at = now();
