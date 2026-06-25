## Context

The BPM Editor's document print view (`documentView` mode) renders a header (`BPMCanvasHeader`) and a footer (`BPMCanvasFooter`) simulating the official Appendix 4 structure. The signature boxes in the footer currently contain empty lines and are filled manually. There is also a digital workflow tracking mechanism (`workflowHistory`) for BPM Processes that records sign-off history (e.g., submit, review, approval events). However, the PDF print canvas footer is completely static and does not display these digital sign-offs nor allow manual name editing.

## Goals / Non-Goals

**Goals:**
- Dynamically display the digital sign-off user names and dates in the printed/exported PDF.
- Allow users to manually override or customize any sign-off name or date inside the Document View.
- Persist manual overrides to the database and re-load them on subsequent visits.
- Ensure the layout remains styled professionally (without border outlines) during PDF printing/exporting.

**Non-Goals:**
- We are not changing the core workflow states or validation rules of the BPM Process workflow.
- We are not changing the visual node mapping layout or connections, only the canvas print header/footer.

## Decisions

### 1. Hybrid Storage Strategy
- We will use the `metadata` JSONB column on the `bpm_diagrams` table.
- A `signatures` key will be stored within `metadata`, containing:
  ```json
  {
    "lini1Name": "User Override Lini 1",
    "lini1Date": "2026-06-25",
    "lini2Name": "User Override Lini 2",
    "lini2Date": "2026-06-25",
    "cfoName": "User Override CFO",
    "cfoDate": "2026-06-25"
  }
  ```
- **Rationale**: Storing overrides in diagram `metadata` keeps the structure clean and self-contained. It avoids schema migration (since the `metadata` JSONB column is already present).

### 2. Auto-population Fallback Chain
When the Document View is opened, the frontend will compute the sign-off details:
1. **Lini 1 (Disusun Oleh)**:
   - Check `diagram.metadata.signatures.lini1Name`. If set, use it.
   - Else, find the most recent `"Submit"` action in `bpmProcess.workflowHistory` and use that user's name and date.
   - Else, fall back to the creator's name of the diagram.
2. **Lini 2 (Direview Oleh)**:
   - Check `diagram.metadata.signatures.lini2Name`. If set, use it.
   - Else, find the most recent `"Review"` action in `bpmProcess.workflowHistory` and use that user's name and date.
   - Else, display empty/blank input.
3. **CFO (Disetujui Oleh)**:
   - Check `diagram.metadata.signatures.cfoName`. If set, use it.
   - Else, find the most recent `"Approve"` action in `bpmProcess.workflowHistory` and use that user's name.
   - Else, display empty/blank input.
- **Rationale**: This provides instant value by auto-filling if the workflow was completed digitally, but gives complete editing freedom.

### 3. Print-safe Editable Inputs
- Instead of static text or popups, we will render text inputs directly inside the footer cells.
- Standard inputs would show ugly border boxes on the printed PDF. We will use CSS classes `print:border-none print:bg-transparent print:placeholder-transparent border-slate-200 focus-visible:ring-1 focus:ring-slate-400 bg-white` to make them print-safe.
- **Rationale**: Avoids complex toggle states between "edit mode" and "print view". The inputs behave like normal inputs in the UI, but look like clean static text in the printout.

## Risks / Trade-offs

- **[Risk]**: User overrides the signature, but then a new official workflow action occurs (e.g. Lini 2 reviews). The override would still take precedence, potentially showing outdated manually typed names instead of the new reviewer.
  - **Mitigation**: We will display a "Reset to Workflow" helper button or simply allow clearing the custom input. Clearing the input will fall back to the workflow defaults.
- **[Risk]**: Database `updateDiagram` service is called inside a database transaction and performs sync. Saving metadata might fail if schema does not support it.
  - **Mitigation**: The `metadata` column is already a `jsonb` column in `bpmDiagrams` (checked in `schema.ts`). We will verify by updating `worker/services/bpm-service.ts` to include it in the `set` update block.
