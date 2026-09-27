## Purpose

Defines the compact presentation rules for the BPM baseline status banner and the per-process workflow history so the BPM page stays scannable without hiding compliance-critical state.

## ADDED Requirements

### Requirement: Compact baseline status banner

The system SHALL render the BPM scoping-baseline status as a compact single-row strip in all states (approved, missing source data, and no approved baseline), with consistent height and layout.

#### Scenario: Approved baseline shown compactly
- **WHEN** an approved scoping simulation exists for the working year
- **THEN** the banner SHALL display a single-row success strip with the baseline year and no large empty-state block.

#### Scenario: No approved baseline shown compactly
- **WHEN** no approved scoping simulation exists for the working year (none, Draft, pending review/approval, or rejected)
- **THEN** the banner SHALL display a single-row warning strip (not a large centered empty-state block) containing a short title, a one-line description with the year, and an action link to open Scoping.

#### Scenario: Missing source snapshot shown compactly
- **WHEN** the active simulation references a GL snapshot that cannot be found
- **THEN** the banner SHALL display a single-row error strip stating the source data is missing and directing the user to re-perform scoping.

### Requirement: Accurate no-baseline wording

The system SHALL NOT label the no-approved-baseline state as `Rejected`. It SHALL use a dedicated title stating that no baseline is approved for the year, localized in English and Indonesian.

#### Scenario: English wording
- **WHEN** the UI language is English and no approved baseline exists for 2023
- **THEN** the banner title SHALL read `No Approved Baseline for 2023` (or equivalent including the year) and SHALL NOT contain the word `Rejected`.

#### Scenario: Indonesian wording
- **WHEN** the UI language is Indonesian and no approved baseline exists for 2023
- **THEN** the banner title SHALL read `Baseline Belum Disahkan untuk 2023` (or equivalent including the year).

### Requirement: Workflow history collapsed by default

The system SHALL render the per-process workflow history section collapsed by default, showing the entry count in the toggle label, while workflow actions remain visible.

#### Scenario: Opening a process shows collapsed history
- **WHEN** the user selects a BPM process
- **THEN** the history section SHALL appear collapsed as `Riwayat (N)` / `History (N)` and the available workflow action buttons SHALL remain visible without scrolling.

#### Scenario: Expanding history reveals full timeline
- **WHEN** the user expands the collapsed history section
- **THEN** the system SHALL display the full workflow timeline entries and the compliance note inside the expanded area.
