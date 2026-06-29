-- Sync migration for the Spirit/support CMS rollout.
-- This file is intentionally idempotent and avoids destructive data changes.
-- Run after the base schema and earlier 2026 migrations if the remote DB is missing
-- recently added support, conductor, accompanist, or member columns.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Support settings: public copy/form settings managed from /admin/support.
-- ---------------------------------------------------------------------------

create table if not exists public.support_settings (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  description text,
  message text,
  individual_amounts text,
  corporate_amounts text,
  allow_custom_amount boolean not null default true,
  bank_name text,
  bank_account_number text,
  bank_account_holder text,
  bank_note text,
  enable_online_submission boolean not null default true,
  form_note text,
  privacy_notice text,
  print_note text,
  print_button_label text,
  submit_button_label text,
  success_message text,
  contact_phone text,
  contact_email text,
  homepage_url text,
  organization_name text,
  footer_note text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_settings
  add column if not exists title text,
  add column if not exists subtitle text,
  add column if not exists description text,
  add column if not exists message text,
  add column if not exists individual_amounts text,
  add column if not exists corporate_amounts text,
  add column if not exists allow_custom_amount boolean not null default true,
  add column if not exists bank_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_account_holder text,
  add column if not exists bank_note text,
  add column if not exists enable_online_submission boolean not null default true,
  add column if not exists form_note text,
  add column if not exists privacy_notice text,
  add column if not exists print_note text,
  add column if not exists print_button_label text,
  add column if not exists submit_button_label text,
  add column if not exists success_message text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists homepage_url text,
  add column if not exists organization_name text,
  add column if not exists footer_note text,
  add column if not exists is_visible boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists support_settings_public_visible_idx
on public.support_settings (created_at)
where is_visible = true;

drop trigger if exists set_updated_at on public.support_settings;
create trigger set_updated_at
before update on public.support_settings
for each row
execute function public.set_updated_at();

alter table public.support_settings enable row level security;
alter table public.support_settings force row level security;

grant select on public.support_settings to anon, authenticated;
grant select, insert, update, delete on public.support_settings to authenticated;

drop policy if exists public_read_visible on public.support_settings;
drop policy if exists admin_full_access on public.support_settings;
drop policy if exists support_settings_public_read_visible on public.support_settings;
drop policy if exists support_settings_admin_full_access on public.support_settings;

create policy support_settings_public_read_visible
on public.support_settings
for select
to anon, authenticated
using (is_visible = true);

create policy support_settings_admin_full_access
on public.support_settings
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into public.support_settings (
  title,
  subtitle,
  description,
  message,
  individual_amounts,
  corporate_amounts,
  allow_custom_amount,
  bank_note,
  enable_online_submission,
  form_note,
  privacy_notice,
  print_note,
  print_button_label,
  submit_button_label,
  success_message,
  organization_name,
  footer_note,
  is_visible
)
select
  '후원약정',
  '서울모테트청소년합창단을 후원합니다.',
  '청소년들이 음악 안에서 성장하고, 나눔과 사랑을 실천할 수 있도록 후원에 동참해 주세요.',
  '후원은 정기연습, 공연, 초청연주, 봉사연주가 안정적으로 이어지는 기반이 됩니다.',
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
  '후원 계좌 정보는 관리자 CMS에서 등록한 뒤 표시합니다.',
  true,
  '작성한 후원약정 정보는 관리자에게만 전달되며 공개 화면에는 표시되지 않습니다.',
  '작성하신 개인정보는 후원 안내 및 약정 확인 목적으로만 사용되며, 관리자만 조회할 수 있습니다.',
  '작성 후 인쇄하거나 PDF로 저장할 수 있습니다. 실제 자동이체 출금은 별도 확인 절차 후 처리합니다.',
  '후원약정서 인쇄',
  '후원약정 제출',
  '후원약정이 접수되었습니다. 확인 후 연락드리겠습니다.',
  '서울모테트청소년합창단',
  '입력 내용은 관리자 CMS에 안전하게 저장되며 공개 화면에는 표시되지 않습니다.',
  true
where not exists (select 1 from public.support_settings);

-- ---------------------------------------------------------------------------
-- Support pledges: donor submissions. Visitors can insert only; admins manage.
-- ---------------------------------------------------------------------------

create table if not exists public.support_pledges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text,
  birth_date date,
  phone text not null,
  email text not null,
  address text,
  member_type text not null default 'individual',
  amount integer not null,
  custom_amount integer,
  depositor text,
  pledge_date date,
  signer_name text,
  signature_image_url text,
  privacy_agreed boolean not null default false,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_pledges
  add column if not exists name text,
  add column if not exists gender text,
  add column if not exists birth_date date,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists member_type text default 'individual',
  add column if not exists amount integer,
  add column if not exists custom_amount integer,
  add column if not exists depositor text,
  add column if not exists pledge_date date,
  add column if not exists signer_name text,
  add column if not exists signature_image_url text,
  add column if not exists privacy_agreed boolean not null default false,
  add column if not exists status text not null default 'new',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.support_pledges
  alter column member_type set default 'individual',
  alter column privacy_agreed set default false,
  alter column status set default 'new';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_pledges_gender_check'
      and conrelid = 'public.support_pledges'::regclass
  ) then
    alter table public.support_pledges
      add constraint support_pledges_gender_check
      check (gender in ('male', 'female', 'none') or gender is null)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_pledges_member_type_check'
      and conrelid = 'public.support_pledges'::regclass
  ) then
    alter table public.support_pledges
      add constraint support_pledges_member_type_check
      check (member_type in ('individual', 'corporate'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_pledges_status_check'
      and conrelid = 'public.support_pledges'::regclass
  ) then
    alter table public.support_pledges
      add constraint support_pledges_status_check
      check (status in ('new', 'in_progress', 'done'))
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_pledges_amount_positive_check'
      and conrelid = 'public.support_pledges'::regclass
  ) then
    alter table public.support_pledges
      add constraint support_pledges_amount_positive_check
      check (amount > 0)
      not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_pledges_signature_image_check'
      and conrelid = 'public.support_pledges'::regclass
  ) then
    alter table public.support_pledges
      add constraint support_pledges_signature_image_check
      check (
        signature_image_url is null
        or (
          length(signature_image_url) <= 200000
          and signature_image_url like 'data:image/png;base64,%'
        )
      )
      not valid;
  end if;
end $$;

create index if not exists support_pledges_status_created_idx
on public.support_pledges (status, created_at desc);

drop trigger if exists set_updated_at on public.support_pledges;
create trigger set_updated_at
before update on public.support_pledges
for each row
execute function public.set_updated_at();

alter table public.support_pledges enable row level security;
alter table public.support_pledges force row level security;

revoke select, update, delete on public.support_pledges from anon;
revoke select, update, delete on public.support_pledges from public;

grant insert on public.support_pledges to anon, authenticated;
grant select, insert, update, delete on public.support_pledges to authenticated;

drop policy if exists admin_full_access on public.support_pledges;
drop policy if exists support_pledges_admin_full_access on public.support_pledges;
drop policy if exists support_pledges_public_insert on public.support_pledges;

create policy support_pledges_admin_full_access
on public.support_pledges
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy support_pledges_public_insert
on public.support_pledges
for insert
to anon, authenticated
with check (
  privacy_agreed = true
  and status = 'new'
  and amount > 0
  and (
    signature_image_url is null
    or (
      length(signature_image_url) <= 200000
      and signature_image_url like 'data:image/png;base64,%'
    )
  )
);

-- ---------------------------------------------------------------------------
-- Public profile extension columns used by the official profile document UI.
-- ---------------------------------------------------------------------------

alter table public.conductor
  add column if not exists profile_image_alt text,
  add column if not exists profile_summary text,
  add column if not exists profile_highlight text,
  add column if not exists hero_quote text,
  add column if not exists current_roles text,
  add column if not exists education_items text,
  add column if not exists career_items text,
  add column if not exists awards_items text,
  add column if not exists activities_items text,
  add column if not exists philosophy_title text,
  add column if not exists philosophy_body text,
  add column if not exists philosophy_quote text,
  add column if not exists teaching_principles text,
  add column if not exists message_title text,
  add column if not exists message_body text,
  add column if not exists activity_images text,
  add column if not exists is_featured boolean not null default true;

alter table public.accompanist
  add column if not exists role text,
  add column if not exists photo_url text,
  add column if not exists description text,
  add column if not exists bio text,
  add column if not exists message text,
  add column if not exists is_visible boolean not null default true,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.members
  add column if not exists member_status text not null default 'active';

alter table public.members
  alter column group_type set default 'middle',
  alter column member_status set default 'active';

alter table public.members
drop constraint if exists members_group_type_check;

alter table public.members
drop constraint if exists members_member_status_check;

alter table public.members
add constraint members_group_type_check
check (group_type in ('elementary', 'middle', 'high', 'university', 'staff'))
not valid;

alter table public.members
add constraint members_member_status_check
check (member_status in ('active', 'alumni'))
not valid;

comment on column public.members.group_type is
'Member group. Allowed values for new CMS edits: elementary, middle, high, university, staff.';

comment on column public.members.member_status is
'Member activity status. Use active for current members and alumni for historical member listings.';
