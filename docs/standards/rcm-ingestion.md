# Standar Ingestion & Idempotensi RCM (SK-5 Lampiran 5)

Dokumen ini mendokumentasikan spesifikasi teknis, aturan idempotensi (upsert), dan arsitektur pengunggahan data RCM ke dalam platform IndoGRC Pro.

---

## 1. Prinsip Idempotensi & Anti-Duplikasi (Mandat ADR 0012)

Setiap endpoint dan handler impor data RCM (termasuk `worker/routes/rcm/rcm-import.ts`) **WAJIB** bersifat idempotent. Mengunggah ulang berkas spreadsheet yang sama tidak boleh menduplikasi baris di basis data.

### Aturan Pencocokan Entitas:

1. **Risiko (`icofr.rcms`):**
   - **Kunci Komposit:** `(organizationId, year, process, subProcess, riskDescription)`.
   - **Tindakan:** Jika ditemukan, field risiko (`isFraudRelated`, `riskRating`, `diagramId`) diperbarui (*update*). Dilarang menyisipkan (*insert*) risiko baru.

2. **Pengendalian / Kontrol (`icofr.controls`):**
   - **Pencocokan Primer:** `(organizationId, year, code)`.
   - **Pencocokan Sekunder (Fallback saat kode kontrol kosong):** `(organizationId, year, bpmProcessId, name)`.
   - **Tindakan:** Jika cocok, seluruh atribut kontrol (nama, deskripsi, nature, type, frequency, IPO C-A-V-RA, Asersi C-E-A-CO-RO-VA-PD) diperbarui (*update*).

3. **Relasi Pemetaan (`icofr.rcm_controls`):**
   - **Kunci Komposit:** `(organizationId, rcmId, controlId)`.
   - **Tindakan:** Diperbarui jika sudah ada, atau dibuat baru jika belum ada.

4. **Tautan Simpul BPM (`icofr.bpm_node_rcms`):**
   - **Kunci Komposit:** `(organizationId, diagramId, nodeId, rcmId)`.
   - **Tindakan:** Diperiksa eksistensinya sebelum `insert` untuk mencegah duplikasi relasi visual simpul.

---

## 2. Kardinalitas 1-to-N (1 Langkah BPM Memiliki Banyak Risiko & Kontrol)

Struktur data RCM regulasi BUMN berorientasi pada baris kontrol (*Control/Risk-Centric Table*).
- Baris-baris pada spreadsheet RCM yang memitigasi langkah proses yang sama **memang sengaja mengisi `Ref_Langkah_BPM` dan `Nama_Langkah_BPM` yang sama**.
- Kanvas BPM tidak memerlukan simpul duplikat. Satu simpul aktivitas BPM menampung array *Regulatory Pairs*:
  ```json
  [
    { "riskId": "...", "controlId": "..." },
    { "riskId": "...", "controlId": "..." }
  ]
  ```

---

## 3. Alur Ingestion: Global Multi-Process vs Diagram-Scoped

| Karakteristik | Global Multi-Process Ingestion | Diagram-Scoped Ingestion |
| :--- | :--- | :--- |
| **Titik Masuk** | `/import` atau `/rcm/tlc` | Toolbar dalam BPM Workflow Editor |
| **Cakupan** | Lintas proses (P2P, O2C, H2R, R2R) | Terbatas pada sub-proses diagram aktif |
| **Rekonsiliasi** | *Late Reconciliation* (Unmapped Backlog) | *Instant Auto-Matcher* (Step 3 Wizard) |
| **Pembuatan Proses** | Otomatis membuat entitas `bpmProcesses` baru bila belum ada | Menggunakan proses aktif yang sedang dibuka |

---

## 4. Requirement Pengujian (Locking Tests)

Setiap penambahan atau modifikasi logika ingestion wajib disertai pengujian otomatis di `worker/routes/__tests__/rcm-import-upsert.test.ts` dan `src/components/rcm/import/__tests__/rcm-multi-process-ingestion.test.ts`:
- Pengunggahan ulang baris yang sama wajib menghasilkan `summary.createdControls === 0` dan `summary.createdRisks === 0`.
- Kontrol tanpa kode wajib ter-deduplikasi melalui fallback nama kontrol.
