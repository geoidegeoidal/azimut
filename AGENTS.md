# Azimut — project instructions

- Before work, read this file and HANDOFF.md. Prepend a handoff after project changes.
- Keep Ponytail active for coding: reuse the stack, native APIs first, no speculative dependencies. Use OpenSpec artifacts for substantial changes; keep tasks and verification evidence current.
- Prefer codebase-memory-mcp discovery. The index attempt was rejected by automatic review on 2026-10-04; use local discovery while no approved index exists. Do not retry or export source indirectly.
- Design follows the user's Swiss International reference: white/black, functional #FF3000 accent, Inter/Helvetica, rectangular controls, visible grid, no shadows or decorative gradients. Prioritize the search, map, candidate evidence and batch review.
- Precision means evidence, not OSM importance or a probability. Recorded addresses outrank interpolations; street/area locations must never imply a resolved house number.
- IDE Chile numbering must retain INI_IZQ/TER_IZQ and INI_DER/TER_DER independently, their direction, parity and every polyline vertex. Never clamp or extrapolate an out-of-range number. Legacy combined min/max data is insufficient for interpolation.
- Load official data by comuna. SIRGAS 2000 coordinates are geographically compatible at this dataset's practical precision; do not invent a metre-level guarantee or a side offset without road width/survey evidence.
- Supabase/PostGIS is the selected cloud serving option; keep public browser keys separate from service-role import keys. Enable RLS and bound anonymous RPC output. Measure database/index size against Free limits after importing.
- DuckDB is an optional offline analysis/preparation tool, not an assumed accuracy improvement. Introduce it only for a measured data processing need.
- Public Nominatim is disabled by default for this generic address service. Use an explicitly configured own/provider endpoint; respect the provider's usage terms. No remote autocomplete. Communicate source failures and preserve cancellation.
- Benchmark public addresses with cited reference evidence. OSM-derived references are consistency tests, not independent ground-truth surveys.

## Session protocol

Handoff entries contain objective, completed work, decisions, blockers, next steps and commits. The user authorized branches, commits and pushes on 2026-10-04; use a codex/ branch and push reviewable increments. Deployment needs an actual destination. Public data ingestion is allowed within the user's requested scope; credentials are supplied through local environment files, never chat logs or commits.
