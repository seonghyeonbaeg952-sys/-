alter table public.locations
add column if not exists email text,
add column if not exists fax text;
