# Tasks: Deep Linking Integration (Scoping to BPM)

## 1. UI: Scoping Integration
- [x] 1.1 Update `src/components/scoping/GLDataGrid.tsx`: Tambahkan import `Link` dari `react-router-dom`.
- [x] 1.2 Update `src/components/scoping/GLDataGrid.tsx`: Implementasi logic pembungkusan deskripsi akun dengan `Link` (Hanya untuk yang **IN SCOPE**).
- [x] 1.3 Update `src/components/scoping/GLDataGrid.tsx`: Tambahkan styling link biru + underline.

## 2. UI: BPM Capture Logic
- [x] 2.1 Update `src/pages/bpm/BPMPage.tsx`: Tambahkan hook `useSearchParams` untuk menangkap query parameters.
- [x] 2.2 Update `src/pages/bpm/BPMPage.tsx`: Implementasi `useEffect` untuk inisialisasi state `selectedFsli` dan `selectedAccountKey` dari URL.

## 3. Validation
- [ ] 3.1 Verifikasi: Klik akun di Scoping -> Tab baru terbuka -> Halaman BPM sudah terisi filter yang benar secara otomatis.
