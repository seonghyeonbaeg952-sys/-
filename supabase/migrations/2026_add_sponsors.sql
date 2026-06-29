-- Sponsors / partner organizations for public display.
-- Run after the base schema. This does not expose support_pledges data.

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_name text,
  category text not null default 'other',
  tier text not null default 'supporter',
  description text,
  logo_url text,
  website_url text,
  start_date date,
  end_date date,
  is_visible boolean not null default false,
  consent_public boolean not null default false,
  show_on_home boolean not null default false,
  show_on_support boolean not null default true,
  show_on_footer boolean not null default false,
  display_order integer not null default 0,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sponsors
  add column if not exists display_name text,
  add column if not exists category text not null default 'other',
  add column if not exists tier text not null default 'supporter',
  add column if not exists description text,
  add column if not exists logo_url text,
  add column if not exists website_url text,
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists is_visible boolean not null default false,
  add column if not exists consent_public boolean not null default false,
  add column if not exists show_on_home boolean not null default false,
  add column if not exists show_on_support boolean not null default true,
  add column if not exists show_on_footer boolean not null default false,
  add column if not exists display_order integer not null default 0,
  add column if not exists internal_notes text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sponsors_name_not_blank_check'
  ) then
    alter table public.sponsors
      add constraint sponsors_name_not_blank_check
      check (length(btrim(name)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'sponsors_category_check'
  ) then
    alter table public.sponsors
      add constraint sponsors_category_check
      check (
        category in (
          'corporate',
          'church',
          'institution',
          'foundation',
          'individual',
          'media',
          'other'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'sponsors_tier_check'
  ) then
    alter table public.sponsors
      add constraint sponsors_tier_check
      check (
        tier in (
          'main',
          'education',
          'performance',
          'partner',
          'in_kind',
          'supporter'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'sponsors_date_range_check'
  ) then
    alter table public.sponsors
      add constraint sponsors_date_range_check
      check (
        start_date is null
        or end_date is null
        or start_date <= end_date
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'sponsors_website_url_check'
  ) then
    alter table public.sponsors
      add constraint sponsors_website_url_check
      check (
        website_url is null
        or website_url ~* '^https?://'
      );
  end if;
end $$;

create index if not exists sponsors_public_home_order_idx
on public.sponsors (show_on_home, display_order, created_at)
where is_visible = true and consent_public = true;

create index if not exists sponsors_public_support_order_idx
on public.sponsors (show_on_support, display_order, created_at)
where is_visible = true and consent_public = true;

create index if not exists sponsors_public_footer_order_idx
on public.sponsors (show_on_footer, display_order, created_at)
where is_visible = true and consent_public = true;

create index if not exists sponsors_admin_order_idx
on public.sponsors (display_order, created_at);

drop trigger if exists set_updated_at on public.sponsors;
create trigger set_updated_at
before update on public.sponsors
for each row execute function public.set_updated_at();

alter table public.sponsors enable row level security;
alter table public.sponsors force row level security;

grant select on public.sponsors to anon, authenticated;
grant insert, update, delete on public.sponsors to authenticated;

drop policy if exists sponsors_public_read_visible on public.sponsors;
create policy sponsors_public_read_visible
on public.sponsors
for select
to anon, authenticated
using (
  is_visible = true
  and consent_public = true
);

drop policy if exists sponsors_admin_full_access on public.sponsors;
create policy sponsors_admin_full_access
on public.sponsors
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Allow admin uploads to site-images/sponsors.
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
      'locations',
      'brand',
      'sponsors'
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
      'locations',
      'brand',
      'sponsors'
    ]
  )
);
