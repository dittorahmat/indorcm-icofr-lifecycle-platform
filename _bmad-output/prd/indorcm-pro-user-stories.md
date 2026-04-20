# User Stories: IndoGRC Pro - Platform Lifecycle ICOFR

**Proyek:** IndoGRC Pro  
**Referensi PRD:** _bmad-output/prd/indorcm-pro-prd.md  
**Status:** Backlog Ready

---

## Modul 1: Scoping & Data Intake
| ID | Persona | User Story | Kriteria Penerimaan (AC) |
| :--- | :--- | :--- | :--- |
| US1.1 | Lini 2 | Sebagai Fungsi ICOFR, saya ingin mengunggah file Excel GL yang divalidasi otomatis, sehingga saya yakin data dasar scoping bebas dari kesalahan saldo. | 1. Cek balance Debit/Kredit.<br>2. Deteksi baris duplikat.<br>3. Alert jika format kolom salah. |
| US1.2 | Lini 2 | Sebagai Fungsi ICOFR, saya ingin sistem menghitung OM dan PM secara otomatis, sehingga proses scoping akun signifikan selesai dalam hitungan detik. | 1. Input benchmark (misal: Laba).<br>2. Kalkulasi % otomatis.<br>3. Flagging akun > PM. |
| US1.3 | Lini 2 | Sebagai Fungsi ICOFR, saya ingin mendapatkan peringatan jika distribusi angka GL mencurigakan (Benford's Law), sehingga saya bisa mendeteksi manipulasi data sejak awal. | 1. Laporan skor deviasi Benford.<br>2. Highlight akun yang anomali. |

## Modul 2: Visual RCM & BPM Editor
| ID | Persona | User Story | Kriteria Penerimaan (AC) |
| :--- | :--- | :--- | :--- |
| US2.1 | Lini 1 | Sebagai Control Owner, saya ingin memetakan proses bisnis saya secara visual dengan drag-and-drop, sehingga dokumentasi kepatuhan mudah dipahami tim. | 1. Toolbar ikon standar Lampiran 3.<br>2. Hubungkan Risiko ke Aktivitas. |
| US2.2 | Lini 2 | Sebagai Fungsi ICOFR, saya ingin melihat "Heatmap" risiko pada peta proses bisnis, sehingga saya tahu bagian mana yang paling sering gagal audit. | 1. Gradasi warna (Merah/Hijau) pada diagram BPM berdasarkan status temuan. |

## Modul 3: Operational Control (CSA & Evidence)
| ID | Persona | User Story | Kriteria Penerimaan (AC) |
| :--- | :--- | :--- | :--- |
| US3.1 | Lini 1 | Sebagai Control Owner, saya ingin mengisi kuesioner CSA yang dinamis, sehingga saya hanya menjawab pertanyaan yang relevan dengan transaksi saya. | 1. Pertanyaan muncul berdasarkan kategori akun.<br>2. Logika conditional skip. |
| US3.2 | Lini 1 | Sebagai Pekerja Lapangan, saya ingin mengunggah bukti fisik menggunakan ponsel dengan verifikasi lokasi, sehingga bukti audit saya diakui keabsahannya. | 1. Ambil foto via app.<br>2. Simpan koordinat GPS & Timestamp EXIF. |
| US3.3 | Lini 2 | Sebagai Fungsi ICOFR, saya ingin sistem membaca isi PDF bukti otomatis (OCR), sehingga saya tidak perlu membuka file satu per satu untuk cek angka. | 1. Ekstraksi teks dari PDF unggahan.<br>2. Match nilai dengan field input. |

## Modul 4: Testing & Deficiency Management
| ID | Persona | User Story | Kriteria Penerimaan (AC) |
| :--- | :--- | :--- | :--- |
| US4.1 | Lini 3 | Sebagai Auditor Internal, saya ingin sistem memberikan rekomendasi klasifikasi defisiensi (DoD), sehingga penilaian tingkat keparahan temuan saya objektif. | 1. Wizard Magnitude/Likelihood.<br>2. Suggestion: CD, SD, atau MW. |
| US4.2 | Lini 3 | Sebagai Auditor Internal, saya ingin agar temuan yang sudah dicatat tidak bisa dihapus, sehingga integritas sejarah audit tetap terjaga. | 1. Tidak ada tombol 'Delete' untuk Finding.<br>2. Resolusi hanya via alur formal. |

## Modul 5: Governance & Reporting
| ID | Persona | User Story | Kriteria Penerimaan (AC) |
| :--- | :--- | :--- | :--- |
| US5.1 | Eksekutif | Sebagai CFO, saya ingin menandatangani Laporan Asesmen Manajemen secara digital, sehingga laporan resmi siap dipublikasikan tepat waktu. | 1. Generate PDF format Lampiran 11.<br>2. QR Code Digital Signature. |
| US5.2 | Eksekutif | Sebagai Direksi, saya ingin melihat dasbor kepatuhan seluruh unit BUMN, sehingga saya bisa mengambil tindakan cepat jika ada area yang merah. | 1. Charts penyelesaian CSA/Remediasi.<br>2. Filter berdasarkan unit/cluster. |

---
*User Stories ini disusun oleh BMad Master untuk memandu siklus sprint pengembang.*
