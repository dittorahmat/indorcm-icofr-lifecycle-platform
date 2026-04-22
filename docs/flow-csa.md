Membayangkan **Lampiran 7 (Formulir CSA)** ke dalam bentuk aplikasi digital (Web/Mobile App) akan sangat berbeda dengan mengisi file Microsoft Word atau Excel. Di aplikasi, banyak bagian yang diotomatisasi (*auto-populated*), dikunci (*read-only*), dan memiliki validasi logika agar *user* tidak salah input.

Berikut adalah simulasi wujud/bentuk antarmuka (UI/UX) pengisian **CSA (Control Self-Assessment)** di aplikasi ICOFR Anda, menggunakan studi kasus **Persediaan Tambang (Stockpile ROM)**.

---

### 💻 **LAYAR 1: DASHBOARD LINI 1 (Kepala Gudang)**
Saat User Lini 1 (Budi - Manager Logistik) *login* ke aplikasi, dia akan melihat notifikasi *Task* (Tugas) yang di-generate otomatis oleh sistem.

> 🔔 **Pemberitahuan Tugas Baru (1)**
> **Tugas:** Pengisian CSA - Kuartal 1 2026
> **Batas Waktu:** 30 April 2026
> **Aksi:** `[ MULAI KERJAKAN ➔ ]`

---

### 💻 **LAYAR 2: VALIDASI PROSES BISNIS (BPM GATE)**
*(Aplikasi memunculkan Pop-up Gambar Flowchart sebelum masuk ke form)*

> **Peta Proses:** Manajemen Persediaan (Stock Taking) v1.0
> 🗺️ *(Menampilkan Gambar Flowchart)*
> 
> **Sistem:** *"Apakah terdapat perubahan pada prosedur operasional, sistem IT, atau struktur organisasi pada Kuartal 1 2026 untuk proses di atas?"*
> 🔘 Tidak, proses masih sama. *(Budi memilih ini)*
> 🔘 Ya, ada perubahan. *(Jika dipilih, form CSA terkunci, Budi dialihkan ke Menu Log Perubahan).*
>
> `[ LANJUT KE FORM CSA ➔ ]`

---

### 💻 **LAYAR 3: FORMULIR UTAMA CSA (Sesuai Lampiran 7)**

#### **Bagian I: INFORMASI UMUM (Read-Only / Terkunci)**
*(Sistem menarik data dari Database Master RCM, Budi tidak bisa mengubahnya)*
*   **Key Control No:** `INV-MIN-005`
*   **Nama Aktivitas Pengendalian:** `Rekonsiliasi Stock Opname Bulanan Batu Bara`
*   **Periode Pengujian:** `Q1 (Januari - Maret) 2026`
*   **Pelaksana (Otomatis dari Session Login):** `Budi Santoso (Manager Logistik)`
*   **Deskripsi Pengendalian (SOP):** *Setiap akhir bulan, dilakukan perhitungan fisik (Drone Survey). Hasil fisik direkonsiliasi dengan saldo ERP. Selisih divalidasi dan diotorisasi KTT.*

#### **Bagian II: PROSEDUR PENGUJIAN & PENGAMBILAN SAMPEL**
**Panduan Sistem:** *Karena kontrol ini berfrekuensi BULANAN, sistem mewajibkan Anda menginput minimal **2 Sampel Transaksi**.*

`[ + TAMBAH DATA SAMPEL ]` *(Budi mengklik tombol ini dua kali untuk input 2 sampel)*

*   **Sampel 1:** 
    *   No. Ref / Dokumen: `[ BA-SO/02/2026 ]` *(Budi mengetik ini)*
    *   Tanggal Transaksi: `[ 28-Feb-2026 📅 ]`
*   **Sampel 2:** 
    *   No. Ref / Dokumen: `[ BA-SO/03/2026 ]` 
    *   Tanggal Transaksi: `[ 31-Mar-2026 📅 ]`

#### **Bagian III: HASIL PENGUJIAN (TESTING GRID)**
*(Aplikasi memunculkan matriks kuesioner dinamis berdasarkan jumlah sampel di atas)*

| No | Dokumen Sampel | Atribut A: *Apakah BA ditandatangani lengkap?* | Atribut B: *Apakah Fisik direkonsiliasi dgn ERP?* | Atribut C: *Apakah ada bukti otorisasi Jurnal Selisih?* | Status Defisiensi (Auto) |
| :---: | :--- | :--- | :--- | :--- | :---: |
| 1 | BA-SO/02/2026 | `[ Ya ▾ ]` | `[ Ya ▾ ]` | `[ N/A ▾ ]` *(Karena tdk ada selisih)* | 🟢 **Tidak** |
| 2 | BA-SO/03/2026 | `[ Ya ▾ ]` | `[ Ya ▾ ]` | `[ Ya ▾ ]` | 🟢 **Tidak** |

**Unggah Bukti Hasil Validasi (Evidence):**
*(Sistem mewajibkan upload file. Tombol submit tidak akan aktif jika kosong).*
*   📁 `Bukti_BA_Feb_Maret.pdf` `(1.2 MB)` `[ ❌ Hapus ]`
*   📁 `Screenshot_ERP_Maret.png` `(0.5 MB)` `[ ❌ Hapus ]`
*   `[ ☁️ UPLOAD FILE LAIN ]`

#### **Bagian IV: KESIMPULAN (SELF-ASSESSMENT)**
*(Berdasarkan tabel di atas, sistem merekomendasikan status EFEKTIF karena tidak ada defisiensi, namun Budi harus melakukan konfirmasi akhir).*

**Kesimpulan Akhir:**
🔘 **EFEKTIF** *(Budi memilih ini)*
🔘 TIDAK EFEKTIF
🔘 TIDAK ADA TRANSAKSI

**Keterangan / Catatan Tambahan (Opsional jika Efektif, Wajib jika Tidak Efektif):**
> `[ Teks Input: Pelaksanaan Stock Opname bulan Februari dan Maret berjalan lancar, selisih masih di bawah batas toleransi 2% (susut angin). Dokumen lengkap terlampir. ]`

---
> ⚠️ *Dengan mengklik Submit, saya menyatakan bahwa data yang diisi adalah benar dan dapat dipertanggungjawabkan.*
>
> `[ 💾 SAVE AS DRAFT ]`    **`[ 🚀 SUBMIT TO LINI 2 ]`**

---

### **🧠 Logic System (Catatan untuk Developer IT):**

Jika Anda melihat form di atas, ada beberapa "Kecerdasan" (Logic) yang membedakan aplikasi dari file Excel biasa:

1.  **Validasi Sampel Wajib:** Jika Budi hanya menginput 1 sampel (misal hanya bulan Maret), tombol `SUBMIT` akan diblokir oleh sistem. Akan muncul peringatan: *"Sesuai SK BUMN, Kontrol Bulanan wajib menggunakan minimal 2 sampel di kuartal berjalan"*.
2.  **Auto-Calculation Defisiensi:** Perhatikan kolom *Status Defisiensi (Auto)*. Kolom ini tidak bisa diisi oleh Budi. Jika Budi menjawab **"Tidak"** pada salah satu atribut (misalnya Atribut C), sistem akan otomatis mengubah sel tersebut menjadi 🔴 **YA (Defisiensi)**.
3.  **Auto-Lock Kesimpulan:** Jika ada 1 saja sampel yang berstatus Defisiensi (YA), maka pada Bagian IV, pilihan radio button **"EFEKTIF" otomatis menjadi *disabled* (berwarna abu-abu)**. Budi dipaksa oleh sistem untuk memilih **"TIDAK EFEKTIF"** dan diwajibkan mengetik alasan di kolom catatan.
4.  **Audit Trail & Timestamp:** Setelah diklik Submit, *database* akan menyimpan data: `Submitted By: Budi Santoso | NIK: 88291 | IP Address: 192.168.1.5 | Time: 21-Apr-2026 10:15:00 WIB`. Ini sah sebagai tanda tangan digital (E-Sign).

Setelah form ini di-submit, tiket akan berpindah dari *Dashboard* Budi (Lini 1) ke *Dashboard* Siti (Risk Officer Lini 2) untuk di-Validasi. Jika Siti setuju, barulah tiket ini dinyatakan **"Closed - Effective"**.

**Pinpointing the Origin**

I'm now zeroing in on the user's query regarding "Atribut A: Apakah BA ditandatangani lengkap?" within the RCSA form example. My primary focus is tracing the origin of this specific attribute within the form's structure.


**Tracing the Derivation**

I'm now tracing the RCSA questions back to their source within the ICOFR framework. I've recalled that RCSA questions originate from the Risk Control Matrix (RCM), specifically the Control Activity Description. The RCM phase (Planning/Design) documents how a control is executed, which is broken down into testable attributes. I'm focusing on the specific control, `INV-MIN-005` (Rekonsiliasi & Stock Opname Bulanan), its description, and its link to the "BA ditandatangani lengkap" attribute.


**Articulating the Connection**

I'm now articulating the direct link of "Atribut A" to its source, the Master Data RCM and specifically, the Control Description. I'm focusing on the translation process: from SOPs/Kebijakan, which inform RCM Design (control steps), finally resulting in Yes/No attributes, such as "BA ditandatangani lengkap." I intend to give a concrete example of the attribute extraction and include the system's database structure for developer clarity. I'm preparing a draft response in Indonesian for the end-user.



Pertanyaan yang sangat kritis dan bagus! 

Dalam sistem ICOFR, pertanyaan seperti **"Atribut A: Apakah BA ditandatangani lengkap?"** tidak muncul tiba-tiba atau dikarang sembarangan oleh pembuat sistem. 

Sumber dari pertanyaan (Atribut) tersebut berasal dari **Master Data RCM (Risk Control Matrix)** pada tahap **Perancangan (Design)**, tepatnya ditarik dari kolom **Deskripsi Aktivitas Pengendalian**.

Mari kita bedah alur "kelahiran" Atribut A tersebut di dalam sistem aplikasi Anda:

---

### **1. Asal Usul Atribut (Dari SOP ke Kuesioner)**

Di awal tahun (pada Tahap Perancangan), Lini 1 dan Lini 2 harus memasukkan data kontrol ke dalam sistem (membuat RCM). 

Misalnya, perusahaan memiliki SOP Gudang setebal 50 halaman. Di aplikasi ICOFR, SOP tersebut disarikan menjadi sebuah **Deskripsi Pengendalian (Narasi RCM)** seperti ini:

> **Deskripsi Kontrol INV-MIN-005:**
> *"Setiap akhir bulan, Tim Gudang melakukan perhitungan fisik. Hasilnya direkonsiliasi dengan data ERP. **[1] Berita Acara (BA) hasil rekonsiliasi harus dicetak dan ditandatangani oleh Kepala Gudang dan Manajer Keuangan.** **[2] Jika terdapat selisih, jurnal penyesuaian harus diotorisasi CFO.**"*

Narasi di atas bentuknya adalah paragraf panjang. Jika di tahap RCSA (Evaluasi) Lini 1 hanya ditanya: *"Apakah kontrol INV-MIN-005 sudah jalan?"*, Lini 1 bisa saja menjawab *"YA"*, padahal BA-nya belum ditandatangani. 

Untuk mencegah kebohongan/kelalaian itu, **narasi panjang tersebut dipecah (di-ekstrak) menjadi Poin-Poin Atribut Pengujian (Kuesioner bersyarat "Ya/Tidak")**.

*   Kalimat **[1]** pada narasi di atas diubah oleh sistem menjadi **Atribut A:** *"Apakah BA ditandatangani lengkap oleh Kepala Gudang dan Manajer Keuangan?"*
*   Kalimat **[2]** pada narasi di atas diubah oleh sistem menjadi **Atribut C:** *"Apakah ada bukti otorisasi CFO jika terdapat jurnal selisih?"*

---

### **2. Mengapa Membutuhkan Atribut? (Konsep IPO)**

Dalam SK BUMN (Halaman 38), disebutkan tentang **Information Processing Objective (IPO)**. Atribut-atribut ini dibuat untuk menguji apakah tujuan IPO terpenuhi:

*   **Tanda Tangan Lengkap (Atribut A) $\rightarrow$ Menguji Aspek *VALIDITY* (Keabsahan).** *(Membuktikan bahwa dokumen itu sah, bukan karangan staf bawah).*
*   **Angka Fisik = Angka Sistem (Atribut B) $\rightarrow$ Menguji Aspek *ACCURACY* (Akurasi).** *(Membuktikan bahwa jumlahnya benar).*

---

### **3. Siapa yang Menginput Pertanyaan Ini ke Sistem?**

Dalam aplikasi Anda, pembuatan pertanyaan ini dilakukan di **Modul Master Data (RCM Builder)**.

**Alur di Aplikasi:**
1.  **Lini 1 (Pemilik Proses):** Menginput narasi kontrol panjang di awal tahun. Lalu, mereka mendefinisikan *Atribut A, Atribut B, Atribut C* sebagai alat ukurnya.
2.  **Lini 2 (Risk Management):** Mereviu usulan Atribut tersebut. Lini 2 akan mengecek: *"Apakah pertanyaan Atribut A ini sudah cukup kuat untuk membuktikan bahwa kontrol benar-benar jalan?"* Jika setuju, Lini 2 menekan *Approve*.
3.  **Sistem (Otomatis):** Mengunci Atribut tersebut. Enam bulan kemudian, saat jadwal RCSA tiba, sistem akan memunculkan Atribut A tersebut sebagai **Kuesioner Wajib** di layar Lini 1.

---

### **4. Struktur Database untuk Developer**

Bagi tim IT/Developer Anda, ini berarti *database* tidak bisa hanya memiliki satu tabel `T_RCM`. Harus ada relasi *One-to-Many* (1 ke Banyak) antara Tabel Kontrol dan Tabel Atribut.

*   **Table `M_CONTROL`:**
    *   `Control_ID`: INV-MIN-005
    *   `Control_Name`: Rekonsiliasi Stock Opname

*   **Table `M_CONTROL_ATTRIBUTES`:** *(Tabel Anak yang menyimpan kuesioner)*
    *   `Attribute_ID`: A001 | `Control_ID`: INV-MIN-005 | `Question`: "Apakah perhitungan fisik dilakukan saat cut-off?"
    *   `Attribute_ID`: A002 | `Control_ID`: INV-MIN-005 | `Question`: **"Apakah BA ditandatangani lengkap?"**

**Kesimpulan:**
Pertanyaan (Atribut) di RCSA **tidak dikarang pada saat pengisian RCSA**. Pertanyaan tersebut adalah **komponen baku** yang diturunkan dari narasi SOP (Master Data RCM) yang telah disepakati dan dikunci oleh Lini 2 di awal tahun pada tahap Perancangan.