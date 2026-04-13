## ADDED Requirements

### Requirement: Centralized System Auditing
Sistem WAJIB mencatat setiap aktivitas INSERT, UPDATE, dan DELETE ke dalam satu tabel pusat `audit_logs`. Setiap record audit harus mencantumkan `timestamp`, `actor_id` (user), `action`, `entity_type`, `entity_id`, dan data JSON yang berubah.

#### Scenario: Automatic Mutation Logging
- **WHEN** user melakukan update pada deskripsi Control
- **THEN** sistem secara otomatis membuat entri di tabel `audit_logs` yang merekam nilai sebelum dan sesudah perubahan.

### Requirement: Regulatory Change Log (Lampiran 6 SK-5)
Sistem WAJIB menyediakan fungsi pencatatan log perubahan khusus untuk entitas krusial (RCM/BPM) yang menyertakan informasi "Referensi Sebelum/Sesudah", "Tanggal Efektif", dan "Justifikasi Perubahan".

#### Scenario: Finalizing Regulatory Change
- **WHEN** Lini 2 menyetujui perubahan pada RCM yang sudah aktif
- **THEN** sistem membuat entri audit log dengan flag `is_regulatory = true` dan menyimpan metadata tambahan sesuai standar Lampiran 6 SK-5.
