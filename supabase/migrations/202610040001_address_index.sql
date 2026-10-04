-- Run on a new Supabase project. Every location is evidence, not a surveyed guarantee.
begin;
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create table public.azimut_streets (
  id bigint generated always as identity primary key,
  comuna text not null,
  name text not null,
  street_key text not null,
  aliases text[] not null default '{}',
  unique (comuna, street_key)
);
create index azimut_streets_name on public.azimut_streets using gin (street_key extensions.gin_trgm_ops);

create table public.azimut_segments (
  id text primary key,
  street_id bigint not null references public.azimut_streets(id),
  left_from integer, left_to integer, right_from integer, right_to integer,
  geom extensions.geometry(LineString, 4326) not null,
  source text not null default 'IDE Chile 2022',
  check ((left_from is null and left_to is null) or (left_from is not null and left_to is not null and left_from > 0 and left_to > 0 and left_from <> left_to)),
  check ((right_from is null and right_to is null) or (right_from is not null and right_to is not null and right_from > 0 and right_to > 0 and right_from <> right_to)),
  check (extensions.st_npoints(geom) >= 2)
);
create index azimut_segments_street on public.azimut_segments(street_id);

create table public.azimut_addresses (
  id text primary key,
  street_id bigint not null references public.azimut_streets(id),
  house_number text not null check (length(house_number) between 1 and 24),
  geom extensions.geometry(Point, 4326) not null,
  source text not null,
  observed_at timestamptz not null default now(),
  check (extensions.st_y(geom) between -56.6 and -17 and extensions.st_x(geom) between -110 and -66)
);
create index azimut_addresses_lookup on public.azimut_addresses(street_id, house_number);

create table public.azimut_osm_cache (
  key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null
);
create index azimut_osm_cache_expiry on public.azimut_osm_cache(expires_at);

alter table public.azimut_streets enable row level security;
alter table public.azimut_segments enable row level security;
alter table public.azimut_addresses enable row level security;
alter table public.azimut_osm_cache enable row level security;
revoke all on public.azimut_streets, public.azimut_segments, public.azimut_addresses, public.azimut_osm_cache from anon, authenticated;
grant all on public.azimut_streets, public.azimut_segments, public.azimut_addresses, public.azimut_osm_cache to service_role;
grant usage, select on sequence public.azimut_streets_id_seq to service_role;

create function public.azimut_text_key(value text) returns text
language sql stable set search_path = '' as $$
  select trim(regexp_replace(lower(extensions.unaccent(replace(replace(value, '''', ''), '’', ''))), '[^a-z0-9]+', ' ', 'g'));
$$;

create function public.address_candidates(p_street text, p_comuna text, p_number text default '') returns jsonb
language plpgsql stable security definer set search_path = '' set statement_timeout = '3s' as $$
declare
  v_street text := regexp_replace(public.azimut_text_key(p_street), '^(avda|av|avenida|cl|calle|pje|psje|pasaje|camino|cmno) ', '');
  v_comuna text := public.azimut_text_key(p_comuna);
  v_number integer := case when p_number ~ '^[0-9]{1,8}$' then p_number::integer else null end;
  result jsonb;
begin
  if length(v_street) not between 3 and 100 or length(v_comuna) not between 2 and 80 or length(p_number) > 24 then
    raise exception 'Invalid address query';
  end if;
  with streets as materialized (
    select s.* from public.azimut_streets s
    where s.comuna = v_comuna and (s.street_key = v_street or v_street = any(s.aliases) or s.street_key operator(extensions.%) v_street)
      and (s.street_key = v_street or v_street = any(s.aliases) or not exists (
        select 1 from public.azimut_streets exact where exact.comuna = v_comuna and (exact.street_key = v_street or v_street = any(exact.aliases))))
    order by (s.street_key = v_street or v_street = any(s.aliases)) desc, extensions.similarity(s.street_key, v_street) desc
    limit 12
  ), segments as (
    select jsonb_build_object('id', seg.id, 'c', st.comuna, 'v', st.name, 'a', st.aliases,
      'n', jsonb_build_array(least(seg.left_from, seg.left_to, seg.right_from, seg.right_to), greatest(seg.left_from, seg.left_to, seg.right_from, seg.right_to)),
      'l', case when seg.left_from is not null then jsonb_build_array(seg.left_from, seg.left_to) end,
      'r', case when seg.right_from is not null then jsonb_build_array(seg.right_from, seg.right_to) end,
      'g', extensions.st_asgeojson(seg.geom)::jsonb -> 'coordinates') as item
    from public.azimut_segments seg join streets st on st.id = seg.street_id
    where v_number between least(seg.left_from, seg.left_to) and greatest(seg.left_from, seg.left_to)
       or v_number between least(seg.right_from, seg.right_to) and greatest(seg.right_from, seg.right_to)
    limit 60
  ), addresses as (
    select jsonb_build_object('id', a.id, 'lat', extensions.st_y(a.geom), 'lon', extensions.st_x(a.geom), 'score', 95,
      'source', a.source, 'method', 'address', 'label', st.name || ' ' || a.house_number || ', ' || st.comuna,
      'evidence', jsonb_build_array('Calle, número y comuna registrados en el índice'),
      'warnings', jsonb_build_array('Dato importado; revisa la fecha y procedencia de la fuente')) as item
    from public.azimut_addresses a join streets st on st.id = a.street_id
    where a.house_number = p_number and (st.street_key = v_street or v_street = any(st.aliases))
    limit 8
  ) select jsonb_build_object('segments', coalesce((select jsonb_agg(item) from segments), '[]'::jsonb),
    'addresses', coalesce((select jsonb_agg(item) from addresses), '[]'::jsonb)) into result;
  return result;
end;
$$;
revoke all on function public.address_candidates(text, text, text) from public;
grant execute on function public.address_candidates(text, text, text) to anon, authenticated, service_role;

-- Only the service role can import public reference data. Never expose this key in Vite.
create function public.import_segments(p_rows jsonb) returns integer
language plpgsql security definer set search_path = '' set statement_timeout = '30s' as $$
declare inserted integer;
begin
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then raise exception 'Invalid import batch'; end if;
  insert into public.azimut_streets(comuna, name, street_key, aliases)
  select distinct on (r->>'c', r->>'street_key') r->>'c', r->>'v', r->>'street_key',
    array(select jsonb_array_elements_text(coalesce(r->'alias_keys', '[]'::jsonb)))
  from jsonb_array_elements(p_rows) r
  on conflict (comuna, street_key) do nothing;
  insert into public.azimut_segments(id, street_id, left_from, left_to, right_from, right_to, geom)
  select r->>'id', s.id, (r->'l'->>0)::integer, (r->'l'->>1)::integer, (r->'r'->>0)::integer, (r->'r'->>1)::integer,
    extensions.st_setsrid(extensions.st_geomfromgeojson(jsonb_build_object('type', 'LineString', 'coordinates', r->'g')::text), 4326)
  from jsonb_array_elements(p_rows) r join public.azimut_streets s on s.comuna = r->>'c' and s.street_key = r->>'street_key'
  on conflict (id) do nothing;
  get diagnostics inserted = row_count;
  return inserted;
end;
$$;
revoke all on function public.import_segments(jsonb) from public, anon, authenticated;
grant execute on function public.import_segments(jsonb) to service_role;

create function public.import_addresses(p_rows jsonb) returns integer
language plpgsql security definer set search_path = '' set statement_timeout = '30s' as $$
declare inserted integer;
begin
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 500 then raise exception 'Invalid import batch'; end if;
  insert into public.azimut_streets(comuna, name, street_key)
  select distinct on (r->>'comuna', r->>'street_key') r->>'comuna', r->>'street', r->>'street_key' from jsonb_array_elements(p_rows) r
  on conflict (comuna, street_key) do nothing;
  insert into public.azimut_addresses(id, street_id, house_number, geom, source)
  select r->>'id', s.id, r->>'number', extensions.st_setsrid(extensions.st_makepoint((r->>'lon')::float8, (r->>'lat')::float8), 4326), r->>'source'
  from jsonb_array_elements(p_rows) r join public.azimut_streets s on s.comuna = r->>'comuna' and s.street_key = r->>'street_key'
  on conflict (id) do nothing;
  get diagnostics inserted = row_count;
  return inserted;
end;
$$;
revoke all on function public.import_addresses(jsonb) from public, anon, authenticated;
grant execute on function public.import_addresses(jsonb) to service_role;
commit;
