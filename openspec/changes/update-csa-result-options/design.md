# Design: Update CSA Result Options

## UI/UX
- **Radio Button Group**: Replace the current options with "High", "Medium", and "Low".
- **Styling**:
  - Each radio option will be wrapped in a container or styled label with a background color.
  - **High**: `bg-red-100 border-red-200 text-red-800` (checked: `bg-red-500 text-white`)
  - **Medium**: `bg-yellow-100 border-yellow-200 text-yellow-800` (checked: `bg-yellow-500 text-white`)
  - **Low**: `bg-green-100 border-green-200 text-green-800` (checked: `bg-green-500 text-white`)
- **Interaction**: Selecting an option will highlight it with the primary color while the background reflects the rating level.

## Data Model Updates
- **shared/types.ts**:
  ```typescript
  export interface CSARecord {
    // ...
    result: "High" | "Medium" | "Low"; // Changed from Pass | Fail | N/A
    // ...
  }
  ```

## Logic Changes
- **Deficiency Trigger**: In `CSAWorkspace.tsx`, update the success callback to invalidate deficiency queries if `result === 'High'` (and potentially `'Medium'`).
- **Validation**: Update `csaSchema` to use the new enum.

## Risks / Trade-offs
- **Historical Data**: Existing records with "Pass", "Fail", or "N/A" might break if the system expects the new enum. 
  - *Mitigation*: The current app is a prototype/demo, so we can clear mock data or handle mapping.
- **Reporting**: Reports that calculate "Pass Rate" will need to be updated to define what "High/Medium/Low" means for effectiveness.
