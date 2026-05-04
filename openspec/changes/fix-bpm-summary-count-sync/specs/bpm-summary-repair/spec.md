## ADDED Requirements

### Requirement: Manual Summary Repair via CLI
Sistem MUST menyediakan mekanisme untuk melakukan audit dan perbaikan data summary (riskCount & controlCount) pada tabel `bpm_processes` berdasarkan kondisi diagram terkini secara manual via script.

#### Scenario: Running the repair script
- **WHEN** admin menjalankan script `repair-bpm-summary.ts`
- **THEN** sistem MUST menarik data seluruh diagram dari `bpm_diagrams`, menghitung ulang jumlah risiko dan kontrol unik, dan memperbarui kolom `risk_count` serta `control_count` pada baris `bpm_processes` yang bersangkutan.

### Requirement: Ghost Mapping Cleanup
Script perbaikan MUST mampu mengidentifikasi dan menghapus mapping di tabel `rcm_controls` yang tidak lagi terhubung ke node visual manapun di diagram BPM.

#### Scenario: Detecting ghost controls
- **WHEN** sebuah mapping kontrol ada di database tapi tidak ada dalam array `controlIds` atau `regulatoryPairs` di diagram manapun
- **THEN** script perbaikan MUST menghapus mapping tersebut dari tabel `rcm_controls` untuk menjaga integritas data.
