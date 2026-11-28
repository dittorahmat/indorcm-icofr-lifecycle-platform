import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ChangeLog, User } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Printer, CheckCircle2, History } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import { useExcelExport } from '@/lib/useExcelExport';
import {
  changeLogRegulatoryColumns,
  changeLogRegulatoryFilename,
  mapChangeLogToRegulatoryRow,
  type ChangeLogColumnLabels,
} from '@/lib/changelog-excel-export';
import { changeLogRowMeta, sortChangeLogsDesc } from './changelog-helpers';
import { generateLampiran6Pdf } from '@/lib/pdf/lampiran6-9-pdf-export';

export function ChangeLogReport() {
  const { t } = useTranslation(['reports', 'common']);
  const { isExporting: isExportingExcel, exportNow } = useExcelExport<ChangeLog>();
  const [showFullTable, setShowFullTable] = React.useState(false);
  const { data: logs, isLoading } = useQuery({
    queryKey: ['regulatory-change-logs'],
    queryFn: async () => {
      const res = await api<{ items: ChangeLog[] }>('/api/change-logs?isRegulatory=true');
      return sortChangeLogsDesc(res.items);
    }
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api<{ items: User[] }>('/api/users')
  });

  const getUserName = (id?: string) => users?.items.find(u => u.id === id)?.name || id || "-";

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
    if (!logs || logs.length === 0) return;
    const { exportRegulatoryTableToExcel } = await import('@/lib/rcm-excel-export');
    await exportNow({
      rows: logs,
      filename: changeLogRegulatoryFilename(),
      sheetName: t('changeLog.title', { defaultValue: 'Lampiran 6' }),
      exportFn: (rows, { filename, sheetName }) => {
        const mapped = rows.map((log, index) =>
          mapChangeLogToRegulatoryRow(log, index, 'PT Bukit Asam Tbk', (id) => getUserName(id ?? undefined)),
        );
        return exportRegulatoryTableToExcel(mapped, {
          title: t('changeLog.title', { defaultValue: 'LAMPIRAN 6' }),
          subtitle: t('changeLog.subtitle', { defaultValue: '' }),
          identityLines: ['PT Bukit Asam Tbk', String(new Date().getFullYear())],
          columns: changeLogRegulatoryColumns(getColumnLabels()),
          filename,
          sheetName,
          signoffs: [
            { roleTitle: 'Pemohon Perubahan (Lini 1)', name: 'Pemilik Proses / Pengendalian', title: 'Process Owner', date: format(new Date(), 'yyyy-MM-dd'), isSigned: true },
            { roleTitle: 'Penyetuju Perubahan (Lini 2)', name: 'Tim Kepatuhan ICOFR', title: 'ICOFR Compliance Lead', date: format(new Date(), 'yyyy-MM-dd'), isSigned: true },
          ],
        });
      },
    });
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
                        <Button size="sm" variant="outline" onClick={() => {
              const doc = generateLampiran6Pdf({
                logs: logs || [],
                fiscalYear: new Date().getFullYear(),
                getUserName,
              });
              doc.save(`Lampiran_6_Catatan_Perubahan_${new Date().getFullYear()}.pdf`);
            }} className="min-h-[44px] text-xs font-bold text-slate-700 bg-white">
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
            const meta = changeLogRowMeta(log);
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
            <TableHeader className="print:bg-transparent">
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
                  const meta = changeLogRowMeta(log);
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
