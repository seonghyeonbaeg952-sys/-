-- Support pledge public settings.
-- This stores public pledge form configuration and private donor submissions.
-- Public visitors can insert pledge submissions, but only admins can read them.

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
  add column if not exists enable_online_submission boolean not null default true,
  add column if not exists form_note text,
  add column if not exists privacy_notice text,
  add column if not exists print_button_label text,
  add column if not exists submit_button_label text,
  add column if not exists success_message text;

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
  updated_at timestamptz not null default now(),
  constraint support_pledges_gender_check check (gender in ('male', 'female', 'none') or gender is null),
  constraint support_pledges_member_type_check check (member_type in ('individual', 'corporate')),
  constraint support_pledges_status_check check (status in ('new', 'in_progress', 'done')),
  constraint support_pledges_name_not_blank_check check (length(btrim(name)) > 0),
  constraint support_pledges_phone_not_blank_check check (length(btrim(phone)) > 0),
  constraint support_pledges_email_not_blank_check check (length(btrim(email)) > 0),
  constraint support_pledges_amount_positive_check check (amount > 0),
  constraint support_pledges_signature_image_check check (
    signature_image_url is null
    or (
      length(signature_image_url) <= 200000
      and signature_image_url like 'data:image/png;base64,%'
    )
  )
);

alter table public.support_pledges
  add column if not exists signature_image_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_pledges_signature_image_check'
  ) then
    alter table public.support_pledges
      add constraint support_pledges_signature_image_check
      check (
        signature_image_url is null
        or (
          length(signature_image_url) <= 200000
          and signature_image_url like 'data:image/png;base64,%'
        )
      );
  end if;
end $$;

create index if not exists support_settings_public_visible_idx
on public.support_settings (created_at)
where is_visible = true;

create index if not exists support_pledges_status_created_idx
on public.support_pledges (status, created_at desc);

drop trigger if exists set_updated_at on public.support_settings;
create trigger set_updated_at
before update on public.support_settings
for each row
execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.support_pledges;
create trigger set_updated_at
before update on public.support_pledges
for each row
execute function public.set_updated_at();

alter table public.support_settings enable row level security;
alter table public.support_settings force row level security;
alter table public.support_pledges enable row level security;
alter table public.support_pledges force row level security;

grant select on public.support_settings to anon, authenticated;
grant select, insert, update, delete on public.support_settings to authenticated;
grant insert on public.support_pledges to anon, authenticated;
grant select, insert, update, delete on public.support_pledges to authenticated;

drop policy if exists public_read_visible on public.support_settings;
create policy public_read_visible
on public.support_settings
for select
to anon, authenticated
using (is_visible = true);

drop policy if exists admin_full_access on public.support_settings;
create policy admin_full_access
on public.support_settings
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists admin_full_access on public.support_pledges;
create policy admin_full_access
on public.support_pledges
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists support_pledges_public_insert on public.support_pledges;
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
  '후원 계좌 정보는 관리자 CMS에서 등록한 뒤 표시됩니다.',
  true,
  '입력한 후원약정 정보는 관리자에게만 전달되며 공개 화면에는 표시되지 않습니다.',
  '작성하신 개인정보는 후원 안내 및 약정 확인 목적으로만 사용되며, 관리자만 조회할 수 있습니다.',
  '작성 후 인쇄하거나 PDF로 저장할 수 있습니다. 온라인 제출 시 동일한 내용이 관리자 CMS에 저장됩니다.',
  '약정서 인쇄하기',
  '후원약정 제출',
  '후원약정이 접수되었습니다. 확인 후 연락드리겠습니다.',
  '서울모테트청소년합창단',
  '입력 내용은 관리자 CMS에 안전하게 저장되며 공개 화면에는 표시되지 않습니다.',
  true
where not exists (select 1 from public.support_settings);
