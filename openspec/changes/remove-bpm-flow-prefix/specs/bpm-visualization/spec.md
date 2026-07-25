## MODIFIED Requirements  
  
### Requirement: BPM Diagram Naming  
The system SHALL name BPM diagrams using the exact sub-process name without prepending any prefix such as Flow:.  
  
#### Scenario: Creating or saving BPM diagram  
- **WHEN** user creates or saves a BPM diagram for a sub-process  
- **THEN** system saves the diagram name exactly as subProcess without Flow: prefix 
