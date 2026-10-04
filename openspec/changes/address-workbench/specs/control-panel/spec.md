## ADDED Requirements

### Requirement: Swiss address workbench
The system SHALL provide text search, CSV/XLSX batch mapping, a map, candidate evidence and exports with the supplied Swiss design tokens.

#### Scenario: Review an interpolated result
- **WHEN** a candidate is selected
- **THEN** show its coordinate, full street line, directed range, source, evidence and review status without calling it a verified door.

#### Scenario: Mobile or keyboard use
- **WHEN** the viewport is 320px wide or the user navigates with a keyboard
- **THEN** labeled controls, visible focus, usable touch targets and contained table scrolling preserve the primary flow.

### Requirement: Reviewable alternative design
The system SHALL open the modern colorful cartographic workshop proposal by default and retain the original Swiss design through `?design=classic`, preserving the same resolution and review behavior. This replaces the rejected flat Destino and Atlas prototypes.

#### Scenario: Compare layout alternatives
- **WHEN** the cartographic workshop is opened
- **THEN** batch import leads, with a broad map and horizontal review table, graphite/lime/cyan/coral/violet roles, linked numbered selection and usable mobile reflow.
- **WHEN** the user compares designs
- **THEN** the imported file, rows, selection and manual corrections survive without reloading.

#### Scenario: Change map presentation
- **WHEN** the user chooses Mapa claro
- **THEN** original OSM raster colors are restored without changing geometry, coordinates, attribution or selected row.

#### Scenario: Recover from export failure on mobile
- **WHEN** export fails while the processed importer is collapsed
- **THEN** show the error beside the export area, retain the selection and permit another format/retry; no previous success notice contradicts the error.

### Requirement: GIS batch review
The system SHALL support accent-insensitive lot search, uncertainty and unlocated filters, next-review keyboard focus and pagination of at most 100 visible rows.

#### Scenario: Filter or paginate a large lot
- **WHEN** the user filters or changes page
- **THEN** source rows and selection are retained; export includes all selected resolved locations, independent of current page/filter.

#### Scenario: Correct a location
- **WHEN** a user supplies coordinates or chooses a candidate
- **THEN** the numbered row, map and evidence agree, and manual edits remain labeled as requiring review rather than automatically verified.

#### Scenario: Start with one clear import action
- **WHEN** the workspace has no rows
- **THEN** show one import-file action with an interactive azimuth mark, a broad real map and locally served Outfit typography; do not duplicate import or empty review/evidence panels.
- **WHEN** input validation fails before any rows exist
- **THEN** keep the error visible beside the importer.

#### Scenario: Artistic motion with accessible feedback
- **WHEN** a mouse moves over the import surface or title symbol
- **THEN** the bearing responds without moving controls or altering geographic coordinates.
- **WHEN** a different resolved location is selected
- **THEN** a finite animation emphasizes its real marker and street geometry.
- **WHEN** reduced motion is requested
- **THEN** remove spatial and drawing animation while preserving visible selection and status feedback.
