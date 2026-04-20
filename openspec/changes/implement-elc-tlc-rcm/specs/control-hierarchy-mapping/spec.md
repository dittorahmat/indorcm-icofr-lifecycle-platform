## ADDED Requirements

### Requirement: Pemetaan Hubungan TLC ke ELC
Sistem HARUS memungkinkan kontrol operasional (TLC) untuk merujuk pada satu atau lebih kebijakan strategis (ELC).

#### Scenario: Menghubungkan TLC ke ELC di BPM Editor
- **WHEN** user membuka modal edit kontrol di BPM Editor
- **THEN** sistem menampilkan dropdown multiselect bertajuk "ELC Policy Umbrella"
- **WHEN** user memilih satu atau lebih kebijakan ELC dan menyimpan
- **THEN** sistem memperbarui atribut `relatedControlIds` pada entitas kontrol tersebut

### Requirement: Visualisasi Linkage di BPM
Sistem HARUS memberikan penanda visual pada diagram alir untuk kontrol yang sudah memiliki payung kebijakan.

#### Scenario: Icon Shield muncul di diagram
- **WHEN** sebuah node kontrol di diagram BPM memiliki link ke ELC (`relatedControlIds.length > 0`)
- **THEN** sistem menampilkan icon "Shield" di pojok node kontrol tersebut
- **AND** sistem menampilkan tooltip berisi daftar nama ELC saat icon tersebut di-hover

### Requirement: Aturan Penghapusan Ketat (Strict Deletion)
Sistem HARUS melarang penghapusan entitas ELC yang masih menjadi referensi bagi TLC aktif.

#### Scenario: Gagal hapus ELC karena masih ada link
- **WHEN** user mencoba menghapus sebuah ELC yang masih terhubung ke satu atau lebih TLC
- **THEN** sistem membatalkan aksi hapus
- **AND** sistem menampilkan pesan error: "Cannot delete ELC policy while it is still linked to active Transaction Level Controls."
