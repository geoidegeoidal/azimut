# Session handoff

## 2026-10-04 — Backend checkpoint

- Completed: PostGIS migrations execute in isolated PostgreSQL 17; SQL assertions pass for privileges, exact street matching, directed ranges, quotas and cache eviction. Native OSM query checks pass. Edge enrichment validates Auth and limits cache to 20MiB/128 entries.
- Decision: service keys are only in ignored local environment; browser uses public key and a genuine anonymous Auth session. Native fetch avoids a new SDK.
- Cloud: user created azimut in São Paulo in the Free organization; configuration/import/deployment is in progress.
- Next: finish cloud connection and publish the panel checkpoint with browser evidence and benchmark documentation.
- Commits: 808a8c1 (engine), pushed to codex/address-workbench; backend commit follows this entry.

## 2026-10-04 — Address workbench, in progress

- Objective: improve Chilean address resolution and replace the wizard with a Swiss control panel.
- Completed: regenerated 254,859 directed polylines for 82 comunas; added strict street identity, parity, curved-line interpolation, OSM anchors, provider provenance, source failures and cancellation. 85 Vitest tests and three native query checks pass.
- Decisions: Ponytail and OpenSpec guide this project. Local per-comuna files work without credentials; Supabase/PostGIS is optional cloud serving. DuckDB remains an offline option pending a measured need.
- Blockers: no Supabase destination/credentials; graph indexing was rejected by automatic review, so local discovery is used.
- Next: finish bounded authenticated cloud enrichment, browser and public-address verification, documentation; commit and push increments on codex/address-workbench.
- Commits: first checkpoint pending.
