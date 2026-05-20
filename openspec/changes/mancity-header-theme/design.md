## Context

Aplikasi IndoGRC Pro memiliki standar warna primer biru Manchester City (`#6CABDD`) yang didefinisikan dalam `index.css`. Beberapa komponen kunci seperti `BPMModal` dan `RCMGroupRow` saat ini masih menggunakan warna gelap (`Indigo-900` dan `Slate-800`) yang kurang konsisten dengan identitas visual yang diinginkan pengguna.

## Goals / Non-Goals

**Goals:**
- Mengganti latar belakang header `BPMModal` dan `RCMGroupRow` dengan tema Manchester City.
- Memastikan teks pada latar belakang tersebut menggunakan warna gelap (`primary-foreground`) untuk kontras optimal.
- Mempertahankan kegunaan elemen UI lain (tombol close, icon, badge) dalam header tersebut.

**Non-Goals:**
- Mengubah skema warna dasar (CSS Variables) di `index.css`.
- Mengubah fungsionalitas logika bisnis pada komponen tersebut.

## Decisions

### Decision 1: Penggunaan `bg-mancity-pattern`
Kita akan menggunakan utility class `.bg-mancity-pattern` yang sudah ada di `src/index.css`. Class ini memberikan warna dasar `--primary` sekaligus efek garis diagonal transparan yang memberikan tekstur profesional.

### Decision 2: Penggunaan `text-primary-foreground`
Alih-alih `text-white`, kita akan menggunakan `text-primary-foreground` (Dark Navy) untuk memastikan keterbacaan yang tajam di atas biru muda. Ini sesuai dengan variabel CSS `:root` yang sudah disetel.

### Decision 3: Penyesuaian Detail Komponen
- **BPMModal:** Mengubah header dari `bg-indigo-900 text-white` menjadi `bg-mancity-pattern text-primary-foreground`.
- **RCMGroupRow:** Mengubah dari `bg-slate-800 text-white` menjadi `bg-mancity-pattern text-primary-foreground`. Border bawah `border-slate-400` akan dihapus atau diganti dengan transparansi agar tidak terlihat "kaku" di atas biru muda.

## Risks / Trade-offs

- **[Risk]** Kontras warna pada Badge atau Icon yang sebelumnya putih mungkin menjadi kurang jelas.
  - **Mitigation:** Melakukan peninjauan visual setelah perubahan dan menyesuaikan warna elemen pendukung tersebut menjadi lebih gelap jika diperlukan.
- **[Trade-off]** Tampilan menjadi lebih terang (light mode feel) pada area yang sebelumnya sangat gelap. Ini adalah konsekuensi yang disetujui untuk meningkatkan profesionalisme UI.
