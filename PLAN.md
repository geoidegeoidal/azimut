# PLAN.md — Azimut

Geocodificador + normalizador de direcciones chilenas. SPA 100% client-side alojada en GitHub Pages. Todo corre en el navegador (Web APIs + WASM).

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Pages (Static)                        │
│  ┌──────────┐   ┌───────────────┐   ┌────────────────────────┐  │
│  │  Upload   │   │  Normalizer   │   │   Geocode Engine       │  │
│  │  Engine   │→  │  7-step pipe  │→  │  Nominatim→Photon      │  │
│  │ CSV/XLSX  │   │  (Chile)      │   │  (cascada, sin API key)│  │
│  └──────────┘   └───────────────┘   └────────────────────────┘  │
│       ↓                                    ↓                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │     Results Table + Leaflet Map + Dashboard              │    │
│  │  Score 0-100  ● Exc ● Bueno ● Regular ● Bajo ● Nulo     │    │
│  └─────────────────────────────────────────────────────────┘    │
│       ↓                                                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Export: CSV | XLSX | GeoJSON | Shapefile (.zip)         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## APIs de Geocodificación (100% gratuitas, sin API key, cobertura Chile OSM)

| API | Límite | Rate | API Key | Score fuente |
|-----|--------|------|---------|--------------|
| **Nominatim** *(primaria)* | Sin límite* | 1 req/seg | **No** | `importance` + `osm_type` |
| **Photon** *(fallback)* | Sin límite* | Fair use | **No** | `importance` + `osm_type` |

*Throttling por abuso en ambas. Basadas en OpenStreetMap → excelente cobertura Chile. Ninguna expone API keys en el repositorio.

**Estrategia**: Nominatim como primaria (1 req/seg constante), Photon como fallback si Nominatim no responde. Sin límites diarios artificiales — el único límite es la paciencia del usuario (1 dirección por segundo). Límite sugerido: **500 direcciones por lote** (~8 minutos). Procesamiento en background con Web Worker para no congelar la UI.

---

## Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Framework | React 18 + Vite + TypeScript | SPA rápida, GH Pages compatible |
| Estilos | Tailwind CSS v4 + Framer Motion | Moderno, utilitario, animaciones |
| Mapa | Leaflet + OSM tiles + MarkerCluster | Ligero, sin API key |
| XLSX I/O | SheetJS (`xlsx`) | Parseo y generación en browser |
| CSV I/O | PapaParse | Robusto, streaming |
| Shapefile | `@crmackey/shp-write` (ESM, `fflate`) | ZIP .shp/.shx/.dbf/.prj |
| GeoJSON | Nativo RFC 7946 | Sin dependencias |
| APIs externas | fetch() + Web Workers | Sin bloqueo de UI |
| Descargas | FileSaver.js | Cross-browser |
| Estado | Zustand + IndexedDB (cache) | Ligero, TypeScript-friendly |

---

## Fases de Implementación

### Fase 1 — Setup y Arquitectura

**Modelo**: `DeepSeek V4 Flash`

**Tareas**:
- `npm create vite@latest` con React + TypeScript
- Tailwind CSS v4, PostCSS, tema base
- Estructura de carpetas: `src/components/`, `src/engine/`, `src/hooks/`, `src/types/`
- Sin `.env` ni API keys — todo funciona sin configuración
- GitHub Actions: build + deploy a `gh-pages`
- ESLint + Prettier config

**Output**: Proyecto corriendo en `localhost:5173`, deploy automático funcional.

---

### Fase 2 — UI/UX Avant-Garde

**Modelo**: `Qwen3.6 Plus` + `skill frontend-design`

**Tareas**:
- Design system completo: glassmorphism, paleta de colores, tipografía Inter + JetBrains Mono
- Dark/Light mode con toggle animado (sol/luna morphing)
- Layout principal: sidebar wizard (izquierda) + área resultados (derecha)
- Componentes:
  - Drag & drop uploader con animación de archivo flotando
  - Progress bar radial animada durante geocodificación
  - Skeleton loaders con shimmer
  - Tabla de resultados con badges de score
  - Botones de exportación con íconos
- Textos de UI en español chileno natural
- Responsive: mobile-first, sidebar colapsa

**Output**: UI completa, navegable, con datos mock.

---

### Fase 3 — Motor de Parseo de Archivos

**Modelo**: `DeepSeek V4 Pro`

**Tareas**:
- Detección de encoding (UTF-8, Latin1, Windows-1252) con heurística
- CSV parser: PapaParse con `header: true`, detección de delimitador (`,` `;` `\t`)
- XLSX parser: SheetJS, manejo de múltiples hojas (usar primera con datos)
- Detección inteligente de columnas de dirección:
  - Busca por nombre: `direccion`, `address`, `calle`, `dirección`, `ubicacion`, `ubicación`, `domicilio`
  - Soporte para **selección de múltiples columnas** (ej: unir calle y número).
- Preview: tabla con primeras 10 filas, confirmación de mapeo y vista previa en vivo de la normalización.
- Validación: columna(s) seleccionada(s) deben existir, archivo no vacío, encoding legible

**Output**: Usuario sube CSV/XLSX → ve preview → confirma columna → avanza.

---

### Fase 4 — Normalizador Rápido (5 pasos)

**Modelo**: `Qwen3.6 Plus` (principal)

Pipeline simplificado y optimizado de 5 pasos:

```
PASO 1 — ESPACIOS Y LIMPIEZA
├─ Trim whitespace, colapsar múltiples espacios.

PASO 2 — EXPANDIR VÍA
├─ Analizar el primer token (separando por espacios).
├─ Expandir según diccionario rápido (ej. `Av.` -> `Avenida`, `Pje` -> `Pasaje`).

PASO 3 — SIN TILDES
├─ Remover acentos gráficos (Normalización NFD) para robustecer el match con OSM.

PASO 4 — LIMPIAR PUNTUACIÓN
├─ Remover puntos y comas residuales al final del string.

PASO 5 — CAPITALIZAR
├─ Poner en mayúsculas la primera letra de cada palabra.
├─ Omitir de la capitalización palabras menores (`de`, `la`, `el`, `los`, etc.).
└─ Ensamblar vía y resto de la dirección.
```

**Casos de frontera que DEBE resolver**:

| Caso | Input real | Output |
|------|-----------|--------|
| Todo minúsculas | `av. providencia 1234` | `Avenida Providencia 1234` |
| Mayúsculas | `CAMINO A MELIPILLA 25` | `Camino A Melipilla 25` |
| Puntuación extra | `los leones 56,` | `Los Leones 56` |
| Sin vía | `santiago centro 123` | `Santiago Centro 123` |

**Output**: Módulo `NormalizerEngine` con función `normalize(raw: string): NormalizedAddress`.

---

### Fase 5 — Motor de Geocodificación

**Modelo**: `DeepSeek V4 Pro` (principal) / `MiniMax M2.7` (alternativa)

**Tareas**:
- Sistema de cascada: `tryNominatim()` → `tryPhoton()`
- Nominatim como primaria: 1 req/seg constante, sin límite diario, sin API key
- Photon como fallback automático: si Nominatim devuelve error 5xx o timeout
- Token bucket rate limiter: 1 req/seg para Nominatim (cumplimiento estricto)
- Web Worker dedicado: no bloquea UI durante geocodificación
- Progress tracker en tiempo real (postMessage del worker → UI):
  - Muestra: "Procesando 47 de 200 (23%) · ~2m 33s restantes"
- Reintentos: exponential backoff (1s, 2s, 4s) + jitter aleatorio, máximo 3 intentos por dirección
- Cache IndexedDB: `normalizedAddress → geocodeResult`, expira en 30 días
- Timeout por request: 10 segundos máximo
- User-Agent header correcto: `GeoNormalizadorChile/1.0 (herramienta gratuita de geocodificación)`
- Cola pausable/reanudable: el usuario puede pausar, cancelar o continuar

**Clasificación de score 0-100**:

```
SCORE = (matchType × 0.40) + (importance × 0.30) + (completeness × 0.20) + (uniqueness × 0.10)
```

| Sub-puntaje | Peso | Fuente | Cálculo |
|------------|------|--------|---------|
| **matchType** | 40% | `osm_type` (Nominatim) o `type` (Photon) | building=100, house_number=95, street=70, suburb=45, city=25, state=10, country=5 |
| **importance** | 30% | `importance` (0-1 en ambas APIs) | valor × 100 |
| **completeness** | 20% | Cruce de componentes | % de tokens coincidentes entre dirección normalizada y resultado |
| **uniqueness** | 10% | Número de matches | 1 match=100, 2=80, 3=60, 4-5=40, 6+=20 |

**Badges visuales**:
- 🟢 **Excelente** ≥ 85 — tracking casi perfecto, calle+número exacto
- 🟡 **Bueno** 60–84 — calle correcta, posible desfase en número
- 🟠 **Regular** 35–59 — solo comuna o barrio identificado
- 🔴 **Bajo** < 35 — match débil, requiere revisión manual
- ⚫ **Sin resultado** — 0, sin match en ninguna API

**Output**: Módulo `GeocodeEngine` con función `geocode(address: NormalizedAddress): Promise<GeocodeResult>`.

---

### Fase 6 — Visualización y Resultados

**Modelo**: `Qwen3.6 Plus` + `skill frontend-design`

**Tareas**:
- **Mapa Leaflet**:
  - Clusters de marcadores coloreados por score (verde/amarillo/naranja/rojo)
  - Popups con: dirección original, normalizada, score, coordenadas, badge de precisión
  - Fit bounds automático a todos los puntos al cargar
  - Toggle de capas: solo Excelentes, solo Buenos, etc.
- **Tabla de resultados**:
  - Columnas: #, Original, Normalizada, Score, Precisión, Lat, Lon, Comuna, Región, Warnings
  - Filtros por score (slider 0-100), por badge, por comuna
  - Ordenamiento por cualquier columna
  - Selección múltiple para exportación parcial
  - Paginación virtual (si +500 filas)
- **Dashboard lateral**:
  - Circular progress: total geocodificados con score promedio
  - Histograma de scores (barras por rango)
  - Estadísticas: encontrados, no encontrados, % alta precisión
  - Tiempo total de procesamiento
- **Vista de detalle** (modal/panel):
  - Dirección original vs normalizada (side-by-side diff)
  - Mapa con marcador único + radio de precisión
  - Metadata: API usada, timestamps, warnings, sugerencias
  - Score breakdown (4 sub-puntajes en barras horizontales)

**Output**: UI de resultados completa, interactiva, con datos reales del motor.

---

### Fase 7 — Motor de Exportación

**Modelo**: `DeepSeek V4 Pro`

**4 formatos descargables**:

| Formato | Librería | Columnas/Esquema |
|---------|----------|-----------------|
| **CSV** | PapaParse | `original, normalizada, lat, lon, score, precision, comuna, region, warnings, api` |
| **XLSX** | SheetJS | Celdas coloreadas por score. 2 hojas: Resultados + Resumen. Auto-ancho de columnas. |
| **GeoJSON** | Nativo | `FeatureCollection`, CRS EPSG:4326, `properties` con todos los campos |
| **Shapefile** | `@crmackey/shp-write` | ZIP con `.shp` `.shx` `.dbf` `.prj` (WGS84). Nombres de campo truncados a 10 chars. |

**Features**:
- Exportación parcial: solo filas seleccionadas
- Botones individuales con íconos descriptivos
- Descarga directa con nombre: `geocodificacion_YYYY-MM-DD_HHmmss.{csv|xlsx|geojson|zip}`
- Feedback visual: spinner durante generación, toast al completar

**Output**: 4 botones de exportación funcionales con todos los formatos.

---

### Fase 8 — Testing, Pulido y Deploy

**Modelo**: `DeepSeek V4 Flash`

**Tareas**:
- **Unit tests** (Vitest):
  - Normalizador: 50+ casos de prueba (todos los de frontera listados en Fase 4)
  - Score calculator: verificar fórmula con casos conocidos
  - Parser: CSV con distintos delimitadores, XLSX con múltiples hojas
- **Optimización**:
  - Lazy load: `leaflet`, `shp-write` solo cuando se necesitan
  - Code splitting por ruta (upload / results)
  - Bundle < 500KB inicial (sin contar WASM lazy)
- **Accesibilidad**:
  - ARIA labels en todos los componentes interactivos
  - Navegación por teclado en tabla y filtros
  - Contraste AA en ambos temas
- **PWA**: manifest.json + service worker básico para cache estático
- **Deploy**: GitHub Actions → build → deploy a `gh-pages`

**Output**: App en producción, URL `https://<user>.github.io/geocoding`.

---

## Resumen de Asignación de Modelos

| Fase | Tarea | Modelo Principal | Alternativa |
|------|-------|-----------------|-------------|
| 1 | Setup & Arquitectura | **DeepSeek V4 Flash** | — |
| 2 | UI Avant-Garde | **Qwen3.6 Plus** + Skill | GLM-5.1 |
| 3 | Parseo CSV/XLSX | **DeepSeek V4 Pro** | — |
| 4 | Normalizador ⭐ | **Qwen3.6 Plus** | Kimi K2.6 |
| 5 | Geocodificación ⭐ | **DeepSeek V4 Pro** | MiniMax M2.7 |
| 6 | Visualización | **Qwen3.6 Plus** + Skill | GLM-5.1 |
| 7 | Exportación | **DeepSeek V4 Pro** | — |
| 8 | Testing & Deploy | **DeepSeek V4 Flash** | — |

⭐ = Fases críticas donde la elección del modelo tiene mayor impacto en la calidad final.

---

## Estructura de Archivos (target)

```
geocoding/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Build + deploy a gh-pages
├── public/
│   ├── favicon.svg
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── ui/                     # Botones, badges, inputs, modals
│   │   ├── upload/                 # DragDrop, FilePreview, ColumnMapper
│   │   ├── results/                # ResultTable, ResultMap, ScoreBadge
│   │   ├── export/                 # ExportButtons, ExportProgress
│   │   └── layout/                 # Shell, Sidebar, Header, ThemeToggle
│   ├── engine/
│   │   ├── normalizer.ts           # Pipeline 7 pasos
│   │   ├── normalizer.rules.ts     # Diccionarios y reglas
│   │   ├── geocoder.ts             # Cascada Nominatim→Photon
│   │   ├── geocoder.worker.ts      # Web Worker
│   │   ├── scorer.ts               # Fórmula score 0-100
│   │   ├── parser.ts               # CSV/XLSX parsing
│   │   └── exporter.ts             # Generación CSV/XLSX/GeoJSON/SHP
│   ├── hooks/
│   │   ├── useGeocoding.ts         # Hook principal
│   │   ├── useFileUpload.ts
│   │   ├── useCache.ts             # IndexedDB
│   │   └── useTheme.ts
│   ├── types/
│   │   ├── address.ts
│   │   ├── geocode.ts
│   │   └── export.ts
│   ├── data/
│   │   ├── comunas.ts              # 346 comunas
│   │   ├── regiones.ts             # 16 regiones
│   │   └── lookup.ts               # Comuna→Región, Región→Comunas
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                   # Tailwind directives
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── PLAN.md
└── README.md
```
