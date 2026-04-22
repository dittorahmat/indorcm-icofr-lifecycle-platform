# Regulatory DoD Logic Spec

## Overview
Menentukan tingkat defisiensi (Degree of Deficiency) berdasarkan Gambar 5 regulasi SK-5/2024.

## Requirements

### Flowchart Logic (Gambar 5)
1.  **Box a (Hubungan Asersi)**:
    - Jika **Yes** -> Lanjut ke **Box b**.
    - Jika **No** -> Lanjut ke **Box d**.
2.  **Box b (Likelihood)**:
    - Jika **Yes** -> Lanjut ke **Box c**.
    - Jika **No** -> Lanjut ke **Box d**.
3.  **Box c (Magnitude)**:
    - Jika **Yes** -> Lanjut ke **Box e**.
    - Jika **No** -> Lanjut ke **Box d**.
4.  **Box d (Atensi Dewan/Komite Audit)**:
    - Jika **Yes** -> Lanjut ke **Box f**.
    - Jika **No** -> Hasil: **Control Deficiency**.
5.  **Box e (Compensating Control)**:
    - Jika **Yes** -> Lanjut ke **Box d**.
    - Jika **No** -> Hasil: **Material Weakness** (Terminal).
6.  **Box f (Prudent Official)**:
    - Jika **Yes** -> Hasil: **Material Weakness**.
    - Jika **No** -> Hasil: **Significant Deficiency**.
7.  **Box g (Agregasi)**:
    - Jika hasil non-MW (CD atau SD) dan `isAggregate` aktif, tanyakan Box g.
    - Jika **Yes** -> Kembali ke **Box b** (Loop).
    - Jika **No** -> Selesai.

### Terminology (Official Indonesia)
- Box a: "Apakah defisiensi berhubungan langsung dengan pencapaian satu atau lebih asersi atas laporan keuangan?"
- Box b: "Apakah terdapat kemungkinan (likelihood) dari salah saji dihasilkan dari defisiensi (atau kombinasi defisiensi)?"
- Box c: "Apakah terdapat kemungkinan magnitude dari potensi salah saji (dengan mempertimbangkan faktor-faktor material baik untuk laporan keuangan)?"
- Box d: "Apakah defisiensi (atau kombinasi defisiensi) cukup penting untuk mendapat perhatian dari yang bertanggung jawab atas pengawasan laporan keuangan perusahaan?"
- Box e: "Apakah terdapat pengendalian yang dapat beroperasi secara efektif pada tingkat ketepatan yang cukup untuk mencegah atau mendeteksi salah saji material laporan keuangan?"
- Box f: "Akankah individu yang berpengetahuan luas, kompeten dan objektif (prudent official) menyimpulkan defisiensi sebagai material weakness?"
- Box g: "Apakah terdapat beberapa pengendalian defisiensi dan/atau defisiensi signifikan yang mempengaruhi account balance atau disclosure dari laporan keuangan yang sama?"

## Verification
- Pastikan Box e "No" langsung memicu Material Weakness.
- Pastikan teks pertanyaan di UI sama persis dengan poin di atas.
