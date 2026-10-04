# Interface verification — 2026-10-04

Swiss workbench follows the user's reference: white/black, functional #FF3000, Inter/Helvetica, uppercase hierarchy, square controls, visible grid. No decorative shadows, fake metrics or invented accuracy percentages.

Atlas (`?design=atlas`) follows the user's later request for a distinct style: warm paper, forest ink, copper, IBM Plex Sans/Instrument Serif, a continuous query/evidence notebook and full-height working map. It omits the visible hero/KPI strip. Selection/export appear with actual rows. Scope and decisions are in `docs/design-atlas.md`. Both views reuse one engine/state and pass the same browser scenarios; reports are `browser-check.json` and `atlas-browser-check.json`.

Automated browser checks passed at 1440, 1024, 768, 390 and 320px: no page overflow. Table scrolling stays inside its container. The 720px reflow check approximates the layout space at 200% zoom on a 1440px desktop; it is not an actual browser zoom measurement. Reduced-motion transitions resolve to 0.00001s. Search fallback, manual coordinate entry, three-row UTF-8 CSV batch and CSV/XLSX/GeoJSON/Shapefile ZIP downloads pass. Remote sources are mocked empty/unavailable in this UI test; live source checks are in the separate benchmark. No browser page or application console errors remain. Visual screenshots were inspected; screen-reader assistive technology and representative-user research were not performed.

| Law of UX | Evidence / application |
|---|---|
| Selective attention | Swiss uses one red search action. Atlas uses a green search action and selected marker; copper marks interpolated geometry/warnings. |
| Cognitive load | Address and comuna suffice; methods and sources appear alongside the result. |
| Aesthetic-usability | Consistent type, spacing, grid and controls; responsive screenshots inspected. |
| Serial position | Search first, export last; sources follow the candidate's actual evidence. |
| Goal-gradient | Batch count advances only when a row resolves; one query uses indeterminate feedback. |
| Von Restorff | Selected point and review warnings are distinguishable through markers, method labels and restrained accent use. |
| Zeigarnik | Completed rows survive pause/cancel; unfinished rows stay visibly pending. Data is session-only. |
| Flow | Map, query and evidence share a workspace; candidate inspection preserves input. |
| Chunking | Query / map / evidence / ledger are labeled groups. |
| Working memory | Query, comuna, range, coordinate and source remain visible together. |
| Occam | Existing React/Leaflet/native fetch; two active UI components replace the wizard. |
| Uniform connectedness | Full street geometry connects the selected interpolation to its range. |
| Fitts | Primary buttons and map zoom controls are at least 44px; checkboxes have adjacent labels or padded cells. |
| Hick | Two modes and three filters; candidate details are disclosed when needed. |
| Jakob | Native fields, selects, datalist, details, standard file picker and download behavior. |
| Similarity | Equal actions use equal styles; pending, review and registered statuses also have text. |
| Miller | Swiss has four factual counters. Atlas exposes query, map and evidence, adding the register after a query; no arbitrary item limit. |
| Parkinson | No compulsory wizard or decorative waiting; remote calls have bounded timeouts. |
| Postel | Accents, comma-separated comuna, UTF-8/Windows-1252, quoted multiline CSV accepted; strict output validation. |
| Proximity | Labels/help/errors near input; review evidence beside the selected result. |
| Prägnanz | Restrained palette and heading hierarchy. Atlas replaces equal panels with a continuous map and notebook. |
| Common region | Swiss borders group tasks; Atlas groups query/evidence in one column and links map/register, with little nesting. |
| Tesler | System resolves ranges/parity/name identity; user controls ambiguous candidates and manual edits. |
| Mental model | A house number requires a recorded number or valid interpolation; coarse locations are labeled. |
| Active user | Public examples populate editable fields; first-use guidance appears in empty panels. |
| Pareto | Individual query and batch work are prominent; advanced provenance lives in details. No usage analytics claimed. |
| Peak-end | Completion states state what finished and preserve exportable results on interruption. |
| Cognitive bias | Score explicitly says it is evidence, not probability; configured backend isn't labeled connected. |
| Choice overload | No remote autocomplete; native comuna suggestions and progressive candidate details. |
| Doherty | Input updates immediately; network work acknowledges loading and actual row counts. No latency threshold claim. |

Accessibility provisions: skip link, associated labels, visible keyboard focus, real buttons, live status feedback, keyboard coordinate alternative to map dragging, reduced motion and contained table scrolling. This is a checked implementation, not a WCAG certification.

Review fixes: CSV extra fields and ambiguous CSV/XLSX headers are rejected; file read blocks processing/configuration; unique source-record IDs prevent duplicate candidate keys; DBF text is transliterated to ASCII, while the other exports preserve Unicode. 93 Vitest cases and three native query checks pass. Lint/build pass. The large initial names-catalog bundle remains a documented performance limitation.
