-- Text CMS for public homepage copy.
-- Non-destructive: existing site_texts rows and custom value fields are preserved.

create table if not exists public.site_texts (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  group_name text,
  page text,
  section text,
  label text,
  value text not null default '',
  default_value text not null default '',
  description text,
  input_type text not null default 'text',
  value_type text not null default 'text',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.site_texts
  add column if not exists group_name text,
  add column if not exists page text,
  add column if not exists section text,
  add column if not exists label text,
  add column if not exists value text not null default '',
  add column if not exists default_value text not null default '',
  add column if not exists description text,
  add column if not exists input_type text not null default 'text',
  add column if not exists value_type text not null default 'text',
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_active boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

update public.site_texts
set
  group_name = coalesce(group_name, section, page),
  input_type = coalesce(input_type, case when value_type = 'textarea' then 'textarea' else 'text' end),
  value_type = coalesce(value_type, case when input_type = 'textarea' then 'textarea' else 'text' end),
  default_value = coalesce(default_value, ''),
  value = coalesce(value, '')
where
  group_name is null
  or input_type is null
  or value_type is null
  or default_value is null
  or value is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'site_texts_key_not_blank_check'
  ) then
    alter table public.site_texts
      add constraint site_texts_key_not_blank_check
      check (length(btrim(key)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'site_texts_input_type_check'
  ) then
    alter table public.site_texts
      add constraint site_texts_input_type_check
      check (input_type in ('text', 'textarea', 'url', 'label'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'site_texts_value_type_check'
  ) then
    alter table public.site_texts
      add constraint site_texts_value_type_check
      check (value_type in ('text', 'textarea', 'markdown'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'site_texts_no_html_value_check'
  ) then
    alter table public.site_texts
      add constraint site_texts_no_html_value_check
      check (
        value !~* '<[[:space:]]*/?[[:space:]]*[a-z][^>]*>'
        and default_value !~* '<[[:space:]]*/?[[:space:]]*[a-z][^>]*>'
      );
  end if;
end $$;

create unique index if not exists site_texts_key_uidx
on public.site_texts (key);

create index if not exists site_texts_public_active_idx
on public.site_texts (group_name, sort_order, key)
where is_active = true;

create index if not exists site_texts_admin_order_idx
on public.site_texts (group_name, sort_order, key);

drop trigger if exists set_updated_at on public.site_texts;
create trigger set_updated_at
before update on public.site_texts
for each row execute function public.set_updated_at();

alter table public.site_texts enable row level security;
alter table public.site_texts force row level security;

grant select on public.site_texts to anon, authenticated;
grant insert, update, delete on public.site_texts to authenticated;

drop policy if exists site_texts_public_read_active on public.site_texts;
create policy site_texts_public_read_active
on public.site_texts
for select
to anon, authenticated
using (is_active = true);

drop policy if exists site_texts_admin_full_access on public.site_texts;
create policy site_texts_admin_full_access
on public.site_texts
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

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
  ('home.hero.title.line1', 'home.hero', 'home', 'home.hero', '히어로 제목 1행', '', '마음을 다한 음악으로', '홈 히어로의 첫 번째 큰 문구입니다.', 'text', 'text', 10, true),
  ('home.hero.title.line2', 'home.hero', 'home', 'home.hero', '히어로 제목 2행', '', '다음 세대를 세웁니다', '홈 히어로의 두 번째 큰 문구입니다.', 'text', 'text', 20, true),
  ('home.hero.subtitle', 'home.hero', 'home', 'home.hero', '히어로 설명', '', '서울모테트청소년합창단은 정직한 음악과 공동체의 울림으로 다음 세대를 세웁니다.', '히어로 제목 아래에 표시되는 보조 문구입니다.', 'textarea', 'textarea', 30, true),
  ('home.hero.eyebrow', 'home.hero', 'home', 'home.hero', '히어로 키커', '', 'SEOUL MOTET YOUTH CHOIR', '히어로 상단의 영문 라벨입니다.', 'text', 'text', 40, true),
  ('home.hero.chip1', 'home.hero', 'home', 'home.hero', '히어로 가치 칩 1', '', '정직한 음악', '히어로 하단 가치 칩 1입니다.', 'text', 'text', 50, true),
  ('home.hero.chip2', 'home.hero', 'home', 'home.hero', '히어로 가치 칩 2', '', '함께 부르는 공동체', '히어로 하단 가치 칩 2입니다.', 'text', 'text', 60, true),
  ('home.hero.chip3', 'home.hero', 'home', 'home.hero', '히어로 가치 칩 3', '', '다음 세대 교육', '히어로 하단 가치 칩 3입니다.', 'text', 'text', 70, true),
  ('home.hero.cta.primary', 'home.hero', 'home', 'home.hero', '히어로 기본 CTA', '', '입단 안내', '히어로의 첫 번째 CTA 버튼 문구입니다.', 'text', 'text', 80, true),
  ('home.hero.cta.secondary', 'home.hero', 'home', 'home.hero', '히어로 보조 CTA', '', '공연 일정', '히어로의 두 번째 CTA 버튼 문구입니다.', 'text', 'text', 90, true),
  ('home.quick.join.title', 'home.quick', 'home', 'home.quick', '입단 카드 제목', '', '입단 안내', '빠른 진입 카드의 입단 제목입니다.', 'text', 'text', 110, true),
  ('home.quick.join.description', 'home.quick', 'home', 'home.quick', '입단 카드 설명', '', '모집 대상과 입단 절차를 빠르게 확인합니다.', '빠른 진입 카드의 입단 설명입니다.', 'textarea', 'textarea', 120, true),
  ('home.quick.concert.title', 'home.quick', 'home', 'home.quick', '공연 카드 제목', '', '공연 일정', '빠른 진입 카드의 공연 제목입니다.', 'text', 'text', 130, true),
  ('home.quick.concert.description', 'home.quick', 'home', 'home.quick', '공연 카드 설명', '', '다가오는 무대와 공지사항을 확인합니다.', '빠른 진입 카드의 공연 설명입니다.', 'textarea', 'textarea', 140, true),
  ('home.quick.support.title', 'home.quick', 'home', 'home.quick', '후원·문의 카드 제목', '', '후원·문의', '빠른 진입 카드의 후원/문의 제목입니다.', 'text', 'text', 150, true),
  ('home.quick.support.description', 'home.quick', 'home', 'home.quick', '후원·문의 카드 설명', '', '후원 상담과 문의를 공식 채널로 연결합니다.', '빠른 진입 카드의 후원/문의 설명입니다.', 'textarea', 'textarea', 160, true),
  ('home.quick.gallery.title', 'home.quick', 'home', 'home.quick', '갤러리 카드 제목', '', '갤러리', '필요 시 빠른 진입 카드에 사용할 갤러리 제목입니다.', 'text', 'text', 170, true),
  ('home.quick.gallery.description', 'home.quick', 'home', 'home.quick', '갤러리 카드 설명', '', '활동 사진과 영상 기록을 확인합니다.', '필요 시 빠른 진입 카드에 사용할 갤러리 설명입니다.', 'textarea', 'textarea', 180, true),
  ('home.about.kicker', 'home.about', 'home', 'home.about', '소개 키커', '', 'ABOUT', '홈 소개 섹션의 상단 라벨입니다.', 'text', 'text', 210, true),
  ('home.about.title', 'home.about', 'home', 'home.about', '소개 제목', '', '청소년의 목소리로 전하는 깊은 울림', '홈 소개 섹션 제목입니다.', 'text', 'text', 220, true),
  ('home.about.body', 'home.about', 'home', 'home.about', '소개 본문', '', '서울모테트청소년합창단은 청소년들이 정직한 음악과 함께 부르는 공동체 안에서 지성, 인성, 영성을 균형 있게 기르도록 돕습니다.', '홈 앞쪽에 짧게 노출되는 합창단 소개 문구입니다.', 'textarea', 'textarea', 230, true),
  ('home.about.cta', 'home.about', 'home', 'home.about', '소개 CTA', '', '합창단 소개 보기', '소개 섹션 CTA 버튼 문구입니다.', 'text', 'text', 240, true),
  ('home.join.kicker', 'home.join', 'home', 'home.join', '입단 키커', '', 'JOIN', '입단 CTA 섹션의 상단 라벨입니다.', 'text', 'text', 310, true),
  ('home.join.title', 'home.join', 'home', 'home.join', '입단 CTA 제목', '', '입단 안내', '홈 조기 입단 CTA 제목입니다.', 'text', 'text', 320, true),
  ('home.join.body', 'home.join', 'home', 'home.join', '입단 CTA 본문', '', '모집 대상, 연습 안내, 입단 절차를 확인하고 입단지원서 작성으로 이어집니다.', '홈 조기 입단 CTA 본문입니다.', 'textarea', 'textarea', 330, true),
  ('home.join.target', 'home.join', 'home', 'home.join', '모집 대상', '', '음악을 사랑하며 합창 활동에 성실히 참여할 청소년', '입단 CTA의 모집 대상 요약입니다.', 'textarea', 'textarea', 340, true),
  ('home.join.schedule', 'home.join', 'home', 'home.join', '연습 안내', '', '정기 연습 일정과 장소는 입단 안내에서 확인', '입단 CTA의 연습 안내 요약입니다.', 'textarea', 'textarea', 350, true),
  ('home.join.process', 'home.join', 'home', 'home.join', '입단 절차', '', '지원서 작성 → 안내 연락 → 음역 확인', '입단 CTA의 절차 요약입니다.', 'textarea', 'textarea', 360, true),
  ('home.join.cta', 'home.join', 'home', 'home.join', '입단 CTA 버튼', '', '입단지원서 작성하기', '입단 CTA 버튼 문구입니다.', 'text', 'text', 370, true),
  ('home.concert.kicker', 'home.concert', 'home', 'home.concert', '공연 키커', '', 'CONCERTS & NEWS', '공연·공지 섹션 상단 라벨입니다.', 'text', 'text', 410, true),
  ('home.concert.title', 'home.concert', 'home', 'home.concert', '공연 섹션 제목', '', '공연과 소식', '공연·공지 섹션 제목입니다.', 'text', 'text', 420, true),
  ('home.concert.description', 'home.concert', 'home', 'home.concert', '공연 섹션 설명', '', '최신 공연과 공지사항을 확인합니다.', '공연·공지 섹션 보조 설명입니다.', 'textarea', 'textarea', 430, true),
  ('home.concert.cta.schedule', 'home.concert', 'home', 'home.concert', '공연 일정 CTA', '', '공연 일정 보기', '공연 목록 CTA 문구입니다.', 'text', 'text', 440, true),
  ('home.concert.cta.notice', 'home.concert', 'home', 'home.concert', '공지 CTA', '', '공지사항 보기', '공지 목록 CTA 문구입니다.', 'text', 'text', 450, true),
  ('home.concert.cta.more', 'home.concert', 'home', 'home.concert', '공연 상세 CTA', '', '자세히 보기', '공연 카드 상세 버튼 문구입니다.', 'text', 'text', 460, true),
  ('home.concert.cta.inquiry', 'home.concert', 'home', 'home.concert', '공연 문의 CTA', '', '문의', '공연 카드 문의 버튼 문구입니다.', 'text', 'text', 470, true),
  ('home.score.cover.title', 'home.score', 'home', 'home.score', '악보 표지 제목', '', E'정직한 음악과\n공동체의 울림을\n기록하는 악보집', 'Motet Score 표지 제목입니다.', 'textarea', 'textarea', 510, true),
  ('home.score.cover.body', 'home.score', 'home', 'home.score', '악보 표지 설명', '', '정직한 음악과 공동체의 울림을 한 권의 악보처럼 기록합니다.', 'Motet Score 표지 설명입니다.', 'textarea', 'textarea', 520, true),
  ('home.score.left.kicker', 'home.score', 'home', 'home.score', '악보 왼쪽 키커', '', 'MOTET SCORE', 'Motet Score 내부 왼쪽 라벨입니다.', 'text', 'text', 530, true),
  ('home.score.left.title', 'home.score', 'home', 'home.score', '악보 왼쪽 제목', '', '정직한 음악', 'Motet Score 왼쪽 보조 제목입니다.', 'text', 'text', 540, true),
  ('home.score.left.body', 'home.score', 'home', 'home.score', '악보 왼쪽 본문', '', '입단과 연습, 작품을 준비하는 과정 안에서 청소년들은 성실하게 준비하는 태도를 배웁니다.', 'Motet Score 왼쪽 본문입니다.', 'textarea', 'textarea', 550, true),
  ('home.score.right.title', 'home.score', 'home', 'home.score', '악보 오른쪽 제목', '', '함께 부르는 교육', 'Motet Score 오른쪽 보조 제목입니다.', 'text', 'text', 560, true),
  ('home.score.right.body', 'home.score', 'home', 'home.score', '악보 오른쪽 본문', '', '나의 목소리보다 우리의 울림을 먼저 생각하며 책임과 배려를 익혀갑니다.', 'Motet Score 오른쪽 본문입니다.', 'textarea', 'textarea', 570, true),
  ('home.score.final.title', 'home.score', 'home', 'home.score', '악보 최종 제목', '', E'목소리와 공동체의\n울림을 읽습니다', 'Motet Score 최종 페이지 제목입니다.', 'textarea', 'textarea', 580, true),
  ('home.score.final.body', 'home.score', 'home', 'home.score', '악보 최종 본문', '', E'합창은 소리를 맞추는 일을 넘어,\n사람을 세우는 교육입니다.', 'Motet Score 최종 페이지 본문입니다.', 'textarea', 'textarea', 590, true),
  ('home.score.value.list', 'home.score', 'home', 'home.score', '악보 가치 단어', '', '경청, 배려, 성실, 책임, 조화, 비전', '데스크톱 악보 전환 중 표시되는 가치 단어 목록입니다.', 'textarea', 'textarea', 600, true),
  ('home.gallery.kicker', 'home.gallery', 'home', 'home.gallery', '갤러리 키커', '', 'ARCHIVE', '갤러리 섹션 상단 라벨입니다.', 'text', 'text', 610, true),
  ('home.gallery.title', 'home.gallery', 'home', 'home.gallery', '갤러리 제목', '', '무대의 시간', '갤러리 섹션 제목입니다.', 'text', 'text', 620, true),
  ('home.gallery.description', 'home.gallery', 'home', 'home.gallery', '갤러리 설명', '', '무대와 연습, 기록의 장면을 차분하게 모았습니다.', '갤러리 섹션 설명입니다.', 'textarea', 'textarea', 630, true),
  ('home.gallery.cta', 'home.gallery', 'home', 'home.gallery', '갤러리 CTA', '', '갤러리 보기', '갤러리 CTA 버튼 문구입니다.', 'text', 'text', 640, true),
  ('home.support.title', 'home.support', 'home', 'home.support', '후원 섹션 제목', '', '후원·문의', '후원·문의 섹션 제목입니다.', 'text', 'text', 710, true),
  ('home.support.description', 'home.support', 'home', 'home.support', '후원 섹션 본문', '', '후원은 청소년의 음악교육과 합창단의 지속 가능한 활동을 돕습니다.', '후원·문의 섹션 본문입니다.', 'textarea', 'textarea', 720, true),
  ('home.support.cta.primary', 'home.support', 'home', 'home.support', '후원 상담 CTA', '', '후원 상담 신청', '후원 상담 CTA 문구입니다.', 'text', 'text', 730, true),
  ('home.support.cta.secondary', 'home.support', 'home', 'home.support', '후원 문의 CTA', '', '문의', '후원 섹션 일반 문의 CTA 문구입니다.', 'text', 'text', 740, true),
  ('home.support.card.title', 'home.support', 'home', 'home.support', '후원 카드 제목', '', '후원과 문의를 한곳에서 연결합니다', '후원 카드 제목입니다.', 'text', 'text', 750, true),
  ('home.support.card.description', 'home.support', 'home', 'home.support', '후원 카드 설명', '', '공연 초청, 후원 약정, 입단 문의를 공식 문의 채널을 통해 함께 접수합니다.', '후원 카드 설명입니다.', 'textarea', 'textarea', 760, true),
  ('home.support.short.cta', 'home.support', 'home', 'home.support', '짧은 후원 문의 CTA', '', '문의', '홈 하단 짧은 후원·문의 연결 CTA입니다.', 'text', 'text', 770, true),
  ('footer.tagline.line1', 'home.footer', 'home', 'home.footer', '푸터 태그라인 1행', '', '마음을 다한 음악으로', '푸터 태그라인 첫 번째 줄입니다.', 'text', 'text', 810, true),
  ('footer.tagline.line2', 'home.footer', 'home', 'home.footer', '푸터 태그라인 2행', '', '다음 세대를 세웁니다', '푸터 태그라인 두 번째 줄입니다.', 'text', 'text', 820, true),
  ('footer.quick.join', 'home.footer', 'home', 'home.footer', '푸터 입단 메뉴', '', '입단 안내', '푸터 빠른 메뉴 입단 문구입니다.', 'text', 'text', 830, true),
  ('footer.quick.concert', 'home.footer', 'home', 'home.footer', '푸터 공연 메뉴', '', '공연 일정', '푸터 빠른 메뉴 공연 문구입니다.', 'text', 'text', 840, true),
  ('footer.quick.support', 'home.footer', 'home', 'home.footer', '푸터 후원 메뉴', '', '후원·문의', '푸터 빠른 메뉴 후원 문구입니다.', 'text', 'text', 850, true),
  ('footer.quick.gallery', 'home.footer', 'home', 'home.footer', '푸터 갤러리 메뉴', '', '갤러리', '푸터 빠른 메뉴 갤러리 문구입니다.', 'text', 'text', 860, true),
  ('footer.quick.about', 'home.footer', 'home', 'home.footer', '푸터 소개 메뉴', '', '합창단 소개', '푸터 빠른 메뉴 소개 문구입니다.', 'text', 'text', 870, true),
  ('footer.privacy', 'home.footer', 'home', 'home.footer', '푸터 개인정보 문구', '', '개인정보 처리 안내', '푸터 개인정보 안내 문구입니다.', 'text', 'text', 880, true),
  ('common.cta.inquiry', 'common.button', 'common', 'common.button', '공통 문의 CTA', '', '문의', '공통 문의 CTA 문구입니다.', 'text', 'text', 910, true),
  ('common.cta.more', 'common.button', 'common', 'common.button', '공통 상세 CTA', '', '자세히 보기', '공통 상세 CTA 문구입니다.', 'text', 'text', 920, true),
  ('common.cta.join', 'common.button', 'common', 'common.button', '공통 입단 CTA', '', '입단 안내', '공통 입단 CTA 문구입니다.', 'text', 'text', 930, true),
  ('common.cta.concert', 'common.button', 'common', 'common.button', '공통 공연 CTA', '', '공연 일정', '공통 공연 CTA 문구입니다.', 'text', 'text', 940, true),
  ('home.hero.title', 'home.hero', 'home', 'home.hero', '히어로 제목', '', E'마음을 다한 음악으로\n다음 세대를 세웁니다', '기존 키 호환용 히어로 제목입니다.', 'textarea', 'textarea', 950, true),
  ('home.hero.description', 'home.hero', 'home', 'home.hero', '히어로 설명', '', '서울모테트청소년합창단은 정직한 음악과 공동체의 울림으로 다음 세대를 세웁니다.', '기존 키 호환용 히어로 설명입니다.', 'textarea', 'textarea', 960, true),
  ('home.quick.1.title', 'home.quick', 'home', 'home.quick', '빠른 카드 1 제목', '', '입단 안내', '기존 key 호환용 빠른 카드 1 제목입니다.', 'text', 'text', 970, true),
  ('home.quick.1.description', 'home.quick', 'home', 'home.quick', '빠른 카드 1 설명', '', '모집 대상과 입단 절차를 빠르게 확인합니다.', '기존 key 호환용 빠른 카드 1 설명입니다.', 'textarea', 'textarea', 980, true),
  ('home.quick.2.title', 'home.quick', 'home', 'home.quick', '빠른 카드 2 제목', '', '공연 일정', '기존 key 호환용 빠른 카드 2 제목입니다.', 'text', 'text', 990, true),
  ('home.quick.2.description', 'home.quick', 'home', 'home.quick', '빠른 카드 2 설명', '', '다가오는 무대와 공지사항을 확인합니다.', '기존 key 호환용 빠른 카드 2 설명입니다.', 'textarea', 'textarea', 1000, true),
  ('home.quick.3.title', 'home.quick', 'home', 'home.quick', '빠른 카드 3 제목', '', '후원·문의', '기존 key 호환용 빠른 카드 3 제목입니다.', 'text', 'text', 1010, true),
  ('home.quick.3.description', 'home.quick', 'home', 'home.quick', '빠른 카드 3 설명', '', '후원 상담과 문의를 공식 채널로 연결합니다.', '기존 key 호환용 빠른 카드 3 설명입니다.', 'textarea', 'textarea', 1020, true),
  ('home.concert.concertButton', 'home.concert', 'home', 'home.concert', '공연 일정 버튼', '', '공연 일정 보기', '기존 key 호환용 공연 CTA입니다.', 'text', 'text', 1030, true),
  ('home.concert.noticeButton', 'home.concert', 'home', 'home.concert', '공지사항 버튼', '', '공지사항 보기', '기존 key 호환용 공지 CTA입니다.', 'text', 'text', 1040, true),
  ('home.concert.ghost', 'home.concert', 'home', 'home.concert', '공연 배경 텍스트', '', 'PROGRAM', '기존 key 호환용 공연 고스트 텍스트입니다.', 'text', 'text', 1050, true),
  ('home.concert.programNoteLabel', 'home.concert', 'home', 'home.concert', '프로그램 노트 라벨', '', 'PROGRAM NOTE', '기존 key 호환용 공연 프로그램 라벨입니다.', 'text', 'text', 1060, true),
  ('home.concert.sectionTitle', 'home.concert', 'home', 'home.concert', '공연 섹션 제목', '', '공연과 소식', '기존 key 호환용 공연 섹션 제목입니다.', 'text', 'text', 1070, true),
  ('home.scorebook.coverTitle', 'home.score', 'home', 'home.score', '악보 표지 제목', '', E'정직한 음악과\n공동체의 울림을\n기록하는 악보집', '기존 key 호환용 Motet Score 표지 제목입니다.', 'textarea', 'textarea', 1080, true),
  ('home.scorebook.coverDescription', 'home.score', 'home', 'home.score', '악보 표지 설명', '', '정직한 음악과 공동체의 울림을 한 권의 악보처럼 기록합니다.', '기존 key 호환용 Motet Score 표지 설명입니다.', 'textarea', 'textarea', 1090, true),
  ('home.scorebook.finalTitle', 'home.score', 'home', 'home.score', '악보 최종 제목', '', E'목소리와 공동체의\n울림을 읽습니다', '기존 key 호환용 Motet Score 최종 제목입니다.', 'textarea', 'textarea', 1100, true),
  ('home.scorebook.finalDescription', 'home.score', 'home', 'home.score', '악보 최종 본문', '', E'합창은 소리를 맞추는 일을 넘어,\n사람을 세우는 교육입니다.', '기존 key 호환용 Motet Score 최종 본문입니다.', 'textarea', 'textarea', 1110, true),
  ('home.scorebook.rightTitle', 'home.score', 'home', 'home.score', '악보 오른쪽 제목', '', '함께 부르는 교육', '기존 key 호환용 Motet Score 오른쪽 제목입니다.', 'text', 'text', 1120, true),
  ('home.gallery.eyebrow', 'home.gallery', 'home', 'home.gallery', '갤러리 키커', '', 'ARCHIVE', '기존 key 호환용 갤러리 키커입니다.', 'text', 'text', 1130, true),
  ('home.gallery.sectionTitle', 'home.gallery', 'home', 'home.gallery', '갤러리 제목', '', '무대의 시간', '기존 key 호환용 갤러리 제목입니다.', 'text', 'text', 1140, true),
  ('home.gallery.sectionDescription', 'home.gallery', 'home', 'home.gallery', '갤러리 설명', '', '무대와 연습, 기록의 장면을 차분하게 모았습니다.', '기존 key 호환용 갤러리 설명입니다.', 'textarea', 'textarea', 1150, true),
  ('home.support.button', 'home.support', 'home', 'home.support', '후원 상담 CTA', '', '후원 상담 신청', '기존 key 호환용 후원 상담 CTA입니다.', 'text', 'text', 1160, true),
  ('home.support.secondaryButton', 'home.support', 'home', 'home.support', '후원 문의 CTA', '', '문의', '기존 key 호환용 후원 문의 CTA입니다.', 'text', 'text', 1170, true),
  ('home.support.cardTitle', 'home.support', 'home', 'home.support', '후원 카드 제목', '', '후원과 문의를 한곳에서 연결합니다', '기존 key 호환용 후원 카드 제목입니다.', 'text', 'text', 1180, true),
  ('home.support.cardDescription', 'home.support', 'home', 'home.support', '후원 카드 설명', '', '공연 초청, 후원 약정, 입단 문의를 공식 문의 채널을 통해 함께 접수합니다.', '기존 key 호환용 후원 카드 설명입니다.', 'textarea', 'textarea', 1190, true)
on conflict (key) do update
set
  group_name = excluded.group_name,
  page = excluded.page,
  section = excluded.section,
  label = excluded.label,
  default_value = excluded.default_value,
  description = excluded.description,
  input_type = excluded.input_type,
  value_type = excluded.value_type,
  sort_order = excluded.sort_order,
  is_active = public.site_texts.is_active;
