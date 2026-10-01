## Why

User complain bahwa tampilan mobile ICOFR app pada resolusi smartphone (portrait dan landscape) masih kurang baik dan tidak proporsional:
1. Header atas (`MainHeader`) berjejal dan badge role menumpuk canggung di atas avatar pengguna.
2. Pada mode landscape handphone, sidebar desktop ikut muncul atau berbenturan dengan header dan konten sehingga dashboard terpotong parah.
3. Card "Cycle Readiness" mengambil terlalu banyak ruang vertikal layar (hampir 35% tinggi viewport) dengan data density yang sangat rendah.
4. "Lifecycle Progress" di mobile portrait terpotong teksnya ("Next Stage...") dan menyembunyikan 6 tahapan wajib regulasi SK-5/DKU.MBU/11/2024.
5. Grid KPI di mobile portrait membuat teks judul terpotong (`OPEN DEFICIEN...`) dan kartu baris bawah tertutup oleh AI Chatbot Floating Action Button (`AIFabButton`).
6. Tombol tindakan di atas header ("Manage RCM", "Start Assessment") kaku dan tidak mobile-friendly.

Penyegaran desain mobile-first yang bersih, proporsional, dan sesuai dengan prinsip enterprise BUMN (anti-AI slop, font minimal 12px, border radius institusional) sangat mendesak agar pimpinan dan auditor dapat menginspeksi siklus ICOFR langsung dari genggaman.

## What Changes

- **Mobile Header Optimization**: Menata ulang layout header pada layar `< 768px` agar tombol trigger sidebar, identitas tenant, pemilih tahun fiskal, lonceng notifikasi, dan avatar profil tersusun rapi tanpa overlap atau badge terpotong.
- **Landscape Screen Responsiveness**: Memastikan sidebar desktop hanya muncul pada layar desktop sesungguhnya (`lg` / desktop tablet) dan tidak merusak layout ponsel landscape (`max-height < 500px` atau layar ponsel horizontal).
- **Executive Snapshot & KPI Refinement**:
  - Mengubah card "Cycle Readiness" raksasa menjadi **Executive Snapshot Card** yang terintegrasi, ramping, dan kaya informasi.
  - Memperbaiki tata letak KPI card agar judul dan angka tidak terpotong (menggunakan typography adaptif dan layout list/stacked compact di mobile portrait).
- **Interactive Horizontal Lifecycle Stepper**:
  - Menggantikan tampilan mobile "Lifecycle Progress" yang terpotong menjadi **Horizontal Touch Stepper** yang menampilkan ke-6 fase regulasi SK-5 (Perancangan, Implementasi, Evaluasi, Remediasi, Pelaporan, Asurans) dengan indikator visual status aktif/selesai tanpa teks terpotong.
- **Mobile Floating Action Button & Safe Area**:
  - Mengatur elevasi, posisi, dan bottom padding untuk `AIFabButton` agar tidak menutupi isi kartu KPI dan konten Action Center di mobile.
- **Streamlined Mobile Actions**:
  - Menyusun tombol aksi cepat ("Kelola RCM", "Mulai CSA", "Review Temuan") dengan ergonomi sentuhan jempol (thumb zone) minimal 44px hit-target.

## Capabilities

### New Capabilities
- `mobile-dashboard-experience`: Menyediakan pengalaman dashboard eksekutif mobile-first yang ergonomis, responsif portrait & landscape, bebas teks terpotong, dan patuh standar visual SK-5/DKU.MBU/11/2024.

### Modified Capabilities
<!-- None -->

## Impact

- `src/pages/Dashboard.tsx`
- `src/components/dashboard/DashboardKPIs.tsx`
- `src/components/dashboard/LifecycleProgress.tsx`
- `src/components/dashboard/ActionCenter.tsx`
- `src/components/layout/MainHeader.tsx`
- `src/components/layout/RootLayout.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/components/ai-chatbot/AIFabButton.tsx`
- `src/i18n/locales/en/dashboard.json` dan `src/i18n/locales/id/dashboard.json`
