export const MOCK_COMPANY = "PT BATUBARA NUSANTARA SEJAHTERA";

export const MOCK_ELC = [
  {
    ref: "ELC-PRC-01",
    activity: "Penegakan Etika Pengadaan & Anti-Suap: Perusahaan mewajibkan penandatanganan Pakta Integritas, Deklarasi CoI, dan pelaporan LHKPN bagi Komite Pengadaan sebelum penetapan tender strategis (misal: Kontraktor OB Removal / Coal Getting).",
    freq: "Ad-hoc (Setiap Tender Strategis)",
    evidence: "1. Pakta Integritas, 2. Form CoI, 3. Tanda Terima LHKPN",
    function: "Supply Chain Management (SCM)",
    owner: "EVP SCM / Ketua Panitia Tender",
    period: "Jan - Des 2026",
    coso: "P1 (Komitmen Integritas), P5 (Akuntabilitas)"
  },
  {
    ref: "ELC-PRC-02",
    activity: "Struktur Wewenang Penetapan Pemenang: Penetapan pemenang tender > Rp 100 Miliar (pengadaan Heavy Equipment / Smelter) wajib melalui Rapat Gabungan Direksi & persetujuan Dewan Komisaris.",
    freq: "Ad-hoc (Setiap Rapat)",
    evidence: "1. SK DoA Procurement, 2. MoM Rapat Direksi, 3. Persetujuan Dekom",
    function: "Board of Directors (BOD)",
    owner: "Direktur Utama & Dewan Komisaris",
    period: "Jan - Des 2026",
    coso: "P2 (Pengawasan Dewan), P3 (Struktur & Wewenang)"
  }
];

export const MOCK_TLC = [
  {
    no: 1,
    process: "Pengadaan Barang & Jasa (Procurement)",
    subProcess: "Evaluasi dan Penetapan Pemenang Tender",
    location: "Head Office (Divisi SCM)",
    risk: "Penunjukan pemenang tender tidak didasarkan pada kualifikasi teknis dan komersial yang wajar, atau terjadi mark-up harga, mengakibatkan pemborosan biaya operasional tambang.",
    fraud: "Y",
    riskRating: "Tinggi",
    controlRef: "PRC-MIN-012",
    controlName: "Otorisasi Penetapan Pemenang Tender (Tender Award Approval)",
    controlDesc: "Sistem e-Procurement mengkalkulasi penawaran. Pimpinan SCM memverifikasi hasil dengan HPS. Penetapan disetujui berjenjang di sistem sesuai DoA sebelum PO diterbitkan.",
    evidence: "BA Hasil Pelelangan (BAHP), Log Approval E-Proc",
    keyControl: "Y",
    assertions: ["A", "V", "RA", "C", "EO", "CO", "PD"],
    nature: "Preventif",
    natureExecution: "ITDM (IT Dependent Manual)",
    freq: "Ad-hoc",
    app: "SAP Ariba / E-Procurement",
    affectedFSLI: "Beban Pokok Pendapatan (COGS - Jasa Kontraktor)",
    period: "Jan - Des 2026"
  },
  {
    no: 2,
    process: "Manajemen Persediaan (Inventory)",
    subProcess: "Perhitungan Fisik Stok (Stock Taking)",
    location: "Stockpile Site Palembang",
    risk: "Selisih volume batu bara antara catatan sistem (Weighbridge) dengan kondisi fisik di lapangan tidak terdeteksi, menyebabkan salah saji nilai persediaan akhir.",
    fraud: "T",
    riskRating: "Tinggi",
    controlRef: "INV-MIN-005",
    controlName: "Rekonsiliasi dan Pengukuran Fisik Batu Bara (ROM) Bulanan",
    controlDesc: "Melakukan survei topografi/drone bulanan untuk menghitung volume stockpile. Hasil dibandingkan dengan saldo buku. Selisih > 5% wajib diinvestigasi & disetujui KTT.",
    evidence: "Laporan Survey Drone, Berita Acara Rekonsiliasi Stok",
    keyControl: "Y",
    assertions: ["E", "V", "C"],
    nature: "Detektif",
    natureExecution: "Manual",
    freq: "Bulanan",
    app: "Surpac / MineScape",
    affectedFSLI: "Persediaan Batu Bara",
    period: "Jan - Des 2026"
  }
];

export const MOCK_FINDINGS = [
  {
    process: "Manajemen Persediaan (Inventory)",
    subProcess: "Perhitungan Fisik Stok (Stock Taking)",
    ref: "DEF-2025-INV-01 (Ref Kontrol: INV-MIN-005)",
    controlName: "Rekonsiliasi dan Pengukuran Fisik Batu Bara (ROM) Bulanan",
    title: "Kegagalan Pelaksanaan Pengukuran Fisik (Drone Survey) Bulan November 2025",
    detail: "Pengukuran volume batu bara menggunakan drone tidak dilakukan karena kerusakan alat dan cuaca buruk. Namun, BA Rekonsiliasi tetap diterbitkan menggunakan estimasi tanpa verifikasi fisik.",
    account: "1-3001 Persediaan Batu Bara - ROM Stockpile",
    exposure: 400000000000,
    risk: "Risiko overstatement nilai persediaan karena susut (losses) tidak terdeteksi.",
    type: "Defisiensi Operasi (Operating Deficiency)",
    function: "Logistik & Surveyor",
    owner: "Manager Logistik Site & KTT",
    remediation: "Catch-up pengukuran ulang & pengadaan layanan drone backup.",
    actionPlan: "1. Joint Survey akhir Desember. 2. Kontrak payung vendor surveyor cadangan. 3. Teguran tertulis kepada PIC.",
    status: "YA (Disetujui CFO)"
  }
];

export const MOCK_DOD = [
  {
    ref: "DEF-2025-INV-01",
    desc: "Pengukuran fisik drone stockpile tidak dilakukan pada Nov. Upaya remediasi Des gagal karena cuaca, saldo akhir tahun murni estimasi.",
    remediated: "T",
    period: "2 Bulan (Nov-Des)",
    exposure: 400000000000,
    account: "Persediaan Batu Bara ROM",
    coso: "Control Activities",
    process: "Inventory",
    assertions: ["E/O", "V/A"],
    box1: "Y",
    box2: "Y",
    box3: "Y",
    box4: "N/A",
    box5: "T",
    box6: "N/A",
    box7: "N/A",
    conclusion: "MW (Material Weakness)"
  }
];

export const MOCK_CHANGELOG = [
  {
    no: 1,
    process: "Procurement",
    subProcess: "Award Approval",
    date: "2026-05-01",
    owner: "EVP SCM",
    before: "Approval DoA bergantung pada ketelitian manual atasan.",
    after: "Implementasi Hard-Block di sistem: tender > 100M wajib eskalasi otomatis ke seluruh Direksi.",
    refBefore: "PRC-MIN-012 (v1.0)",
    refAfter: "PRC-MIN-012 (v2.0)",
    effective: "01 Mei 2026"
  }
];
