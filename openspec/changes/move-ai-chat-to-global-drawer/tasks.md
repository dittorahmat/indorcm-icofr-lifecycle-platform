## 1. Refactor UI Components

- [x] 1.1 Ubah `AIChatModal.tsx` menjadi `AIChatDrawer.tsx` menggunakan komponen `Sheet` dari shadcn/ui.
- [x] 1.2 Sesuaikan styling `AIChatDrawer` agar memiliki lebar responsif (`w-full sm:max-w-[500px]`) dan tinggi penuh.
- [x] 1.3 Update `ChatMessageList.tsx` untuk memastikan area scroll menyesuaikan dengan tinggi Drawer yang baru.

## 2. Global Integration

- [x] 2.1 Tambahkan state `isChatOpen` ke `src/components/layout/RootLayout.tsx`.
- [x] 2.2 Pasang `AIFabButton` dan `AIChatDrawer` ke dalam `RootLayout.tsx`.
- [x] 2.3 Hapus penggunaan `AIFabButton`, `AIChatModal`, dan state terkait dari `src/pages/Dashboard.tsx`.

## 3. Context Awareness & Improvements

- [x] 3.1 Tambahkan hook `useLocation` ke dalam `AIChatDrawer.tsx` untuk mendeteksi rute aktif.
- [x] 3.2 Modifikasi fungsi `handleSend` di `AIChatDrawer.tsx` untuk menyertakan informasi rute saat ini dalam payload API jika diperlukan.
- [x] 3.3 Update sistem prompt di backend (`worker/user-routes.ts`) jika metadata konteks ditambahkan ke dalam request.

## 4. Verification

- [x] 4.1 Verifikasi tombol chat muncul di Dashboard, Scoping, dan RCM.
- [x] 4.2 Verifikasi tombol chat TIDAK muncul di halaman Login (`/`).
- [x] 4.3 Verifikasi riwayat chat tetap ada saat berpindah antar halaman (misal dari Dashboard ke RCM).
- [x] 4.4 Pastikan ukuran Drawer sudah sesuai dan nyaman digunakan di desktop maupun mobile.
