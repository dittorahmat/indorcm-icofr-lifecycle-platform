## MODIFIED Requirements
### Requirement: Agentic Action Confirmation
The AI API MUST parse date properties from actionConfirmation payloads.
#### Scenario: Confirming CREATE_SCHEDULE parses date properly
When the AI API receives an actionConfirmation payload for CREATE_SCHEDULE, the `plannedDate` property (which comes across the wire as a JSON string) MUST be instantiated back into a Javascript `Date` object before it is passed to Drizzle ORM to avoid "toISOString is not a function" errors.
