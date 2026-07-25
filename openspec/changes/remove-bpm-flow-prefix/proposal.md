## Why  
  
When saving or creating a BPM diagram, subProcess name is prepended with Flow:. This prefix is unnecessary and persists in DB.  
  
## What Changes  
  
- Remove Flow: prefix when creating/updating BPM diagrams.  
- Standardize BPM diagram naming to directly use subProcess name.  
  
## Capabilities  
  
### Modified Capabilities  
- bpm-visualization: Update diagram naming to remove Flow: prefix.  
  
## Impact  
  
- Frontend: useBPMPage.ts, BPMWorksheet.tsx, BPMEditor.tsx 
