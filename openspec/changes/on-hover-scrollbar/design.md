## Context

Aplikasi IndoGRC Pro memiliki banyak area padat data seperti RCM Matrix dan Sidebar navigasi. Saat ini, scrollbar yang muncul adalah scrollbar bawaan browser (default OS) yang seringkali mengganggu estetika antarmuka atau menutupi konten penting (seperti border tabel). Kebutuhan desain adalah sistem scrollbar yang "discreet" namun tetap fungsional.

## Goals / Non-Goals

**Goals:**
- Implementasi sistem scrollbar "On-Hover" yang konsisten di seluruh platform.
- Mengurangi gangguan visual dari scrollbar tebal di area tabel RCM.
- Memastikan navigasi Sidebar tetap bisa dilakukan pada resolusi layar rendah.
- Mendukung kompatibilitas di browser Webkit (Chrome/Edge/Safari) dan Firefox.

**Non-Goals:**
- Mengimplementasikan library eksternal khusus scrollbar (seperti OverlayScrollbars atau SimpleBar) untuk menjaga performa dan meminimalkan ketergantungan.
- Mengubah perilaku scrollbar pada level sistem operasi (hanya di level komponen aplikasi).

## Decisions

### 1. CSS Utility Class over Component Props
- **Keputusan**: Menggunakan utility class CSS `.scrollbar-hover` yang didefinisikan di `@layer utilities` pada Tailwind.
- **Rasio**: Lebih ringan, mudah diaplikasikan secara deklaratif pada elemen apapun tanpa perlu memodifikasi props komponen React secara besar-besaran. Mendukung "separation of concerns" di mana behavior UI diatur lewat CSS.
- **Alternatif**: Membuat Wrapper Component `<ScrollArea>`. Ditolak karena akan menambah kompleksitas DOM nesting pada tabel RCM yang sudah sangat padat.

### 2. Native Scroll with Transparent Styling
- **Keputusan**: Menggunakan properti `scrollbar-width` (Firefox) dan `::-webkit-scrollbar` (Webkit) dengan warna transparan secara default.
- **Rasio**: Menjaga performa native scrolling browser sambil mendapatkan kontrol penuh atas aspek visual.
- **Alternatif**: Custom Scrollbar dengan JS. Ditolak karena risiko performa (jank) pada tabel dengan ribuan baris data.

### 3. Z-Index Management for RCM Table
- **Keputusan**: Scrollbar pada `RCMTable` harus memiliki konteks stacking yang benar agar tidak tertutup oleh header sticky.
- **Rasio**: Header RCM menggunakan `sticky top-0` dengan z-index tinggi. Kontainer pembungkus tabel harus dipastikan memiliki `overflow-auto` dengan penanganan scrollbar yang tidak menimpa elemen sticky.

## Risks / Trade-offs

- **[Risk] Browser Compatibility** → Properti scrollbar CSS non-standard di Webkit mungkin berubah di masa depan. Mitigasi: Tetap menggunakan fallback `overflow: auto` standar sehingga fungsi scroll tidak akan pernah rusak meskipun styling gagal.
- **[Risk] Mobile Devices** → Perangkat mobile biasanya sudah memiliki on-hover scrollbar secara native. Mitigasi: Styling CSS ini utamanya ditujukan untuk desktop, pada mobile browser biasanya mengabaikan custom styling webkit scrollbar tertentu.
- **[Risk] Visibility on Dark Mode** → Warna scrollbar mungkin tidak terlihat di background gelap. Mitigasi: Menggunakan variabel CSS `hsl(var(--muted-foreground) / 0.5)` yang secara otomatis menyesuaikan dengan tema dark/light aplikasi.
