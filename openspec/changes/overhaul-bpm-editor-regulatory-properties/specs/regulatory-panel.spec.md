# Spec: Hierarchical Regulatory Property Panel

## 1. Data Object (`regulatoryPairs`)
| Field | Type | Description |
|-------|------|-------------|
| `riskId` | `string` | Auto-gen ID (R-XXX) |
| `riskDescription` | `text` | Narasi risiko aktivitas |
| `isFraudRelated` | `boolean` | Indikator fraud |
| `riskRating` | `enum` | Low / Medium / High |
| `controlId` | `string` | Auto-gen ID (C-XXX) |
| `controlDescription`| `text` | Narasi prosedur kontrol |
| `classification` | `enum` | TLC / ELC / ITGC |

## 2. TLC Fields (IPO Table)
- **C (Completeness)**: Seluruh transaksi tercatat.
- **A (Accuracy)**: Nilai, akun, periode tepat.
- **V (Validity)**: Hanya transaksi sah/terotorisasi.
- **RA (Restricted Access)**: Akses data/sistem terbatas.

## 3. ITGC Fields (Lampiran 5.c)
- **Domain**: Access, Changes, Development, Operations.
- **IT Assertions**: Confidentiality, Integrity, Availability, Completeness, Authenticity.

## 4. ELC Fields (Lampiran 5.a)
- **COSO Principles**: Mapping ke 17 prinsip (Multi-select/Grid).

## 5. Localized Warnings (Audit Compliance)
Semua konfirmasi penghapusan wajib melalui `window.confirm` dengan teks dari `rcm.json`:
- `delete_risk_confirm`: Peringatan penghapusan grup risiko & kontrol.
- `delete_control_confirm`: Peringatan penghapusan baris kontrol tunggal.
- `hard_delete_notice`: Peringatan konsekuensi permanen di database.

## 6. Target Mapping & Persistence
- **PUT Diagram**: Melakukan sinkronisasi ke tabel `rcms`, `controls`, `rcm_controls`, dan `bpm_node_rcms`.
- **RCM TLC Page**: Otomatis mem-populate kolom xiv s.d. xxiv berdasarkan array `regulatoryPairs`.
- **Change Log**: Mencatat `descriptionBefore` vs `descriptionAfter` untuk setiap mutasi data di panel.
