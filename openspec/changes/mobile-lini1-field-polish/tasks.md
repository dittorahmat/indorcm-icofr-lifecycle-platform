## 1. Fondasi pola dual-render

- [x] 1.1 Inventarisasi tabel tersisa (CSA, Todo, Testing, Scoping, BPMWorksheet, Lampiran 6/8) dan tandai mana kartu penuh vs read-only — verifikasi: daftar di PR description cocok dengan hasil grep `min-w-[`/`overflow-x-auto`
- [x] 1.2 Terapkan `w-full max-w-full overflow-x-hidden` di shell (RootLayout/AppLayout) tanpa mengubah scroll desktop — verifikasi: tidak ada scroll horizontal halaman di 360px dan 390px (cek manual Chrome DevTools)
- [x] 1.3 Tambah test dual-render CSA mengikuti aturan `getAllByText` + `closest()` — verifikasi: `npm test -- CSA` lolos dan sengaja gagal bila memakai `getByText` tunggal

## 2. Kartu CSA + bottom-sheet verifikasi (Lini 1)

- [x] 2.1 Implement kartu CSA mobile (`block md:hidden`) setara CSAMobileCard: Process, Unit, status Lini 2, aksi — verifikasi: assessment tampil sebagai kartu di <768px dan tabel di >=768px
- [x] 2.2 Bungkus dialog verifikasi/TOD sebagai bottom-sheet mobile (`max-h-[90vh]`, sticky Batal/Simpan) — verifikasi: aksi terlihat tanpa scroll halaman di HP + tidak tertutup keyboard virtual
- [x] 2.3 Tambah semua string baru ke `src/i18n/locales/**` (id + en), tanpa hardcoded text — verifikasi: grep tidak menemukan string UI baru di luar i18n

## 3. Evidence foto lapangan

- [x] 3.1 Tambah trigger upload foto/file di kartu CSA (input native, target >=44px) + pratinjau sebelum simpan — verifikasi: pilih foto dari kamera HP tersimpan sebagai evidence CSA
- [x] 3.2 Tangani gagal upload (pesan + retry) tanpa menghilangkan isian form (`useUnsavedChanges`) — verifikasi: simulasi gagal upload mempertahankan draft CSA

## 4. Todo mobile Lini 1

- [x] 4.1 Render Todo sebagai daftar vertikal terurut urgensi di mobile (reuse pola ActionCenter) — verifikasi: tugas mendesak muncul teratas di <768px dengan aksi buka CSA/unggah evidence
- [x] 4.2 Pastikan notifikasi/todo terhubung dari MobileBottomNav tanpa duplikasi sidebar — verifikasi: navigasi Todo dari bottom nav mencapai daftar yang sama

## 5. Read-only jujur tabel berat

- [x] 5.1 Bungkus BPMWorksheet/Testing/Scoping/Lampiran 6/8 di mobile sebagai ringkasan baca + banner i18n "buka di desktop untuk edit" — verifikasi: tidak ada scroll horizontal paksa + banner tampil hanya di <768px
- [x] 5.2 Audit anti-AI slop (font ≥12px, `rounded-md/lg`, tanpa italic dekoratif/glassmorphism/animasi distraksi) — verifikasi: `npm run lint` bersih + review visual 360px

## 6. Quality gate

- [x] 6.1 Jalankan `type-check` per-tsconfig (redirect ke file), `lint`, `build`, `test` berurutan — verifikasi: semua hijau, atau catat kegagalan pre-existing yang tidak terkait
