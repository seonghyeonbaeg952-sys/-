-- Synthetic records only. Never commit this test transaction.
begin;
set local statement_timeout = '15s';
do $$ begin
  assert to_regprocedure('public.submit_contact_message(uuid,jsonb)') is not null, 'Missing secure contact RPC';
  assert to_regprocedure('public.submit_support_pledge(uuid,uuid,jsonb)') is not null, 'Missing secure pledge RPC';
  assert cms_intake_private.date_ok('"2024-02-29"'), 'Valid leap day rejected';
  assert not cms_intake_private.date_ok('"2025-02-29"'), 'Invalid leap day accepted';
  assert not cms_intake_private.date_ok('"infinity"'), 'Non-calendar date accepted';
  assert cms_intake_private.png_ok('"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMioAAAAASUVORK5CYII="'), 'Valid PNG rejected';
  assert not cms_intake_private.png_ok('"data:image/svg+xml;base64,PHN2Zz4="'), 'Active-image type accepted';
  assert not cms_intake_private.png_ok('"data:image/png;base64,AAAA"'), 'Invalid PNG accepted';
end $$;
insert into public.support_settings(id,title,is_visible,enable_online_submission,created_at)
values('0c0de000-0000-4000-8000-000000000010','TEST ONLY',true,true,'1900-01-01');
set local role anon;
do $$
declare
  contact jsonb := '{"name":"QA fictional","email":"qa@example.invalid","phone":null,"type":"general","title":null,"message":"  원문\n유지  ","privacy_agreed":true}';
  pledge jsonb := '{"name":"QA fictional","email":"qa@example.invalid","phone":"010-0000-0000","address":null,"amount":10000,"custom_amount":null,"birth_date":null,"gender":null,"member_type":"individual","depositor":null,"pledge_date":null,"signer_name":null,"signature_image_url":null,"privacy_agreed":true}';
  n integer;
begin
  assert public.submit_contact_message('0c0de000-0000-4000-8000-000000000011',contact);
  assert public.submit_contact_message('0c0de000-0000-4000-8000-000000000011',contact), 'Same request retry failed';
  begin
    perform public.submit_contact_message('0c0de000-0000-4000-8000-000000000011',jsonb_set(contact,'{message}','"changed"'));
    raise exception 'Changed retry accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.submit_contact_message(gen_random_uuid(),contact || '{"admin_note":"injected"}');
    raise exception 'Unknown field accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.submit_contact_message(gen_random_uuid(),jsonb_set(contact,'{privacy_agreed}','false'));
    raise exception 'Missing consent accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.submit_contact_message(gen_random_uuid(),jsonb_set(contact,'{email}','"invalid"'));
    raise exception 'Invalid email accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.submit_contact_message(gen_random_uuid(),jsonb_set(contact,'{message}',to_jsonb(repeat('x',5001))));
    raise exception 'Oversized message accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.submit_contact_message(gen_random_uuid(),jsonb_set(contact,'{name}','null'));
    raise exception 'Null required name accepted';
  exception when sqlstate '22023' then null; end;
  for n in 2..5 loop perform public.submit_contact_message(gen_random_uuid(),contact); end loop;
  begin
    perform public.submit_contact_message(gen_random_uuid(),contact);
    raise exception 'Contact quota bypassed';
  exception when sqlstate 'P0001' then
    if sqlerrm <> '접수 요청이 많습니다. 한 시간 후 다시 시도해 주세요.' then raise; end if;
  end;
  assert public.submit_contact_message('0c0de000-0000-4000-8000-000000000011',contact), 'Quota blocked an accepted retry';
  assert public.submit_support_pledge('0c0de000-0000-4000-8000-000000000012','0c0de000-0000-4000-8000-000000000010',pledge);
  begin
    perform public.submit_support_pledge(gen_random_uuid(),'0c0de000-0000-4000-8000-000000000010',jsonb_set(pledge,'{birth_date}','"2025-02-29"'));
    raise exception 'Invalid pledge date accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.submit_support_pledge(gen_random_uuid(),'0c0de000-0000-4000-8000-000000000010',jsonb_set(pledge,'{signature_image_url}','"data:text/html,active"'));
    raise exception 'Unsafe signature accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.submit_support_pledge(gen_random_uuid(),'0c0de000-0000-4000-8000-000000000099',pledge);
    raise exception 'Wrong guide accepted';
  exception when sqlstate '22023' then null; end;
  begin
    insert into public.contacts(name,email,type,message,privacy_agreed,status) values('test','test@example.invalid','general','test',true,'new');
    raise exception 'Direct contact insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.support_pledges(name,email,phone,amount,privacy_agreed,status) values('test','test@example.invalid','01000000000',100,true,'new');
    raise exception 'Direct pledge insert allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  assert (select count(*) from public.contacts where id='0c0de000-0000-4000-8000-000000000011')=1, 'Retry inserted duplicates';
  assert (select message from public.contacts where id='0c0de000-0000-4000-8000-000000000011')=E'  원문\n유지  ', 'Original text changed';
  assert (select terms_snapshot->>'title' from public.support_pledges where id='0c0de000-0000-4000-8000-000000000012')='TEST ONLY', 'Terms not captured';
end $$;
update public.support_settings set enable_online_submission=false where id='0c0de000-0000-4000-8000-000000000010';
set local role anon;
do $$
declare pledge jsonb := '{"name":"QA fictional","email":"qa@example.invalid","phone":"010-0000-0000","address":null,"amount":10000,"custom_amount":null,"birth_date":null,"gender":null,"member_type":"individual","depositor":null,"pledge_date":null,"signer_name":null,"signature_image_url":null,"privacy_agreed":true}';
begin
  assert public.submit_support_pledge('0c0de000-0000-4000-8000-000000000012','0c0de000-0000-4000-8000-000000000010',pledge), 'Accepted retry lost after closing';
  begin
    perform public.submit_support_pledge(gen_random_uuid(),'0c0de000-0000-4000-8000-000000000010',pledge);
    raise exception 'Closed pledge gate bypassed';
  exception when sqlstate '22023' then null; end;
end $$;
reset role;
do $$ begin
  assert (select count(*) from cms_intake_private.receipts where kind='pledge' and contact_hash=sha256(convert_to('qa@example.invalid','UTF8')))=1, 'Rejected requests consumed capacity';
end $$;
rollback;
