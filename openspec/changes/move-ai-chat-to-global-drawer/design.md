## Context

Aplikasi IndoRCM Pro memiliki asisten AI yang membantu pengguna dengan regulasi ICOFR. Saat ini, fungsionalitas chat terikat pada komponen `Dashboard.tsx`. Hal ini membatasi kegunaan asisten saat pengguna sedang bekerja di modul lain. Selain itu, penggunaan modal tengah (`Dialog`) menutupi konten utama dan membatasi tinggi area chat.

## Goals / Non-Goals

**Goals:**
- Membuat AI Chat tersedia secara global di semua halaman dalam `RootLayout`.
- Mengubah tampilan chat dari Modal menjadi Side Drawer (Sheet) untuk UX yang lebih baik.
- Memastikan riwayat chat tetap terjaga saat berpindah halaman.
- Menambahkan deteksi konteks halaman otomatis.

**Non-Goals:**
- Mengubah logika inti pemrosesan AI di backend (selain penambahan metadata konteks).
- Menambahkan fitur chat ke halaman publik (Login/Welcome).

## Decisions

1. **Global State di RootLayout**: Menggunakan state `isChatOpen` di `RootLayout.tsx`.
   - *Rationale*: `RootLayout` adalah titik temu semua rute terproteksi. Meletakkan state di sini menjamin komponen chat tetap terpasang (*mounted*) selama navigasi antar halaman terproteksi.
   - *Alternative*: Menggunakan Context API. Diputuskan tidak perlu karena state hanya digunakan oleh dua komponen yang berdekatan secara hierarki dalam satu layout.

2. **Side Drawer (Sheet) via shadcn/ui**: Mengganti `Dialog` dengan `Sheet` dari shadcn/ui.
   - *Rationale*: Side Drawer memberikan vertikalitas yang lebih baik (100% tinggi layar), sangat cocok untuk menampilkan teks regulasi yang panjang. Lebar akan diatur sekitar 450px-500px agar cukup lega namun tidak menutupi seluruh konten utama.

3. **Context-Aware Prompting**: Mengirimkan `currentLocation` dari frontend ke backend.
   - *Rationale*: AI dapat memberikan jawaban yang lebih spesifik jika tahu user sedang melihat halaman "RCM" atau "Scoping".
   - *Implementation*: Menggunakan hook `useLocation` dari `react-router-dom` di dalam `AIChatModal` (yang akan dikonversi menjadi Drawer).

## Risks / Trade-offs

- **[Risk] Layout Collision** → Tombol FAB mungkin menutupi elemen UI penting di halaman tertentu.
  - *Mitigation*: Pastikan posisi `fixed bottom-6 right-6` memiliki z-index yang cukup tinggi dan tidak berbenturan dengan elemen scrollable.
- **[Trade-off] Mobile Experience** → Side drawer lebar 500px akan menutupi seluruh layar di mobile.
  - *Mitigation*: Gunakan responsive width (contoh: `w-full sm:max-w-[500px]`).
