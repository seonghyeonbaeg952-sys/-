alter table public.members
drop constraint if exists members_group_type_check;

alter table public.members
add constraint members_group_type_check
check (group_type in ('elementary', 'middle', 'high', 'university', 'staff'));
