## Context

State tahun fiskal (`workingYear`) diatur oleh `useFiscalYearStore` (Zustand). Saat ini, inisialisasi hanya mengandalkan URL atau default sistem. State ini hilang saat refresh atau buka tab baru jika tidak ada parameter `?year=` di URL.

## Goals / Non-Goals

**Goals:**
- Membuat state `workingYear` persisten di `localStorage`.
- Sinkronisasi state antar tab secara otomatis menggunakan `storage` event listener.
- Menghormati prioritas: `URL Param` > `localStorage` > `Current Year`.

**Non-Goals:**
- Mengubah database schema.
- Mengubah logika backend terkait tahun fiskal.
- Migrasi data antar tahun fiskal.

## Decisions

### 1. Penggunaan Zustand Persist Middleware
**Keputusan**: Menggunakan middleware `persist` bawaan Zustand.
**Rasional**: Middleware ini menangani serialisasi ke `localStorage` secara otomatis dan mendukung hidrasi state saat aplikasi dimuat.
**Alternatif**: Menulis wrapper manual untuk `localStorage.setItem`. Ditolak karena lebih rawan bug dan boilerplate tinggi.

### 2. Sinkronisasi Antar Tab (Cross-Tab Sync)
**Keputusan**: Menambahkan event listener `window.addEventListener('storage', ...)` di dalam store atau komponen layout utama.
**Rasional**: Ini adalah cara standar browser untuk komunikasi antar tab dari domain yang sama tanpa perlu backend/websocket.
**Alternatif**: Menggunakan Broadcast Channel API. Ditolak karena `localStorage` event sudah cukup dan lebih kompatibel dengan middleware persist.

### 3. Penanganan Unsaved Changes (isDirty)
**Keputusan**: Jika tab mendeteksi perubahan storage tapi sedang dalam kondisi `isDirty`, update otomatis akan diblokir dan user diberi notifikasi (atau dibiarkan saja sampai navigasi berikutnya).
**Rasional**: Menghindari hilangnya data input user akibat perubahan konteks tahun secara tiba-tiba.

## Risks / Trade-offs

- **[Risk]** Data di tab lain berubah tiba-tiba saat user sedang melihat data. → **Mitigation**: Gunakan notifikasi visual jika tahun berubah secara eksternal.
- **[Risk]** Konflik antara URL parameter dan Storage. → **Mitigation**: URL parameter selalu menang (override storage) saat inisialisasi awal.
