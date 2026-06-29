alter table public.locations
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists image_caption text;

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
      'locations',
      'brand'
    ]
  )
);
