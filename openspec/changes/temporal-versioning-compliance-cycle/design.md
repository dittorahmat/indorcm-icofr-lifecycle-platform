## Context

IndoGRC Pro currently stores BPM, RCM, and Control data without year-based partitioning. To support multi-year compliance cycles as mandated by audit standards, the system must transition to a temporal versioning model.

## Goals / Non-Goals

**Goals:**
- Partition core compliance data (BPM, RCM, Controls) by `year`.
- Implement an automated "Carry Forward" mechanism for new years.
- Ensure read-only access for previous years' approved data.
- Maintain backward compatibility for existing 2024 data.

**Non-Goals:**
- Implementing "Live" versioning (multiple versions within the same year).
- Automatic synchronization of changes between years (years are isolated snapshots).

## Decisions

### 1. Database Schema Extension
- **Decision**: Add an `integer("year")` column to `bpm_diagrams`, `rcms`, `controls`, and `rcm_controls` tables.
- **Rationale**: Direct partitioning allows for efficient querying by year and clear separation of data. `rcm_controls` is included because it contains year-specific metadata for how a control is applied to a specific risk.
- **Alternative**: A separate `snapshots` table. *Rejected* due to increased complexity in join logic for daily operations.

### 2. "Carry Forward" via API Service
- **Decision**: Implement the cloning logic in the Hono API (`POST /api/simulations`).
- **Rationale**: Starting a new simulation is the natural lifecycle event that triggers a new year's cycle.
- **Implementation**: Use a transaction to clone BPMs -> RCMS -> Controls and recreate the mappings.

### 3. Read-Only Enforcement in Frontend
- **Decision**: Use a global `isLocked` state based on `selectedYear < currentYear` or `simulationStatus === 'Approved'`.
- **Rationale**: Simplest way to ensure "Frozen" snapshots without complex backend permission logic for now.

### 4. Migration Script for Legacy Data
- **Decision**: A one-time script to set `year = 2024` for all existing records.
- **Rationale**: Ensures the system is in a consistent state before enabling the 2025 features.

## Risks / Trade-offs

- **[Risk] Data Redundancy** → Cloning data every year increases database size. 
  - *Mitigation*: The volume of BPM/RCM data is relatively low compared to transactional logs; PostgreSQL handles this efficiently.
- **[Risk] Broken Links during Cloning** → Complexity in re-mapping IDs in many-to-many tables.
  - *Mitigation*: Use an ID mapping object during the cloning transaction to ensure all foreign keys are updated correctly.
- **[Risk] User Confusion** → Users might edit the wrong year.
  - *Mitigation*: Clear visual indicators (Badges) and a mandatory year selector.
