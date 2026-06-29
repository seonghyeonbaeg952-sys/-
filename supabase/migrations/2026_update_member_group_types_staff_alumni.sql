alter table public.members
add column if not exists member_status text not null default 'active';

update public.members
set member_status = 'alumni'
where group_type = 'alumni';

update public.members
set group_type = 'staff'
where group_type in ('other', 'alumni');

alter table public.members
drop constraint if exists members_group_type_check;

alter table public.members
drop constraint if exists members_member_status_check;

alter table public.members
alter column group_type set default 'middle';

alter table public.members
alter column member_status set default 'active';

alter table public.members
add constraint members_group_type_check
check (group_type in ('elementary', 'middle', 'high', 'university', 'staff'));

alter table public.members
add constraint members_member_status_check
check (member_status in ('active', 'alumni'));

comment on column public.members.group_type is
'Member group. Allowed values: elementary, middle, high, university, staff.';

comment on column public.members.member_status is
'Member activity status. Use active for current members and alumni for historical member listings.';
