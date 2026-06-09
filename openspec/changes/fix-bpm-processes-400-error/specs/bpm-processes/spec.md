## MODIFIED Requirements
### Requirement: BPM Processes Fetching
The frontend MUST pass the required `year` query parameter when fetching BPM processes.
#### Scenario: Fetching all BPM processes in TodoList
Given the user is on the CSA Hub or Todo List page, the UI MUST fetch `/api/bpm-processes?year={workingYear}` so that the backend does not reject the request with a 400 error.
