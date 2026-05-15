# 🧭 Azimut

**Geocodificador y normalizador de direcciones chilenas.**  
SPA 100% client-side — todo corre en tu navegador. Sin API keys, sin límites.

## 🌎 URL

**[geoidegeoidal.github.io/azimut](https://geoidegeoidal.github.io/azimut/)**

## ✨ Features

- 📂 **Subí CSV o XLSX** con direcciones chilenas (detección automática de encoding y columna)
- 🧹 **Normalizador bulletproof**: 7 pasos — limpia teléfonos/RUTs/emails intrusos, expande abreviaturas (`Pje→Pasaje`, `Stgo→Santiago`), corrige tildes
- 🗺️ **Geocodificación real** vía Nominatim (1 req/s) con fallback a Photon — sin API keys
- 📊 **Score 0-100** por dirección: match type × importancia × completitud × unicidad
- 🌍 **Mapa Leaflet** con marcadores coloreados por precisión y popups ricos
- 📋 **Tabla filtrable** con detalle de score (modal con desglose de 4 factores)
- 📦 **4 formatos de exportación**: CSV, XLSX (celdas coloreadas), GeoJSON, Shapefile (.zip)
- 🌙 **Dark mode** con toggle animado

## 🔧 Stack

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + Vite 7 + TypeScript |
| Estilos | Tailwind CSS v4 + Framer Motion |
| Mapa | Leaflet + OSM |
| CSV/XLSX | SheetJS + PapaParse |
| Geocoding | Nominatim + Photon (sin API key) |
| Export | GeoJSON nativo, @crmackey/shp-write |
| Cache | IndexedDB (30 días) |
| Tests | Vitest |

## 🧪 Tests

```bash
npm test        # Vitest: normalizador, scorer, parser
npm run build   # Build de producción
npm run dev     # Dev server en localhost:5173
```

## 📝 Datos de Chile embebidos

- 346 comunas con aliases y fuzzy matching (Levenshtein)
- 16 regiones con números romanos y abreviaturas
- ~50 abreviaturas de vías y unidades
- ~150 correcciones de tildes y nombres propios
