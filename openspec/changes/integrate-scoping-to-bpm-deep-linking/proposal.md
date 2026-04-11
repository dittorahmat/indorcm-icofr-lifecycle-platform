# Proposal: Deep Linking Integration (Scoping to BPM)

## Business Case
User (terutama level Komisaris dan Manajemen) membutuhkan alur navigasi yang mulus antara hasil identifikasi akun signifikan (Scoping) dengan detail proses bisnis (BPM). Saat ini, user harus berpindah menu secara manual dan mencari ulang akun GL di halaman BPM. Integrasi ini akan memangkas waktu kerja dan meningkatkan pengalaman pengguna (UX).

## Goals
1.  **Direct Navigation:** Menjadikan "Account Description" pada tabel Scoping sebagai pintu masuk langsung ke modul BPM.
2.  **State Preservation:** Menggunakan URL query parameters untuk memastikan halaman BPM yang dibuka di tab baru langsung menampilkan data akun yang tepat.
3.  **Visual Clarity:** Memberikan penanda visual link tradisional (biru & underline) pada akun-akun yang masuk kategori "IN SCOPE".

## Proposed Changes

### 1. UI: Scoping Worksheet (`GLDataGrid.tsx`)
-   Modifikasi renderer kolom `Account Description`.
-   Implementasikan pengecekan status: Jika baris tersebut **IN SCOPE** (Kuantitatif Significant ATAU Kualitatif High), maka bungkus deskripsi dengan komponen `<Link>`.
-   Set link menuju `/bpm` dengan query parameters: `fsli`, `noGL`, dan `glDesc`.
-   Tambahkan styling CSS: `text-blue-600 underline hover:text-blue-800`.

### 2. UI: BPM Page Header (`BPMPage.tsx`)
-   Gunakan hook `useSearchParams` untuk menangkap data dari URL.
-   Implementasikan `useEffect` untuk mendeteksi parameter saat *mounting*.
-   Otomatis isi state `selectedFsli` dan `selectedAccountKey` (menggunakan format gabungan unik) jika parameter ditemukan di URL.

## Compliance Alignment
-   **Traceability:** Mendukung kemudahan penelusuran (*traceability*) dari Akun Laporan Keuangan ke rincian Pengendalian (mandat SK-5/2024).

## Risks & Mitigations
-   **Risk:** Link diklik tapi data GL di tab baru tidak muncul.
-   **Mitigation:** Pastikan parameter `glDesc` juga dikirim agar kunci unik gabungan di BPM bisa terkonstruksi dengan sempurna.
