# Design: Jira-like Multi-Tier Approval Workflow for Scoping

## 1. Data Model Updates (`shared/types.ts`)

### `UserRole`
Tambah `"CFO"` ke list role.

### `SimulationStatus`
Perbarui status menjadi state machine yang lebih kompleks:
```typescript
export type SimulationStatus = 
  | "Draft" 
  | "Pending CFO" 
  | "Pending Komut" 
  | "Approved" 
  | "Rejected";
```

### `ApprovalHistory`
Definisikan interface untuk log aktivitas:
```typescript
export interface ApprovalHistoryEntry {
  id: string;
  action: "Submit" | "Approve" | "Reject" | "Update";
  role: UserRole;
  userId: string;
  timestamp: number;
  note: string;
}
```

### `MaterialitySimulation`
Tambahkan field history:
```typescript
export interface MaterialitySimulation {
  // ... existing fields
  status: SimulationStatus;
  history: ApprovalHistoryEntry[];
}
```

## 2. API Transition Logic (`worker/user-routes.ts`)

Setiap transisi status akan melakukan `.mutate()` pada entity dan menambahkan entry ke array `history`.

-   `POST /api/simulations/:id/submit`: 
    - Ubah status ke `Pending CFO`.
    - Tambahkan history entry (Action: Submit).
-   `POST /api/simulations/:id/approve`:
    - Jika user = CFO & status = `Pending CFO` -> status = `Pending Komut`.
    - Jika user = Komisaris & status = `Pending Komut` -> status = `Approved`.
    - Tambahkan history entry (Action: Approve).
-   `POST /api/simulations/:id/reject`:
    - Ubah status ke `Rejected`.
    - Tambahkan history entry (Action: Reject, Note: required).

## 3. UI/UX Workflow

### `ScopingPage.tsx` (Lini 2)
-   Jika status = `Draft` atau `Rejected`, tampilkan tombol "Submit to CFO".
-   Tampilkan komponen `HistoryTimeline` di bagian bawah untuk melihat alasan penolakan (feedback).

### `ApprovalPage.tsx` (Reviewer)
-   Filter list berdasarkan role:
    -   CFO melihat sim dengan status `Pending CFO`.
    -   Komisaris melihat sim dengan status `Pending Komut`.
-   Modal review akan memiliki `TextArea` untuk input `note` (wajib diisi jika Reject).

### `AppSidebar.tsx` (Notifications)
-   Lakukan query `useQuery(['simulations-pending-count'])` untuk menghitung sim yang butuh tindakan user saat ini.
-   Tampilkan angka di samping menu "Materiality Approval" jika count > 0.

## 4. Visualisasi Alur Kerja (Jira Style)

```
[ Lini 2 ] --(Submit)--> [ Pending CFO ] --(Approve)--> [ Pending Komut ] --(Approve)--> [ Approved ]
    ^                         |                              |
    |                         |                              |
    +-------(Reject)----------+------------------------------+
```
