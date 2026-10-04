# Design

Use a single candidate/evidence model for official lines, OSM address features and provider results. Interpolate along cumulative geographic line length, preserve descending ranges, enforce parity, reject missing endpoints and extrapolation. Require strong street similarity and matching known comuna; ambiguous distant candidates require review.

The map is the workspace, with address search on the left and evidence on the right. Coordinate readouts, numbered candidates and the original segment/range provide the product signature. Palette derives from cadastral paper, black survey linework, neutral gray map context and red location/action signals. Replace decorative score cards with an inline quality strip, the multi-step navigation with search/batch modes and rounded/glass containers with a visible rectangular grid. Typography: Inter/Helvetica; 4px spacing unit; borders establish depth; controls at least 44px.

Supabase normalizes streets separately from geometries to reduce storage. RLS blocks table access; a narrowly scoped RPC exposes limited candidates. OSM enrichment is cached server-side and filtered by street, geometry and numbering. Free-tier storage is measured, not assumed. DuckDB may prepare GeoParquet offline if future scale warrants it; a second runtime is unnecessary for the current streaming conversion.
