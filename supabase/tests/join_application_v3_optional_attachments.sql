-- Isolated synthetic data only. Roll back the entire contract test.
begin;
set local statement_timeout = '15s';

insert into public.join_info(id, title, is_visible)
values ('0c0de000-0000-4000-8000-000000000030', 'QA fixture', true);
update public.intake_limits set hourly_contact = 3 where kind = 'join';

set local role anon;
do $$
declare
  guide uuid := '0c0de000-0000-4000-8000-000000000030';
  request uuid := '0c0de000-0000-4000-8000-000000000031';
  photo jsonb := '{"media_type":"image/png","base64":"iVBORw0KGgoAAAANSUhEUgAAAB4AAAAoCAIAAABmcd1FAAAAKElEQVR4nO3MMQ0AAAwDoPo33anosQQEkM5ErVar1Wq1Wq1Wq9V9Xx+qjQLDZ78qAQAAAABJRU5ErkJggg=="}';
  landscape jsonb := '{"media_type":"image/png","base64":"iVBORw0KGgoAAAANSUhEUgAAACgAAAAeCAIAAADRv8uKAAAAJ0lEQVR4nO3NMQEAAAwCIPuXdjHcAQVIRyIWi8VisVgsFovF4r6ND5y5AsOKyfwFAAAAAElFTkSuQmCC"}';
  pdf jsonb := jsonb_build_object('media_type', 'application/pdf', 'base64', encode(convert_to(E'%PDF-1.4\n%%EOF\n', 'UTF8'), 'base64'));
begin
  assert (select form_version from public.get_join_application_config(guide)) = 2, 'The original published config changed';
  assert (select form_version from public.get_join_application_config_v3(guide)) = 3, 'The new published config is missing';
  assert public.submit_join_application_v3(request, guide, 'QA fixture', '2009-03-01',
    '01000000001', '01000000002', 'QA school', array['alto'], 'QA test', true,
    'university', '2학년', '음악학과', 'not_specified', photo, pdf);
  assert public.submit_join_application_v3(request, guide, 'QA fixture', '2009-03-01',
    '01000000001', '01000000002', 'QA school', array['alto'], 'QA test', true,
    'university', '2학년', '음악학과', 'not_specified', photo, pdf), 'Identical retry was rejected';
  begin
    perform public.submit_join_application_v3(request, guide, 'QA fixture', '2009-03-01',
      '01000000001', '01000000002', 'QA school', array['alto'], 'QA test', true,
      'university', '3학년', '음악학과', 'not_specified', photo, pdf);
    raise exception 'A modified retry was accepted';
  exception when sqlstate '22023' then null; end;
  begin
    perform public.submit_join_application_v3(gen_random_uuid(), guide, 'QA fixture', '2009-03-01',
      '01000000001', '01000000002', 'QA school', array['alto'], 'QA test', true,
      'high', '2학년', null, 'female', landscape, null);
    raise exception 'A landscape photo was accepted';
  exception when sqlstate '22023' then
    if sqlerrm not like '%3:4%' then raise; end if;
  end;
  begin
    perform public.submit_join_application_v3(gen_random_uuid(), guide, 'QA fixture', '2009-03-01',
      '01000000001', '01000000002', 'QA school', array['alto'], 'QA test', true,
      'high', '2학년', null, 'female', null, '{"media_type":"application/pdf","base64":"PGRpdj5maXh0dXJlPC9kaXY+"}');
    raise exception 'A file without the accepted PDF signature was accepted';
  exception when sqlstate '22023' then
    if sqlerrm not like '%PDF%' then raise; end if;
  end;
  assert public.submit_join_application_v3('0c0de000-0000-4000-8000-000000000032', guide, 'QA no attachments', '2009-03-01',
    '01000000001', '01000000002', 'QA school', array['alto'], 'QA test', true,
    'high', '2학년', null, 'female', null, null), 'A submission without optional files was rejected';
  assert public.submit_join_application_v2('0c0de000-0000-4000-8000-000000000033', guide, 'QA old form', '2009-03-01',
    '01000000001', '01000000002', 'QA school 2학년', array['alto'], 'QA test', true), 'Legacy submissions stopped working';
  begin
    perform public.submit_join_application_v3(gen_random_uuid(), guide, 'QA capacity', '2009-03-01',
      '01000000001', '01000000002', 'QA school', array['alto'], 'QA test', true,
      'high', '2학년', null, 'female', null, null);
    raise exception 'The shared join quota was not applied';
  exception when sqlstate 'P0001' then
    if sqlerrm <> '접수 요청이 많습니다. 한 시간 후 다시 시도해 주세요.' then raise; end if;
  end;
  assert not has_function_privilege(current_user, 'public.get_join_application_attachment_v3(uuid,text)', 'EXECUTE');
  assert not has_table_privilege(current_user, 'public.join_applications', 'SELECT');
end $$;

reset role;
do $$
declare
  submitted public.join_applications%rowtype;
begin
  select * into strict submitted from public.join_applications where submission_id = '0c0de000-0000-4000-8000-000000000031';
  assert submitted.form_version = 3 and submitted.school_level = 'university';
  assert submitted.school = 'QA school' and submitted.grade = '2학년' and submitted.department = '음악학과';
  assert submitted.photo_file_path = 'join-intake-v3:photo' and submitted.recommendation_file_path = 'join-intake-v3:recommendation';
  assert (select count(*) from cms_intake_private.join_application_attachments where application_id = submitted.id) = 2;
  assert not exists (
    select from cms_intake_private.join_application_attachments a join public.join_applications b on b.id = a.application_id
    where b.submission_id in ('0c0de000-0000-4000-8000-000000000032', '0c0de000-0000-4000-8000-000000000033')
  ), 'A submission without files created extra attachments';
end $$;

set local role authenticated;
do $$ begin
  begin
    perform public.get_join_application_attachment_v3('0c0de000-0000-4000-8000-000000000031', 'photo');
    raise exception 'Authenticated non-admin attachment read succeeded';
  exception when insufficient_privilege then null; end;
end $$;

rollback;
