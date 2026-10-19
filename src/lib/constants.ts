import { ControlFrequency, ITGCArea } from '@shared/types';

export const ALL_FREQUENCIES: ControlFrequency[] = [
  "Annual", 
  "Semi-Annual", 
  "Quarterly", 
  "Monthly", 
  "Weekly", 
  "Daily", 
  "Ad-hoc"
];

export const ALL_COSO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export const ITGC_AREAS: ITGCArea[] = [
  "Access to Program and Data", 
  "Program Development", 
  "Program Changes", 
  "Computer Operations"
];

export const CONTROL_NATURES = [
  { value: 'Manual', label: 'Manual' },
  { value: 'Automated', label: 'Otomatis' },
  { value: 'ITDM - IPE', label: 'ITDM - IPE (Report)' },
  { value: 'ITDM - EUC', label: 'ITDM - EUC (Spreadsheet)' },
  { value: 'MRC', label: 'MRC (Management Review)' }
];

export const AUTOMATED_SUB_NATURES = [
  "Automated Control", 
  "Automated Calculation", 
  "Restricted Access", 
  "Interface"
];

export const COSO_PRINCIPLES = [
  { id: 1, name: "Integritas dan Nilai Etika", component: "Lingkungan Pengendalian" },
  { id: 2, name: "Pengawasan Dewan Komisaris", component: "Lingkungan Pengendalian" },
  { id: 3, name: "Struktur, Wewenang & Tanggung Jawab", component: "Lingkungan Pengendalian" },
  { id: 4, name: "Komitmen terhadap Kompetensi", component: "Lingkungan Pengendalian" },
  { id: 5, name: "Akuntabilitas Personel", component: "Lingkungan Pengendalian" },
  { id: 6, name: "Tujuan Pengendalian Intern", component: "Penilaian Risiko" },
  { id: 7, name: "Identifikasi & Analisis Risiko", component: "Penilaian Risiko" },
  { id: 8, name: "Risiko Kecurangan (Fraud)", component: "Penilaian Risiko" },
  { id: 9, name: "Analisis Perubahan Signifikan", component: "Penilaian Risiko" },
  { id: 10, name: "Menentukan Aktivitas Pengendalian", component: "Aktivitas Pengendalian" },
  { id: 11, name: "Pengendalian Umum TI (ITGC)", component: "Aktivitas Pengendalian" },
  { id: 12, name: "Kebijakan dan Prosedur", component: "Aktivitas Pengendalian" },
  { id: 13, name: "Informasi Relevan & Berkualitas", component: "Informasi dan Komunikasi" },
  { id: 14, name: "Komunikasi Internal Efektif", component: "Informasi dan Komunikasi" },
  { id: 15, name: "Komunikasi Eksternal Efektif", component: "Informasi dan Komunikasi" },
  { id: 16, name: "Evaluasi Berkelanjutan & Terpisah", component: "Pemantauan" },
  { id: 17, name: "Evaluasi & Komunikasi Defisiensi", component: "Pemantauan" },
];
