## ADDED Requirements

### Requirement: On-Hover Scrollbar Appearance
Sistem SHALL menyembunyikan scrollbar secara visual (transparan) pada elemen yang memiliki class `.scrollbar-hover` ketika mouse tidak berada di atas elemen tersebut, namun tetap memungkinkan fungsi scroll tetap berjalan.

#### Scenario: Scrollbar Hidden by Default
- **WHEN** halaman dimuat dan mouse tidak berada di atas kontainer yang memiliki class `.scrollbar-hover`
- **THEN** scrollbar tidak terlihat secara visual di layar

#### Scenario: Scrollbar Visible on Hover
- **WHEN** user mengarahkan mouse (hover) ke atas kontainer yang memiliki class `.scrollbar-hover`
- **THEN** scrollbar muncul secara visual dengan warna yang samar (semi-transparan)

### Requirement: Global Accessibility for Long Content
Sistem SHALL menerapkan perilaku On-Hover Scrollbar pada komponen utama yang memiliki potensi konten melebihi tinggi/lebar viewport (Sidebar, RCM Table, Modal/Dialog Content).

#### Scenario: Sidebar Scrolling
- **WHEN** jumlah menu di Sidebar melebihi tinggi layar dan user melakukan hover ke Sidebar
- **THEN** scrollbar vertikal muncul sehingga user dapat menavigasi seluruh menu

#### Scenario: RCM Matrix Horizontal Scrolling
- **WHEN** lebar kolom tabel RCM melebihi lebar layar (min-width > 2000px) dan user melakukan hover ke tabel
- **THEN** scrollbar horizontal muncul di bagian bawah tabel RCM untuk menggeser kolom

### Requirement: Consistent Interaction State
Sistem SHALL memberikan umpan balik visual yang lebih jelas (warna lebih kontras) ketika user sedang melakukan interaksi aktif dengan scrollbar (click & drag).

#### Scenario: Active Scrollbar Interaction
- **WHEN** user melakukan klik dan menahan (drag) pada thumb scrollbar
- **THEN** warna thumb scrollbar menjadi lebih gelap/kontras untuk menandakan status aktif interaksi
