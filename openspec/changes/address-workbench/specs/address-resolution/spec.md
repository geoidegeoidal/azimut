## ADDED Requirements

### Requirement: Evidence-based address resolution
The system SHALL retain the original query, rank multiple source candidates and disclose method, source, numbering evidence, warnings and unavailable sources.

#### Scenario: Out-of-range house number
- **WHEN** a number is outside every compatible directed side range
- **THEN** no official interpolated candidate is returned and no endpoint is substituted.

#### Scenario: Curved or descending street
- **WHEN** a compatible side has a descending range or a curved line
- **THEN** interpolation follows the directed range and cumulative line length.

#### Scenario: Provider candidate has a different comuna or number
- **WHEN** structured evidence contradicts a supplied comuna or number
- **THEN** reject a mismatched comuna and label a mismatched number as a coarse street result requiring review.

#### Scenario: Source outage or cancellation
- **WHEN** an external source fails or the user cancels
- **THEN** report source availability, preserve completed rows and stop further requests on cancellation.

### Requirement: Supabase spatial serving
The system SHALL use PostGIS for indexed geometry storage when configured, restrict anonymous reads to bounded RPC output and reserve writes/imports for server credentials.

#### Scenario: No backend configured
- **WHEN** Supabase credentials are absent
- **THEN** local official data remains usable and the panel clearly identifies unavailable enrichment.
