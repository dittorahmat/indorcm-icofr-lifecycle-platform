## Why

Saat pengujian TOD (Test of Design) atau CSA menyatakan pengendalian `Ineffective`, sistem secara otomatis membuat *Deficiency* pada `/deficiencies` (Deficiency Board). Namun, deskripsi temuan hanya menghasilkan teks generik seperti `"Hasil Verifikasi Desain (TOD) Ineffective."` jika evaluator tidak mengisi kolom komentar. Selain itu, kartu defisiensi pada UI belum menampilkan metadata seperti Kode Kontrol (`controlCode`), Nama Kontrol (`controlName`), dan Kode Risiko (`riskCode`). Hal ini menyulitkan Lini 1, Lini 2, maupun Auditor dalam mengidentifikasi pengendalian mana yang mengalami kelemahan.

## What Changes

- **Backend**:
  - Mengubah pembuat deskripsi auto-deficiency pada [`worker/routes/rcm.ts`](file:///C:/backup/indorcm-icofr-lifecycle-platform/worker/routes/rcm.ts) dan [`worker/routes/csa.ts`](file:///C:/backup/indorcm-icofr-lifecycle-platform/worker/routes/csa.ts) agar menyertakan Kode Kontrol (`controlCode`) dan Nama Kontrol (`controlName`) sebagai prefix deskripsi otomatis.
  - Memastikan API `/api/deficiencies` dan `/api/actionplans` me-return metadata relasi pengendalian (kode/nama kontrol & kode/deskripsi risiko).
- **Frontend**:
  - memperbarui [`DeficiencyCard.tsx`](file:///C:/backup/indorcm-icofr-lifecycle-platform/src/components/deficiencies/DeficiencyCard.tsx) untuk menampilkan `Control Code`, `Control Name`, dan `Risk Code` dalam bentuk badge/tag visual yang informatif.
  - Memperbarui komponen lokalisasi (i18n) terkait tampilan kartu defisiensi.

## Capabilities

### New Capabilities
- `deficiency-context-display`: Menyediakan konteks lengkap (Kode/Nama Kontrol dan Risiko) pada pembuatan & tampilan Defisiensi ICOFR di Deficiency Board.

### Modified Capabilities

## Impact

- **Affected Code**: `worker/routes/rcm.ts`, `worker/routes/csa.ts`, `worker/services/deficiency-service.ts`, `src/components/deficiencies/DeficiencyCard.tsx`, `src/pages/deficiencies/DeficiencyBoard.tsx`, `src/i18n/locales/*/deficiency.json`.
- **API**: Mengirimkan detail relasi kontrol & risiko pada respons GET `/api/deficiencies`.
- **Database**: Tidak merusak schema DB yang ada (menggunakan relasi/join yang sudah ada).
