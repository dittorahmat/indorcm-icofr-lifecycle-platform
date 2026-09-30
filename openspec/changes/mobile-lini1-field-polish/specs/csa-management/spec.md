## ADDED Requirements

### Requirement: Tampilan kartu lapangan dan bottom-sheet verifikasi
The system SHALL mendukung presentasi dual desktop-tabel / mobile-kartu untuk record CSA serta dialog verifikasi sebagai bottom-sheet pada viewport < 768px (scroll containment `max-h-[90vh]`, sticky action Batal/Simpan di thumb zone), tanpa mengubah aturan validasi Lini 2 yang sudah ada.

#### Scenario: Dual-render CSA tanpa regresi test
- **WHEN** halaman CSA dirender di jsdom (kedua view hadir karena class `hidden` Tailwind tidak menyembunyikan di test)
- **THEN** test SHALL memakai `getAllByText` / scoping per-view dan menegaskan scroll container via `closest()`, mengikuti pelajaran 2026-09-30 (RCMStickyHeader + CSARealizationTable)

#### Scenario: Verifikasi CSA di HP
- **WHEN** Lini 1 membuka dialog verifikasi/TOD pada viewport < 768px
- **THEN** sistem SHALL menampilkan bottom-sheet yang bisa scroll dengan aksi Batal/Simpan selalu terlihat
- **AND** keyboard virtual SHALL tidak menutupi tombol aksi
