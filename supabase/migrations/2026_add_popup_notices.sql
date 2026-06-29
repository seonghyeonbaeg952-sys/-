-- Home popup notices for Seoul Motet Youth Choir.
-- Run this in Supabase SQL Editor after the base schema has been applied.
-- Do not include secrets in this file.

create table if not exists public.popup_notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  image_url text,
  image_alt text,
  button_label text,
  button_href text,
  starts_on date,
  ends_on date,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint popup_notices_date_range_check check (
    starts_on is null
    or ends_on is null
    or starts_on <= ends_on
  )
);

create index if not exists popup_notices_visible_order_date_idx
on public.popup_notices (is_visible, display_order, starts_on, ends_on);

create index if not exists popup_notices_public_visible_idx
on public.popup_notices (display_order)
where is_visible = true;

drop trigger if exists set_updated_at on public.popup_notices;
create trigger set_updated_at
before update on public.popup_notices
for each row
execute function public.set_updated_at();

alter table public.popup_notices enable row level security;
alter table public.popup_notices force row level security;

grant select on public.popup_notices to anon, authenticated;
grant select, insert, update, delete on public.popup_notices to authenticated;

drop policy if exists public_read_visible on public.popup_notices;
create policy public_read_visible
on public.popup_notices
for select
to anon, authenticated
using (is_visible = true);

drop policy if exists admin_full_access on public.popup_notices;
create policy admin_full_access
on public.popup_notices
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

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
      'popups',
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
      'popups',
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
