## ADDED Requirements

### Requirement: Swiss address workbench
The system SHALL provide text search, CSV/XLSX batch mapping, a map, candidate evidence and exports with the supplied Swiss design tokens.

#### Scenario: Review an interpolated result
- **WHEN** a candidate is selected
- **THEN** show its coordinate, full street line, directed range, source, evidence and review status without calling it a verified door.

#### Scenario: Mobile or keyboard use
- **WHEN** the viewport is 320px wide or the user navigates with a keyboard
- **THEN** labeled controls, visible focus, usable touch targets and contained table scrolling preserve the primary flow.
