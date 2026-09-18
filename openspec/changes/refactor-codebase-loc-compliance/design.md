# Design: Full-stack Codebase LOC Compliance Refactoring

## Architecture Overview

Proposal ini menangani modularisasi dan dekomposisi pada modul-modul yang melanggar batas LOC di [AGENTS.md](file:///C:/backup/indorcm-icofr-lifecycle-platform/AGENTS.md) (Hard Limit 800 LOC dan Soft Limit 500 LOC), terbagi atas Frontend dan Backend.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BEFORE VS AFTER ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  BEFORE (Monolithic Files > 800-1100+ LOC):                                  │
│  - BPMCustomNodes.tsx (1.146 LOC) ───────> All 30+ Lampiran 3 nodes inside   │
│  - bpm-service.ts (1.164 LOC) ────────────> Validation, transforms, Drizzle  │
│  - routes/rcm.ts (835 LOC) ───────────────> DB joins, matrix logic inside   │
│  - routes/csa.ts (780 LOC) ───────────────> Query orchestration in router    │
│                                                                             │
│  AFTER (Decomposed Modular Architecture < 400-500 LOC each):                │
│                                                                             │
│  [Frontend]                                                                 │
│  src/components/rcm/nodes/                                                  │
│    ├── ProcessNodes.tsx        (< 300 LOC: Oval, Task, Subprocess)          │
│    ├── RiskControlNodes.tsx    (< 350 LOC: Hexagon Risk, Control box)       │
│    ├── SystemMediaNodes.tsx    (< 300 LOC: Cylinder Media, Application)     │
│    ├── AnnotationNodes.tsx     (< 250 LOC: Inverted Triangle, Notes)        │
│    └── index.ts                (Barrel exports matching nodeTypes registry) │
│                                                                             │
│  [Backend]                                                                  │
│  worker/services/bpm/                                                       │
│    ├── bpm-validator.ts        (< 350 LOC: SK-5 rules & node graph checks)  │
│    ├── bpm-transformer.ts      (< 400 LOC: Layout calculation & I/O)        │
│    ├── bpm-audit.ts            (< 250 LOC: Lampiran 6 change log tracking)  │
│    └── bpm-service.ts          (< 350 LOC: Facade service entrypoint)       │
│                                                                             │
│  worker/services/                                                           │
│    ├── rcm-service.ts          (< 400 LOC: RCM matrix data retrieval & map) │
│    └── csa-service.ts          (< 400 LOC: CSA queries & aggregation logic) │
│  worker/routes/                                                             │
│    ├── rcm.ts                  (< 350 LOC: Lean HTTP handler calling service)│
│    └── csa.ts                  (< 350 LOC: Lean HTTP handler calling service)│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Component Design

### 1. Frontend: Custom Nodes Decomposition
- File asal `BPMCustomNodes.tsx` dipecah berdasarkan taksonomi Lampiran 3 SK-5:
  - `ProcessNodes.tsx`: Node yang mengontrol aliran proses bisnis.
  - `RiskControlNodes.tsx`: Node identifikasi risiko (hexagon) dan titik kontrol (persegi bersudut tumpul/warna khusus).
  - `SystemMediaNodes.tsx`: Node media data/penyimpanan (silinder) dan aplikasi pemroses.
  - `AnnotationNodes.tsx`: Node arsip (segitiga terbalik) dan catatan anotasi.
- `index.ts` mengekspor objek `bpmNodeTypes` yang digunakan langsung oleh ReactFlow di `BPMEditor.tsx`.
- **Constraint:** Semua input/output handle ID dan props data (CSS styling, custom handles) dipertahankan 100% identik untuk menghindari rusaknya diagram yang sudah tersimpan.

### 2. Frontend: Sheet & Dialog Modularization
- `RegulatoryPropertySheet.tsx` mengekstrak sub-panel form:
  - `RiskPropertyForm.tsx`
  - `ControlPropertyForm.tsx`
  - `ProcessPropertyForm.tsx`
- `BPMWorksheet.tsx` mengekstrak:
  - `BPMWorksheetToolbar.tsx`
  - `BPMWorksheetColumns.tsx`

### 3. Backend: BPM Service Modularization
- Pola **Facade**: `BpmService` mempertahankan signature method publik yang sama (`saveDiagram`, `validateCompliance`, `exportBpmn`, dll.).
- Logika internal didelegasikan ke:
  - `bpm-validator.ts`: Memeriksa kelengkapan atribut Lampiran 3 (apakah risiko memiliki kontrol terkait, apakah flow valid).
  - `bpm-transformer.ts`: Mengubah format internal ke ReactFlow dan sebaliknya.
  - `bpm-audit.ts`: Menulis ke tabel change log dan audit trail sesuai Lampiran 6.

### 4. Backend: Route Controller to Service Separation
- Rute `worker/routes/rcm.ts` dan `worker/routes/csa.ts` saat ini melakukan kueri langsung `db.select(...).from(...)` berulang-ulang di dalam route handler.
- Logika dipindahkan ke service domain terisolasi sehingga endpoint rute Hono hanya bertugas:
  1. Validasi input request.
  2. Eksekusi service function.
  3. Mengembalikan response dengan HTTP status code yang sesuai.
