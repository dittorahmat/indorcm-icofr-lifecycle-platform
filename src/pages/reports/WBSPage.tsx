import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Plus, FileText, CheckCircle2, Search, Download, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { exportRegulatoryTableToExcel } from '@/lib/rcm-excel-export';
import { mapWbsRows, wbsColumns, wbsFilename } from '@/lib/wbs-excel-export';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';
import type { WBSReport } from '@shared/types';
import { motion } from 'framer-motion';

const mockWBS: WBSReport[] = [
  {
    id: "WBS-2024-001",
    reportDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
    category: "Financial Reporting",
    description: "Alleged override of revenue recognition policy in subsidiary A",
    impactMagnitude: 500000000,
    status: "Investigating",
    isFinancialImpact: true,
    relatedControlIds: ["CTRL-REV-01"]
  },
  {
    id: "WBS-2024-002",
    reportDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
    category: "Asset Misappropriation",
    description: "Inventory theft in warehouse 3 involving internal staff",
    impactMagnitude: 120000000,
    status: "Confirmed",
    isFinancialImpact: true,
    relatedControlIds: ["CTRL-INV-05"]
  }
];

export function WBSPage() {
  const { t } = useTranslation('reports');
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);

  const handleExportExcel = async () => {
    if (mockWBS.length === 0 || isExportingExcel) return;
    setIsExportingExcel(true);
    try {
      await exportRegulatoryTableToExcel(mapWbsRows(mockWBS), {
        title: t('wbs.title', { defaultValue: 'Rekap Whistleblowing' }),
        subtitle: 'Lampiran 1 Prinsip 8 & 14 — SK-5/DKU.MBU/11/2024',
        identityLines: [String(new Date().getFullYear())],
        columns: wbsColumns({
          date: t('wbs.columns.date', { defaultValue: 'Tanggal' }),
          category: t('wbs.columns.category', { defaultValue: 'Kategori' }),
          description: t('wbs.columns.description', { defaultValue: 'Deskripsi' }),
          impact: t('wbs.columns.impact', { defaultValue: 'Estimasi Dampak' }),
          status: t('wbs.columns.status', { defaultValue: 'Status' }),
          controls: t('wbs.columns.controls', { defaultValue: 'Kontrol Terkait' }),
        }),
        filename: wbsFilename(),
        sheetName: t('wbs.title', { defaultValue: 'WBS Recap' }),
      });
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <AppLayout container>
      <div className="space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Whistleblowing Recap</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">Integration of fraud indicators into ICOFR risk assessment (Lampiran 1 Prinsip 8 & 14).</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto h-11 sm:h-10 min-h-[44px] justify-center">
            <Plus className="h-4 w-4" /> Log Fraud Indicator
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-amber-800">Total Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">{mockWBS.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-red-800">Financial Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{mockWBS.filter(w => w.isFinancialImpact).length}</div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-blue-800">Investigating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{mockWBS.filter(w => w.status === 'Investigating').length}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase text-green-800">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{mockWBS.filter(w => w.status === 'Confirmed').length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle>Fraud Risk Indicators Matrix</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={isExportingExcel}
                  className="gap-2 h-10 sm:h-8 min-h-[44px] sm:min-h-0 text-xs font-semibold rounded-md"
                >
                  {isExportingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {t('wbs.exportExcel', { defaultValue: 'Ekspor Excel' })}
                </Button>
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input placeholder="Search reports..." className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 w-full sm:w-[200px] text-base sm:text-sm" />
                </div>
              </div>
            </div>
            <CardDescription>Recap of reports from Whistleblowing System affecting Financial Reporting.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="mb-4 md:hidden">
              <MobileDesktopBanner recordCount={mockWBS.length} />
            </div>
            <div className="block md:hidden space-y-3">
              {mockWBS.map((report) => (
                <div key={report.id} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">{new Date(report.reportDate).toLocaleDateString()} · {report.id}</p>
                      <p className="mt-1 text-xs font-semibold text-foreground leading-snug">{report.description}</p>
                    </div>
                    <Badge className={
                      report.status === 'Investigating' ? "bg-amber-100 text-amber-700 hover:bg-amber-100 shrink-0" :
                      report.status === 'Confirmed' ? "bg-red-100 text-red-700 hover:bg-red-100 shrink-0" :
                      "bg-green-100 text-green-700 hover:bg-green-100 shrink-0"
                    }>
                      {report.status}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{report.category}</Badge>
                    <span className="text-xs font-mono font-bold text-red-600">{formatCurrency(report.impactMagnitude)}</span>
                  </div>
                  {(report.relatedControlIds?.length ?? 0) > 0 ? (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {report.relatedControlIds?.map(c => (
                        <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint rounded-lg">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Est. Impact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Related Controls</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockWBS.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(report.reportDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{report.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <div className="text-sm font-medium">{report.description}</div>
                      <div className="text-xs text-muted-foreground font-mono mt-1">{report.id}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-red-600 font-bold">
                      {formatCurrency(report.impactMagnitude)}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        report.status === 'Investigating' ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                        report.status === 'Confirmed' ? "bg-red-100 text-red-700 hover:bg-red-100" :
                        "bg-green-100 text-green-700 hover:bg-green-100"
                      }>
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {report.relatedControlIds?.map(c => (
                          <Badge key={c} variant="secondary" className="text-xs cursor-pointer hover:bg-primary hover:text-white transition-colors">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <div className="bg-muted/30 p-4 sm:p-6 rounded-lg border flex items-start gap-3 sm:gap-4">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Regulatory Compliance Note</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              As per **SK-5/DKU.MBU/11/2024 Table 9**, Management must consider fraud indicators in their ICOFR assessment. 
              Confirmed cases with financial impact MUST be mapped to deficiencies if the underlying control failed to prevent or detect the incident.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
