-- Backend/admin repair migration.
-- Non-destructive: preserves existing rows and existing public values.

-- site_texts: add columns expected by the admin CMS while keeping legacy
-- page/section/value_type columns for compatibility.
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
  group_name = coalesce(nullif(group_name, ''), nullif(section, ''), nullif(page, ''), 'home.hero'),
  input_type = coalesce(nullif(input_type, ''), case when value_type = 'textarea' then 'textarea' else 'text' end),
  value_type = coalesce(nullif(value_type, ''), case when input_type = 'textarea' then 'textarea' else 'text' end),
  default_value = coalesce(default_value, ''),
  value = coalesce(value, '')
where
  group_name is null
  or group_name = ''
  or input_type is null
  or input_type = ''
  or value_type is null
  or value_type = ''
  or default_value is null
  or value is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'site_texts_key_not_blank_check'
  ) then
    alter table public.site_texts
      add constraint site_texts_key_not_blank_check
      check (length(btrim(key)) > 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'site_texts_input_type_check'
  ) then
    alter table public.site_texts
      add constraint site_texts_input_type_check
      check (input_type in ('text', 'textarea', 'url', 'label')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'site_texts_value_type_check'
  ) then
    alter table public.site_texts
      add constraint site_texts_value_type_check
      check (value_type in ('text', 'textarea', 'markdown')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'site_texts_no_html_value_check'
  ) then
    alter table public.site_texts
      add constraint site_texts_no_html_value_check
      check (
        value !~* '<[[:space:]]*/?[[:space:]]*[a-z][^>]*>'
        and default_value !~* '<[[:space:]]*/?[[:space:]]*[a-z][^>]*>'
        and value !~* 'javascript:'
        and default_value !~* 'javascript:'
      ) not valid;
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
revoke insert, update, delete on public.site_texts from anon;

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

-- contacts: add admin note/reply fields and support the restored status values.
alter table public.contacts
  add column if not exists admin_note text,
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz,
  add column if not exists replied_by uuid references auth.users(id) on delete set null;

alter table public.contacts
  drop constraint if exists contacts_type_check,
  drop constraint if exists contacts_status_check;

alter table public.contacts
  add constraint contacts_type_check
  check (type in ('join', 'concert_request', 'support', 'general', 'other')) not valid,
  add constraint contacts_status_check
  check (
    status in (
      'new',
      'reviewing',
      'answered',
      'on_hold',
      'archived',
      'in_progress',
      'done'
    )
  ) not valid;

create index if not exists contacts_status_created_idx
on public.contacts (status, created_at desc);

alter table public.contacts enable row level security;
alter table public.contacts force row level security;

grant insert on public.contacts to anon, authenticated;
grant select, insert, update, delete on public.contacts to authenticated;
revoke select, update, delete on public.contacts from anon;
revoke select, update, delete on public.contacts from public;

drop policy if exists contacts_public_insert on public.contacts;
create policy contacts_public_insert
on public.contacts
for insert
to anon, authenticated
with check (
  privacy_agreed = true
  and status = 'new'
  and admin_note is null
  and admin_reply is null
  and replied_at is null
  and replied_by is null
);

drop policy if exists admin_full_access on public.contacts;
drop policy if exists contacts_admin_full_access on public.contacts;
create policy contacts_admin_full_access
on public.contacts
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- join_applications: restore reproducible table, RLS, and private storage bucket.
create table if not exists public.join_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null,
  applicant_phone text not null,
  email text not null,
  guardian_name text,
  guardian_phone text,
  birth_date date,
  gender text,
  region text,
  school text,
  grade text,
  desired_part text,
  choir_experience text,
  lesson_experience text,
  music_experience text,
  awards text,
  motivation text,
  vision text,
  contact_time text,
  photo_file_path text,
  recommendation_file_path text,
  recommender_name text,
  recommender_affiliation text,
  recommender_reason text,
  privacy_agreed boolean not null default false,
  status text not null default 'new',
  admin_notes text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.join_applications
  add column if not exists applicant_name text,
  add column if not exists applicant_phone text,
  add column if not exists email text,
  add column if not exists guardian_name text,
  add column if not exists guardian_phone text,
  add column if not exists birth_date date,
  add column if not exists gender text,
  add column if not exists region text,
  add column if not exists school text,
  add column if not exists grade text,
  add column if not exists desired_part text,
  add column if not exists choir_experience text,
  add column if not exists lesson_experience text,
  add column if not exists music_experience text,
  add column if not exists awards text,
  add column if not exists motivation text,
  add column if not exists vision text,
  add column if not exists contact_time text,
  add column if not exists photo_file_path text,
  add column if not exists recommendation_file_path text,
  add column if not exists recommender_name text,
  add column if not exists recommender_affiliation text,
  add column if not exists recommender_reason text,
  add column if not exists privacy_agreed boolean not null default false,
  add column if not exists status text not null default 'new',
  add column if not exists admin_notes text,
  add column if not exists is_archived boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'join_applications_status_check'
  ) then
    alter table public.join_applications
      add constraint join_applications_status_check
      check (status in ('new', 'in_review', 'accepted', 'rejected', 'archived')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'join_applications_required_check'
  ) then
    alter table public.join_applications
      add constraint join_applications_required_check
      check (
        coalesce(length(btrim(applicant_name)), 0) > 0
        and coalesce(length(btrim(applicant_phone)), 0) > 0
        and coalesce(length(btrim(email)), 0) > 0
      ) not valid;
  end if;
end $$;

create index if not exists join_applications_status_created_idx
on public.join_applications (status, created_at desc);

create index if not exists join_applications_archived_created_idx
on public.join_applications (is_archived, created_at desc);

drop trigger if exists set_updated_at on public.join_applications;
create trigger set_updated_at
before update on public.join_applications
for each row execute function public.set_updated_at();

alter table public.join_applications enable row level security;
alter table public.join_applications force row level security;

grant insert on public.join_applications to anon, authenticated;
grant select, insert, update, delete on public.join_applications to authenticated;
revoke select, update, delete on public.join_applications from anon;
revoke select, update, delete on public.join_applications from public;

drop policy if exists join_applications_public_insert on public.join_applications;
create policy join_applications_public_insert
on public.join_applications
for insert
to anon, authenticated
with check (
  privacy_agreed = true
  and status = 'new'
  and coalesce(is_archived, false) = false
  and admin_notes is null
  and photo_file_path is not null
  and length(btrim(photo_file_path)) > 0
);

drop policy if exists join_applications_admin_full_access on public.join_applications;
create policy join_applications_admin_full_access
on public.join_applications
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'join-application-files',
  'join-application-files',
  false,
  10485760,
  array[
    'application/pdf',
    'application/x-hwp',
    'application/haansofthwp',
    'application/vnd.hancom.hwp',
    'application/vnd.hancom.hwpx',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = coalesce(storage.buckets.file_size_limit, excluded.file_size_limit),
  allowed_mime_types = coalesce(storage.buckets.allowed_mime_types, excluded.allowed_mime_types);

drop policy if exists join_application_files_public_read on storage.objects;
drop policy if exists join_application_files_public_select on storage.objects;
drop policy if exists join_application_files_public_insert on storage.objects;
create policy join_application_files_public_insert
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'join-application-files'
  and name like 'submissions/%'
);

drop policy if exists join_application_files_admin_select on storage.objects;
create policy join_application_files_admin_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'join-application-files'
  and (select public.is_admin())
);

drop policy if exists join_application_files_admin_update on storage.objects;
create policy join_application_files_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'join-application-files'
  and (select public.is_admin())
)
with check (
  bucket_id = 'join-application-files'
  and (select public.is_admin())
);

drop policy if exists join_application_files_admin_delete on storage.objects;
create policy join_application_files_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'join-application-files'
  and (select public.is_admin())
);
