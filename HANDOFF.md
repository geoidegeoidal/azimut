# Session handoff

## 2026-10-04 — Input panel without nested scrolling

- Objective: remove the vertical scrollbar inside Archivo de entrada while preserving the cartographic workshop design and GIS review flow.
- Completed: importer and column list grow in normal page flow; desktop input and ledger align to content, populated map row340px, empty map capped640px, table body capped440px/400px mobile. Mobile panels remain full width and retain the processed-entry disclosure.
- Decisions: reuse native grid/flex CSS, no dependency. Auto-height fractional tracks inflated neighboring panels during review; bounded map track plus content alignment resolves that pitfall. AGENTS, DESIGN/sidecar and OpenSpec record the final behavior.
- Verification: lint/build and full browser workflow pass at1440/1304/1024/768/390/320;32columns visible without inner scrolling, compact three-row regions,103-row bounded table, exports and mobile recovery. Independent scoped layout assessment passed; final mechanical layout scan returned no findings. Reports in docs/verification/import-flow-*; API sources mocked empty/unavailable, local IDE and tiles real.
- Blockers: none for this UI change. Supabase ingestion/Auth/Edge remain separate pending backend work.
- Next: user review of the revised input flow; keep Vite/native preview available.
- Commits: follows pushed a9f72b2 on codex/cartographic-workspace; this entry accompanies the input-flow fix checkpoint.

## 2026-10-04 — Artistic cartographic workshop

- Objective: address the user's rejection of duplicated import, typography and anonymous identity; retain the requested modern, tech, colorful GIS workflow with artistic expression and interactive motion.
- Completed: one import action; local Outfit variable font with OFL license; lowercase wordmark and shared geometric bearing; pointer-responsive needle; finite header arc, marker focus and actual street trace; reduced-motion CSS and pointer alternative. Empty state is importer + broad real map; populated ledger/inspector retain task density. Source degradation counts remain visible while details are closed. Input errors remain visible without rows; export errors stay outside the mobile disclosure.
- Verification: lint/build pass; browser checks at1440/1304/1024/768/390/320 pass, including single import, font load, pointer/reduced motion, real geometry, four exports, manual correction/design preservation, filters/focus, mobile export failure/retry and103-row cancellation/pagination. Captures are settled/full-page; source APIs mocked unavailable/empty, local IDE and OSM tiles real. Earlier unchanged engine93Vitest +3native checks pass. Initial JS catalog remains about808kBgzip.
- Decisions: current proposal is a cartographic workshop, not user-approved visual identity. Native CSS/SVG and pointer APIs, no new runtime dependency or fake precision claims. OpenSpec/product/brief and AGENTS updated. The graph index remains unavailable after prior automatic-review rejection; do not retry.
- Blockers: no UI blocker. Supabase import, anonymous Auth and Edge deployment still pending; design does not alter geocoding precision.
- Review: fresh full Impeccable review matched the scoped contract and requested one header-hover reduced-motion fix. Applied and tested; verdict scored it resolved, disposition ship at fix-list scope. Full report and verdict preserved in docs/verification.
- Documentation: fresh documenter wrote token-bearing DESIGN.md and .impeccable/design.json; frontmatter/reference and JSON checks pass. Public asset scan:0 rasters,0 missing.
- Next: user visual review of the working proposal; cloud ingestion/Auth/Edge remain the separate pending backend work. Keep Vite/native preview available.
- Commits: 4841e67 (Prisma checkpoint) pushed on codex/cartographic-workspace; 2e2b22c/76d0dda on codex/destino-gis are prior UI checkpoints. 4f006cb is the pushed artistic feature checkpoint; review/documentation closure is the following branch checkpoint.

## 2026-10-04 — GIS batch design direction

- Objective: replace the rejected Atlas alternative using official Impeccable, focused on processing and correcting GIS batches.
- Completed: installed Impeccable 4.5.0 with LICENSE/NOTICE; captured confirmed product context in PRODUCT.md and code-first preference. Prepared a local decision board (key b1488e00, seed ab5ec911): Destino, Registro and Terreno; no direction selected yet.
- UI checkpoint: functional query/map/evidence/batch workspace; CSV/XLSX mapping, pause/cancel, manual coordinates, four exports, source states. Design switching preserves imported file, selected rows and manual coordinates. Existing 93 Vitest tests plus 3 native checks, lint and production build pass. Browser checks cover five widths, exports and fallback sources; latest reports are copied to docs/verification. These checks describe the existing prototype, not the unbuilt replacement.
- Decisions: the user confirmed batches for GIS as the opening priority. Table-first is the next design; current Atlas remains an unapproved field-notebook prototype. Git workflow is codex/address-workbench with checkpoints and push.
- Blockers: waiting for visual direction on the Impeccable decision board. Cloud import, anonymous Auth and Edge deployment remain pending; migrations are already applied. Graph indexing was rejected, use local discovery.
- Next: build selected direction, bounded desktop/mobile review, fresh finish reviewer and documenter, update verification and push. Keep the Vite preview running for review.
- Commits: 808a8c1, 24a3d01, fa581ef (parser/export/identity), 4e1ee4c (workspace) and 31be175 (Impeccable/context) pushed to codex/address-workbench. Verification checkpoint follows this entry.

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
