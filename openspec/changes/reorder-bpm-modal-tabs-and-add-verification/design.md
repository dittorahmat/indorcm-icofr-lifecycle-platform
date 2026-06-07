## Context

Saat ini, `BPMModal` berfungsi sebagai pusat eksekusi (Execution Hub) untuk proses bisnis. Namun, urutan tab yang ada belum optimal secara operasional. Pengguna sering kali perlu melihat rancangan verifikasi (Verification Design) sebelum mengisi CSA, namun halaman tersebut saat ini hanya tersedia sebagai halaman mandiri di luar modal.

## Goals / Non-Goals

**Goals:**
- Mengoptimalkan alur navigasi di `BPMModal`.
- Mengintegrasikan `VerificationDesignPage` ke dalam modal untuk mengurangi perpindahan halaman.
- Memastikan sinkronisasi data (filtering) tetap berjalan di tab baru.

**Non-Goals:**
- Mengubah logika internal `VerificationDesignPage` (hanya integrasi).
- Menambah fitur baru di luar struktur tab.

## Decisions

### 1. Tab Reordering
**Rencana:** Worksheet -> Sampling -> RCM -> CSA -> Verification -> Logs.
**Rasional:** Urutan ini mencerminkan lifecycle ICOFR: Dokumentasi Kontrol -> Persiapan Data -> Matriks Referensi -> Penilaian Mandiri -> Audit Log.

### 2. Integrasi VerificationDesignPage
**Keputusan:** Memasukkan `VerificationDesignPage` dengan mode `embedded`.
**Rasional:** Memanfaatkan komponen yang sudah ada untuk menjaga konsistensi UI. Perlu memastikan props `filterBpmId` atau prop serupa diteruskan agar data yang tampil relevan dengan proses yang sedang dibuka di modal.

### 3. I18n Update
**Keputusan:** Menambahkan key baru di `bpm.json` untuk label tab "verification".

## Risks / Trade-offs

- **[Risk]** Modal menjadi terlalu berat karena memuat banyak komponen besar sekaligus.
  → **Mitigation:** Tab content di Shadcn/UI (Radix) secara default baru di-render saat tab dipilih (lazy mounting), sehingga performa awal modal tetap terjaga.
- **[Risk]** Layout `VerificationDesignPage` mungkin pecah saat dimasukkan ke dalam modal (container lebih kecil).
  → **Mitigation:** Gunakan prop `embedded={true}` pada komponen tersebut (jika tersedia) atau sesuaikan styling overflow pada container tab.
