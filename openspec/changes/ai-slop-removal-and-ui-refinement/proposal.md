## Why

Pengguna mengidentifikasi inkonsistensi tipografi yang signifikan pada tabel RCM (TLC, ELC, ITGC) seperti ketebalan font yang tidak seragam (ada yang terlalu tipis dan sebagian terlalu tebal), header berkabut (`backdrop-blur`) yang mengganggu keterbacaan, serta elemen visual generik/cliché ("AI slop") seperti sisa kode demo, background rainbow/glow yang tidak sesuai standar korporat BUMN SK-5/DKU.MBU/11/2024, animasi berkedip (`animate-pulse`) yang berlebihan pada badge status, serta sudut kartu (*corner radius*) raksasa yang tidak proporsional untuk software data-density tinggi.

Perubahan ini diperlukan sekarang untuk menghadirkan antarmuka institusional, bersih, authoritative, dan mudah dibaca oleh auditor BUMN dan KAP sesuai dengan panduan anti-slop `design-taste-frontend`.

## What Changes

1. **RCM Table & Matrix Modernization (TLC, ELC, ITGC):**
   - Penyeragaman tipografi: Standarisasi base font size ke 12px/13px dan hierarki bobot menjadi 2 level (`font-semibold` untuk header/identifier kunci dan `font-normal`/`font-medium` untuk isi deskripsi).
   - Penghapusan styling miring (*italic*) pada teks deskripsi kontrol untuk menjaga ketegasan dokumen kepatuhan.
   - Penghapusan `backdrop-blur-md` pada sticky header tabel menjadi solid background bertoken (`bg-slate-100 dark:bg-slate-900`).
   - Normalisasi skema warna header grup dan chip status Boolean (Y/N) menjadi palet korporat yang tenang dan tidak bertabrakan.
   - Reduksi corner radius raksasa (`rounded-3xl` dan `rounded-[2.5rem]`) menjadi radius institusional yang rapi (`rounded-lg` / `rounded-md`).
2. **Pembersihan Residu Demo & Sisa Gradient Slop:**
   - Penghapusan file template AI starter yang tidak terpakai: `src/pages/DemoPage.tsx`.
   - Pembersihan efek `bg-gradient-rainbow` dan card blur pada `src/components/ErrorFallback.tsx`.
3. **Refinement Modul Analitik Enterprise:**
   - Restrukturisasi `src/components/reports/AIAnalyticsMockup.tsx` dari gaya sci-fi/cyberpunk (gradient neon, radar `animate-ping`) menjadi tampilan panel metrik continuous control monitoring yang formal dan solid.
4. **Pembersihan Distraksi Animasi Statis (`animate-pulse` / `animate-ping`):**
   - Menghilangkan `animate-pulse` permanen pada badge tingkat keparahan defisiensi (`DeficiencyBoard.tsx`), testing workbench (`TestWorkbench.tsx`), icon gear setting, serta sheet properti regulatori.

## Capabilities

### New Capabilities
- `ui-anti-slop-standards`: Standar desain institusional bebas AI slop yang mencakup solid background, tipografi terstandarisasi, penghapusan animasi distraktif, dan eliminasi kode mockup residu.

### Modified Capabilities
- `rcm-risk-control-accordion`: Pembaruan rendering tabel matriks RCM (TLC, ELC, ITGC) dengan tipografi seragam, kontras teks yang konsisten, dan sticky header solid tanpa backdrop blur.

## Impact
- **Frontend Components:** `RCMTable.tsx`, `TLCTabContent.tsx`, `ITGCTabContent.tsx`, `ELCTabContent.tsx`, `RCMPageHeader.tsx`, `RCMGroupRow.tsx`, `ErrorFallback.tsx`, `AIAnalyticsMockup.tsx`.
- **Pages:** `RCMTLCPage.tsx`, `RCMELCPage.tsx`, `RCMITGCPage.tsx`, `DeficiencyBoard.tsx`, `TestWorkbench.tsx`, `CSAPage.tsx`.
- **Files Removed:** `src/pages/DemoPage.tsx`.
- **Performance & Usability:** Meningkatkan FPS scrolling pada tabel RCM berdensitas tinggi serta kenyamanan membaca dokumen kepatuhan bagi auditor.
