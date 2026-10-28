import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import { MOCK_COMPANY } from '../mock-regulatory-data';
import { useExcelExport } from '@/lib/useExcelExport';
import type { FindingControlRef, FindingExportRow } from '@/lib/findings-excel-export';
import { findingsColumns, findingsFilename } from '@/lib/findings-excel-export';
import { findingRowId, formatExposureValue, resolveFindingControlName } from './findings-helpers';
import { ReportSeverityBadge } from './severity-badge';
import { generateLampiran9Pdf } from '@/lib/pdf/lampiran6-9-pdf-export';

export type FindingRow = FindingExportRow;

interface FindingsReportProps {
  deficiencies?: FindingExportRow[];
  controls?: FindingControlRef[];
}

export function FindingsReport({ deficiencies = [], controls = [] }: FindingsReportProps) {
  const { t } = useTranslation('reports');
  const { isExporting: isExportingExcel, exportNow } = useExcelExport<FindingExportRow>();

  const columns = findingsColumns({
    no: t('findings.columns.no', { defaultValue: 'No' }),
    ref: t('findings.columns.ref', { defaultValue: 'Ref. Temuan' }),
    description: t('findings.columns.description', { defaultValue: 'Deskripsi Temuan' }),
    control: t('findings.columns.control', { defaultValue: 'Kontrol Terkait' }),
    severity: t('findings.columns.severity', { defaultValue: 'Tingkat' }),
    exposure: t('findings.columns.exposure', { defaultValue: 'Nilai Eksposur' }),
    identifiedBy: t('findings.columns.identifiedBy', { defaultValue: 'Ditemukan Oleh' }),
    identifiedDate: t('findings.columns.identifiedDate', { defaultValue: 'Tanggal Temuan' }),
    source: t('findings.columns.source', { defaultValue: 'Sumber' }),
    status: t('findings.columns.status', { defaultValue: 'Status' }),
  });

  const handleExportExcel = async () => {
    if (deficiencies.length === 0) return;
    await exportNow({
      rows: deficiencies,
      filename: findingsFilename(new Date().getFullYear()),
      sheetName: t('findings.title', { defaultValue: 'Lampiran 9' }),
      exportFn: async (rows) => {
        const { exportRegulatoryTableToExcel } = await import('@/lib/rcm-excel-export');
        const { mapFindingsRows, resolveFindingControlName } = await import('@/lib/findings-excel-export');
        const mapped = mapFindingsRows(rows as FindingRow[], (d) => resolveFindingControlName(d, controls));
        await exportRegulatoryTableToExcel(mapped, {
          title: t('findings.title', { defaultValue: 'LAMPIRAN 9' }),
          subtitle: t('findings.subtitle', { defaultValue: '' }),
          identityLines: [MOCK_COMPANY, String(new Date().getFullYear())],
          columns,
          filename: findingsFilename(new Date().getFullYear()),
          sheetName: t('findings.title', { defaultValue: 'Lampiran 9' }),
          signoffs: [
            { roleTitle: 'Pengidentifikasi (Lini 1)', name: 'Penguji Pengendalian', title: 'Internal Control Assessor', date: format(new Date(), 'yyyy-MM-dd'), isSigned: true },
            { roleTitle: 'Penelaah (Lini 2)', name: 'Kepala Satuan ICOFR', title: 'ICOFR Head', date: format(new Date(), 'yyyy-MM-dd'), isSigned: true },
          ],
        });
      },
    });
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
            <Button size="sm" variant="outline" onClick={() => {
              const doc = generateLampiran9Pdf({
                findings: deficiencies,
                fiscalYear: new Date().getFullYear(),
                companyName: MOCK_COMPANY,
              });
              doc.save(`Lampiran_9_Daftar_Temuan_${new Date().getFullYear()}.pdf`);
            }} className="min-h-[44px] text-xs font-bold w-full min-[420px]:w-auto justify-center">
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
            deficiencies.map((d, index) => (
              <div key={d.id || index} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold">{findingRowId(d, index)}</span>
                  <ReportSeverityBadge severity={d.severity} />
                </div>
                <p className="mt-2 text-xs text-foreground leading-relaxed">{d.description || '-'}</p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>{d.status || '-'}</span>
                  <span className="font-mono">{formatExposureValue(d.exposureValue)}</span>
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
                deficiencies.map((d, index) => {
                  return (
                    <TableRow key={d.id || index} className="border-b hover:bg-slate-50/50">
                      <TableCell className="text-center text-xs text-slate-500">{index + 1}</TableCell>
                      <TableCell className="font-mono text-xs font-bold">{findingRowId(d, index)}</TableCell>
                      <TableCell className="text-xs max-w-[280px]">{d.description || '-'}</TableCell>
                      <TableCell className="text-xs text-slate-600">{resolveFindingControlName(d, controls)}</TableCell>
                      <TableCell className="text-center"><ReportSeverityBadge severity={d.severity} /></TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatExposureValue(d.exposureValue)}
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
