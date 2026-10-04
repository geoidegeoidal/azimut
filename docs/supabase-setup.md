# Configurar Azimut en Supabase Free

Estado de esta sesión: el usuario creó `azimut` en São Paulo (`cvgacnsmluomodpqofsu`). Las dos migraciones se ejecutaron con éxito desde SQL Editor y la URL/clave pública están en `.env.local`. La importación real, los accesos anónimos y el despliegue de `osm-enrich` siguen pendientes; no se afirma que el backend esté operativo. No repitas las migraciones de esta base ni uses `db push` sin registrar el esquema ya aplicado.

1. Entra en [Supabase Dashboard](https://supabase.com/dashboard) y completa el login. Usa una organización Free.
2. Crea el proyecto `azimut`, región **South America (São Paulo)**. Introduce o genera tú la contraseña de la base y guárdala en tu gestor. Mantén Data API habilitada, desactiva la exposición automática de nuevas tablas y habilita RLS automático.
3. En SQL Editor ejecuta, en orden, los archivos `supabase/migrations/202610040001_address_index.sql` y `202610040002_osm_budget.sql`. Verifica éxito antes del siguiente. Son para una base nueva; no los repitas sobre un esquema ya instalado.
4. En Settings / API copia la URL del proyecto y su publishable key en `.env.local`, según el README. La clave pública se usa en el navegador. La service-role key sólo se usa localmente para importar; no la pegues en un chat ni la publiques.
5. Prueba e importa una comuna:

   ```powershell
   node scripts/import-supabase.mjs --comuna "Santiago" --dry-run
   node scripts/import-supabase.mjs --comuna "Santiago"
   ```

6. Habilita **anonymous sign-ins** en Authentication / Sign In / Providers. La función valida la sesión con `/auth/v1/user`; la clave pública por sí sola no autoriza a llamar al enriquecimiento. [Guía oficial de Auth anónimo](https://supabase.com/docs/guides/auth/auth-anonymous).
7. Despliega `osm-enrich` con la CLI oficial, desde el repositorio:

   ```powershell
   npx supabase login
   npx supabase link --project-ref TU_REFERENCIA
   npx supabase functions deploy osm-enrich
   ```

   `verify_jwt=false` en `supabase/config.toml` permite las claves modernas en el gateway; la función hace su propia validación del usuario mediante Auth antes de consultar la caché. No elimines esa validación. URL/clave de servicio están disponibles como variables de la función; `ALLOWED_ORIGIN` puede acotarse al origen del panel. [Despliegue oficial](https://supabase.com/docs/guides/functions/deploy).
8. Reinicia Vite y busca Matucana 501 / Santiago. El panel debe mostrar respuestas efectivas de PostGIS y OSM, o explicar cada error. Una etiqueta «configurado» no demuestra conectividad.
9. Mide en SQL Editor antes de ampliar las comunas:

   ```sql
   select pg_size_pretty(pg_database_size(current_database())) as database_size;
   select count(*) as segments from public.azimut_segments;
   select count(*) as recorded_addresses from public.azimut_addresses;
   ```

   Free dispone de 500MB de base y 5GB de egress según [facturación oficial](https://supabase.com/docs/guides/platform/billing-on-supabase). El tamaño JSON no equivale al tamaño de la base con índices. La caché tiene presupuesto propio; vigila el total del proyecto en Usage.

Si se aplicaron las migraciones desde Dashboard, registra esa situación antes de usar `db push`: no vuelvas a ejecutar `create table` como si la base estuviera vacía. Las credenciales y autorizaciones de CLI se completan directamente en Supabase.
