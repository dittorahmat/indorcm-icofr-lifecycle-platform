## 1. Shell — scroll + safe-area (P0, unblock semua)

- [x] 1.1 `RootLayout.tsx:52,55` pertahankan sebagai satu-satunya scroll owner (`overflow-y-auto overflow-x-hidden + pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0`); pastikan `SidebarProvider` tidak menambah clip baru.
- [x] 1.2 `AppLayout.tsx:59-66` ubah `SidebarInset` ke `overflow-visible` (hapus `overflow-y-auto overflow-x-hidden` kedua), hapus duplikat `pb-[calc(3.5rem...)]` baris 62; pertahankan branch `tenant.isEmbedded`.
- [x] 1.3 Regression check: `TodoListPage` calendar shell, tabel sticky, dialog portal tetap berfungsi; tidak ada `overflow-x-clip` baru.

## 2. Scoping — tables / charts / dialogs

- [x] 2.1 `ScopingHealthDashboard.tsx:57,82,96-112,101,104` stack chart+panel (`flex-col sm:flex-row min-w-0`), wrapper chart `overflow-x-auto … min-w-[280px]`, font axis/tooltip 12px, header `flex-col sm:flex-row`.
- [x] 2.2 `SmartImportWizard.tsx:602-630` nilai Rp `text-lg sm:text-2xl break-all min-w-0`, `rounded-[3rem]` → `rounded-lg`.
- [x] 2.3 `ScopingPage.tsx:258,434` hapus `overflow-hidden` ganda di `DialogContent` (sisakan `overflow-y-auto`).
- [x] 2.4 `GLDataIntake.tsx:215,237,288,311-325` wrapper baku charts + preview (`min-w-[320/560px]`), font ≥12px.
- [x] 2.5 `SetBenchmarkModal.tsx:160` → `overflow-x-auto … table-scroll-hint` + `Table min-w-[480px]`.
- [x] 2.6 Header LOW: `EntityTreeFilter.tsx:98`, `MaterialityParamsCard.tsx:88`, `MaterialityJustificationModal.tsx:135`, `SignificantLocationModal.tsx:137` (`text-left sm:text-right`).

## 3. RCM / BPM — canvas + tables

- [x] 3.1 `RcmTables.tsx:20` tambah isolated scroller + `min-w-[720px]` + `md:hidden` cards / `hidden md:block` tabel.
- [x] 3.2 `BPMCanvasLayout.tsx:28,76` → `grid-cols-1 sm:grid-cols-12`, `col-span-1 sm:col-span-*`, logo `w-12 sm:w-20`, `p-4 sm:p-6`, `text-base sm:text-xl`.
- [x] 3.3 `BPMDocumentView.tsx:108` FAB → `fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] flex-col sm:flex-row sm:inset-x-auto`.
- [x] 3.4 `ApplicationControlsTable.tsx:59` tambah `min-w-[640/720px]`; `BPMOcrModal.tsx:216,315` panes `overflow-y-auto min-h-0`; `TransactionSamplingTab.tsx:102` toolbar `flex-col min-[480px]:flex-row flex-wrap`; `BPMPage.tsx:301` detail `min-h-0 overflow-y-auto`.

## 4. CSA / Testing / Deficiencies — polish

- [x] 4.1 `CSAReviewMatrix.tsx:114,136` grid → `grid-cols-1 sm:grid-cols-2`.
- [x] 4.2 `DeficiencyCard.tsx:129` → `flex-col min-[420px]:flex-row min-w-0` + `break-words`.
- [x] 4.3 `ControlTestCard.tsx:139,243,249,440` header stack + tombol `w-full sm:w-auto`.
- [x] 4.4 `DoDWorksheetDialog.tsx:301` tabs → `sm:grid-cols-3`.

## 5. Reports / Audit / Admin — headers + charts

- [x] 5.1 `DoDLampiran10Report.tsx:342,360` + `RegulatoryReportComponents.tsx:471` + `CustomizableDashboard.tsx:335` tombol stack `flex-col min-[420px]:flex-row + h-11 min-h-[44px] w-full`.
- [x] 5.2 `Appendix7aSummary.tsx:88` `Table min-w-[560px]`; `Appendix7aDetailed.tsx:134,145` header stack + `border-b-2 sm:border-b-0 sm:border-r-2`.
- [x] 5.3 Charts `CustomizableDashboard.tsx:288,305` + `AIAnalyticsMockup.tsx:126,189,389` wrapper + inner `min-w-[280/300px]` + legend 12px + `p-4 sm:p-6`.
- [x] 5.4 Tabs `ExternalAuditPortal.tsx:93` + `UserManagementPage.tsx:214` → `min-w-[140px]` / `flex-1 min-w-0`.

## 6. Verifikasi mandat (tiap fase dianggap selesai bila lolos)

- [x] 6.1 `design-taste-frontend`: font ≥12px, tanpa italic data audit, tanpa backdrop-blur, tanpa pulse/ping/bounce statis, radius `md/lg` saja, token semantik.
- [x] 6.2 `better-interface` 320/360 analitis: nol page h-scroll, tabel/chart hanya scroll di wrapper sengaja, empty/loading/error sempit OK, aman dari bottom-nav.
- [x] 6.3 i18n: tidak ada string hardcoded baru.
- [x] 6.4 Dual-render guard: `getAllByText`/scope + `closest()` bila menyentuh komponen dual-render.
- [x] 6.5 `type-check` per-tsconfig → `lint` → `build` → `test` sekuensial dengan redirect file (OOM guard), exit 0.

