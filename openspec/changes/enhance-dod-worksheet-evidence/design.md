## Context

See `proposal.md` for background and regulatory references (SK-5/DKU.MBU/11/2024 Bab V & Lampiran 10).
The current implementation `src/components/deficiencies/DoDWizard.tsx` uses a minimal modal with single-question steps and lacks persistent per-step rationale and integrated evidence context.

## Goals / Non-Goals

**Goals:**
- Provide an enterprise audit worksheet view (`DoDWorksheetDialog.tsx`) adhering strictly to the 24 columns of Lampiran 10.
- Auto-extract and display evidence context:
  - TOD/TOE test workpaper details (samples tested, failures, exception rate).
  - Financial magnitude context (GL exposure vs. Performance Materiality threshold).
  - Secondary controls from RCM with effectiveness status.
  - Objective red-flag indicator checklist for prudent official assessment (AS 2201 / SK-5 Hal. 62).
- Require textual justification per active decision box with validation before final sign-off.
- Keep components modular (< 500 LOC per file per project guidelines) by separating Header/Evidence context, Logic Grid, and Summary/Footer into sub-components.
- Ensure strict compliance with `design-taste-frontend` (no sub-12px text, no decorative italics, enterprise rounded-md/rounded-lg borders, no glassmorphism/blurs).

**Non-Goals:**
- Replacing the global deficiency Kanban workflow itself (the worksheet integrates as the assessment engine triggered from the card or board).
- Modifying calculation formulas of Performance Materiality in Scoping (we only consume the computed values).

## Decisions

### 1. Architectural Decomposition of the Worksheet
Rather than creating a monolith dialog exceeding the 500 LOC threshold, decompose into:
- `DoDWorksheetDialog.tsx`: Orchestrator container controlling state, active path, and persistence.
- `DoDHeaderSummary.tsx`: Blok A (Deficiency info, remediation status, assertions, COSO components).
- `DoDEvidenceContextCard.tsx`: Blok B (Auto-aggregated evidence: sample results, exposure vs PM card, compensating control picker).
- `DoDLogicMatrix.tsx`: Blok C (Tabular evaluation for Box 1 to Box 7 with inline radio choice, mandatory justification input, and evidence tag).
- `DoDConclusionFooter.tsx`: Blok D (Final computed severity CD/SD/MW, governance routing badge as per Tabel 24 Hal. 65, and completion action).

*Alternative considered:* Keeping it inside one single file. Rejected because it would exceed 700+ lines and violate the project's single-responsibility rule.

### 2. Schema and Type Extensions in `shared/types.ts`
Introduce structured types:
```typescript
export interface DoDBoxEvaluation {
  answer: boolean;
  justification: string;
  evidenceRef?: string;
  supportingData?: Record<string, any>;
}

export interface DoDWorksheetData {
  deficiencyId: string;
  evaluatedAt: string;
  evaluatorId: string;
  evaluatorName: string;
  exposureValue: number;
  ineffectivePeriod: string;
  isRemediated: boolean;
  assertions: string[];
  cosoComponent: string;
  boxes: {
    box1?: DoDBoxEvaluation;
    box2?: DoDBoxEvaluation;
    box3?: DoDBoxEvaluation;
    box4?: DoDBoxEvaluation;
    box5?: DoDBoxEvaluation;
    box6?: DoDBoxEvaluation;
    box7?: DoDBoxEvaluation;
  };
  finalSeverity: DeficiencySeverity;
  governanceRouting: string[]; // ['CEO', 'Direksi', 'Komite Audit', 'Dewan Komisaris']
}
```

### 3. Data Integration Strategy
Fetch related data using existing TanStack Query endpoints (`api.get('/testing/plans')`, `api.get('/scoping/materiality')`, `api.get('/rcm/controls')`):
- If the deficiency links to `testPlanId` or `controlId`, query the corresponding test run to prefill sample exception data.
- Read current year materiality to dynamically compare `exposureValue` with `performanceMateriality`.

## Risks / Trade-offs

- **[Risk]** Auditor might consider typing justification for each box tedious if multiple simple deficiencies exist.
  - **Mitigation**: Provide quick template suggestion chips (e.g., "Directly impacts financial statement assertion of accuracy", "Compensating detective control is absent") that auditors can click to populate the justification textarea and customize.
- **[Risk]** Missing historical test plan link for older mock deficiencies.
  - **Mitigation**: Allow manual entry or override of evidence reference if auto-integration returns empty data.
