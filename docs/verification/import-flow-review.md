# Input panel page flow — 2026-10-04

Request: remove the internal vertical scrollbar from Archivo de entrada, preserving the cartographic workshop identity and GIS batch workflow.

The input panel and its column list now use intrinsic content height with visible overflow. The page handles vertical scrolling. Desktop importer and ledger align to the start of their grid tracks; a340px populated map row avoids fractional auto-height track amplification. Empty map maximum height is640px. Table body remains bounded440px,400px on mobile. Mobile flex panels retain stretch alignment and the processed-entry disclosure.

Verification: lint and production build pass. Browser workflow passes at1440,1304,1024,768,390 and320px; all32columns and the importer footer fit without internal scrolling at1304/390px. At1440/1304px, the populated map is340px, the three-row ledger413px and the importer footer gap25px. The103-row pagination case retains100visible rows and a bounded scrolling table. Import validation, four exports, filtering, correction, design comparison, motion alternatives and mobile export recovery also pass.

Source API responses were mocked unavailable/empty for deterministic fallback tests; local IDE geometry and map tiles were real. These checks do not measure geocoding accuracy. Existing production catalog bundle warning remains (~808kB gzip).

Impeccable layout detector returned no findings. Independent scoped rendered assessment passed: no nested importer scrollbar, stretched map or blank ledger; full-width mobile regions remain in the established order. Evidence: import-flow-browser-check.json and captures in the session's import-flow visualization directory.
