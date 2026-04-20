## Context

Saat ini, interface `Control` di `shared/types.ts` menyimpan semua jenis kontrol (ELC, TLC, ITGC) dalam satu struktur datar. Hal ini menyulitkan pemisahan logika bisnis, otorisasi, dan visualisasi yang diminta oleh regulasi SK-5/2024. Antarmuka RCM Manager juga masih bersifat tunggal (monolitik), tidak memisahkan kontrol strategis perusahaan dan kontrol teknis operasional.

## Goals / Non-Goals

**Goals:**
- Melakukan kategorisasi eksplisit pada entitas `Control`.
- Implementasi hubungan Many-to-Many antara prosedur teknis (TLC) dan kebijakan strategis (ELC).
- Pembatasan akses Tab ELC hanya untuk peran strategis (Admin/Line 2).
- Dekorasi visual pada diagram BPM untuk menunjukkan status kepatuhan (linkage).

**Non-Goals:**
- Migrasi data otomatis untuk kontrol lama (user akan diminta mengupdate secara manual).
- Implementasi modul Audit Internal (Lini 3) secara penuh (hanya fokus pada linkage RCM).

## Decisions

- **Keputusan 1: Kategorisasi Kontrol.** Menambahkan atribut `level: "ELC" | "TLC" | "ITGC"` pada interface `Control`. Ini memungkinkan pemanfaatan atribut bersama (seperti `code`, `name`, `ownerId`) namun tetap bisa difilter di sisi UI dan API.
- **Keputusan 2: Pemetaan Many-to-Many.** Menggunakan array `relatedControlIds: string[]` pada level TLC untuk merujuk ke ID ELC. Dipilih array karena 1 aktivitas operasional bisa didasari oleh lebih dari 1 prinsip kebijakan COSO.
- **Keputusan 3: Logika Penghapusan Ketat (Strict Delete).** Implementasi pengecekan pada backend/Durable Object sebelum aksi `delete`. Jika sebuah ELC masih tercantum dalam `relatedControlIds` milik kontrol lain, sistem akan melempar error 400 (Bad Request).
- **Keputusan 4: UI Berbasis Tab di RCM Manager.** Menggunakan komponen `Tabs` dari Shadcn/UI untuk memisahkan view TLC dan ELC tanpa harus pindah halaman, menjaga konteks kerja user.
- **Keputusan 5: Visualisasi di BPM.** Node kontrol pada diagram alir akan diberikan *Conditional Decorator* (icon Shield) jika `relatedControlIds.length > 0`.

## Risks / Trade-offs

- [Risk] Performansi diagram BPM melambat karena pengecekan relasi → [Mitigation] Lakukan pre-fetch data ELC dan gunakan Map untuk lookup cepat (O(1)) di sisi client.
- [Risk] User bingung saat ELC tidak bisa dihapus → [Mitigation] Tampilkan modal info yang merinci daftar TLC mana saja yang masih bergantung pada ELC tersebut.
- [Risk] Inkonsistensi i18n → [Mitigation] Pastikan semua label Tab dan Pesan Error menggunakan key dari file JSON di `src/i18n/`.
