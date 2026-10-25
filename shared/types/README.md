# Shared Types Map (ICOFR 5-Stage Lifecycle)

Panduan navigasi penempatan tipe TypeScript domain ICOFR berlandaskan Peraturan BUMN SK-5/DKU.MBU/11/2024:

| Tahap Siklus ICOFR | File Definisi Tipe | Tipe Entitas Utama |
| :--- | :--- | :--- |
| **Pondasi & Pengguna** | `shared/types/user.ts` & `org.ts` | `User`, `Department`, `BusinessEntity`, `UserRole`, `RoleType` |
| **Tahap 1: Scoping & Materialitas** | `shared/types/scoping.ts` | `MaterialitySimulation`, `Scoping`, `SignificantAccount`, `GLRow`, `GLSnapshot` |
| **Tahap 2: RCM & BPM Linkage** | `shared/types/rcm-bpm.ts` | `RCM`, `Control`, `BPMProcess`, `BPMNode`, `BPMEdge`, `Application` |
| **Tahap 3 & 4: CSA & Testing** | `shared/types/csa-testing.ts` | `CSARecord`, `CSASample`, `CSASchedule`, `TestRecord`, `TestSample`, `TODEvaluation` |
| **Tahap 5: Defisiensi & Pelaporan** | `shared/types/deficiency.ts` | `Deficiency`, `ActionPlan`, `AggregateDeficiency`, `WBSReport`, `DoDWorksheetData` |
| **Konvensi Umum / Primitif** | `shared/types/common.ts` | `ControlAssertion`, `DeficiencySeverity`, `ActionPlanStatus` |

> Barrel import tersedia melalui `shared/types.ts`. Hindari inline `any` atau duplikasi definisi di level komponen UI.
