# Public address comparison

Run `node scripts/benchmark-addresses.mjs` with the local OSM proxy running and `VITE_OSM_VECTOR_API` configured. It loads the actual official resolver from commit `a480f49` and compares it with the current directed resolver and combined source resolver. The JSON report preserves source failures and null measurements.

Five public institutional addresses were chosen from primary institutional pages/PDFs, linked in `public-addresses.json`. This sample is a coverage and regression check, not a representative Chile-wide accuracy assessment. OSM coordinates are a second source, not independent surveyed ground truth; a zero distance when OSM is selected only means source consistency.

| Address | Previous official interpolation | New resolution in live run |
|---|---|---|
| Matucana 501, Santiago | 96m from mapped OSM building position | Recorded OSM building; review required for approximate building position, absent municipality tags and alternative evidence. |
| José Miguel de la Barra 650, Santiago | Clamped to range 500–552; 78m from OSM node | Invalid official interpolation rejected; recorded OSM node recovered. |
| Maipú 2359, Concepción | Clamped to range 2370–2394; 55m from OSM building position | Invalid official interpolation rejected; recorded OSM building recovered. |
| Ricardo de Ferrari 692, Valparaíso | Assigned to range 702–793; 172m from OSM node | Invalid official interpolation rejected; recorded OSM node recovered. |
| Fernando Márquez de la Plata 0192, Providencia | Combined range 118–194 | Valid directed official interpolation; no compatible recorded OSM number in this run. |

Four queries recovered recorded OSM numbers; all five resolved with an explicit method and review status. OSM initially failed for the fifth query, and a later bounded retry completed without a compatible recorded number. These results do not establish a maximum metre error or verified doorway precision.

Other regressions cover bends, descending numbers, parity, out-of-range rejection, interior OSM numbering anchors (a previous endpoint-only error of roughly 187m), exact street identity before fuzzy matching, municipality contradictions, provider provenance and preserved cancellation.
