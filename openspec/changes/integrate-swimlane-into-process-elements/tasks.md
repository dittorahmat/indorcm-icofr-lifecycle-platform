## 1. Backend OCR Upgrades

- [x] 1.1 Add `"swimlane"` to the Gemini schema `type` enum in `worker/routes/bpm.ts`.
- [x] 1.2 Add `parentId`, `department`, `function`, `width`, and `height` properties to the schema in `worker/routes/bpm.ts`.
- [x] 1.3 Update Gemini `systemInstruction` in `worker/routes/bpm.ts` to instruct the AI on swimlane boundary grouping and label extraction.

## 2. Frontend UI & Import Integration

- [x] 2.1 Add the Swimlane button inside the Process Elements scrollable grid in `src/components/rcm/BPMEditor.tsx` and delete the standalone button at the bottom.
- [x] 2.2 Update `handleApplyOcr` in `src/components/rcm/BPMEditor.tsx` to handle swimlane mapping, relative child coordinate translation (`position.x - parent.x`), and event handler injection.

## 3. Compliance & Verification

- [x] 3.1 Run `npm run type-check` to verify TypeScript integrity.
- [x] 3.2 Run `npm run lint` to verify code quality.
- [x] 3.3 Run `npm run build` to verify standard compile.
