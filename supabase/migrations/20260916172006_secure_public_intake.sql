-- Additive intake boundary. Deploy and verify RPCs before switching consumers.
-- The final grant revocations require the matching client in the same release.
begin;
create schema cms_intake_private;
revoke all on schema cms_intake_private from public,anon,authenticated;

create table public.intake_limits (
  kind text primary key check(kind in ('contact','pledge','join')),
  hourly_total integer not null default 100 check(hourly_total between 10 and 10000),
  hourly_contact integer not null default 5 check(hourly_contact between 1 and 100),
  check(hourly_contact <= hourly_total)
);
insert into public.intake_limits(kind) values('contact'),('pledge'),('join');
alter table public.intake_limits enable row level security;
alter table public.intake_limits force row level security;
revoke all on public.intake_limits from public,anon,authenticated;
grant select,update(hourly_total,hourly_contact) on public.intake_limits to authenticated;
create policy intake_limits_admin_read on public.intake_limits for select to authenticated
  using ((select public.is_admin()));
create policy intake_limits_admin_update on public.intake_limits for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create table cms_intake_private.receipts (
  kind text not null references public.intake_limits(kind),
  request_id uuid not null,
  payload_hash bytea not null,
  contact_hash bytea not null,
  accepted_at timestamptz not null default clock_timestamp(),
  primary key(kind,request_id)
);
alter table cms_intake_private.receipts enable row level security;
alter table cms_intake_private.receipts force row level security;
revoke all on cms_intake_private.receipts from public,anon,authenticated;
create index intake_receipts_hour on cms_intake_private.receipts(kind,accepted_at);
create index intake_receipts_contact_hour on cms_intake_private.receipts(kind,contact_hash,accepted_at);

-- Bounded rolling-hour capacity control, not proof of identity or network DDoS protection.
-- A per-kind transaction lock makes count+insert atomic across concurrent requests.
create function cms_intake_private.claim(p_kind text,p_id uuid,p_payload jsonb,p_contact text)
returns boolean language plpgsql security definer set search_path='' as $$
declare
  prior cms_intake_private.receipts%rowtype;
  limits public.intake_limits%rowtype;
  fingerprint bytea := pg_catalog.sha256(pg_catalog.convert_to(p_payload::text,'UTF8'));
  subject bytea := pg_catalog.sha256(pg_catalog.convert_to(lower(btrim(p_contact)),'UTF8'));
  since_at timestamptz;
begin
  if p_kind not in ('contact','pledge','join') or p_id is null or p_contact is null
    or p_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception using errcode='22023',message='필수 항목과 입력 내용을 확인해 주세요.';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('cms-intake:'||p_kind,0));
  select * into prior from cms_intake_private.receipts where kind=p_kind and request_id=p_id;
  if found then
    if prior.payload_hash=fingerprint then return false; end if;
    raise exception using errcode='22023',message='같은 제출 요청의 내용이 변경되었습니다. 새 요청으로 다시 제출해 주세요.';
  end if;
  select * into strict limits from public.intake_limits where kind=p_kind for share;
  since_at := clock_timestamp()-interval '1 hour';
  if (select count(*) from cms_intake_private.receipts where kind=p_kind and accepted_at>since_at)>=limits.hourly_total
    or (select count(*) from cms_intake_private.receipts where kind=p_kind and contact_hash=subject and accepted_at>since_at)>=limits.hourly_contact then
    raise exception using errcode='P0001',message='접수 요청이 많습니다. 한 시간 후 다시 시도해 주세요.';
  end if;
  insert into cms_intake_private.receipts(kind,request_id,payload_hash,contact_hash)
    values(p_kind,p_id,fingerprint,subject);
  return true;
end $$;

create function cms_intake_private.text_ok(v jsonb, maximum integer, required boolean default false)
returns boolean language sql immutable set search_path='' as $$
  select case when v='null'::jsonb then not required
    when jsonb_typeof(v)='string' then
      length(v#>>'{}')<=maximum and octet_length(v#>>'{}')<=maximum*4
      and (not required or length(regexp_replace(v#>>'{}','[[:space:]]','','g'))>0)
      and not exists (select 1 from generate_series(1,length(v#>>'{}')) n
        where ascii(substr(v#>>'{}',n,1))<32 and ascii(substr(v#>>'{}',n,1)) not in (9,10,13))
    else false end;
$$;
create function cms_intake_private.phone_ok(v jsonb, required boolean default true)
returns boolean language sql immutable set search_path='' as $$
  select (not required and v='null'::jsonb) or
    (cms_intake_private.text_ok(v,40,true) and btrim(v#>>'{}')~'^[+]?[0-9 ()-]+$'
      and length(regexp_replace(v#>>'{}','[^0-9]','','g')) between 9 and 15);
$$;
create function cms_intake_private.date_ok(v jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare d date;
begin
  if v='null'::jsonb then return true; end if;
  if jsonb_typeof(v)<>'string' or (v#>>'{}') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then return false; end if;
  d := (v#>>'{}')::date;
  return isfinite(d) and to_char(d,'YYYY-MM-DD')=v#>>'{}';
exception when invalid_datetime_format or datetime_field_overflow then return false;
end $$;
create function cms_intake_private.png_ok(v jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare b bytea; pos integer:=8; len bigint; kind text; seen_data boolean:=false; w bigint; h bigint; s text;
begin
  if v='null'::jsonb then return true; end if;
  if jsonb_typeof(v)<>'string' then return false; end if;
  s:=v#>>'{}';
  if length(s)>200000 or s !~ '^data:image/png;base64,([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$' then return false; end if;
  b:=decode(substr(s,23),'base64');
  if replace(encode(b,'base64'),E'\n','')<>substr(s,23) or length(b)<57
    or substring(b from 1 for 8)<>decode('89504e470d0a1a0a','hex') then return false; end if;
  while pos+12<=length(b) loop
    len:=get_byte(b,pos)::bigint*16777216+get_byte(b,pos+1)*65536+get_byte(b,pos+2)*256+get_byte(b,pos+3);
    if len>length(b)-pos-12 then return false; end if;
    kind:=convert_from(substring(b from pos+5 for 4),'UTF8');
    if kind !~ '^[A-Za-z]{4}$' then return false; end if;
    if pos=8 then
      if kind<>'IHDR' or len<>13 then return false; end if;
      w:=get_byte(b,pos+8)::bigint*16777216+get_byte(b,pos+9)*65536+get_byte(b,pos+10)*256+get_byte(b,pos+11);
      h:=get_byte(b,pos+12)::bigint*16777216+get_byte(b,pos+13)*65536+get_byte(b,pos+14)*256+get_byte(b,pos+15);
      if w not between 1 and 4096 or h not between 1 and 4096 or w*h>4000000 then return false; end if;
    elsif kind='IHDR' then return false; end if;
    if kind='IDAT' then seen_data:=true; end if;
    if kind='IEND' then return len=0 and seen_data and pos+12=length(b); end if;
    pos:=pos+12+len::integer;
  end loop;
  return false;
exception when data_exception then return false;
end $$;

create function cms_intake_private.validate(p jsonb, pledge boolean)
returns void language plpgsql immutable set search_path='' as $$
declare expected text[]; amount numeric;
begin
  expected:=case when pledge then array['name','email','phone','address','amount','custom_amount','birth_date','gender','member_type','depositor','pledge_date','signer_name','signature_image_url','privacy_agreed']
    else array['name','email','phone','type','title','message','privacy_agreed'] end;
  if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>220000 then
    raise exception using errcode='22023',message='필수 항목과 입력 내용을 확인해 주세요.'; end if;
  if not p ?& expected or exists(select 1 from jsonb_object_keys(p) k where not k=any(expected))
    or not cms_intake_private.text_ok(p->'name',100,true)
    or not cms_intake_private.text_ok(p->'email',254,true)
    or octet_length(p->>'email')>254 or p->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or not cms_intake_private.phone_ok(p->'phone',pledge) then
    raise exception using errcode='22023',message='필수 항목과 입력 내용을 확인해 주세요.'; end if;
  if p->'privacy_agreed' is distinct from 'true'::jsonb then
    raise exception using errcode='22023',message='개인정보 수집 및 이용에 동의해 주세요.'; end if;
  if not pledge then
    if p->>'type' not in ('general','concert_request','join','support','other') or jsonb_typeof(p->'type')<>'string'
      or not cms_intake_private.text_ok(p->'title',200) or not cms_intake_private.text_ok(p->'message',5000,true) then
      raise exception using errcode='22023',message='필수 항목과 입력 내용을 확인해 주세요.'; end if;
  else
    if jsonb_typeof(p->'amount')<>'number' then
      raise exception using errcode='22023',message='필수 항목과 입력 내용을 확인해 주세요.'; end if;
    amount:=(p->>'amount')::numeric;
    if amount not between 1 and 2147483647 or trunc(amount)<>amount
      or (p->'custom_amount'<>'null'::jsonb and p->'custom_amount'<>p->'amount')
      or p->'gender' not in ('null'::jsonb,'"female"'::jsonb,'"male"'::jsonb,'"none"'::jsonb)
      or p->'member_type' not in ('"individual"'::jsonb,'"corporate"'::jsonb)
      or not cms_intake_private.text_ok(p->'address',1000) or not cms_intake_private.text_ok(p->'depositor',100)
      or not cms_intake_private.text_ok(p->'signer_name',100) or not cms_intake_private.date_ok(p->'birth_date')
      or not cms_intake_private.date_ok(p->'pledge_date') or not cms_intake_private.png_ok(p->'signature_image_url') then
      raise exception using errcode='22023',message='필수 항목과 입력 내용을 확인해 주세요.'; end if;
  end if;
end $$;

alter table public.support_pledges add column terms_snapshot jsonb;
comment on column public.support_pledges.terms_snapshot is 'Server-captured original support settings at acceptance. NULL for historical records; never inferred retroactively.';
create function public.submit_contact_message(p_submission_id uuid,p_payload jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
begin
  perform cms_intake_private.validate(p_payload,false);
  if not cms_intake_private.claim('contact',p_submission_id,p_payload,p_payload->>'email') then return true; end if;
  insert into public.contacts(id,name,email,phone,type,title,message,privacy_agreed,status)
    values(p_submission_id,p_payload->>'name',p_payload->>'email',p_payload->>'phone',p_payload->>'type',p_payload->>'title',p_payload->>'message',true,'new');
  return true;
end $$;

create function public.submit_support_pledge(p_submission_id uuid,p_support_settings_id uuid,p_payload jsonb)
returns boolean language plpgsql security definer set search_path='' as $$
declare guide public.support_settings%rowtype;
begin
  perform cms_intake_private.validate(p_payload,true);
  if p_support_settings_id is null then raise exception using errcode='22023',message='필수 항목과 입력 내용을 확인해 주세요.'; end if;
  if not cms_intake_private.claim('pledge',p_submission_id,jsonb_build_object('settings',p_support_settings_id,'answers',p_payload),p_payload->>'email') then return true; end if;
  select * into guide from public.support_settings where is_visible=true order by created_at asc,id asc limit 1 for share;
  if not found or guide.id<>p_support_settings_id or guide.enable_online_submission is distinct from true then
    raise exception using errcode='22023',message='현재 온라인 후원약정을 접수할 수 없습니다. 최신 후원 안내를 확인해 주세요.'; end if;
  if p_payload->'custom_amount'<>'null'::jsonb and guide.allow_custom_amount is distinct from true then
    raise exception using errcode='22023',message='필수 항목과 입력 내용을 확인해 주세요.'; end if;
  insert into public.support_pledges(id,name,email,phone,address,amount,custom_amount,birth_date,gender,member_type,depositor,pledge_date,signer_name,signature_image_url,privacy_agreed,status,terms_snapshot)
    values(p_submission_id,p_payload->>'name',p_payload->>'email',p_payload->>'phone',p_payload->>'address',(p_payload->>'amount')::integer,
      (p_payload->>'custom_amount')::integer,(p_payload->>'birth_date')::date,p_payload->>'gender',p_payload->>'member_type',p_payload->>'depositor',
      (p_payload->>'pledge_date')::date,p_payload->>'signer_name',p_payload->>'signature_image_url',true,'new',to_jsonb(guide));
  return true;
end $$;

-- Preserve admissions v2 validation, recruitment locks and accepted retry behavior.
-- A new row, including a direct privileged insert, crosses the quota boundary once.
create function cms_intake_private.guard_join_insert()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.form_version=2 then
    perform cms_intake_private.claim('join',new.submission_id,
      jsonb_build_object('guide',new.join_info_id,'name',new.applicant_name,'birth',new.birth_date,'phone',new.applicant_phone,
        'guardian',new.guardian_phone,'school',new.school,'parts',new.desired_parts,'motivation',new.motivation,'consent',new.privacy_agreed),
      regexp_replace(new.applicant_phone,'[^0-9]','','g'));
  end if;
  return new;
end $$;
create trigger join_intake_capacity before insert on public.join_applications
  for each row execute function cms_intake_private.guard_join_insert();

revoke all on all functions in schema cms_intake_private from public,anon,authenticated;
revoke all on function public.submit_contact_message(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.submit_support_pledge(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.submit_contact_message(uuid,jsonb) to anon,authenticated;
grant execute on function public.submit_support_pledge(uuid,uuid,jsonb) to anon,authenticated;
revoke insert on public.contacts,public.support_pledges from public,anon,authenticated;
drop policy if exists contacts_public_insert on public.contacts;
drop policy if exists support_pledges_public_insert on public.support_pledges;
notify pgrst,'reload schema';
commit;
