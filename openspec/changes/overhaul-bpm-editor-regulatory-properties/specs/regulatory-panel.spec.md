# Spec: Regulatory Property Panel Fields

## 1. Risk Fields (Lampiran 2 & 5b)
- **Risk ID**: `string` (Auto-generated: R-001...)
- **Risk Description**: `text` (Mandatory)
- **Fraud Related**: `boolean` (UI: Dropdown "Yes" | "No")
- **Risk Rating**: `QualitativeLevel` (Low | Medium | High)

## 2. Control Fields (Lampiran 5b)
- **Control ID**: `string` (Auto-generated: C-001...)
- **Control Description**: `text` (Mandatory)
- **Key Control**: `boolean` (UI: Dropdown "Yes" | "No")
- **Classification**: `ControlLevel` (RCM TLC | RCM ELC | RCM ITGC)

## 3. TLC Compliance Details (Tabel IPO)
| Field | Name | Tooltip Info (Requirement 9) |
|-------|------|--------------|
| `ipoC`| Completeness | Memastikan seluruh transaksi/kejadian yang terjadi telah dicatat. |
| `ipoA`| Accuracy | Memastikan transaksi/kejadian telah dicatat dengan nilai yang benar. |
| `ipoV`| Validity | Memastikan transaksi/kejadian yang dicatat benar-benar terjadi dan sah. |
| `ipoRa`| Restricted Access | Memastikan akses terhadap data dan sistem hanya diberikan kepada pihak yang berwenang. |

## 4. ELC Compliance Details (Prinsip COSO)
- Mapping ke 17 Prinsip COSO (Lampiran 1).
- UI: Grid checkbox atau dropdown Multi-select.
- Value akan disimpan ke array `cosoPrinciples: number[]`.

## 5. ITGC Compliance Details (Lampiran 5c)
- **Domain ITGC**: Dropdown berdasarkan Tabel 1 SK-5/2024:
    - *Access to Program and Data*: Pengelolaan identitas dan hak akses lingkungan TI.
    - *Program Development*: Tata kelola pengembangan atau akuisisi aplikasi baru.
    - *Program Changes*: Prosedur perubahan sistem, pengujian, dan migrasi ke produksi.
    - *Computer Operations*: Manajemen operasional harian (Backup, Batch Job, Incident).
- **IT Assertion (Dummy Mapping)**: Tabel dengan dropdown Y/N untuk kriteria:
    - **Confidentiality**: Akses terbatas hanya untuk personel berwenang.
    - **Integrity**: Menjamin akurasi data dan sistem dari modifikasi ilegal.
    - **Availability**: Menjamin sistem operasional sesuai SLA dan memiliki backup.
    - **Completeness**: Menjamin seluruh data diproses tanpa ada yang terlewat.
    - **Authenticity**: Menjamin validitas identitas pengakses (MFA/Signature).

## 6. Audit Trail & Snapshots (Lampiran 6)
- Setiap kali tombol "Save Alur" ditekan, sistem wajib membandingkan `regulatoryData` lama dan baru.
- Perubahan akan dicatat ke tabel `change_logs` dengan format:
    - `descriptionBefore`: "Rating: Medium, Key: No"
    - `descriptionAfter`: "Rating: High, Key: Yes"
    - `effectiveDate`: [Timestamp saat ini]
