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
The system SHALL provide the Atlas design proposal through `?design=atlas`, preserving the same resolution and review behavior.

#### Scenario: Compare layout alternatives
- **WHEN** Atlas is opened
- **THEN** a continuous query/evidence notebook occupies the left column and a full-height map/results the right column on desktop, with warm paper/forest ink/copper, IBM Plex Sans/Instrument Serif, no visible hero/KPI strip, a link to the original layout and usable mobile reflow.
