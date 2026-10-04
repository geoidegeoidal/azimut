# Laws of UX review — Destino, 2026-10-04

Historical checkpoint, superseded by Prisma after the user rejected this visual direction. Current evidence: `prisma-ux-review.md` and `prisma-browser-check.json`. The pending review wording below describes the prior checkpoint; it is not a current approval.

Scope: `/azimut/`, individual query and GIS batch import/review/export; 1440, 1024, 768, 649 (measured user width), 390 and 320 CSS px; keyboard/manual coordinates, native file input and buttons. Swiss comparison remains at `?design=classic`. The earlier Atlas/Swiss reports describe previous checkpoints.

## Findings

The first capture run expected the unlocated filter to be empty. Two real local failures were correctly present; the check now uses the recorded-address filter, which is empty under the simulated remote-source failure. Captures now wait for visible real map tiles after resize. The independent finish review returned `fix`: lot search could hide the edited row, next-review focus could be offscreen, and processed mobile import pushed review below the first viewport. All three changes were implemented in one batch and pass focused browser checks; the verdict pass is pending. No page overflow or application errors in the functional run.

## Matrix

| Law | Status | Evidence |
| --- | --- | --- |
| Selective Attention | applied | Import before data; review table and export after processing. |
| Cognitive Load | applied | Column mapping stays by the file; sources/candidates use details. |
| Aesthetic-Usability Effect | applied | One UI family, restrained scale, navy shell, consistent states. |
| Serial Position Effect | applied | Lotes is the first mode; export is next to the reviewed lot. |
| Goal-Gradient Effect | applied | Real completed-row count and progress; no invented query percentage. |
| Von Restorff Effect | applied | Active reference repeats in row/marker/evidence; review and failure have text. |
| Zeigarnik Effect | applied | Cancel test preserves all 103 rows and available results; session-only. |
| Flow | applied | Next-review button advances selection, keyboard focus and visible scroll position. |
| Chunking | applied | Entry, table, map and evidence are distinct work regions. |
| Working Memory | applied | File/columns remain editable in a mobile disclosure; selected row and provenance reconcile with search. |
| Occam's Razor | applied | Existing stack and engine; CSS layout, native controls, no new runtime dependency. |
| Uniform Connectedness | applied | Numbered row/marker/evidence and actual interpolation geometry. |
| Fitts's Law | compliant | Primary/secondary and zoom buttons are 44px; mobile mode controls 48px. |
| Hick's Law | applied | Two modes, four purposeful filters and native format select. |
| Jakob's Law | compliant | Real table, file picker, inputs, selects, buttons and details. |
| Law of Similarity | compliant | Shared action styles and semantic pending/review/unlocated/recorded vocabulary. |
| Miller's Law | applied | Meaningful task regions; 100-row pages limit rendering, not accepted file size. |
| Parkinson's Law | applied | No compulsory wizard; asynchronous feedback and cancel remain available. |
| Postel's Law | compliant | Accent-insensitive lot query; existing encoding, CSV and formatted XLSX checks. |
| Law of Proximity | applied | Search and filters above their table; input help beside controls. |
| Law of Prägnanz | applied | Compact grid, standard affordances and one linked-selection signature. |
| Law of Common Region | applied | Continuous work areas without nested dashboard cards. |
| Tesler's Law | applied | Source matching/numbering handled by engine; user can choose/correct candidates. |
| Mental Model | applied | Registered, interpolated, manual and unlocated are distinct; score is not probability. |
| Active User Paradox | applied | Three-public-address example imports input, then genuinely processes on request. |
| Pareto Principle | applied | User-confirmed batch work leads; individual search stays accessible. No usage metrics claimed. |
| Peak-End Rule | applied | Completion/cancellation states explain retained results and export. |
| Cognitive Bias | compliant | No invented precision, connected backend, fake results or forced account steps. |
| Choice Overload | applied | Progressive provenance; four output formats, no remote autocomplete. |
| Doherty Threshold | applied | Immediate input/filter feedback; honest process count, no measured latency claim. |

## Verification

- `npm test`: 93 Vitest cases and three native query checks pass.
- `npm run lint`: passes; upstream skill assets excluded from application lint.
- `npm run build`: passes; existing ~806kB gzip entry bundle warning remains.
- `scripts/browser-check.mjs`: six widths without page overflow; manual coordinates and comparison preserve work; CSV/XLSX/GeoJSON/SHP downloads; UTF-8 lot, accent-insensitive search, selection/hidden-edit reconciliation, next-review focus/visible scroll at 1440x400, empty filter, mobile disclosure with first-viewport review at 390/649x672, 103-row pagination and cancellation pass. Report: `destino-browser-check.json`.
- Initial and populated captures were opened at desktop/mobile/user width; map tiles are actual OSM. Remote query sources were mocked empty/unavailable to check recovery and local interpolation. Public live-engine benchmark is separate.
- Computed UI typography: IBM Plex Sans; body 14px, secondary copy 11–12px, task heading 22px at the inspected desktop scale. Contrast from inspected CSS palette: main 10.61:1, secondary 5.15:1, active nav 8.84:1, secondary nav 7.96:1, review 6.33:1, failure 7.99:1, recorded 6.73:1.
- Impeccable detector ran once over the changed UI: `[]`. No browser overlay was injected; this is source detection plus rendered review.

Residual gaps: no screen-reader assistive technology study, no representative-user research, no actual browser zoom measurement (720px reflow approximates 200% at 1440px), no national geocoding accuracy certification. The inherited initial catalog bundle and all-marker rendering remain performance limits for very large lots. This UI work does not finish Supabase ingestion/Auth/Edge deployment.
