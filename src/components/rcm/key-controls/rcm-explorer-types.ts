import type { BUMNCluster } from '@shared/types';

export interface BUMNClusterOption {
  id: BUMNCluster;
  nameKey: string;
  defaultName: string;
  code: string;
}

export const BUMN_CLUSTER_LIST: readonly BUMNClusterOption[] = [
  { id: 'Umum', nameKey: 'explorer.clusters.umum', defaultName: 'Umum / Lintas Sektor', code: 'UMUM' },
  { id: 'Industri Energi', nameKey: 'explorer.clusters.energi', defaultName: 'Industri Energi & Migas', code: 'ENRG' },
  { id: 'Industri Pangan dan Pupuk', nameKey: 'explorer.clusters.pangan', defaultName: 'Industri Pangan & Pupuk', code: 'PANG' },
  { id: 'Jasa Keuangan', nameKey: 'explorer.clusters.keuangan', defaultName: 'Jasa Keuangan & Perbankan', code: 'KEUG' },
  { id: 'Industri Mineral dan Batubara', nameKey: 'explorer.clusters.minerba', defaultName: 'Industri Mineral & Batubara', code: 'MNRB' },
  { id: 'Jasa Telekomunikasi dan Media', nameKey: 'explorer.clusters.telekomunikasi', defaultName: 'Jasa Telekomunikasi & Media', code: 'TELK' },
  { id: 'Jasa Infrastruktur', nameKey: 'explorer.clusters.infrastruktur', defaultName: 'Jasa Infrastruktur & Karya', code: 'INFR' },
  { id: 'Jasa Asuransi dan Dana Pensiun', nameKey: 'explorer.clusters.asuransi', defaultName: 'Jasa Asuransi & Dana Pensiun', code: 'ASUR' },
  { id: 'Jasa Pariwisata dan Pendukung', nameKey: 'explorer.clusters.pariwisata', defaultName: 'Jasa Pariwisata & Pendukung', code: 'PARI' },
  { id: 'Industri Perkebunan dan Kehutanan', nameKey: 'explorer.clusters.perkebunan', defaultName: 'Industri Perkebunan & Kehutanan', code: 'BUNH' },
  { id: 'Jasa Logistik', nameKey: 'explorer.clusters.logistik', defaultName: 'Jasa Logistik & Transportasi', code: 'LOGI' },
] as const;

export type MitigationPillar =
  | 'ALL'
  | 'pilarObjective'
  | 'pilarTiming'
  | 'pilarAuthority'
  | 'pilarReliability'
  | 'pilarCoverage'
  | 'pilarEvidence';

export interface MitigationPillarOption {
  id: MitigationPillar;
  labelKey: string;
  defaultLabel: string;
  field?: 'pilarObjective' | 'pilarTiming' | 'pilarAuthority' | 'pilarReliability' | 'pilarCoverage' | 'pilarEvidence';
}

export const MITIGATION_PILLARS: readonly MitigationPillarOption[] = [
  { id: 'ALL', labelKey: 'explorer.pillars.all', defaultLabel: 'Semua 6 Pilar' },
  { id: 'pilarObjective', labelKey: 'verification.columns.p_obj', defaultLabel: 'Pencapaian Objektif', field: 'pilarObjective' },
  { id: 'pilarTiming', labelKey: 'verification.columns.p_time', defaultLabel: 'Ketepatan Waktu', field: 'pilarTiming' },
  { id: 'pilarAuthority', labelKey: 'verification.columns.p_auth', defaultLabel: 'Wewenang & Kompetensi', field: 'pilarAuthority' },
  { id: 'pilarReliability', labelKey: 'verification.columns.p_rel', defaultLabel: 'Keandalan Informasi', field: 'pilarReliability' },
  { id: 'pilarCoverage', labelKey: 'verification.columns.p_cov', defaultLabel: 'Periode Cakupan', field: 'pilarCoverage' },
  { id: 'pilarEvidence', labelKey: 'verification.columns.p_evid', defaultLabel: 'Bukti yang Tersedia', field: 'pilarEvidence' },
] as const;

export type BusinessCycleCode = 'ALL' | 'O2C' | 'P2P' | 'R2R' | 'FAM' | 'ITGC' | 'TRE' | 'INV';

export interface BusinessCycleOption {
  code: BusinessCycleCode;
  num: string;
  name: string;
  sub: string;
}

export const BUSINESS_CYCLES: readonly BusinessCycleOption[] = [
  { code: 'ALL', num: '00', name: 'Semua', sub: 'Semua Siklus' },
  { code: 'O2C', num: '01', name: 'O2C', sub: 'Order to Cash' },
  { code: 'P2P', num: '02', name: 'P2P', sub: 'Procure to Pay' },
  { code: 'R2R', num: '03', name: 'R2R', sub: 'Record to Report' },
  { code: 'FAM', num: '04', name: 'FAM', sub: 'Fixed Assets Mgt' },
  { code: 'ITGC', num: '05', name: 'ITGC', sub: 'IT General Controls' },
  { code: 'TRE', num: '06', name: 'TRE', sub: 'Treasury & Cash' },
  { code: 'INV', num: '07', name: 'INV', sub: 'Inventory Management' },
] as const;
