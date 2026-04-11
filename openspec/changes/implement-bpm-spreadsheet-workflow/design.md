# Design: BPM Spreadsheet Workflow

## 1. Unified Entity Structure

Untuk mendukung tampilan 15 kolom PDF, kita akan menyederhanakan relasi data:
- **`BPMProcess`**: Entitas penampung judul besar (misal: Penerimaan Setoran). Nempel ke `noGL` tertentu.
- **`Control`**: Kita perluas schema-nya agar mencakup field baru dari PDF:
  - `businessProcessLvl1`: string
  - `businessProcessLvl2`: string
  - `subProcess`: string
  - `location`: string
  - `isFraudRelated`: boolean
  - `reference`: string
  - `supportingDocs`: string
  - `isKeyControl`: boolean (Pengendalian Utama)
  - `ipo`: InformationProcessingObjective[]
  - `assertions`: ControlAssertion[]
  - `controlType`: "Preventive" | "Detective"
  - `controlNature`: ControlNature
  - `applicationId`: string (Link ke Master Application)

## 2. Dynamic Workflow Linking

Diagram React Flow (BPM) akan disimpan dengan kunci kombinasi: `rcmId` + `subProcessName`.
- Jika user mengedit kolom "Sub Proses Bisnis" di tabel, sistem akan mengecek apakah sudah ada diagram dengan nama sub-proses tersebut.
- Tombol di kolom 16 akan berubah warna (biru jika ada diagram, abu-abu jika belum ada).

## 3. Spreadsheet Architecture (`@tanstack/react-table`)

Kerangka kerja tabel:
- **Cell Rendering:** Setiap sel menggunakan komponen `EditableCell` yang memiliki local state. Saat `onBlur`, dia akan memicu fungsi `updateControl(id, field, value)`.
- **Debounced Sync:** Fungsi `updateControl` akan menunggu 500ms sebelum benar-benar mengirim data ke API untuk menghindari overload saat user mengetik cepat.

## 4. Change Log Mechanism (Lampiran 6)

Backend `worker/user-routes.ts` akan memiliki middleware khusus untuk BPM Updates:
1. Ambil data `oldValue` dari Durable Object.
2. Bandingkan dengan `newValue`.
3. Jika berbeda, simpan ke `ChangeLogEntity` dengan field:
   - `entityId`: controlId
   - `descriptionBefore`: stringify(oldValue)
   - `descriptionAfter`: stringify(newValue)
   - `timestamp`: Date.now()

## 5. UI Layout (The "Page BPM")

```
[ Header: Search & Cascading Filter (FSLI -> GL) ]
[ ---------------------------------------------- ]
[ BPM Folders: (1. Process A) (2. Process B) [+] ]
[ ---------------------------------------------- ]
[ Selected Folder: Process A                     ]
[ [ Editable Spreadsheet Table (16 Columns)    ] ]
```
