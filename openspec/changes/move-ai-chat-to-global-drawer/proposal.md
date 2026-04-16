## Why

Saat ini asisten AI ICOFR hanya tersedia di Dashboard, sehingga pengguna kehilangan akses bantuan saat berada di modul lain (Scoping, RCM, Testing). Selain itu, ukuran jendela chat saat ini terlalu kecil (Modal) yang menyulitkan pembacaan referensi regulasi yang panjang.

Perubahan ini bertujuan untuk membuat bantuan AI tersedia secara global di seluruh aplikasi (post-login) dan memberikan ruang baca yang lebih lega bagi pengguna melalui antarmuka Side Drawer.

## What Changes

- Relokasi komponen Chat AI (Button & Modal) dari level halaman (`Dashboard.tsx`) ke level tata letak global (`RootLayout.tsx`).
- Konversi antarmuka pengguna dari **Modal (Dialog)** menjadi **Side Drawer (Sheet)** untuk ruang kerja yang lebih luas.
- Penambahan konteks lokasi (URL path) ke dalam instruksi AI agar memberikan jawaban yang lebih relevan dengan modul yang sedang dibuka.
- Penghapus kode Chat AI yang sudah tidak digunakan di `Dashboard.tsx`.

## Capabilities

### New Capabilities
- `global-ai-assistant`: Kemampuan untuk mengakses asisten AI dari halaman mana pun dalam sesi terautentikasi.
- `context-aware-chat`: Kemampuan asisten untuk memahami konteks halaman pengguna saat ini.

### Modified Capabilities
- `ai-chatbot`: Perubahan antarmuka dari Modal menjadi Side Drawer dan peningkatan visibilitas global.

## Impact

- `src/components/layout/RootLayout.tsx`: Penambahan state global untuk chat.
- `src/pages/Dashboard.tsx`: Penghapusan komponen chat lokal.
- `src/components/ai-chatbot/`: Modifikasi komponen UI untuk mendukung format Drawer/Sheet.
- `worker/user-routes.ts`: Memastikan endpoint `/api/ai/chat` siap menerima tambahan metadata konteks jika diperlukan.
