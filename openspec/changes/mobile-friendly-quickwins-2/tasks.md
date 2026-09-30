## 1. Keterbacaan mobile (font + grid)

- [x] 1.1 Naikkan header tabel `ReportsPage.tsx` dari `text-[10px]` ke `text-xs` dan verifikasi tidak ada sisa `text-[10px]` via grep
- [x] 1.2 Buat grid `ScopingSimulationForm.tsx` responsif (`grid-cols-1 sm:grid-cols-3`) dan verifikasi tidak ada overflow horizontal di 360px

## 2. Card-view ApprovalPage

- [x] 2.1 Tambah render kartu mobile (< 768px) untuk antrean simulasi mengikuti pola CSA/RCM dan verifikasi kartu memuat nama, status, basis, % OM, % haircut, OM/PM + tombol Review 44px
- [x] 2.2 Batasi dialog review dalam viewport mobile (konten bergulir + aksi terjangkau) dan verifikasi tombol Approve/Reject tidak terpotong di 360px

## 3. Identitas PWA dasar

- [x] 3.1 Tambah `theme-color`, link manifest, dan `apple-touch-icon` di `index.html` serta file `public/manifest.webmanifest` + icons dan verifikasi manifest valid (DevTools Application tab)

## 4. Diet performa mobile

- [x] 4.1 Ubah polling `MobileBottomNav` menjadi interval jarang + refetch on focus/navigasi dan verifikasi badge tetap segar tanpa request tiap 30 detik
- [x] 4.2 Tambah route-level `React.lazy` + fallback `Skeleton` untuk rute berat dan verifikasi build sukses dengan chunk terpisah

## 5. Validasi akhir

- [x] 5.1 Jalankan `npm run type-check`, `npm run lint`, `npm run build` sekuensial (redirect output ke file, tidak di-pipe) dan verifikasi semuanya hijau
- [x] 5.2 Verifikasi i18n (tidak ada string hardcode baru) dan kepatuhan anti-AI-slop (min 12px, rounded-md/lg, tanpa glassmorphism/animasi dekoratif)
