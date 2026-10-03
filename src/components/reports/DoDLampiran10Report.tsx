import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Download,
  Printer,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { exportRegulatoryTableToExcel } from '@/lib/rcm-excel-export';
import { Loader2 } from 'lucide-react';
import type { Deficiency, Control } from '@shared/types';
import { MOCK_COMPANY } from './mock-regulatory-data';

interface DoDLampiran10ReportProps {
  deficiencies?: Deficiency[];
  controls?: Control[];
  fiscalYear?: number;
}

interface FormattedDoDRow {
  ref: string;
  description: string;
  isRemediated: boolean;
  ineffectivePeriod: string;
  exposureValue: number;
  severity: string;
  impactedAccount: string;
  cosoComponent: string;
  businessProcess: string;
  businessUnit: string;
  assertions: {
    c: boolean;
    a: boolean;
    eo: boolean;
    co: boolean;
    ro: boolean;
    va: boolean;
    pd: boolean;
  };
  boxes: {
    box1: boolean;
    box2: boolean;
    box3: boolean;
    box4: boolean;
    box5: boolean;
    box6: boolean;
    box7: boolean;
  };
}

export function DoDLampiran10Report({
  deficiencies = [],
  controls = [],
  fiscalYear = new Date().getFullYear(),
}: DoDLampiran10ReportProps) {
  const { t } = useTranslation(['reports', 'common']);
  const [severityFilter, setSeverityFilter] = React.useState<string>('ALL');
  const [remediationFilter, setRemediationFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [isExporting, setIsExporting] = React.useState(false);

  // Normalize deficiency row to 24 columns
  const formattedRows: FormattedDoDRow[] = React.useMemo(() => {
    return deficiencies.map((d, index) => {
      const relatedControl = controls.find((c) => c.id === d.controlId || c.code === d.controlCode);
      const ws = d.dodWorksheet;
      const path = d.flowchartPath || {};

      // Assertions mapping
      const assertionsArr = ws?.assertions || d.assertions || relatedControl?.assertions || [];
      const hasAssertion = (code: string, altNames: string[]) => {
        return assertionsArr.some(
          (a) => a.toUpperCase() === code.toUpperCase() || altNames.some((alt) => a.toLowerCase().includes(alt.toLowerCase()))
        );
      };

      const c = hasAssertion('C', ['completeness', 'kelengkapan']);
      const a = hasAssertion('A', ['accuracy', 'akurasi']);
      const eo = hasAssertion('E/O', ['existence', 'occurrence', 'keberadaan', 'keterjadian']);
      const co = hasAssertion('CO', ['cut-off', 'cutoff', 'pisah']);
      const ro = hasAssertion('R&O', ['rights', 'obligations', 'hak', 'kewajiban']);
      const va = hasAssertion('V/A', ['valuation', 'allocation', 'penilaian', 'alokasi']);
      const pd = hasAssertion('PD', ['presentation', 'disclosure', 'penyajian', 'pengungkapan']);

      // Boxes 1 through 7 mapping
      const getBoxAnswer = (boxNum: number): boolean => {
        const boxKey = `box${boxNum}` as keyof typeof ws.boxes;
        if (ws?.boxes?.[boxKey]?.answer !== undefined) {
          return Boolean(ws.boxes[boxKey]?.answer);
        }
        if (path[boxNum] !== undefined) {
          return path[boxNum];
        }
        // Fallback heuristics based on severity if worksheet was skipped
        if (boxNum === 1) return true;
        if (boxNum === 2) return true;
        if (boxNum === 3) return d.severity === 'Material Weakness' || (d.exposureValue || 0) >= 5_000_000_000;
        if (boxNum === 4) return d.severity === 'Significant Deficiency' || d.severity === 'Material Weakness';
        if (boxNum === 5) return false;
        if (boxNum === 6) return d.severity === 'Material Weakness';
        if (boxNum === 7) return false;
        return false;
      };

      return {
        ref: d.id || `DEF-${String(index + 1).padStart(3, '0')}`,
        description: d.description || relatedControl?.description || '-',
        isRemediated: ws?.isRemediated !== undefined ? ws.isRemediated : d.status === 'Remediated',
        ineffectivePeriod: ws?.ineffectivePeriod || 'Q2 - Q4 (9 Bulan)',
        exposureValue: d.exposureValue || ws?.exposureValue || 0,
        severity: d.severity || 'Control Deficiency',
        impactedAccount: relatedControl?.fsliCodes?.[0] || 'Beban Operasional / Kas & Bank',
        cosoComponent: ws?.cosoComponent || 'Control Activities',
        businessProcess: relatedControl?.businessProcess || 'Pengadaan & Keuangan',
        businessUnit: relatedControl?.location || 'Divisi Akuntansi & Keuangan',
        assertions: { c, a, eo, co, ro, va, pd },
        boxes: {
          box1: getBoxAnswer(1),
          box2: getBoxAnswer(2),
          box3: getBoxAnswer(3),
          box4: getBoxAnswer(4),
          box5: getBoxAnswer(5),
          box6: getBoxAnswer(6),
          box7: getBoxAnswer(7),
        },
      };
    });
  }, [deficiencies, controls]);

  // Filtering
  const filteredRows = React.useMemo(() => {
    return formattedRows.filter((row) => {
      if (severityFilter !== 'ALL' && row.severity !== severityFilter) {
        return false;
      }
      if (remediationFilter === 'REMEDIATED' && !row.isRemediated) {
        return false;
      }
      if (remediationFilter === 'NOT_REMEDIATED' && row.isRemediated) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const match =
          row.ref.toLowerCase().includes(query) ||
          row.description.toLowerCase().includes(query) ||
          row.businessProcess.toLowerCase().includes(query) ||
          row.impactedAccount.toLowerCase().includes(query);
        if (!match) return false;
      }
      return true;
    });
  }, [formattedRows, severityFilter, remediationFilter, searchQuery]);

  // Counters
  const totalCount = formattedRows.length;
  const mwCount = formattedRows.filter((r) => r.severity === 'Material Weakness').length;
  const sdCount = formattedRows.filter((r) => r.severity === 'Significant Deficiency').length;
  const cdCount = formattedRows.filter((r) => r.severity === 'Control Deficiency').length;
  const remediatedCount = formattedRows.filter((r) => r.isRemediated).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const yesLabel = t('common:yes', { defaultValue: 'Ya' });
      const noLabel = t('common:no', { defaultValue: 'Tidak' });
      const check = (v: boolean) => (v ? '✓' : '-');
      const yn = (v: boolean) => (v ? yesLabel : noLabel);

      const rows = filteredRows.map((r) => ({
        ref: r.ref,
        description: r.description,
        remediated: yn(r.isRemediated),
        ineffectivePeriod: r.ineffectivePeriod,
        exposure: r.exposureValue,
        severity: r.severity,
        impactedAccount: r.impactedAccount,
        cosoComponent: r.cosoComponent,
        businessProcess: r.businessProcess,
        businessUnit: r.businessUnit,
        c: check(r.assertions.c),
        a: check(r.assertions.a),
        eo: check(r.assertions.eo),
        co: check(r.assertions.co),
        ro: check(r.assertions.ro),
        va: check(r.assertions.va),
        pd: check(r.assertions.pd),
        box1: yn(r.boxes.box1),
        box2: yn(r.boxes.box2),
        box3: yn(r.boxes.box3),
        box4: yn(r.boxes.box4),
        box5: yn(r.boxes.box5),
        box6: yn(r.boxes.box6),
        box7: yn(r.boxes.box7),
      }));

      const col = (key: string, header: string, numeric = false) => ({ key, header, numeric });
      const headers = [
        t('dodReport.table.col1'),
        t('dodReport.table.col2'),
        t('dodReport.table.col3'),
        t('dodReport.table.col4'),
        t('dodReport.table.col5'),
        t('dodReport.table.col6'),
        t('dodReport.table.col7'),
        t('dodReport.table.col8'),
        t('dodReport.table.col9'),
        t('dodReport.table.col10'),
        t('dodReport.table.col11'),
        t('dodReport.table.col12'),
        t('dodReport.table.col13'),
        t('dodReport.table.col14'),
        t('dodReport.table.col15'),
        t('dodReport.table.col16'),
        t('dodReport.table.col17'),
        t('dodReport.table.col18'),
        t('dodReport.table.col19'),
        t('dodReport.table.col20'),
        t('dodReport.table.col21'),
        t('dodReport.table.col22'),
        t('dodReport.table.col23'),
        t('dodReport.table.col24'),
      ];
      const dataKeys = [
        'ref',
        'description',
        'remediated',
        'ineffectivePeriod',
        'exposure',
        'severity',
        'impactedAccount',
        'cosoComponent',
        'businessProcess',
        'businessUnit',
        'c',
        'a',
        'eo',
        'co',
        'ro',
        'va',
        'pd',
        'box1',
        'box2',
        'box3',
        'box4',
        'box5',
        'box6',
        'box7',
      ];

      await exportRegulatoryTableToExcel(rows, {
        title: t('dodReport.title', { defaultValue: 'LAMPIRAN 10' }),
        subtitle: t('dodReport.subtitle', { defaultValue: '' }),
        identityLines: [MOCK_COMPANY, t('dodReport.period', { year: fiscalYear, defaultValue: `Periode ${fiscalYear}` })],
        groups: [
          { label: `${t('dodReport.table.groupFinding')} (i - vi)`, span: 6 },
          { label: `${t('dodReport.table.groupAggregation')} (vii - x)`, span: 4 },
          { label: `${t('dodReport.table.groupAssertions')} (xi - xvii)`, span: 7 },
          { label: `${t('dodReport.table.groupDecisionTree')} (xviii - xxiv)`, span: 7 },
        ],
        columns: dataKeys.map((key, index) => col(key, headers[index], key === 'exposure')),
        filename: `Lampiran_10_Kertas_Kerja_DoD_${fiscalYear}.xlsx`,
        sheetName: t('dodReport.title', { defaultValue: 'LAMPIRAN 10' }),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Material Weakness':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-300 font-semibold text-xs rounded-md">
            MW (Kelemahan Material)
          </Badge>
        );
      case 'Significant Deficiency':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-300 font-semibold text-xs rounded-md">
            SD (Defisiensi Signifikan)
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-semibold text-xs rounded-md">
            CD (Defisiensi Kontrol)
          </Badge>
        );
    }
  };

  return (
    <Card className="border border-border shadow-sm rounded-lg bg-card">
      <CardContent className="p-6 space-y-6">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider text-primary border-primary">
                {t('dodReport.title')}
              </Badge>
              <span className="text-xs font-semibold text-muted-foreground">
                SK-5/DKU.MBU/11/2024
              </span>
            </div>
            <h2 className="text-base font-bold tracking-tight text-foreground uppercase">
              {t('dodReport.subtitle')}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              {MOCK_COMPANY} — {t('dodReport.regulationReference')}
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="text-xs font-semibold rounded-md h-9 gap-1.5"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t('dodReport.exportExcel')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-semibold rounded-md h-9 gap-1.5"
            >
              <Printer className="h-4 w-4" />
              {t('dodReport.printA4')}
            </Button>
          </div>
        </div>

        {/* KPI Counter Cards (Interactive Filters) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 print:grid-cols-5">
          {/* Card 1: Total (Reset all filters) */}
          <button
            type="button"
            onClick={() => {
              setSeverityFilter('ALL');
              setRemediationFilter('ALL');
            }}
            className={cn(
              "text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              severityFilter === 'ALL' && remediationFilter === 'ALL'
                ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400/40 shadow-sm"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300"
            )}
            title="Klik untuk menampilkan semua defisiensi (Reset Filter)"
          >
            <div className="text-xs font-semibold text-slate-600 uppercase flex items-center justify-between flex-wrap gap-2">
              <span>{t('dodReport.summary.totalEvaluated')}</span>
              {severityFilter === 'ALL' && remediationFilter === 'ALL' && (
                <span className="text-xs font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">Aktif</span>
              )}
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{totalCount}</div>
          </button>

          {/* Card 2: Material Weakness (MW) */}
          <button
            type="button"
            onClick={() => {
              setSeverityFilter((prev) => (prev === 'Material Weakness' ? 'ALL' : 'Material Weakness'));
            }}
            className={cn(
              "text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
              severityFilter === 'Material Weakness'
                ? "bg-red-100 border-red-400 ring-2 ring-red-400/40 shadow-sm"
                : "bg-red-50 border-red-200 hover:bg-red-100/70 hover:border-red-300"
            )}
            title="Klik untuk memfilter Material Weakness (MW)"
          >
            <div className="text-xs font-semibold text-red-700 uppercase flex items-center justify-between flex-wrap gap-2">
              <span>{t('dodReport.summary.materialWeakness')}</span>
              {severityFilter === 'Material Weakness' && (
                <span className="text-xs font-bold text-red-700 bg-white px-1.5 py-0.5 rounded border border-red-200">Aktif</span>
              )}
            </div>
            <div className="text-lg font-bold text-red-700 mt-1">{mwCount}</div>
          </button>

          {/* Card 3: Significant Deficiency (SD) */}
          <button
            type="button"
            onClick={() => {
              setSeverityFilter((prev) => (prev === 'Significant Deficiency' ? 'ALL' : 'Significant Deficiency'));
            }}
            className={cn(
              "text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
              severityFilter === 'Significant Deficiency'
                ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400/40 shadow-sm"
                : "bg-amber-50 border-amber-200 hover:bg-amber-100/70 hover:border-amber-300"
            )}
            title="Klik untuk memfilter Significant Deficiency (SD)"
          >
            <div className="text-xs font-semibold text-amber-700 uppercase flex items-center justify-between flex-wrap gap-2">
              <span>{t('dodReport.summary.significantDeficiency')}</span>
              {severityFilter === 'Significant Deficiency' && (
                <span className="text-xs font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded border border-amber-200">Aktif</span>
              )}
            </div>
            <div className="text-lg font-bold text-amber-700 mt-1">{sdCount}</div>
          </button>

          {/* Card 4: Control Deficiency (CD) */}
          <button
            type="button"
            onClick={() => {
              setSeverityFilter((prev) => (prev === 'Control Deficiency' ? 'ALL' : 'Control Deficiency'));
            }}
            className={cn(
              "text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              severityFilter === 'Control Deficiency'
                ? "bg-blue-100 border-blue-400 ring-2 ring-blue-400/40 shadow-sm"
                : "bg-blue-50 border-blue-200 hover:bg-blue-100/70 hover:border-blue-300"
            )}
            title="Klik untuk memfilter Control Deficiency (CD)"
          >
            <div className="text-xs font-semibold text-blue-700 uppercase flex items-center justify-between flex-wrap gap-2">
              <span>{t('dodReport.summary.controlDeficiency')}</span>
              {severityFilter === 'Control Deficiency' && (
                <span className="text-xs font-bold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200">Aktif</span>
              )}
            </div>
            <div className="text-lg font-bold text-blue-700 mt-1">{cdCount}</div>
          </button>

          {/* Card 5: Remediated Prior to Year-End */}
          <button
            type="button"
            onClick={() => {
              setRemediationFilter((prev) => (prev === 'REMEDIATED' ? 'ALL' : 'REMEDIATED'));
            }}
            className={cn(
              "text-left p-3 rounded-lg border transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
              remediationFilter === 'REMEDIATED'
                ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm"
                : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70 hover:border-emerald-300"
            )}
            title="Klik untuk memfilter defisiensi yang telah diremediasi sebelum akhir tahun"
          >
            <div className="text-xs font-semibold text-emerald-700 uppercase flex items-center justify-between flex-wrap gap-2">
              <span>{t('dodReport.summary.remediatedCount')}</span>
              {remediationFilter === 'REMEDIATED' && (
                <span className="text-xs font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">Aktif</span>
              )}
            </div>
            <div className="text-lg font-bold text-emerald-700 mt-1">{remediatedCount}</div>
          </button>
        </div>

        {/* Interactive Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 print:hidden bg-muted/40 p-3 rounded-lg border border-border">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('dodReport.filters.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs font-medium rounded-md bg-background"
            />
          </div>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs font-medium rounded-md bg-background">
              <SelectValue placeholder={t('dodReport.filters.allSeverities')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">{t('dodReport.filters.allSeverities')}</SelectItem>
              <SelectItem value="Material Weakness" className="text-xs">{t('dodReport.filters.materialWeakness')}</SelectItem>
              <SelectItem value="Significant Deficiency" className="text-xs">{t('dodReport.filters.significantDeficiency')}</SelectItem>
              <SelectItem value="Control Deficiency" className="text-xs">{t('dodReport.filters.controlDeficiency')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={remediationFilter} onValueChange={setRemediationFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs font-medium rounded-md bg-background">
              <SelectValue placeholder={t('dodReport.filters.allRemediation')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">{t('dodReport.filters.allRemediation')}</SelectItem>
              <SelectItem value="REMEDIATED" className="text-xs">{t('dodReport.filters.remediated')}</SelectItem>
              <SelectItem value="NOT_REMEDIATED" className="text-xs">{t('dodReport.filters.notRemediated')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 24-Column Tabular Formal Worksheet */}
        <div className="rounded-lg border border-border overflow-hidden bg-background max-w-full">
          <div className="overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint">
            <Table className="min-w-[2000px] border-collapse print:min-w-0 print:w-full print:text-xs">
              <TableHeader className="bg-slate-50 border-b border-border">
                {/* Tier 1 Header: Grouping */}
                <TableRow className="border-b border-border text-center">
                  <TableHead colSpan={6} className="text-center font-bold text-xs uppercase bg-slate-100 text-slate-800 border-r border-border py-2">
                    {t('dodReport.table.groupFinding')} (i - vi)
                  </TableHead>
                  <TableHead colSpan={4} className="text-center font-bold text-xs uppercase bg-slate-50 text-slate-800 border-r border-border py-2">
                    {t('dodReport.table.groupAggregation')} (vii - x)
                  </TableHead>
                  <TableHead colSpan={7} className="text-center font-bold text-xs uppercase bg-blue-50 text-blue-900 border-r border-border py-2">
                    {t('dodReport.table.groupAssertions')} (xi - xvii)
                  </TableHead>
                  <TableHead colSpan={7} className="text-center font-bold text-xs uppercase bg-amber-50 text-amber-900 py-2">
                    {t('dodReport.table.groupDecisionTree')} (xviii - xxiv)
                  </TableHead>
                </TableRow>

                {/* Tier 2 Header: 24 Columns */}
                <TableRow className="border-b border-border text-left">
                  {/* i - vi */}
                  <TableHead className="w-[120px] text-xs font-semibold text-slate-800 border-r border-border py-2.5">{t('dodReport.table.col1')}</TableHead>
                  <TableHead className="min-w-[200px] text-xs font-semibold text-slate-800 border-r border-border py-2.5">{t('dodReport.table.col2')}</TableHead>
                  <TableHead className="w-[100px] text-xs font-semibold text-center text-slate-800 border-r border-border py-2.5">{t('dodReport.table.col3')}</TableHead>
                  <TableHead className="w-[130px] text-xs font-semibold text-slate-800 border-r border-border py-2.5">{t('dodReport.table.col4')}</TableHead>
                  <TableHead className="w-[150px] text-xs font-semibold text-right text-slate-800 border-r border-border py-2.5">{t('dodReport.table.col5')}</TableHead>
                  <TableHead className="w-[180px] text-xs font-semibold text-center text-slate-800 border-r border-border py-2.5">{t('dodReport.table.col6')}</TableHead>

                  {/* vii - x */}
                  <TableHead className="w-[160px] text-xs font-semibold text-slate-800 border-r border-border py-2.5">{t('dodReport.table.col7')}</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold text-slate-800 border-r border-border py-2.5">{t('dodReport.table.col8')}</TableHead>
                  <TableHead className="w-[150px] text-xs font-semibold text-slate-800 border-r border-border py-2.5">{t('dodReport.table.col9')}</TableHead>
                  <TableHead className="w-[140px] text-xs font-semibold text-slate-800 border-r border-border py-2.5">{t('dodReport.table.col10')}</TableHead>

                  {/* xi - xvii: Assertions */}
                  <TableHead className="w-[50px] text-xs font-semibold text-center text-blue-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-blue-400 underline-offset-2 hover:text-blue-700">
                            C
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-blue-300">{t('dodReport.tooltips.c.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.c.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.c.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[50px] text-xs font-semibold text-center text-blue-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-blue-400 underline-offset-2 hover:text-blue-700">
                            A
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-blue-300">{t('dodReport.tooltips.a.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.a.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.a.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[55px] text-xs font-semibold text-center text-blue-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-blue-400 underline-offset-2 hover:text-blue-700">
                            E/O
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-blue-300">{t('dodReport.tooltips.eo.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.eo.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.eo.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[50px] text-xs font-semibold text-center text-blue-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-blue-400 underline-offset-2 hover:text-blue-700">
                            CO
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-blue-300">{t('dodReport.tooltips.co.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.co.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.co.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[55px] text-xs font-semibold text-center text-blue-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-blue-400 underline-offset-2 hover:text-blue-700">
                            R&O
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-blue-300">{t('dodReport.tooltips.ro.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.ro.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.ro.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[55px] text-xs font-semibold text-center text-blue-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-blue-400 underline-offset-2 hover:text-blue-700">
                            V/A
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-blue-300">{t('dodReport.tooltips.va.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.va.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.va.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[50px] text-xs font-semibold text-center text-blue-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-blue-400 underline-offset-2 hover:text-blue-700">
                            PD
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-blue-300">{t('dodReport.tooltips.pd.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.pd.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.pd.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  {/* xviii - xxiv: AS 2201 Decision Tree Boxes */}
                  <TableHead className="w-[95px] text-xs font-semibold text-center text-amber-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-amber-500 underline-offset-2 hover:text-amber-700">
                            B1 (xviii)
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-amber-300">{t('dodReport.tooltips.box1.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.box1.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.box1.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[95px] text-xs font-semibold text-center text-amber-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-amber-500 underline-offset-2 hover:text-amber-700">
                            B2 (xix)
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-amber-300">{t('dodReport.tooltips.box2.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.box2.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.box2.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[95px] text-xs font-semibold text-center text-amber-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-amber-500 underline-offset-2 hover:text-amber-700">
                            B3 (xx)
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-amber-300">{t('dodReport.tooltips.box3.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.box3.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.box3.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[95px] text-xs font-semibold text-center text-amber-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-amber-500 underline-offset-2 hover:text-amber-700">
                            B4 (xxi)
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-amber-300">{t('dodReport.tooltips.box4.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.box4.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.box4.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[95px] text-xs font-semibold text-center text-amber-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-amber-500 underline-offset-2 hover:text-amber-700">
                            B5 (xxii)
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-amber-300">{t('dodReport.tooltips.box5.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.box5.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.box5.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[95px] text-xs font-semibold text-center text-amber-900 border-r border-border py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-amber-500 underline-offset-2 hover:text-amber-700">
                            B6 (xxiii)
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-amber-300">{t('dodReport.tooltips.box6.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.box6.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.box6.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>

                  <TableHead className="w-[95px] text-xs font-semibold text-center text-amber-900 py-2.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help underline decoration-dotted decoration-amber-500 underline-offset-2 hover:text-amber-700">
                            B7 (xxiv)
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-left p-2.5 bg-slate-900 text-white rounded-md shadow-lg border border-slate-700">
                          <p className="font-bold text-xs text-amber-300">{t('dodReport.tooltips.box7.title')}</p>
                          <p className="text-xs text-slate-200 mt-1 leading-snug">{t('dodReport.tooltips.box7.desc')}</p>
                          <p className="text-xs font-mono text-slate-400 mt-1.5 pt-1 border-t border-slate-700/60">{t('dodReport.tooltips.box7.ref')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={24} className="text-center py-10 text-muted-foreground font-medium text-xs">
                      {t('dodReport.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((r, idx) => (
                    <TableRow key={r.ref + idx} className="border-b border-border hover:bg-muted/40 transition-colors">
                      {/* i - vi */}
                      <TableCell className="font-mono text-xs font-bold text-foreground border-r border-border py-3">
                        {r.ref}
                      </TableCell>
                      <TableCell className="text-xs text-foreground font-medium border-r border-border py-3 max-w-[280px]">
                        {r.description}
                      </TableCell>
                      <TableCell className="text-center border-r border-border py-3">
                        {r.isRemediated ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs rounded-md">
                            Ya
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 font-semibold text-xs rounded-md">
                            Tidak
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground border-r border-border py-3 font-medium">
                        {r.ineffectivePeriod}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-foreground border-r border-border py-3">
                        {formatCurrency(r.exposureValue)}
                      </TableCell>
                      <TableCell className="text-center border-r border-border py-3">
                        {getSeverityBadge(r.severity)}
                      </TableCell>

                      {/* vii - x */}
                      <TableCell className="text-xs text-foreground font-medium border-r border-border py-3">
                        {r.impactedAccount}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground border-r border-border py-3">
                        {r.cosoComponent}
                      </TableCell>
                      <TableCell className="text-xs text-foreground font-medium border-r border-border py-3">
                        {r.businessProcess}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground border-r border-border py-3">
                        {r.businessUnit}
                      </TableCell>

                      {/* xi - xvii */}
                      <TableCell className="text-center font-bold text-xs border-r border-border py-3 text-blue-700">
                        {r.assertions.c ? '✓' : '-'}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs border-r border-border py-3 text-blue-700">
                        {r.assertions.a ? '✓' : '-'}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs border-r border-border py-3 text-blue-700">
                        {r.assertions.eo ? '✓' : '-'}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs border-r border-border py-3 text-blue-700">
                        {r.assertions.co ? '✓' : '-'}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs border-r border-border py-3 text-blue-700">
                        {r.assertions.ro ? '✓' : '-'}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs border-r border-border py-3 text-blue-700">
                        {r.assertions.va ? '✓' : '-'}
                      </TableCell>
                      <TableCell className="text-center font-bold text-xs border-r border-border py-3 text-blue-700">
                        {r.assertions.pd ? '✓' : '-'}
                      </TableCell>

                      {/* xviii - xxiv */}
                      <TableCell className="text-center text-xs font-semibold border-r border-border py-3">
                        {r.boxes.box1 ? <span className="text-emerald-700">Ya</span> : <span className="text-slate-500">Tidak</span>}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold border-r border-border py-3">
                        {r.boxes.box2 ? <span className="text-emerald-700">Ya</span> : <span className="text-slate-500">Tidak</span>}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold border-r border-border py-3">
                        {r.boxes.box3 ? <span className="text-red-700 font-bold">Ya</span> : <span className="text-slate-500">Tidak</span>}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold border-r border-border py-3">
                        {r.boxes.box4 ? <span className="text-amber-700 font-bold">Ya</span> : <span className="text-slate-500">Tidak</span>}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold border-r border-border py-3">
                        {r.boxes.box5 ? <span className="text-emerald-700">Ya</span> : <span className="text-slate-500">Tidak</span>}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold border-r border-border py-3">
                        {r.boxes.box6 ? <span className="text-red-700 font-bold">Ya</span> : <span className="text-slate-500">Tidak</span>}
                      </TableCell>
                      <TableCell className="text-center text-xs font-semibold py-3">
                        {r.boxes.box7 ? <span className="text-amber-700 font-bold">Ya</span> : <span className="text-slate-500">Tidak</span>}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Digital Sign-off Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 max-w-2xl mx-auto print:max-w-full print:pt-4">
          <div className="border border-border rounded-lg p-4 bg-slate-50 flex flex-col items-center justify-between text-center min-h-[140px] print:bg-transparent">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dodReport.signatures.preparerTitle')}
            </span>
            <div className="flex flex-col items-center gap-1 my-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <span className="text-xs font-bold text-foreground">Ketua Tim Audit Internal</span>
              <span className="text-xs text-muted-foreground">{t('dodReport.signatures.preparerRole')}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {t('dodReport.signatures.verifiedDigital')}
            </span>
          </div>

          <div className="border border-border rounded-lg p-4 bg-slate-50 flex flex-col items-center justify-between text-center min-h-[140px] print:bg-transparent">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('dodReport.signatures.approverTitle')}
            </span>
            <div className="flex flex-col items-center gap-1 my-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <span className="text-xs font-bold text-foreground">Ketua Komite Audit</span>
              <span className="text-xs text-muted-foreground">{t('dodReport.signatures.approverRole')}</span>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {t('dodReport.signatures.verifiedDigital')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
