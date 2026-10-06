import type { RCMType } from './smart-import-types';

export const RCM_TEMPLATE_CSV: Record<RCMType, string> = {
  TLC: 'No;Informasi_Proses_Bisnis;Informasi_Sub_proses_Bisnis;Perusahaan_Pelaksana_Proses_Bisnis;Lokasi_Dilaksanakannya_Proses_Bisnis;Risiko_Aktivitas_Pengendalian;Risiko_Terkait_Fraud;Penilaian_Risiko;Referensi_Pengendalian;Nama_Aktivitas_Pengendalian;Deskripsi_Aktivitas_Pengendalian;Dokumen_Pendukung;Pengendalian_Utama;IPO_C;IPO_A;IPO_V;IPO_RA;Asersi_C;Asersi_A;Asersi_E_O;Asersi_CO;Asersi_R_O;Asersi_V_A;Asersi_PD;Preventif_Detektif;Sifat_Pelaksanaan_Pengendalian;Jenis_Pengendalian_Otomatis;Frekuensi_Pelaksanaan_Aktivitas;Aplikasi_Pendukung;Fungsi_Pelaksana_Aktivitas;Pelaku_Pengendalian;Item_Laporan_Keuangan_yang_Terdampak;Periode_Efektif',
  ELC: 'Referensi_Pengendalian;Aktivitas_Pengendalian;Frekuensi_Pengendalian;Dokumen_Pengendalian;Fungsi_Pelaksana_Aktivitas_Pengendalian;Pelaku_Pengendalian;Periode_Efektif;Prinsip_COSO',
  ITGC: 'No;Informasi_Proses_Bisnis;Informasi_Sub_proses_Bisnis;Perusahaan_Pelaksana_Proses_Bisnis;Lokasi_Dilaksanakannya_Proses_Bisnis;Risiko_Aktivitas_Pengendalian;Referensi_Pengendalian;Nama_Aktivitas_Pengendalian;Deskripsi_Aktivitas_Pengendalian;Dokumen_Pendukung;Pengendalian_Utama;Preventif_Detektif;Sifat_Pelaksanaan_Pengendalian;Jenis_Pengendalian_Otomatis;Frekuensi_Pelaksanaan_Aktivitas;Aplikasi_Pendukung;Fungsi_Pelaksana_Aktivitas;Pelaku_Pengendalian;Periode_Efektif',
};

export function templateFilename(rcmType: RCMType): string {
  return `Template_RCM_${rcmType}.csv`;
}

export function downloadTemplate(rcmType: RCMType): void {
  const content = RCM_TEMPLATE_CSV[rcmType];
  const blob = new Blob([content], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.setAttribute('hidden', '');
  anchor.setAttribute('href', url);
  anchor.setAttribute('download', templateFilename(rcmType));
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
