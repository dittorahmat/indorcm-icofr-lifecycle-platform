## 1. Database and Backend Extensions

- [x] 1.1 Add `changeCategory` column to `auditLogs` table in `worker/db/schema.ts`
- [x] 1.2 Generate and run database migrations using `npx drizzle-kit push`
- [x] 1.3 Update `AuditService` in `worker/services/audit-service.ts` to accept `changeCategory` and write to the database
- [x] 1.4 Update RCM change approval endpoint (`/api/rcm/:id/approve-change`) and Control approval endpoint (`/api/controls/:id/approve`) in `worker/routes/rcm.ts` to support regulatory change category and effective date logging

## 2. BPM Modal Logs Tab Redesign

- [x] 2.1 Redesign `src/components/bpm/Lampiran6LogView.tsx` table to support the 11 columns required by Lampiran 6
- [x] 2.2 Implement metadata extraction from `dataBefore` and `dataAfter` properties in the log row rendering (Process, Sub-process, Control references, Control Owner)
- [x] 2.3 Ensure responsive scrolling (`overflow-x-auto`) for the 11-column table within the BPM Modal

## 3. Regulatory Report Page and Exporting

- [x] 3.1 Implement the `ChangeLogReport` component in `src/components/reports/RegulatoryReportComponents.tsx` to fetch regulatory change logs (`isRegulatory: true`)
- [x] 3.2 Add CSS classes to format the 11-column table for printable A4 standard
- [x] 3.3 Add digital sign-off visual blocks to the bottom of the Change Log Report showing "Disetujui oleh: (Pemilik Pengendalian)" and "Diketahui oleh: (Lini Kedua Fungsi ICOFR)"
- [x] 3.4 Implement CSV/Excel export buttons in the Report layout using existing utilities
