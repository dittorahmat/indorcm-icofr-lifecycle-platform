## 1. Localization & I18n

- [x] 1.1 Update `src/i18n/locales/id/deficiency.json` with official Box a-g questions from SK-5/2024.
- [x] 1.2 Update `src/i18n/locales/en/deficiency.json` with corresponding translations.
- [x] 1.3 Add missing labels for result outcomes (Control Deficiency, Significant Deficiency, Material Weakness) in the JSON files.

## 2. Database Schema & Migration

- [x] 2.1 Update `worker/db/schema.ts` if needed to store flowchart metadata (path taken).
- [x] 2.2 Generate Drizzle migration using `npm run db:generate`.
- [x] 2.3 Apply Drizzle migration to local/target database using `npm run db:migrate`.

## 3. DoD Wizard Core Logic

- [x] 3.1 Refactor `handleAnswer` in `DoDWizard.tsx` to strictly follow the Gambar 5 flowchart (specifically Box e "No" -> MW).
- [x] 3.2 Ensure transisi antar Box (Step 1 s.d. 7) sesuai dengan logika spec.
- [x] 3.3 Update `getResult` function to accurately conclude based on the flowchart terminal boxes.
- [x] 3.4 Implement Box g (Step 7) loopback logic to Box b (Step 2) when `isAggregate` is true.

## 4. UI Refinement & Verification

- [x] 4.1 Update UI text in `DoDWizard.tsx` to use the new i18n keys for Box questions.
- [x] 4.2 Add "Box Reference" label in the footer (e.g., "Ref: Gambar 5 SK-5/2024") for regulatory compliance.
- [x] 4.3 Verify the entire flow manually to ensure no dead ends or incorrect transitions.
