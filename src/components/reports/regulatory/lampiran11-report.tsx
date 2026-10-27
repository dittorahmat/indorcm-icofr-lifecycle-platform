import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Control, Deficiency, Settings } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Printer, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import { MOCK_COMPANY } from '../mock-regulatory-data';
import { useExcelExport } from '@/lib/useExcelExport';
import { isAssessmentSigned, summarizeEffectiveness } from './lampiran11-helpers';
import { findingRowId, formatExposureValue } from './findings-helpers';
import { generateLampiran11Pdf } from '@/lib/pdf/lampiran11-pdf-export';
import { ReportSeverityBadge } from './severity-badge';

interface Lampiran11ReportProps {
  deficiencies?: Deficiency[];
  controls?: Control[];
}

export function Lampiran11Report({ deficiencies = [] }: Lampiran11ReportProps) {
  const { t } = useTranslation('reports');
  const { isExporting: isExportingExcel, exportNow } = useExcelExport<Deficiency>();
  const { data: settings } = useQuery({
    queryKey: ['report-settings-lamp11'],
    queryFn: () => api<Settings>('/api/settings'),
  });

  const { mwCount, sdCount, cdCount, isEffective, significant, aggregateLine } = summarizeEffectiveness(deficiencies);
  const isSigned = isAssessmentSigned(settings?.isPeriodLocked);
  const conclusionLine = isEffective
    ? t('assessment.conclusionEffective', { defaultValue: 'Kesimpulan: Efektif' })
    : t('assessment.conclusionIneffective', { defaultValue: 'Kesimpulan: Tidak Efektif' });

  const handleExportExcel = async () => {
    const { exportRegulatoryTableToExcel } = await import('@/lib/rcm-excel-export');
    await exportNow({
      rows: significant,
      filename: `Lampiran_11_Asesmen_Manajemen_${new Date().getFullYear()}.xlsx`,
      sheetName: t('assessment.title', { defaultValue: 'Lampiran 11' }),
      exportFn: (rows, { filename, sheetName }) => {
        const mapped = rows.map((d, index) => ({
          no: index + 1,
          ref: findingRowId(d, index),
          description: d.description || '-',
          severity: d.severity || '-',
          exposure: typeof d.exposureValue === 'number' ? d.exposureValue : '-',
          status: d.status || '-',
        }));
        return exportRegulatoryTableToExcel(mapped, {
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
          filename,
          sheetName,
        });
      },
    });
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
            <Button size="sm" variant="outline" onClick={() => {
              const doc = generateLampiran11Pdf({
                deficiencies,
                companyName: MOCK_COMPANY,
                fiscalYear: new Date().getFullYear(),
                isSigned,
              });
              doc.save(`Lampiran_11_Asesmen_Manajemen_${new Date().getFullYear()}.pdf`);
            }} className="min-h-[44px] text-xs font-bold w-full min-[420px]:w-auto justify-center">
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
            { label: t('dodReport.summary.totalEvaluated', { defaultValue: 'Total' }), value: deficiencies.length, tone: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
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
                  <span className="font-mono text-xs font-bold">{findingRowId(d, index)}</span>
                  <ReportSeverityBadge outline severity={d.severity} className="shrink-0" />
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
                    <TableCell className="font-mono text-xs font-bold">{findingRowId(d, index)}</TableCell>
                    <TableCell className="text-xs max-w-[320px]">{d.description || '-'}</TableCell>
                    <TableCell className="text-center">
                      <ReportSeverityBadge outline severity={d.severity} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {formatExposureValue(d.exposureValue)}
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
