begin;
alter table public.azimut_osm_cache add column bytes integer not null default 0;

create table public.azimut_osm_budget (
  id boolean primary key default true check (id),
  day date not null default current_date,
  misses integer not null default 0,
  responses integer not null default 0,
  bytes bigint not null default 0,
  last_miss timestamptz
);
insert into public.azimut_osm_budget(id) values(true);
create table public.azimut_osm_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  day date not null default current_date,
  misses integer not null default 0
);
alter table public.azimut_osm_budget enable row level security;
alter table public.azimut_osm_usage enable row level security;
revoke all on public.azimut_osm_budget, public.azimut_osm_usage from anon, authenticated;
grant all on public.azimut_osm_budget, public.azimut_osm_usage to service_role;

-- Called only by the edge function AFTER validating the user's JWT with Auth.
-- Serialize admission: 200 misses/day globally, 40/user/day, one miss/2 seconds;
-- responses are also bounded to 1,000/day and 100 MiB/day for this integration.
create function public.admit_osm_request(p_user_id uuid, p_miss boolean, p_bytes integer default 0) returns boolean
language plpgsql security definer set search_path = '' as $$
declare b public.azimut_osm_budget; u public.azimut_osm_usage;
begin
  if p_user_id is null or p_bytes not between 0 and 4194304 then return false; end if;
  select * into b from public.azimut_osm_budget where id = true for update;
  if b.day <> current_date then
    update public.azimut_osm_budget set day=current_date, misses=0, responses=0, bytes=0 where id=true;
    b.misses:=0; b.responses:=0; b.bytes:=0;
  end if;
  if p_miss then
    if b.misses >= 200 or b.last_miss > now() - interval '2 seconds' then return false; end if;
    insert into public.azimut_osm_usage(user_id) values(p_user_id) on conflict do nothing;
    select * into u from public.azimut_osm_usage where user_id=p_user_id for update;
    if u.day <> current_date then
      update public.azimut_osm_usage set day=current_date, misses=0 where user_id=p_user_id;
      u.misses:=0;
    end if;
    if u.misses >= 40 then return false; end if;
    update public.azimut_osm_usage set misses=misses+1 where user_id=p_user_id;
    update public.azimut_osm_budget set misses=misses+1, last_miss=now() where id=true;
  else
    if b.responses >= 1000 or b.bytes + p_bytes > 104857600 then return false; end if;
    update public.azimut_osm_budget set responses=responses+1, bytes=bytes+p_bytes where id=true;
  end if;
  return true;
end;
$$;
revoke all on function public.admit_osm_request(uuid, boolean, integer) from public, anon, authenticated;
grant execute on function public.admit_osm_request(uuid, boolean, integer) to service_role;

-- Bound active cache contents too: logical JSON <=20 MiB, <=128 entries, 7-day TTL.
create function public.store_osm_cache(p_key text, p_payload jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare size integer := octet_length(p_payload::text); total bigint; entries integer;
begin
  if p_key !~ '^[a-f0-9]{64}$' or size > 4194304 then raise exception 'Invalid cache payload'; end if;
  perform pg_advisory_xact_lock(20261004);
  delete from public.azimut_osm_cache where expires_at < now() or key=p_key;
  select coalesce(sum(bytes),0), count(*) into total, entries from public.azimut_osm_cache;
  while total + size > 20971520 or entries >= 128 loop
    delete from public.azimut_osm_cache where key=(select key from public.azimut_osm_cache order by expires_at limit 1);
    select coalesce(sum(bytes),0), count(*) into total, entries from public.azimut_osm_cache;
  end loop;
  insert into public.azimut_osm_cache(key,payload,expires_at,bytes) values(p_key,p_payload,now()+interval '7 days',size);
end;
$$;
revoke all on function public.store_osm_cache(text, jsonb) from public, anon, authenticated;
grant execute on function public.store_osm_cache(text, jsonb) to service_role;
commit;
