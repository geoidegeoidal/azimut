# Address workbench

## Why
The current engine collapses the two sides of an official street segment into one sorted range, discards bends, clamps numbers outside that range, accepts weak street corrections and treats OSM object kind/importance as positional accuracy. The UI hides map/evidence behind a batch wizard.

## What changes
- Recover official vector geometries with independent directed side ranges; load by comuna.
- Rank recorded OSM addresses, valid interpolations and coarse locations with explicit evidence, alternatives and source health.
- Add text search, CSV/XLSX batches and a keyboard-accessible map review panel in the supplied Swiss style.
- Prepare a bounded, read-only Supabase/PostGIS query API, service-only data importer and cached OSM vector enrichment.
- Add algorithm regressions, reproducible public-address checks and visual/accessibility verification.

## Impact
Keep existing stack and export formats. Correct confidence labels and invalidate legacy caches. No promise of surveyed accuracy. Supabase deployment and full OSM coverage require a configured project and imported data.
