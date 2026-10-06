-- A hidden group suppresses only public group metadata, not the member record.
-- Preserve the existing group values, generated names, grants and RLS policies.
alter table public.members
  drop constraint members_group_type_check,
  add constraint members_group_type_check
    check (group_type in ('elementary', 'middle', 'high', 'university', 'staff', 'hidden'));
