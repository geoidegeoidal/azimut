# Azimut

Panel de búsqueda y revisión de direcciones chilenas. Combina el Maestro de Calles IDE Chile 2022, geometrías y direcciones de OpenStreetMap y proveedores configurables. Ofrece búsqueda individual, lotes CSV/Excel, mapa, candidatos, evidencia, ajuste manual y exportaciones con procedencia.

## Ejecutar

Node 22 o superior y pnpm. Instala con `pnpm install --frozen-lockfile` y ejecuta `pnpm dev`. El panel está en `http://localhost:5173/azimut/`. Las interpolaciones oficiales funcionan sin servidor externo.

**Destino** es la interfaz por defecto en `/azimut/`: importación a la izquierda, tabla de revisión principal y mapa/evidencia de la fila a la derecha. Abre primero los lotes, permite buscar dentro de ellos sin depender de tildes, avanzar al siguiente caso por revisar y paginar de 100 en 100. Exporta la selección completa, aunque la tabla esté filtrada o paginada. El diseño Swiss original sigue en `?design=classic`; cambiar de diseño conserva el archivo y las correcciones.

Para enriquecer con OSM en desarrollo, ejecuta en otra terminal:

```powershell
node server/osm-proxy.mjs
```

Crea `.env.local` (ignorado por Git) y reinicia Vite:

```dotenv
VITE_OSM_VECTOR_API=http://127.0.0.1:8787/api/osm
```

El proxy sólo escucha en 127.0.0.1, consulta áreas acotadas, espacia las peticiones y conserva hasta 20MiB en caché. Sirve para desarrollo; Supabase proporciona la integración alojada.

## Qué mejora

- 254.859 polilíneas de 82 comunas, cargadas por comuna. El catálogo de nombres tiene una cobertura distinta; un nombre conocido no garantiza numeración disponible.
- Se conservan todos los vértices y los rangos inicial/final de cada lado, incluyendo numeración descendente y paridad. No se extrapola ni se fija un número fuera de rango al extremo de una calle.
- Una calle existente no se reemplaza por otra parecida sólo porque la segunda tenga el número solicitado.
- OSM distingue números registrados e interpolaciones documentadas, usando cada ancla numerada intermedia. Los proveedores se validan por calle, número, comuna y país; el tipo node/way y la popularidad no indican precisión.
- Cada punto declara método, fuente, advertencias y alternativas. El score es un indicador de evidencia, no una probabilidad. Una posición de edificio no prueba la puerta; sin tags/límites municipales compatibles se exige revisión.
- Pausar/cancelar conserva las filas terminadas. CSV UTF-8, Windows-1252 y campos multilínea se leen sin perder los acentos. Los archivos exportados conservan el método y la incertidumbre.

CSV/XLSX rechazan encabezados ambiguos para evitar pérdida silenciosa de columnas; CSV también rechaza campos sobrantes. XLSX conserva la numeración con su formato visible. El texto del Shapefile DBF se translitera a ASCII por la limitación del escritor incluido; CSV, XLSX y GeoJSON conservan Unicode.

El índice oficial utiliza coordenadas geográficas SIRGAS 2000. No se inventa un desplazamiento hacia una acera sin información sobre ancho vial. Las interpolaciones son estimaciones sobre el eje y los datos oficiales son de 2022.

## Supabase Free

PostGIS sirve las consultas concurrentes y Supabase aporta REST/Auth/Edge Functions. DuckDB puede servir para análisis y preparación offline; cambiar de base no mejora por sí solo la precisión. El conversor actual procesa 899.647 registros mediante lectura por bloques y genera el índice sin cargar el DBF completo en memoria.

El índice completo medido en PostGIS 17/3.5 local ocupa 85.852.160 bytes (aprox. 82MiB) en tablas/índices de la aplicación; la base aislada completa ocupa unos 97MiB. [Informe de tamaño](docs/verification/index-size.json). Es una medición local: mide nuevamente el total del proyecto alojado, con tablas de plataforma y futuros datos OSM, frente al límite Free de 500MB. [Límites oficiales](https://supabase.com/docs/guides/platform/billing-on-supabase).

Pasos detallados en [configurar Supabase](docs/supabase-setup.md). Configuración del navegador:

```dotenv
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICA
```

Sólo para los scripts de importación, en el mismo archivo local:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=TU_CLAVE_DE_SERVIDOR
```

Nunca pongas una clave de servicio en una variable `VITE_*`. Las tablas tienen RLS y no se leen directamente con la clave pública. La RPC de consulta devuelve un conjunto acotado; las de importación/caché sólo aceptan el rol de servicio.

Enriquecimiento: sesión Auth anónima validada por la función, caché con TTL de siete días y máximo lógico 20MiB/128 entradas; 200 consultas no almacenadas por día globales, 40 por usuario, separadas por al menos dos segundos; respuestas limitadas a 1.000/día y 100MiB/día. El presupuesto protege esta integración; no controla todo el consumo del proyecto. Alcanzar un límite conserva las otras fuentes y aparece como indisponibilidad en el panel. Habilita los accesos anónimos para usar esta función.

Photon funciona como fuente de candidatos, sin autocompletar en remoto y con caché por sesión. Para producción configura un proveedor con capacidad y términos adecuados o tu propia instancia mediante `VITE_PHOTON_URL`. Nominatim público está desactivado para este servicio genérico; `VITE_NOMINATIM_URL` acepta una instancia propia o contratada. [Política de Nominatim](https://operations.osmfoundation.org/policies/nominatim/).

## Datos y verificación

`node scripts/process-callejero.mjs` regenera el índice desde los SHP/DBF oficiales presentes en `data/` (datos brutos ignorados por Git). `node scripts/import-supabase.mjs --comuna "Santiago" --dry-run` comprueba un lote sin escribir. La importación real es idempotente y se hace por comuna. Para OSM GeoJSON usa `--osm ruta.geojson`; debe estar recortado al límite municipal y aportar evidencia de comuna, o confirmar ese recorte con `--comuna-scope-verified`.

```powershell
pnpm test
pnpm lint
pnpm build
```

Las migraciones y `supabase/tests/address_index.sql` se verificaron en una base PostGIS aislada. [Comparación de cinco direcciones públicas](docs/benchmarks/README.md): cuatro números OSM registrados y una interpolación en el ensayo. Es consistencia entre fuentes; no un estudio nacional ni un levantamiento topográfico.

El test opcional `node scripts/browser-check.mjs` requiere Playwright instalado o `PLAYWRIGHT_MODULE` apuntando al paquete de un runtime existente. Verifica 320–1440px y el ancho del usuario, búsqueda/fallback, ajuste manual por teclado, filtros, un lote de tres direcciones, cancelación/paginación con 103 filas y las cuatro exportaciones. [Revisión de las 30 leyes de UX de Destino](docs/verification/destino-ux-review.md). Los ensayos de UI simulan fallos de fuentes externas; no prueban exactitud geográfica.

La compilación avisa de un bundle principal de unos 3,24MB (805kB gzip), debido sobre todo al catálogo de nombres. La geometría oficial se carga por comuna; la optimización del catálogo inicial queda pendiente de medición de uso real.

Ponytail está activo para programación, OpenSpec documenta este cambio y code-reviewer revisó motor, backend y panel. No hay CLI OpenSpec instalada: los artefactos de `openspec/changes/address-workbench` siguen el esquema spec-driven y no se atribuye una validación CLI inexistente.

Fuentes: IDE Chile; © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. Los datos y cada proveedor conservan sus licencias y atribuciones.
