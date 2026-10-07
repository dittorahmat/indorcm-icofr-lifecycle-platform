## 1. Pure Utility & Offset Logic

- [x] 1.1 Implement bounding box calculations, collision-free offset math, and element ID re-mapping in `src/utils/bpm-ocr-append.ts` and verify with unit tests in `src/utils/bpm-ocr-append.test.ts`
- [x] 1.2 Verify handling of parent-child relationships (e.g., nodes inside swimlanes) during append offset and ID re-mapping with unit tests

## 2. Localization & Types

- [x] 2.1 Define types for OCR import mode (`'overwrite' | 'append'`) and append direction (`'below' | 'right'`) in `src/components/rcm/editor/ocr/ocr-types.ts`
- [x] 2.2 Add localized strings for import mode radio choices, descriptions, direction choices, and confirmation dialogs in `src/i18n/locales/en/bpm.json` and `src/i18n/locales/id/bpm.json`

## 3. UI Component for Mode Selection

- [x] 3.1 Create `OcrImportModeSelector.tsx` sub-component adhering to design taste rules (font >= 12px, institutional radius, mobile responsive stack)
- [x] 3.2 Integrate `OcrImportModeSelector` into `BPMOcrModal.tsx` and wire state management into `useOcrStaging.ts`
- [x] 3.3 Ensure selector gracefully handles empty canvas state by defaulting to direct import without overwrite confirmation

## 4. Canvas Integration & Handlers

- [x] 4.1 Update `handleApplyOcr` in `useBPMCanvasHandlers.ts` to receive import mode & direction parameters and apply append logic using `src/utils/bpm-ocr-append.ts`
- [x] 4.2 Verify canvas undo history (`pushState`), dirty tracking, and `fitView` execution after both Overwrite and Append operations

## 5. Verification & Compliance Checks

- [x] 5.1 Run LOC gate check (`npm run check:loc`) to ensure all touched and new files remain well below the 400 LOC limit
- [x] 5.2 Run type-check (`npm run type-check`), lint (`npm run lint`), build (`npm run build`), and tests (`npm test`) to verify zero regressions
