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
The system SHALL open Destino by default and retain the original Swiss design through `?design=classic`, preserving the same resolution and review behavior. This replaces the rejected Atlas prototype.

#### Scenario: Compare layout alternatives
- **WHEN** Destino is opened
- **THEN** batch import leads, with a dominant review table and numbered map/evidence inspector on desktop, navy/cool-white/yellow states and IBM Plex Sans, no hero/KPI cards and usable mobile reflow.
- **WHEN** the user compares designs
- **THEN** the imported file, rows, selection and manual corrections survive without reloading.

### Requirement: GIS batch review
The system SHALL support accent-insensitive lot search, uncertainty and unlocated filters, next-review keyboard focus and pagination of at most 100 visible rows.

#### Scenario: Filter or paginate a large lot
- **WHEN** the user filters or changes page
- **THEN** source rows and selection are retained; export includes all selected resolved locations, independent of current page/filter.

#### Scenario: Correct a location
- **WHEN** a user supplies coordinates or chooses a candidate
- **THEN** the numbered row, map and evidence agree, and manual edits remain labeled as requiring review rather than automatically verified.
