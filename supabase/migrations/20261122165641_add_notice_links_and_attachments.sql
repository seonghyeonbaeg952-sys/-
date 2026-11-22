begin;
set local lock_timeout = '3s';
set local statement_timeout = '20s';

alter table public.notices
  add column if not exists external_url text,
  add column if not exists attachments text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.notices'::regclass and conname = 'notices_external_url_format'
  ) then
    alter table public.notices add constraint notices_external_url_format
      check (external_url is null or (
        char_length(external_url) <= 2048
        and external_url ~* '^https?://[^[:space:]/@?#]+([/?#]|$)'
        and external_url !~ '[[:space:][:cntrl:]]'
        and position(chr(92) in external_url) = 0
      ));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.notices'::regclass and conname = 'notices_attachment_paths'
  ) then
    alter table public.notices add constraint notices_attachment_paths
      check (case
        when cardinality(attachments) = 0 then true
        when array_ndims(attachments) <> 1 or cardinality(attachments) > 5 then false
        else array_position(attachments, null) is null
          and char_length(array_to_string(attachments, ' ')) <= 5000
          and array_to_string(attachments, ' ') ~
            '^([a-f0-9-]{36}/[A-Za-z0-9_-]+[.](pdf|hwp|hwpx|docx|xlsx|pptx|jpg|jpeg|png)( |$))+$'
      end);
  end if;
end $$;

create index if not exists notices_visible_attachments_idx
  on public.notices using gin (attachments) where is_visible = true;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'notice-attachments', 'notice-attachments', false, 5242880,
  array[
    'application/pdf', 'application/x-hwp', 'application/hwp+zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg', 'image/png'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists notice_attachments_public_read on storage.objects;
create policy notice_attachments_public_read
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'notice-attachments'
    and exists (
      select 1 from public.notices as notice
      where notice.is_visible = true and notice.attachments @> array[storage.objects.name]
    )
  );

drop policy if exists notice_attachments_admin_read on storage.objects;
create policy notice_attachments_admin_read
  on storage.objects for select to authenticated
  using (bucket_id = 'notice-attachments' and (select public.is_admin()));

drop policy if exists notice_attachments_admin_insert on storage.objects;
create policy notice_attachments_admin_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'notice-attachments'
    and (select public.is_admin())
    and name ~ '^[a-f0-9-]{36}/[A-Za-z0-9_-]+[.](pdf|hwp|hwpx|docx|xlsx|pptx|jpg|jpeg|png)$'
  );

drop policy if exists notice_attachments_admin_delete on storage.objects;
create policy notice_attachments_admin_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'notice-attachments' and (select public.is_admin()));

commit;
