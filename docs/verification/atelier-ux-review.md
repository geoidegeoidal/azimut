# Laws of UX review — Taller cartográfico, 2026-10-04

Scope: /azimut/, query and GIS batch import/review/export, six widths1440/1304/1024/768/390/320. User viewport measured1304x884, included in empty and filled full-page captures. Swiss comparison remains at ?design=classic. Prior Atlas/Destino reports are historical; the user rejected those looks and requested modern, tech, eye-catching, colorful.

## Findings

Browser checks pass without application errors or page overflow. This design cycle corrected the inherited hidden mobile export error, low attribution contrast in the dark map and excess table-toolbar height. Success is next to the table heading; error is visible after collapsing input and clears the previous completion notice. The map has an original-colors toggle. The latest user rejected duplicate import, fonts and anonymous identity; the revised composition removes empty ledger/inspector, replaces fonts and uses bounded bearing/selection motion. Reduced-motion specificity was corrected and checked. The fresh full finish review matched the scoped identity/composition and requested one material fix (header hover under reduced motion); its verdict scored that fix resolved, disposition ship, at fix-list scope. these checks do not certify taste or geocoding accuracy.
## Matrix

| Law | Status | Evidence |
| --- | --- | --- |
| Selective Attention | applied | Import before data; review table and export after processing. |
| Cognitive Load | applied | Column mapping stays by the file; sources/candidates use details. |
| Aesthetic-Usability Effect | applied | Locally served Outfit, lowercase wordmark, responsive azimuth graphic, graphite surfaces and coherent colorful roles; user aesthetic approval remains open. |
| Serial Position Effect | applied | Lotes is the first mode; export is next to the reviewed lot. |
| Goal-Gradient Effect | applied | Real completed-row count and progress; no invented query percentage. |
| Von Restorff Effect | applied | Active reference repeats in row/marker/evidence; review and failure have text. |
| Zeigarnik Effect | applied | Cancel test preserves all 103 rows and available results; session-only. |
| Flow | applied | Next-review button advances selection, keyboard focus and visible scroll position. |
| Chunking | applied | Entry, table, map and evidence are distinct work regions. |
| Working Memory | applied | File/columns remain editable in a mobile disclosure; selected row and provenance reconcile with search. |
| Occam's Razor | applied | Existing stack and engine; CSS layout, native controls, no new runtime dependency. |
| Uniform Connectedness | applied | Numbered row/marker/evidence and actual interpolation geometry. |
| Fitts's Law | compliant | Primary/secondary and zoom buttons are 44px; mobile mode controls 44px. |
| Hick's Law | applied | Two modes, four purposeful filters and native format select. |
| Jakob's Law | compliant | Real table, file picker, inputs, selects, buttons and details. |
| Law of Similarity | compliant | Shared action styles and semantic pending/review/unlocated/recorded vocabulary. |
| Miller's Law | applied | Meaningful task regions; 100-row pages limit rendering, not accepted file size. |
| Parkinson's Law | applied | No compulsory wizard; asynchronous feedback and cancel remain available. |
| Postel's Law | compliant | Accent-insensitive lot query; existing encoding, CSV and formatted XLSX checks. |
| Law of Proximity | applied | Search/filters over their table; errors and success by export, outside collapsed entry. |
| Law of Prägnanz | applied | Broad map and horizontal table; native controls and cyan linked-selection signature. |
| Law of Common Region | applied | One import region and map before data; table and inspector join after processing. |
| Tesler's Law | applied | Source matching/numbering handled by engine; user can choose/correct candidates. |
| Mental Model | applied | Registered, interpolated, manual and unlocated are distinct; score is not probability. |
| Active User Paradox | applied | Three-public-address example imports input, then genuinely processes on request. |
| Pareto Principle | applied | User-confirmed batch work leads; individual search stays accessible. No usage metrics claimed. |
| Peak-End Rule | applied | Completion/cancellation states explain retained results and export. |
| Cognitive Bias | compliant | No invented precision, connected backend, fake results or forced account steps. |
| Choice Overload | applied | Progressive provenance; four output formats, no remote autocomplete. |
| Doherty Threshold | applied | Immediate input/filter feedback; honest process count, no measured latency claim. |

## Verification

- npm test: engine93Vitest and3native OSM checks passed earlier in this session; no engine changes in this design cycle.
- npm run lint / npm run build: pass. Inherited catalog entry remains about807kBgzip; no new runtime dependency.
- scripts/browser-check.mjs: pass. Six widths, original-map toggle, keyboard/manual coordinates preserved across comparison, UTF8three-row lot, accent-insensitive search and inspector reconciliation, next-review focus plus visible scroll at1440x400, empty filter, four downloads, mobile collapsed entry with visible export error/retry, 103-row pagination and cancellation. Report atelier-browser-check.json. Extra checks cover one import action, local Outfit loading, pointer bearing, reduced motion, normalized real street animation and initial validation errors.
- Captures at1440,390 and1304x884 were opened in two bounded grouped rounds: empty, filled and mobile export error. Source-query APIs are mocked503/empty to test fallback; official local interpolation and OSM tiles are real. These screenshots are not new live benchmark results.
- Source-token contrast: body15.54:1, secondary8.30:1, lime action15.02:1, cyan selection11.77:1, coral review7.95:1, failure8.24:1, recorded9.75:1, violet provenance8.30:1, input boundary3.83:1. Map imagery retains original-color option; no contrast guarantee is claimed for all map labels.
- Impeccable detector ran once for this user-steered cycle: []. Fresh full finish review and the resolved-fix verdict are saved alongside this report. Fresh documenter wrote DESIGN.md and .impeccable/design.json; frontmatter/reference and JSON checks pass. Public asset scan:0 rasters,0 missing.

Residual gaps: no assistive-technology study, no representative-user research, no true browser zoom measurement (720px reflow approximates200% of1440), no measured latency, no national accuracy certification. Very large lots still render all found map markers, and the inherited initial catalog bundle remains a limit. Supabase ingestion/Auth/Edge deployment remains pending. The cartographic workshop is a functional visual proposal, not user acceptance.