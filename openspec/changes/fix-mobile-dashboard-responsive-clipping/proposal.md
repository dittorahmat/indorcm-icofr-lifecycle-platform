## Why

Pada viewport mobile (320px–390px), tampilan Dashboard mengalami clipping horizontal parah di sisi kanan pada hampir semua komponen (Lifecycle Progress, KPI Cards, Action Center, CSA Summary, Controls per Process Bar Chart, Findings by Severity Donut Chart, dan 17 COSO Principles Grid). Masalah ini disebabkan oleh kombinasi container clipping di level layout induk (`RootLayout` dan `AppLayout`), fixed minimum widths pada chart Recharts, serta pembagian grid yang tidak mereduksi kolom secara tepat di lebar layar sempit.

Perubahan ini diperlukan untuk memastikan kepatuhan penuh terhadap mandat **better-interface** dan **design-taste-frontend** pada SK-5 BUMN ICOFR Dashboard, sehingga eksekutif dan auditor Lini 1–3 dapat memantau siklus kepatuhan dari perangkat seluler tanpa kehilangan informasi penting akibat terpotong.

## What Changes

- **Outer Shell & Scroll Architecture**: Menghilangkan jebakan `overflow-x-clip` dan `overflow-hidden` ganda pada `RootLayout` dan `AppLayout`, mengalirkan scroll vertikal yang bersih dengan batas horizontal `w-full max-w-full min-w-0` tanpa hard clip.
- **Responsive Charts Container**: Memperbaiki container `<ComplianceCharts>` (Bar Chart dan Pie/Donut Chart) agar tidak menggunakan `min-w-[480px]` yang merusak grid mobile. Bar Chart diberikan scroll horizontal terisolasi yang halus (`overflow-x-auto touch-pan-x`), dan Donut Chart dipusatkan secara proporsional (`cx="50%"`, `cy="50%"`) agar tidak meluber keluar layar.
- **Fluid COSO Coverage Grid**: Menyesuaikan pembagian kolom prinsip P1–P17 di `<COSOCoverageGrid>` dari `min-[380px]:grid-cols-3` menjadi layout mobile-first yang adaptif (`grid-cols-2 min-[360px]:grid-cols-3 sm:grid-cols-3`) dengan padding aman.
- **Action Center & Stepper Flex Safety**: Memastikan seluruh kartu aksi di `<ActionCenter>` dan stepper tahapan di `<LifecycleProgress>` menerapkan `min-w-0 flex-1` pada teks serta `shrink-0` pada badge persentase/status agar teks tidak mendorong badge keluar dari batas viewport mobile.
- **KPI Metrics Layout**: Memastikan kartu metrik di `<DashboardKPIs>` tersusun 1 kolom di layar mobile tanpa memaksakan horizontal margin negatif.

## Capabilities

### New Capabilities
- `dashboard-mobile-view`: Standarisasi responsivitas mobile-first untuk executive dashboard ICOFR tanpa horizontal clipping pada viewport 320px–390px.

### Modified Capabilities
<!-- No requirement changes to existing business logic capabilities -->

## Impact

- **Affected Components**:
  - `src/components/layout/RootLayout.tsx`
  - `src/components/layout/AppLayout.tsx`
  - `src/pages/Dashboard.tsx`
  - `src/components/dashboard/ComplianceCharts.tsx`
  - `src/components/dashboard/COSOCoverageGrid.tsx`
  - `src/components/dashboard/ActionCenter.tsx`
  - `src/components/dashboard/LifecycleProgress.tsx`
  - `src/components/dashboard/DashboardKPIs.tsx`
- **APIs & Dependencies**: Tidak ada perubahan API backend atau schema database. Tidak ada breaking changes.
