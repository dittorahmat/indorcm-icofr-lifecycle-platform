## Context

The IndoGRC Pro dashboard serves as the main activity and compliance hub. To provide executive visibility into testing progress, we need to show how many controls have completed their Control Self-Assessment (CSA) or tests, grouped by their frequency and mapped against the Table 22 sample targets. The user designated the empty sidebar space below the "Compliance Engine" banner for this new widget.

## Goals / Non-Goals

**Goals:**
- Create a `CSARealizationTable` component in `src/components/dashboard/CSARealizationTable.tsx`.
- Group all controls loaded from `/api/controls` in the frontend using `React.useMemo` for high performance and zero extra API calls.
- Display BUMN SK-5 Table 22 targets as reference benchmarks next to active population and realization counts.
- Render progress bars indicating realization percentages.

**Non-Goals:**
- Creating a separate database table for realization summaries (all statistics will be derived dynamically in the frontend from active controls and their CSA states).

## Decisions

### 1. Frontend Grouping & Data Reuse
We will pass the controls fetched in the parent `Dashboard` component (from `/api/controls`) directly into the new `CSARealizationTable` component.
- **Rationale**: Reuses the query cache, avoids double fetching, and ensures the numbers on the realization table match the main KPIs.

### 2. Table Column Structure
The widget table will have the following columns:
- **Frekuensi** (e.g. Annual, Monthly)
- **Populasi** (Total active controls matching this frequency)
- **Target TOE (Tabel 22)** (Reference range text from `getSuggestedSampleRange`)
- **Realisasi CSA** (Count of completed tests / total population)

### 3. Styling & Aesthetics
The component will be styled as a clean card matching Shadcn/UI standards, using a progress bar component (`@/components/ui/progress`) to show realization visually.

## Risks / Trade-offs

- **Risk**: Controls might not have their `frequency` property filled, resulting in "Unmapped" groups.
  - **Mitigation**: Filter out or group under a fallback category ("Lainnya") if a control has an undefined frequency, and show a warning in the UI.
