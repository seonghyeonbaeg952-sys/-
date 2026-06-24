-- 서울모테트청소년합창단 공식 홈페이지 Supabase schema + RLS
-- Run in the Supabase SQL Editor after creating the Supabase project.
-- Do not place real passwords, service_role keys, anon keys, or Figma tokens in this file.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('admin', 'viewer'))
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles
      where id = (select auth.uid())
        and role = 'admin'
    ),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_title text,
  hero_title text,
  hero_subtitle text,
  about_summary text,
  support_text text,
  join_cta_text text,
  email text,
  phone text,
  fax text,
  address text,
  instagram_url text,
  youtube_url text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  description text,
  image_url text,
  image_alt text,
  primary_cta_label text,
  primary_cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conductor (
  id uuid primary key default gen_random_uuid(),
  name text,
  role text,
  photo_url text,
  description text,
  bio text,
  message text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accompanist (
  id uuid primary key default gen_random_uuid(),
  name text,
  role text,
  photo_url text,
  description text,
  bio text,
  message text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text,
  part text not null default 'other',
  group_type text not null default 'other',
  photo_url text,
  description text,
  is_visible boolean not null default true,
  name_display_type text not null default 'hidden',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_part_check check (part in ('soprano', 'alto', 'tenor', 'bass', 'other')),
  constraint members_group_type_check check (group_type in ('elementary', 'middle', 'high', 'alumni', 'other')),
  constraint members_name_display_type_check check (name_display_type in ('full', 'partial', 'hidden'))
);

create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  year text not null,
  month text,
  title text,
  content text not null,
  image_url text,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  place_name text,
  address text,
  map_embed_url text,
  naver_map_url text,
  kakao_map_url text,
  transit_info text,
  parking_info text,
  phone text,
  fax text,
  email text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.concerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'other',
  concert_date date,
  concert_time text,
  location text,
  poster_url text,
  description text,
  program text,
  performers text,
  ticket_url text,
  apply_url text,
  status text not null default 'upcoming',
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concerts_category_check check (category in ('regular', 'invited', 'special', 'church', 'past', 'other')),
  constraint concerts_status_check check (status in ('upcoming', 'open', 'ticketing', 'closed', 'past', 'canceled'))
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'notice',
  content text,
  cover_image_url text,
  is_important boolean not null default false,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notices_category_check check (category in ('notice', 'join', 'concert', 'rehearsal', 'press', 'news'))
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text,
  image_url text,
  description text,
  taken_at date,
  related_concert_id uuid references public.concerts(id) on delete set null,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  youtube_url text,
  youtube_id text,
  description text,
  related_concert_id uuid references public.concerts(id) on delete set null,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posters (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text,
  concert_date date,
  related_concert_id uuid references public.concerts(id) on delete set null,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.join_info (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  target text,
  parts text,
  audition_process text,
  preparation text,
  rehearsal_time text,
  rehearsal_location text,
  application_url text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text,
  category text default 'join',
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  type text not null default 'general',
  title text,
  message text not null,
  privacy_agreed boolean not null default false,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_type_check check (type in ('join', 'concert_request', 'support', 'general')),
  constraint contacts_status_check check (status in ('new', 'in_progress', 'done')),
  constraint contacts_name_not_blank_check check (length(btrim(name)) > 0),
  constraint contacts_email_not_blank_check check (length(btrim(email)) > 0),
  constraint contacts_message_not_blank_check check (length(btrim(message)) > 0)
);

-- Indexes for public listing queries, RLS helper lookups, and foreign keys.
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists hero_slides_visible_order_idx on public.hero_slides (is_visible, display_order, created_at);
create index if not exists members_visible_part_order_idx on public.members (is_visible, part, display_order);
create index if not exists concerts_visible_date_status_category_idx on public.concerts (is_visible, concert_date, status, category);
create index if not exists notices_visible_important_created_category_idx on public.notices (is_visible, is_important, created_at desc, category);
create index if not exists gallery_visible_order_taken_idx on public.gallery (is_visible, display_order, taken_at);
create index if not exists videos_visible_order_idx on public.videos (is_visible, display_order);
create index if not exists posters_visible_order_date_idx on public.posters (is_visible, display_order, concert_date);
create index if not exists faq_visible_order_idx on public.faq (is_visible, display_order);
create index if not exists contacts_status_type_created_idx on public.contacts (status, type, created_at desc);
create index if not exists gallery_related_concert_id_idx on public.gallery (related_concert_id);
create index if not exists videos_related_concert_id_idx on public.videos (related_concert_id);
create index if not exists posters_related_concert_id_idx on public.posters (related_concert_id);

-- Smaller helper indexes for the common public "visible only" filters.
create index if not exists site_settings_public_visible_idx on public.site_settings (created_at) where is_visible = true;
create index if not exists conductor_public_visible_idx on public.conductor (created_at) where is_visible = true;
create index if not exists accompanist_public_visible_idx on public.accompanist (created_at) where is_visible = true;
create index if not exists history_public_visible_order_idx on public.history (display_order, year) where is_visible = true;
create index if not exists locations_public_visible_idx on public.locations (created_at) where is_visible = true;
create index if not exists join_info_public_visible_idx on public.join_info (created_at) where is_visible = true;

-- updated_at triggers.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles',
    'site_settings',
    'hero_slides',
    'conductor',
    'accompanist',
    'members',
    'history',
    'locations',
    'concerts',
    'notices',
    'gallery',
    'videos',
    'posters',
    'join_info',
    'faq',
    'contacts'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', target_table);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      target_table
    );
  end loop;
end $$;

-- RLS enablement.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles',
    'site_settings',
    'hero_slides',
    'conductor',
    'accompanist',
    'members',
    'history',
    'locations',
    'concerts',
    'notices',
    'gallery',
    'videos',
    'posters',
    'join_info',
    'faq',
    'contacts'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);
    execute format('alter table public.%I force row level security', target_table);
  end loop;
end $$;

-- API grants. RLS policies still decide which rows are allowed.
grant usage on schema public to anon, authenticated;

grant select on
  public.site_settings,
  public.hero_slides,
  public.conductor,
  public.accompanist,
  public.members,
  public.history,
  public.locations,
  public.concerts,
  public.notices,
  public.gallery,
  public.videos,
  public.posters,
  public.join_info,
  public.faq
to anon, authenticated;

grant insert on public.contacts to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.site_settings,
  public.hero_slides,
  public.conductor,
  public.accompanist,
  public.members,
  public.history,
  public.locations,
  public.concerts,
  public.notices,
  public.gallery,
  public.videos,
  public.posters,
  public.join_info,
  public.faq,
  public.contacts
to authenticated;

-- Public select policies for visible public content.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'site_settings',
    'hero_slides',
    'conductor',
    'accompanist',
    'members',
    'history',
    'locations',
    'concerts',
    'notices',
    'gallery',
    'videos',
    'posters',
    'join_info',
    'faq'
  ]
  loop
    execute format('drop policy if exists public_read_visible on public.%I', target_table);
    execute format(
      'create policy public_read_visible on public.%I for select to anon, authenticated using (is_visible = true)',
      target_table
    );
  end loop;
end $$;

-- Admin full-access policies for public content and contacts.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'site_settings',
    'hero_slides',
    'conductor',
    'accompanist',
    'members',
    'history',
    'locations',
    'concerts',
    'notices',
    'gallery',
    'videos',
    'posters',
    'join_info',
    'faq',
    'contacts'
  ]
  loop
    execute format('drop policy if exists admin_full_access on public.%I', target_table);
    execute format(
      'create policy admin_full_access on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',
      target_table
    );
  end loop;
end $$;

-- contacts: visitors may create inquiries only after privacy agreement.
drop policy if exists contacts_public_insert on public.contacts;
create policy contacts_public_insert
on public.contacts
for insert
to anon, authenticated
with check (
  privacy_agreed = true
  and status = 'new'
);

-- profiles: users can read only their own row; admins can manage profile rows.
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select
on public.profiles
for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists profiles_admin_full_access on public.profiles;
create policy profiles_admin_full_access
on public.profiles
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Storage bucket. If this insert/update is restricted in your project, create it
-- in Dashboard > Storage and then keep the policies below.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'site-images',
  'site-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists site_images_public_read on storage.objects;
create policy site_images_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-images');

drop policy if exists site_images_admin_insert on storage.objects;
create policy site_images_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-images'
  and (select public.is_admin())
  and (storage.foldername(name))[1] = any (
    array[
      'hero',
      'settings',
      'conductor',
      'accompanist',
      'members',
      'concerts',
      'gallery',
      'posters',
      'notices',
      'history',
      'brand'
    ]
  )
);

drop policy if exists site_images_admin_update on storage.objects;
create policy site_images_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-images'
  and (select public.is_admin())
)
with check (
  bucket_id = 'site-images'
  and (select public.is_admin())
  and (storage.foldername(name))[1] = any (
    array[
      'hero',
      'settings',
      'conductor',
      'accompanist',
      'members',
      'concerts',
      'gallery',
      'posters',
      'notices',
      'history',
      'brand'
    ]
  )
);

drop policy if exists site_images_admin_delete on storage.objects;
create policy site_images_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-images'
  and (select public.is_admin())
);

-- Admin profile setup example:
-- 1. Create the admin user with Supabase Auth Dashboard or an official Auth flow.
-- 2. Copy that Auth user's UUID.
-- 3. Connect the Auth user to an admin profile with SQL like this:
--
-- insert into public.profiles (id, email, role)
-- values ('<auth-user-uuid>', '<admin-email>', 'admin')
-- on conflict (id) do update
-- set role = 'admin', email = excluded.email, updated_at = now();
--
-- Never store an admin password in public.profiles or any application table.
