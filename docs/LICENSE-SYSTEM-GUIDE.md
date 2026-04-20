# Panduan Sistem Lisensi IndoGRC Pro

Dokumen ini menjelaskan cara penggunaan sistem lisensi offline menggunakan algoritma **Ed25519** (Asymmetric Signing) untuk tim internal (Vendor) dan klien.

---

## 🔑 Konsep Dasar
*   **Private Key:** Dipegang oleh Vendor (RAHASIA). Digunakan untuk menandatangani (sign) lisensi.
*   **Public Key:** Dibagikan ke aplikasi klien (via environment). Digunakan untuk memverifikasi keaslian lisensi.
*   **Machine ID:** Identitas unik server klien (Hardware Binding) agar lisensi tidak bisa dipindah-tangankan.

---

## 🛠 Langkah 1: Persiapan Awal (Vendor Saja)
Lakukan ini satu kali di laptop vendor sebelum mulai menjual aplikasi.

1.  **Generate Key Pair:**
    ```bash
    bun run scripts/generate-license.ts gen-keys
    ```
2.  **Output:**
    *   **PUBLIC_KEY:** Catat untuk ditaruh di `docker-compose.yml` klien.
    *   **PRIVATE_KEY:** **SANGAT RAHASIA.** Simpan di password manager.

---

## 🚀 Langkah 2: Tektokan Vendor & Klien (Operasional)

### A. Deployment (Klien)
1.  Vendor memberikan file `docker-compose.yml` dengan mengisi `LICENSE_PUBLIC_KEY` menggunakan Public Key dari Langkah 1.
2.  Klien menjalankan aplikasi:
    ```bash
    docker-compose up -d
    ```

### B. Pengambilan Machine ID (Klien ke Vendor)
1.  Klien membuka aplikasi di browser.
2.  Aplikasi otomatis masuk ke halaman **Activation**.
3.  Klien **Copy Machine ID** yang muncul (misal: `HOST-1a2b3c...`) dan mengirimkannya ke Vendor.

### C. Pembuatan License Key (Vendor ke Klien)
1.  Vendor menjalankan script di laptop sendiri:
    ```bash
    bun run scripts/generate-license.ts sign
    ```
2.  Masukkan data saat diminta:
    *   **Private Key:** (Masukkan Private Key rahasiamu).
    *   **Machine Code:** (Masukkan ID yang dikirim klien).
    *   **Client Name:** (Nama PT Klien).
    *   **Validity:** (Misal: 365 hari).
3.  Vendor mengirimkan string **LICENSE_KEY** yang dihasilkan ke Klien.

### D. Aktivasi (Klien)
1.  Klien paste **LICENSE_KEY** ke dalam kolom aktivasi di aplikasi.
2.  Klik **Activate**. Selesai.

---

## 📊 Ringkasan Alur Tektokan

| Aktor | Aksi | Output |
| :--- | :--- | :--- |
| **Vendor** | `gen-keys` | Simpan Private Key, Berikan Public Key ke Klien |
| **Klien** | Nyalakan App | Lihat & Kirim **Machine ID** ke Vendor |
| **Vendor** | `sign` (pakai Machine ID klien) | Kirim **License Key** ke Klien |
| **Klien** | Input License Key | App Terbuka & Aktif (1 Tahun) |

---

## 🛡️ Fitur Keamanan (Anti-Cheat)
1.  **Hardware Binding:** Jika folder aplikasi di-copy ke server lain, Machine ID tidak akan cocok dan aplikasi otomatis terkunci.
2.  **Time-Travel Detection:** Jika user memundurkan jam server untuk mengelabui masa expired, aplikasi akan mendeteksi perbedaan waktu dengan `last_heartbeat` di database dan langsung mogok jalan (`tampered`).
3.  **Offline-First:** Tidak butuh koneksi internet. Semua verifikasi terjadi di dalam server klien menggunakan matematika kriptografi.

---

## 🔒 Keamanan Kode (Minify & Obfuscate)
Sebagai vendor, sangat disarankan untuk **tidak memberikan source code (.ts)** kepada klien. Gunakan sistem build Docker yang sudah kita siapkan:

### 1. Bundling & Minification
Aplikasi akan digabung menjadi satu file JavaScript (`server.js`) dan semua spasi/nama variabel akan disingkat agar sulit dibaca.

### 2. Obfuscation
Kita menggunakan `javascript-obfuscator` di dalam Dockerfile untuk mengacak logika kode. Hasilnya adalah kode "cacing" yang mustahil dipahami secara manual oleh klien, sehingga logic lisensi tidak bisa di-bypass dengan mudah.

---

## ⚠️ Batasan & Limitasi
*   **Hanya untuk On-Premise/VPS:** Sistem ini **TIDAK JALAN di Cloudflare Workers**. Jangan deploy versi ini ke Cloudflare karena fungsi pencarian Machine ID akan menyebabkan error di lingkungan serverless.
*   **Perubahan Hardware:** Jika klien mengganti motherboard atau melakukan instalasi ulang OS yang mengubah `machine-id`, mereka **wajib** meminta License Key baru kepada Vendor.

---

## ☁️ Cloudflare Demo Bypass
Untuk kebutuhan demo di Cloudflare Workers, sistem lisensi bisa dilewati secara otomatis menggunakan environment variable.

1.  **Konfigurasi:** Di file `wrangler.jsonc`, pastikan terdapat variabel:
    ```jsonc
    "vars": {
      "SKIP_LICENSE": "true"
    }
    ```
2.  **Efek:** Jika set ke `true`, middleware `licenseGuard` akan memberikan akses penuh tanpa mengecek database atau hardware ID.
3.  **Keamanan:** Pastikan variabel ini **TIDAK ADA** atau diset ke `false` di environment produksi VPS/Docker klien.

---

## 🧪 Panduan Testing di Localhost
Jika Anda ingin mencoba alur aktivasi lisensi secara penuh di komputer lokal (bukan mode bypass), ikuti urutan ini:

### 1. Persiapan Kunci & Env
1.  Jalankan `bun run scripts/generate-license.ts gen-keys`.
2.  Buka file **`.dev.vars`**, masukkan:
    ```bash
    SKIP_LICENSE=false
    LICENSE_PUBLIC_KEY=Isi_Public_Key_Anda
    ```

### 2. Jalankan Server & Re-Seed (Auth Sync)
1.  Matikan dan nyalakan ulang `bun run dev`.
2.  Buka browser ke: `http://localhost:3000/api/dev/re-seed?mode=auth`.
3.  Tunggu pesan sukses.
    *   **Penting:** Gunakan `?mode=auth` agar **hanya data user/password** yang diperbarui (disesuaikan dengan mode lisensi). Data bisnis seperti RCM, Kontrol, dan Diagram Anda akan tetap aman.

### 3. Alur Aktivasi & Login
1.  Buka `http://localhost:3000`, Anda akan otomatis diarahkan ke halaman **Activation Required**.
2.  Copy **Machine ID** yang muncul di layar.
3.  Di terminal, jalankan `bun run scripts/generate-license.ts sign`. Masukkan Machine ID tadi saat diminta.
4.  Copy **LICENSE_KEY** yang dihasilkan, paste ke browser, lalu klik **Activate System**.
5.  Setelah sukses, login dengan email `admin@bumn.go.id` dan password `password`.

---

## 🛠️ Developer Tools (Khusus Local/Demo)
Aplikasi menyediakan endpoint rahasia untuk pengelolaan database cepat:

*   **Auth Only Sync:** `GET /api/dev/re-seed?mode=auth`
    *   Mengupdate password semua user demo agar sesuai dengan mode `SKIP_LICENSE` saat ini. 
    *   **Direkomendasikan** saat ganti mode lisensi agar data bisnis tidak hilang.
*   **Full Reset:** `GET /api/dev/re-seed?mode=full`
    *   Menghapus **SELURUH** isi database (Wipe Out) dan mengisi ulang dari nol.

---
© 2026 IndoGRC Pro - Internal Documentation
