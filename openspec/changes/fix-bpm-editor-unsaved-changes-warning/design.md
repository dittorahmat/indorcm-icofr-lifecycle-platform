## Context

Ketika pengguna membuka Editor BPM, diagramnya ditampilkan di dalam sebuah Dialog modal (`BPMPage` dan `BPMWorksheet`) yang diatur berdasarkan ada tidaknya parameter `diagramId` pada pencarian URL. Saat pengguna menutup modal ini, fungsi `handleCloseDiagram()` akan dipanggil untuk menghapus parameter tersebut, yang secara otomatis memicu unmount pada komponen `BPMEditor`.
Namun, unmount ini me-reset state `isDirty` global menjadi `false` pada tahap siklus hidup React, sebelum Router Blocker (`useBlocker`) mengevaluasi transisi halaman/URL. Hal ini menyebabkan konfirmasi perubahan belum disimpan tidak muncul.

## Goals / Non-Goals

**Goals:**
- Mengintersepsi proses penutupan modal di `BPMPage.tsx` dan `BPMWorksheet.tsx` ketika ada perubahan pada diagram BPM yang belum disimpan.
- Menampilkan peringatan konfirmasi sebelum mereset search parameter.

**Non-Goals:**
- Mengubah perilaku `useBlocker` global untuk penjelajahan halaman web lain.

## Decisions

### 1. Intersepsi sebelum Penghapusan Parameter URL
Kita akan memodifikasi fungsi penutupan `handleCloseDiagram` agar melakukan pengecekan `isDirty` terlebih dahulu menggunakan `useUnsavedChangesContext`.
- **Alternatif 1**: Membiarkan dialog tertutup dan mengandalkan `useBlocker` di tingkat global. (Ditolak karena siklus unmount `BPMEditor` merusak state `isDirty` sebelum blocker berjalan).
- **Alternatif 2**: Menggunakan `window.confirm` langsung di fungsi `handleCloseDiagram`. (Dipilih karena mencegah perubahan URL/search params secara preemptive, sehingga mencegah unmount komponen sebelum disetujui pengguna).

### 2. Pelacakan Status Dirty Berbasis Kunci (Key-Based Tracking)
Mengingat beberapa komponen dapat terpasang (*mounted*) bersamaan (misal, `BPMPage` dan `BPMEditor`) dan masing-masing memanggil penanda *dirty*, status global tidak boleh berupa boolean tunggal karena akan saling menimpa.
- **Keputusan**: Mengubah `UnsavedChangesProvider` agar melacak status *dirty* menggunakan peta objek `Record<string, boolean>`.
- **Implementasi**: Setiap panggilan hook `useUnsavedChanges` akan membuat ID unik menggunakan React `useId()` untuk mengisolasi status *dirty* komponen tersebut. Panggilan langsung `setDirty(boolean)` tanpa ID akan otomatis menggunakan kunci cadangan `'global'`.

## Risks / Trade-offs

- **[Risk]**: Dialog konfirmasi native browser (`window.confirm`) tidak konsisten dengan gaya desain Shadcn UI.
- **[Mitigation]**: Kita akan menggunakan dialog konfirmasi standar `window.confirm` untuk kesederhanaan dan keandalan pemblokiran state di fungsi penutupan.
