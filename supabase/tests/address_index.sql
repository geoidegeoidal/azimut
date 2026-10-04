-- Run after migrations in an isolated database (test transaction is rolled back).
begin;
do $$
declare data jsonb; first_id uuid := '00000000-0000-0000-0000-000000000001';
begin
  if has_function_privilege('anon','public.import_segments(jsonb)','execute') then raise exception 'Public import privilege'; end if;
  if has_table_privilege('anon','public.azimut_osm_cache','select') then raise exception 'Public cache privilege'; end if;
  perform public.import_segments('[{"id":"test:maria","c":"antofagasta","v":"calle santa maria","street_key":"santa maria","l":[101,199],"g":[[-70.4,-23.6],[-70.4,-23.599],[-70.399,-23.599]]},{"id":"test:marta","c":"antofagasta","v":"calle santa marta","street_key":"santa marta","r":[639,605],"g":[[-70.4,-23.6],[-70.4,-23.599]]}]'::jsonb);
  data := public.address_candidates('Santa Maria','Antofagasta','605');
  if jsonb_array_length(data->'segments') <> 0 then raise exception 'Fuzzy street replaced known exact street'; end if;
  data := public.address_candidates('Santa Marta','Antofagasta','607');
  if data->'segments'->0->'r' <> '[639,605]'::jsonb then raise exception 'Direction lost'; end if;
  begin
    insert into public.azimut_segments(id,street_id,left_from,geom) select 'invalid',id,100,extensions.st_geomfromtext('LINESTRING(-70 -33,-70 -34)',4326) from public.azimut_streets limit 1;
    raise exception 'Partial numbering range accepted';
  exception when check_violation then null; end;
  insert into auth.users(id) values(first_id);
  if not public.admit_osm_request(first_id,true) then raise exception 'Initial request rejected'; end if;
  if public.admit_osm_request(first_id,true) then raise exception 'Immediate repeated miss accepted'; end if;
  if not public.admit_osm_request(first_id,false,4000000) then raise exception 'Valid response rejected'; end if;
  update public.azimut_osm_budget set bytes=104857600;
  if public.admit_osm_request(first_id,false,1) then raise exception 'Response budget exceeded'; end if;
  update public.azimut_osm_budget set last_miss=now()-interval '3 seconds';
  update public.azimut_osm_usage set misses=40 where user_id=first_id;
  if public.admit_osm_request(first_id,true) then raise exception 'User budget exceeded'; end if;
  for i in 1..25 loop
    perform public.store_osm_cache(lpad(i::text,64,'0'),jsonb_build_object('data',repeat('x',1000000)));
  end loop;
  if (select sum(bytes) from public.azimut_osm_cache) > 20971520 then raise exception 'Cache bytes unbounded'; end if;
  raise notice 'PASS: privileges, exact street priority, directed ranges, rate/byte/user limits and cache eviction';
end;
$$;
rollback;
