# Product
<!-- impeccable:product-schema 1 -->

## Platform
Web, escritorio y adaptación móvil.

## Users
Personas que procesan y corrigen lotes de direcciones chilenas para GIS. Esta tarea fue confirmada por el usuario; su organización, frecuencia y necesidades específicas de accesibilidad aún no se conocen.

## Product Purpose
Convertir direcciones en ubicaciones exportables con evidencia visible, distinguir registros de estimaciones y facilitar la corrección humana de casos dudosos.

## Operating Context
Importar CSV/XLSX, asignar columnas, procesar, filtrar filas que requieren revisión, contrastar candidatos en un mapa y corregir coordenadas. Exportar CSV, XLSX, GeoJSON o Shapefile. También se permite consultar una dirección individual. La tabla y la fila seleccionada son el centro del trabajo con lotes.

## Capabilities and Constraints
React, TypeScript, Vite, Zustand y Leaflet existentes. Callejero IDE 2022 con 254.859 segmentos dirigidos en 82 comunas; geometrías completas, paridad y rangos por lado. Evidencia OSM y proveedores disponibles, con límites y fallos explícitos. Servidor Supabase/PostGIS Free autorizado: migraciones aplicadas, pero importación, Auth anónima y despliegue Edge todavía pendientes. No existe garantía de precisión métrica ni cobertura nacional completa. El puntaje ordena evidencia, no expresa probabilidad. La salida DBF de Shapefile translitera texto a ASCII; las otras salidas preservan Unicode.

## Brand Commitments
Nombre Azimut. El diseño original Swiss queda disponible para comparación. El usuario autorizó proponer un estilo propio y pidió usar Impeccable. Prioriza una interfaz funcional primero, con revisión final. «Procede» autorizó desarrollar Destino, pero posteriormente lo rechazó por plano y simplón. La indicación vigente del 2026-10-04 es probar otro diseño más moderno, tech y con paletas llamativas y coloridas. Prisma es la propuesta funcional vigente, aún sujeta a su revisión visual. Ponytail y OpenSpec acompañan el desarrollo; ramas, commits y push están autorizados.

## Evidence on Hand
Datos locales, benchmark de cinco direcciones públicas con fuentes citadas en docs/benchmarks y pruebas del motor. Referencias OSM demuestran consistencia con esa fuente, no verdad topográfica independiente. Ningún dato de demostración debe presentarse como un lote del usuario.

## Product Principles
Mostrar fuente, método, incertidumbre y fallos junto a la fila. Evitar extrapolar numeraciones o ocultar ambigüedad. Conservar trabajo al cambiar vistas y cancelar procesos. Facilitar importación, revisión y exportación por teclado. Separar corrección manual de resolución automática. No inventar estadísticas, servicios conectados ni garantías.
