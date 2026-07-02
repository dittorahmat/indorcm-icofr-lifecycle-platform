## Why

Currently, the "Add Swimlane" button is statically placed at the bottom of the left panel in the BPM Editor, outside of the scrollable shape grid. This leads to two major issues:
1. **UI Clipping**: On screens with shorter vertical heights, the button is pushed off-screen and becomes unreachable, while the shapes list itself is scrollable.
2. **OCR Limitations**: When a user applies an OCR import, all nodes are replaced, and any pre-existing swimlanes are lost. Additionally, the OCR engine does not recognize swimlane divisions from diagram images, forcing users to manually recreate and re-align swimlanes and nested nodes.

Integrating the Swimlane button into the main scrollable Process Elements grid resolves the visual clipping issue. Upgrading the AI OCR engine to recognize, extract, and layout swimlanes from diagrams directly saves significant manual mapping time.

## What Changes

- **BPM Editor UI**: Move the "Add Swimlane" button inside the main scrollable Process Elements shape grid.
- **AI OCR Schema & Prompts**: Update the Gemini OCR API schema to include the `swimlane` node type, along with properties for `department`, `function`, and `parentId` (to establish parent-child nesting).
- **OCR Import Logic (Frontend & Backend)**:
  - Backend: Detect swimlanes, read department/function headers, and assign node parent-child relations based on spatial containment.
  - Frontend: Correctly render incoming OCR swimlanes, nesting process nodes inside them with appropriate coordinates and React Flow parent relationships.

## Capabilities

### Modified Capabilities
- `bpm-diagram-editor`: Enhances usability by grouping the swimlane creation tool inside the standard shapes list.
- `bpm-ocr-import`: Upgrades the AI diagram import engine to automatically detect, label, and layout functional swimlanes, establishing parent-child containment for flow nodes.

## Impact

- `src/components/rcm/BPMEditor.tsx`: Move UI button location and handle rendering of nested parent-child nodes from OCR.
- `worker/routes/bpm.ts`: Update prompt instructions and JSON schema schema for Gemini to include `swimlane`, `department`, `function`, and `parentId`.
