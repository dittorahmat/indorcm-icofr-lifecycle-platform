## Context  
  
BPM diagram creation and updates currently append a Flow: string prefix to the name attribute of the diagram entity.  
  
## Goals / Non-Goals  
  
Goals:  
- Remove Flow: prefix hardcoding in useBPMPage.ts, BPMWorksheet.tsx, and BPMEditor.tsx.  
- Use clean subProcess name for BPM diagram names.  
  
Non-Goals:  
- Changing database schema types or entity structures.  
  
## Decisions  
  
- Set name directly to subProcess in frontend mutations.  
  
## Risks / Trade-offs  
  
- [Risk] Existing stored records in DB may still have Flow: prefix until updated or saved. 
