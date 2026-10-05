import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ChangeLog, User, Deficiency, Control, Settings } from '@shared/types';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Printer, CheckCircle2, History } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import { MOCK_COMPANY } from './mock-regulatory-data';
import { exportRegulatoryTableToExcel } from '@/lib/rcm-excel-export';
import {
  changeLogRegulatoryColumns,
  changeLogRegulatoryFilename,
  mapChangeLogToRegulatoryRow,
  type ChangeLogColumnLabels,
} from '@/lib/changelog-excel-export';

export const ELCReport = () => <Card><CardContent className="p-4">ELC Report Content</CardContent></Card>;
export const TLCReport = () => <Card><CardContent className="p-4">TLC Report Content</CardContent></Card>;
export const ITGCReport = () => <Card><CardContent className="p-4">ITGC Report Content</CardContent></Card>;
export function FindingsReport({ deficiencies = [], controls = [] }: { deficiencies?: any[]; controls?: any[] }) {
  const { t } = useTranslation('reports');
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);

  const col = (key: string, header: string, numeric = false) => ({ key, header, numeric });
  const columns = [
    col('no', t('findings.columns.no', { defaultValue: 'No' }), true),
    col('ref', t('findings.columns.ref', { defaultValue: 'Ref. Temuan' })),
    col('description', t('findings.columns.description', { defaultValue: 'Deskripsi Temuan' })),
    col('control', t('findings.columns.control', { defaultValue: 'Kontrol Terkait' })),
    col('severity', t('findings.columns.severity', { defaultValue: 'Tingkat' })),
    col('exposure', t('findings.columns.exposure', { defaultValue: 'Nilai Eksposur' }), true),
    col('identifiedBy', t('findings.columns.identifiedBy', { defaultValue: 'Ditemukan Oleh' })),
    col('identifiedDate', t('findings.columns.identifiedDate', { defaultValue: 'Tanggal Temuan' })),
    col('source', t('findings.columns.source', { defaultValue: 'Sumber' })),
    col('status', t('findings.columns.status', { defaultValue: 'Status' })),
  ];

  const handleExportExcel = async () => {
    if (deficiencies.length === 0 || isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const { exportRegulatoryTableToExcel } = await import('@/lib/rcm-excel-export');
      const { mapFindingsRows, resolveFindingControlName, findingsFilename } = await import('@/lib/findings-excel-export');
      const rows = mapFindingsRows(deficiencies, (d) => resolveFindingControlName(d, controls));
      await exportRegulatoryTableToExcel(rows, {
        title: t('findings.title', { defaultValue: 'LAMPIRAN 9' }),
        subtitle: t('findings.subtitle', { defaultValue: '' }),
        identityLines: [MOCK_COMPANY, String(new Date().getFullYear())],
        columns,
        filename: findingsFilename(new Date().getFullYear()),
        sheetName: t('findings.title', { defaultValue: 'Lampiran 9' }),
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const severityBadge = (severity: string) => {
    if (severity === 'Material Weakness') {
      return <Badge className="bg-red-50 text-red-700 border-red-300 font-semibold text-xs rounded-md">MW</Badge>;
    }
    if (severity === 'Significant Deficiency') {
      return <Badge className="bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs rounded-md">SD</Badge>;
    }
    return <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-semibold text-xs rounded-md">CD</Badge>;
  };

  return (
    <Card className="border border-border shadow-sm rounded-lg bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="space-y-1 min-w-0">
            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-primary border-primary">
              {t('findings.title', { defaultValue: 'LAMPIRAN 9' })}
            </Badge>
            <p className="text-xs font-semibold text-muted-foreground">
              {t('findings.subtitle', { defaultValue: 'FORMAT DAFTAR TEMUAN' })} — {MOCK_COMPANY}
            </p>
          </div>
          <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={isExportingExcel || deficiencies.length === 0} className="min-h-[44px] text-xs font-bold w-full min-[420px]:w-auto justify-center">
              {isExportingExcel ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              {t('findings.exportExcel', { defaultValue: 'Ekspor Excel' })}
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="min-h-[44px] text-xs font-bold w-full min-[420px]:w-auto justify-center">
              <Printer className="h-3.5 w-3.5 mr-1.5" /> {t('findings.print', { defaultValue: 'Cetak' })}
            </Button>
          </div>
        </div>

        <MobileDesktopBanner recordCount={deficiencies.length} />

        <div className="block md:hidden space-y-3">
          {deficiencies.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground font-medium">
              {t('findings.empty', { defaultValue: 'Belum ada data temuan.' })}
            </p>
          ) : (
            deficiencies.map((d: any, index: number) => (
              <div key={d.id || index} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold">{d.id || `DEF-${String(index + 1).padStart(3, '0')}`}</span>
                  {severityBadge(d.severity)}
                </div>
                <p className="mt-2 text-xs text-foreground leading-relaxed">{d.description || '-'}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>{d.status || '-'}</span>
                  <span className="font-mono">{typeof d.exposureValue === 'number' ? new Intl.NumberFormat('id-ID').format(d.exposureValue) : '-'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block rounded-lg border overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint bg-white">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-slate-50 border-b">
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key} className="text-xs font-semibold uppercase py-2 text-slate-800">{c.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {deficiencies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8 text-slate-500 font-medium text-xs">
                    {t('findings.empty', { defaultValue: 'Belum ada data temuan.' })}
                  </TableCell>
                </TableRow>
              ) : (
                deficiencies.map((d: any, index: number) => {
                  const match = controls.find((c: any) => (d.controlId && c.id === d.controlId) || (d.controlCode && c.code === d.controlCode));
                  return (
                    <TableRow key={d.id || index} className="border-b hover:bg-slate-50/50">
                      <TableCell className="text-center text-xs text-slate-500">{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs font-bold">{d.id || `DEF-${String(index + 1).padStart(3, '0')}`}</TableCell>
                      <TableCell className="text-xs max-w-[280px]">{d.description || '-'}</TableCell>
                      <TableCell className="text-xs text-slate-600">{match ? `${match.code || ''} - ${match.name || ''}` : (d.controlName || d.controlCode || '-')}</TableCell>
                      <TableCell className="text-center">{severityBadge(d.severity)}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {typeof d.exposureValue === 'number' ? new Intl.NumberFormat('id-ID').format(d.exposureValue) : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">{d.identifiedBy || '-'}</TableCell>
                      <TableCell className="text-xs font-mono text-slate-500">{d.identifiedDate ? format(d.identifiedDate, 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell className="text-xs text-slate-600">{d.source || '-'}</TableCell>
                      <TableCell className="text-xs">{d.status || '-'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
export { DoDLampiran10Report, DoDLampiran10Report as DoDReport } from './DoDLampiran10Report';

export function ChangeLogReport() {
  const { t } = useTranslation(['reports', 'common']);
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const [showFullTable, setShowFullTable] = React.useState(false);
  const { data: logs, isLoading } = useQuery({
    queryKey: ['regulatory-change-logs'],
    queryFn: async () => {
      const res = await api<{ items: ChangeLog[] }>('/api/change-logs?isRegulatory=true');
      return res.items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api<{ items: User[] }>('/api/users')
  });

  const getUserName = (id?: string) => users?.items.find(u => u.id === id)?.name || id || "-";

  const getRowMetadata = (log: ChangeLog) => {
    const dataBefore = log.dataBefore as any;
    const dataAfter = log.dataAfter as any;
    
    const process = dataAfter?.process || dataBefore?.process || "-";
    const subProcess = dataAfter?.subProcess || dataBefore?.subProcess || "-";
    const descBefore = dataBefore?.controlDescription || dataBefore?.riskDescription || log.descriptionBefore || "-";
    const descAfter = dataAfter?.controlDescription || dataAfter?.riskDescription || log.descriptionAfter || "-";
    const refBefore = dataBefore?.controlId || dataBefore?.id || "-";
    const refAfter = dataAfter?.controlId || dataAfter?.id || "-";
    const owner = dataAfter?.executingFunction || dataAfter?.executorRole || dataBefore?.executingFunction || "-";

    return { process, subProcess, descBefore, descAfter, refBefore, refAfter, owner };
  };

  const getColumnLabels = (): ChangeLogColumnLabels => ({
    no: t('changeLog.columns.no', { defaultValue: 'No (i)' }),
    company: t('changeLog.columns.company', { defaultValue: 'Perusahaan (ii)' }),
    process: t('changeLog.columns.process', { defaultValue: 'Proses Bisnis (iii)' }),
    subProcess: t('changeLog.columns.subProcess', { defaultValue: 'Sub-Proses (iv)' }),
    reportDate: t('changeLog.columns.reportDate', { defaultValue: 'Tanggal Laporan (v)' }),
    owner: t('changeLog.columns.owner', { defaultValue: 'Pemilik Pengendalian (vi)' }),
    descBefore: t('changeLog.columns.descBefore', { defaultValue: 'Deskripsi Sebelum (vii)' }),
    descAfter: t('changeLog.columns.descAfter', { defaultValue: 'Deskripsi Setelah (viii)' }),
    refBefore: t('changeLog.columns.refBefore', { defaultValue: 'Referensi Sebelum (ix)' }),
    refAfter: t('changeLog.columns.refAfter', { defaultValue: 'Referensi Setelah (x)' }),
    effectiveDate: t('changeLog.columns.effectiveDate', { defaultValue: 'Tanggal Efektif (xi)' }),
    preparer: t('changeLog.columns.preparer', { defaultValue: 'Penyusun (Lini 1)' }),
    approver: t('changeLog.columns.approver', { defaultValue: 'Penyetuju (Lini 2)' }),
  });

  const handleExportExcel = async () => {
    if (!logs || logs.length === 0 || isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const rows = logs.map((log, index) =>
        mapChangeLogToRegulatoryRow(log, index, 'PT Bukit Asam Tbk', (id) => getUserName(id ?? undefined)),
      );
      await exportRegulatoryTableToExcel(rows, {
        title: t('changeLog.title', { defaultValue: 'LAMPIRAN 6' }),
        subtitle: t('changeLog.subtitle', { defaultValue: '' }),
        identityLines: ['PT Bukit Asam Tbk', String(new Date().getFullYear())],
        columns: changeLogRegulatoryColumns(getColumnLabels()),
        filename: changeLogRegulatoryFilename(),
        sheetName: t('changeLog.title', { defaultValue: 'Lampiran 6' }),
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm font-medium">{t('changeLog.loading')}</p>
      </div>
    );
  }

  const latestApprover = logs?.[0]?.approvedBy ? getUserName(logs[0].approvedBy) : null;
  const latestPreparer = logs?.[0]?.userId ? getUserName(logs[0].userId) : null;

  return (
    <Card className="border-slate-200 shadow-sm print:shadow-none print:border-none">
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 no-print border-b pb-4">
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-600" />
              {t('changeLog.title')}
            </h3>
            <p className="text-xs text-muted-foreground">{t('changeLog.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={isExportingExcel} className="min-h-[44px] text-xs font-bold text-slate-700 bg-white">
              {isExportingExcel ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5 text-slate-500" />} {t('changeLog.exportExcel')}
            </Button>
                        <Button size="sm" variant="outline" onClick={() => window.print()} className="min-h-[44px] text-xs font-bold text-slate-700 bg-white">
              <Printer className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> {t('changeLog.printA4')}
            </Button>
          </div>
        </div>

        <MobileDesktopBanner recordCount={logs?.length ?? 0} />

        {/* Printable Header */}
        <div className="hidden print:block text-center space-y-2 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider">LAMPIRAN 6</h2>
          <h3 className="text-xs font-bold uppercase">ILUSTRASI DOKUMENTASI LOG PERUBAHAN PROSES BISNIS DAN PENGENDALIAN ATAS PELAPORAN KEUANGAN</h3>
          <p className="text-xs text-slate-500">PT BUKIT ASAM TBK - TAHUN {new Date().getFullYear()}</p>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="md:hidden space-y-3" data-testid="changelog-mobile-cards">
          {(logs ?? []).slice(0, 10).map((log, index) => {
            const meta = getRowMetadata(log);
            return (
              <div key={log.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-1.5 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">#{index + 1} · {meta.refAfter}</span>
                  <span className="text-xs font-medium text-slate-500">{log.effectiveDate ? format(log.effectiveDate, 'dd/MM/yyyy') : '-'}</span>
                </div>
                <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{meta.process} · {meta.subProcess}</p>
                <p className="text-xs text-slate-500 leading-snug line-clamp-2">{meta.descAfter}</p>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFullTable((v) => !v)}
            aria-expanded={showFullTable}
            className="w-full min-h-[44px] text-xs font-bold gap-2 bg-white"
          >
            {showFullTable ? t('common:mobile.hideFullTable', { defaultValue: 'Sembunyikan Tabel Penuh' }) : t('common:mobile.showFullTable', { defaultValue: 'Lihat Tabel Penuh' })}
          </Button>
        </div>
        <div className={`rounded-lg border bg-white max-w-full overflow-x-auto touch-pan-x overscroll-x-contain table-scroll-hint ${showFullTable ? 'block' : 'hidden'} md:block print:block`}>
          <Table className="min-w-[1200px] print:min-w-0 print:w-full print:text-xs">
            <TableHeader className="bg-slate-50 border-b print:bg-transparent">
              <TableRow>
                <TableHead className="w-[50px] text-xs font-semibold uppercase py-2 text-center text-slate-800">No (i)</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">Perusahaan (ii)</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">Proses Bisnis (iii)</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">Sub-Proses (iv)</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">Tanggal Laporan (v)</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">Pemilik (vi)</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">Deskripsi Sebelum (vii)</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">Deskripsi Setelah (viii)</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-center text-slate-800">Ref Sebelum (ix)</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-center text-slate-800">Ref Setelah (x)</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">Tgl Efektif (xi)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!logs || logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-slate-500 font-medium text-xs">
                    {t('changeLog.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, index) => {
                  const meta = getRowMetadata(log);
                  return (
                    <TableRow key={log.id} className="border-b hover:bg-slate-50/50 transition-colors print:border-slate-300">
                      <TableCell className="text-center font-medium text-xs text-slate-500 py-2.5 print:py-1">{index + 1}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700 py-2.5 print:py-1">PT Bukit Asam Tbk</TableCell>
                      <TableCell className="text-xs text-slate-600 py-2.5 print:py-1">{meta.process}</TableCell>
                      <TableCell className="text-xs text-slate-600 py-2.5 print:py-1">{meta.subProcess}</TableCell>
                      <TableCell className="py-2.5 print:py-1 font-mono text-xs text-slate-500">
                        {log.timestamp ? format(log.timestamp, 'dd/MM/yyyy HH:mm') : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 py-2.5 print:py-1 font-medium">{meta.owner}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs text-slate-500 py-2.5 print:py-1" title={meta.descBefore}>{meta.descBefore}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs text-slate-800 py-2.5 print:py-1 font-medium" title={meta.descAfter}>{meta.descAfter}</TableCell>
                      <TableCell className="text-center text-xs font-mono text-slate-500 py-2.5 print:py-1">{meta.refBefore}</TableCell>
                      <TableCell className="text-center text-xs font-mono text-slate-800 py-2.5 print:py-1 font-semibold">{meta.refAfter}</TableCell>
                      <TableCell className="py-2.5 print:py-1">
                        <span className="text-xs font-semibold text-indigo-600">
                          {log.effectiveDate ? format(log.effectiveDate, 'dd/MM/yyyy') : "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Digital Sign-off Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 pt-6 sm:pt-8 max-w-2xl mx-auto print:pt-4 print:max-w-full">
          <div className="border rounded-lg p-4 bg-slate-50 flex flex-col items-center justify-between text-center min-h-[140px] print:border-slate-300 print:bg-transparent print:p-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disetujui oleh:</span>
            <div className="flex flex-col items-center gap-1 my-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 print:h-4 print:w-4" />
              <span className="text-xs font-bold text-slate-800">{latestPreparer || "Pemilik Pengendalian"}</span>
              <span className="text-xs text-slate-500">Lini Pertama (Control Owner)</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Signed & Verified Digitally</span>
          </div>

          <div className="border rounded-lg p-4 bg-slate-50 flex flex-col items-center justify-between text-center min-h-[140px] print:border-slate-300 print:bg-transparent print:p-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Diketahui oleh:</span>
            <div className="flex flex-col items-center gap-1 my-2">
              <CheckCircle2 className="h-6 w-6 text-indigo-600 print:h-4 print:w-4" />
              <span className="text-xs font-bold text-slate-800">{latestApprover || "Fungsi ICOFR"}</span>
              <span className="text-xs text-slate-500">Lini Kedua (Fungsi ICOFR)</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Approved & Validated Digitally</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const CSADocReport = () => <Card><CardContent className="p-4">CSA Doc Report Content</CardContent></Card>;
export function Lampiran11Report({ deficiencies = [], controls = [] }: { deficiencies?: Deficiency[]; controls?: Control[] }) {
  const { t } = useTranslation('reports');
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const { data: settings } = useQuery({
    queryKey: ['report-settings-lamp11'],
    queryFn: () => api<Settings>('/api/settings'),
  });

  const items = deficiencies;
  const mwCount = items.filter((d) => d.severity === 'Material Weakness').length;
  const sdCount = items.filter((d) => d.severity === 'Significant Deficiency').length;
  const cdCount = items.filter((d) => d.severity === 'Control Deficiency').length;
  const isEffective = mwCount === 0;
  const significant = items.filter((d) => d.severity !== 'Control Deficiency');
  const isSigned = Boolean((settings as any)?.isPeriodLocked);
  const aggregateLine = `CD: ${cdCount} | SD: ${sdCount} | MW: ${mwCount} | Total: ${items.length}`;
  const conclusionLine = isEffective
    ? t('assessment.conclusionEffective', { defaultValue: 'Kesimpulan: Efektif' })
    : t('assessment.conclusionIneffective', { defaultValue: 'Kesimpulan: Tidak Efektif' });

  const handleExportExcel = async () => {
    if (isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      const { exportRegulatoryTableToExcel } = await import('@/lib/rcm-excel-export');
      const rows = significant.map((d, index) => ({
        no: index + 1,
        ref: d.id || `DEF-${String(index + 1).padStart(3, '0')}`,
        description: d.description || '-',
        severity: d.severity || '-',
        exposure: typeof d.exposureValue === 'number' ? d.exposureValue : '-',
        status: d.status || '-',
      }));
      await exportRegulatoryTableToExcel(rows, {
        title: t('assessment.title', { defaultValue: 'LAMPIRAN 11' }),
        subtitle: t('assessment.subtitle', { defaultValue: '' }),
        identityLines: [
          MOCK_COMPANY,
          String(new Date().getFullYear()),
          conclusionLine,
          aggregateLine,
          isSigned
            ? t('assessment.periodFinalized', { defaultValue: 'FINAL' })
            : t('assessment.awaitingSign', { defaultValue: 'DRAFT' }),
        ],
        columns: [
          { key: 'no', header: t('findings.columns.no', { defaultValue: 'No' }), numeric: true },
          { key: 'ref', header: t('findings.columns.ref', { defaultValue: 'Ref. Temuan' }) },
          { key: 'description', header: t('findings.columns.description', { defaultValue: 'Deskripsi' }) },
          { key: 'severity', header: t('findings.columns.severity', { defaultValue: 'Tingkat' }) },
          { key: 'exposure', header: t('findings.columns.exposure', { defaultValue: 'Nilai Eksposur' }), numeric: true },
          { key: 'status', header: t('findings.columns.status', { defaultValue: 'Status' }) },
        ],
        filename: `Lampiran_11_Asesmen_Manajemen_${new Date().getFullYear()}.xlsx`,
        sheetName: t('assessment.title', { defaultValue: 'Lampiran 11' }),
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <Card className="border border-border shadow-sm rounded-lg bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-primary border-primary">
                {t('assessment.subtitle', { defaultValue: 'LAMPIRAN 11' })}
              </Badge>
              {isSigned ? (
                <Badge className="bg-indigo-600 text-white text-xs font-bold gap-1 border-none">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t('assessment.periodFinalized')}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs font-semibold text-amber-700 border-amber-300 bg-amber-50">
                  {t('assessment.awaitingSign')}
                </Badge>
              )}
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              {t('assessment.title', { defaultValue: 'Asesmen Manajemen' })} — {MOCK_COMPANY}
            </p>
          </div>
          <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={isExportingExcel} className="min-h-[44px] text-xs font-bold w-full min-[420px]:w-auto justify-center">
              {isExportingExcel ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              {t('assessment.exportExcel', { defaultValue: 'Ekspor Excel' })}
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="min-h-[44px] text-xs font-bold w-full min-[420px]:w-auto justify-center">
              <Printer className="h-3.5 w-3.5 mr-1.5" /> {t('changeLog.printA4', { defaultValue: 'Cetak' })}
            </Button>
          </div>
        </div>

        <div className={`p-4 rounded-lg border text-center ${isEffective ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <p className={`font-bold uppercase tracking-wide text-xs ${isEffective ? 'text-emerald-800' : 'text-rose-800'}`}>{conclusionLine}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">{aggregateLine}</p>
        </div>

        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('dodReport.summary.controlDeficiency', { defaultValue: 'CD' }), value: cdCount, tone: 'bg-slate-50 border-slate-200 text-slate-800' },
            { label: t('dodReport.summary.significantDeficiency', { defaultValue: 'SD' }), value: sdCount, tone: 'bg-amber-50 border-amber-200 text-amber-800' },
            { label: t('dodReport.summary.materialWeakness', { defaultValue: 'MW' }), value: mwCount, tone: 'bg-red-50 border-red-200 text-red-800' },
            { label: t('dodReport.summary.totalEvaluated', { defaultValue: 'Total' }), value: items.length, tone: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
          ].map((c) => (
            <div key={c.label} className={`p-3 rounded-lg border ${c.tone}`}>
              <div className="text-xs font-semibold uppercase">{c.label}</div>
              <div className="text-lg font-bold mt-1">{c.value}</div>
            </div>
          ))}
        </div>

        <MobileDesktopBanner recordCount={significant.length} />

        <div className="block md:hidden space-y-3">
          {significant.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground font-medium">
              {t('assessment.noDeficiencies')}
            </p>
          ) : (
            significant.map((d, index) => (
              <div key={d.id || index} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold">{d.id || `DEF-${String(index + 1).padStart(3, '0')}`}</span>
                  <Badge variant="outline" className={d.severity === 'Material Weakness'
                    ? 'bg-red-50 text-red-700 border-red-300 font-semibold text-xs rounded-md shrink-0'
                    : 'bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs rounded-md shrink-0'}>
                    {d.severity === 'Material Weakness' ? 'MW' : 'SD'}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-foreground leading-relaxed">{d.description || '-'}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>{d.status || '-'}</span>
                  <span className="font-mono">{typeof d.exposureValue === 'number' ? new Intl.NumberFormat('id-ID').format(d.exposureValue) : '-'}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block rounded-lg border overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint bg-white">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-slate-50 border-b">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">{t('findings.columns.no')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">{t('findings.columns.ref')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">{t('findings.columns.description')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">{t('findings.columns.severity')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800 text-right">{t('findings.columns.exposure')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase py-2 text-slate-800">{t('findings.columns.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {significant.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500 font-medium text-xs">
                    {t('assessment.noDeficiencies')}
                  </TableCell>
                </TableRow>
              ) : (
                significant.map((d, index) => (
                  <TableRow key={d.id || index} className="border-b hover:bg-slate-50/50">
                    <TableCell className="text-center text-xs text-slate-500">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs font-bold">{d.id || `DEF-${String(index + 1).padStart(3, '0')}`}</TableCell>
                    <TableCell className="text-xs max-w-[320px]">{d.description || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={d.severity === 'Material Weakness'
                        ? 'bg-red-50 text-red-700 border-red-300 font-semibold text-xs rounded-md'
                        : 'bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs rounded-md'}>
                        {d.severity === 'Material Weakness' ? 'MW' : 'SD'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {typeof d.exposureValue === 'number' ? new Intl.NumberFormat('id-ID').format(d.exposureValue) : '-'}
                    </TableCell>
                    <TableCell className="text-xs">{d.status || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
