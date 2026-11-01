begin;
create temporary table setup_context (a uuid, b uuid, published text, hidden text);
insert into setup_context values (gen_random_uuid(), gen_random_uuid(),
  'setup-test-' || gen_random_uuid()::text, 'setup-test-' || gen_random_uuid()::text);
grant select on setup_context to authenticated, anon;
insert into auth.users (id) select a from setup_context union all select b from setup_context;
insert into public.prototype_assets (id,title,style,category,source,image_url,published)
select published,'Temporary test','Test','Test','other','/test.png',true from setup_context
union all select hidden,'Hidden test','Test','Test','other','/test.png',false from setup_context;

select set_config('request.jwt.claims', json_build_object('sub', a, 'role','authenticated')::text, true) from setup_context;
set local role authenticated;
insert into public.study_progress (kind,resource_id,payload) values ('mastery','setup-test','{"right":1,"wrong":0,"streak":1}');
insert into public.prototype_feedback (prototype_id,rating,comment)
select published,8,'Temporary feedback' from setup_context;
update public.study_progress set payload='{"right":2,"wrong":0,"streak":2}' where resource_id='setup-test';
do $$
begin
  if (select revision from public.study_progress where resource_id='setup-test') <> 2 then
    raise exception 'revision test failed';
  end if;
  begin
    update public.prototype_feedback set rating=11;
    raise exception 'invalid rating allowed';
  exception when check_violation then null; end;
  begin
    insert into public.prototype_feedback (prototype_id,rating) select published,5 from setup_context;
    raise exception 'duplicate rating allowed';
  exception when unique_violation then null; end;
  begin
    insert into public.prototype_feedback (prototype_id,rating) select hidden,5 from setup_context;
    raise exception 'hidden prototype rating allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.study_progress set user_id=(select b from setup_context);
    raise exception 'ownership transfer allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.prototype_assets (id,title,style,category,source,image_url)
    values ('forbidden-test','Forbidden','Test','Test','other','/test.png');
    raise exception 'catalog curation allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims', json_build_object('sub', b, 'role','authenticated')::text, true) from setup_context;
set local role authenticated;
do $$
begin
  if exists (select 1 from public.study_progress where resource_id='setup-test') then
    raise exception 'cross-guest progress leak';
  end if;
  if exists (select 1 from public.prototype_feedback where prototype_id=(select published from setup_context)) then
    raise exception 'cross-guest feedback leak';
  end if;
  if exists (select 1 from public.prototype_assets where id=(select hidden from setup_context)) then
    raise exception 'hidden prototype leak';
  end if;
  begin
    insert into public.study_progress (user_id,kind,resource_id,payload)
    select a,'mastery','forged','{}' from setup_context;
    raise exception 'cross-guest insert allowed';
  exception when insufficient_privilege then null; end;
  update public.study_progress set payload='{}' where resource_id='setup-test';
  if found then raise exception 'cross-guest update allowed'; end if;
  delete from public.prototype_feedback where prototype_id=(select published from setup_context);
  if found then raise exception 'cross-guest delete allowed'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$
begin
  if (select count(*) from public.prototype_assets where id=(select published from setup_context)) <> 1 then
    raise exception 'published catalog unavailable';
  end if;
  begin
    perform * from public.study_progress;
    raise exception 'unauthenticated progress read allowed';
  exception when insufficient_privilege then null; end;
  begin
    perform * from public.prototype_feedback;
    raise exception 'unauthenticated feedback read allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: isolated guest read/write, ownership checks, catalog grants, hidden assets, ratings, uniqueness and revision. All fixtures rolled back.' as result;
