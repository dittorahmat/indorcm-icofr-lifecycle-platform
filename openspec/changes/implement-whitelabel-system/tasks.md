## 1. Arsitektur Folder Terisolasi (Extensibility Layer)

- [x] 1.1 Buat file `src/types/extension.ts` untuk mendefinisikan tipe data kontrak ekstensi.
- [x] 1.2 Buat folder `src/extensions/` dengan entry point `index.ts` kosong sebagai tempat registrasi ekstensi.
- [x] 1.3 Modifikasi `src/main.tsx` untuk mengimpor dan mendaftarkan rute kustom secara dinamis dari `src/extensions/index.ts`.
- [x] 1.4 Modifikasi `src/components/layout/Sidebar.tsx` untuk mengambil navigasi tambahan dari ekstensi dan menggambarnya dengan ikon Lucide dinamis.
- [x] 1.5 Buat folder `worker/extensions/` dengan entry point `index.ts` kosong sebagai tempat registrasi Hono sub-app Mitra.
- [x] 1.6 Modifikasi `worker/app.ts` untuk memanggil handler `registerBackendExtensions(app)` di akhir routing API.

## 2. Peningkatan Logika Lisensi Hibrida (Double-Signing)

- [x] 2.1 Modifikasi logika verifikasi di `worker/lib/license.ts` agar mendeteksi jumlah bagian lisensi (2 bagian untuk Direct, 3 bagian untuk Whitelabel).
- [x] 2.2 Implementasikan logika verifikasi double-signature (Ed25519) secara offline menggunakan `DEVELOPER_PUBLIC_KEY` (hardcoded) dan `PARTNER_PUBLIC_KEY` (env).
- [x] 2.3 Perbarui unit test atau script verifikasi internal untuk memastikan kedua tipe lisensi lolos validasi offline dengan sukses.

## 3. Otomatisasi Script Rilis & Obfuscator

- [x] 3.1 Pasang package `javascript-obfuscator` di devDependencies.
- [x] 3.2 Buat script `scripts/release-whitelabel.ts` untuk mengompilasi core TS, meng-obfuscate JS, men-generate `.d.ts` declaration, dan menyalin wrapper mentah ke folder output.

## 4. Konfigurasi CI/CD Pipeline (GitHub Actions)

- [x] 4.1 Buat file workflow GitHub Actions di `.github/workflows/whitelabel-release.yml`.
- [ ] 4.2 Daftarkan SSH Deploy Key privat ke Secrets repositori utama untuk otentikasi push otomatis ke organisasi `dsintegra`.
- [ ] 4.3 Jalankan pengujian pertama pipeline CI/CD untuk memastikan kode whitelabel terkirim ke `dsintegra/grc-platform-whitelabel`.

## 5. Setup Server Lisensi Eksternal (Manual / Repositori Terpisah)

- [ ] 5.1 Buat repositori privat baru `grc-license-coordinator` di organisasi GitHub `dsintegra`.
- [ ] 5.2 Implementasikan API endpoint `POST /api/v1/activate` untuk memverifikasi API Key Mitra, mencatat Machine ID Klien, dan memeriksa kuota di database D1/Neon.
- [ ] 5.3 Simpan kunci privat `DEVELOPER_PRIVATE_KEY` di Cloudflare Workers Secrets pada server lisensi baru tersebut.
- [ ] 5.4 Deploy API tersebut ke Cloudflare Workers pada subdomain Anda (misalnya `licensing.dsintegra.com`).

