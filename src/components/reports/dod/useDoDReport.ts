import * as React from 'react';
import { exportRegulatoryTableToExcel } from '@/lib/rcm-excel-export';
import { MOCK_COMPANY } from '../mock-regulatory-data';
import { checkMark } from './dod-format';
import type {
  DoDCounters,
  FormattedDoDRow,
  TranslateFn,
} from './dod-types';
import type { Control, Deficiency } from '@shared/types';
import { generateLampiran10DoDPdf } from '@/lib/pdf/lampiran10-pdf-export';

interface UseDoDReportParams {
  deficiencies: Deficiency[];
  controls: Control[];
  fiscalYear: number;
  t: TranslateFn;
}

interface UseDoDReportResult {
  filteredRows: FormattedDoDRow[];
  counters: DoDCounters;
  severityFilter: string;
  remediationFilter: string;
  searchQuery: string;
  showFullTable: boolean;
  isExporting: boolean;
  setSeverityFilter: (v: string) => void;
  setRemediationFilter: (v: string) => void;
  setSearchQuery: (v: string) => void;
  setShowFullTable: (v: boolean | ((prev: boolean) => boolean)) => void;
  handlePrint: () => void;
  handleExportExcel: () => Promise<void>;
}

const DATA_KEYS = [
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
] as const;

function toStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => String(a));
}

export function useDoDReport({
  deficiencies,
  controls,
  fiscalYear,
  t,
}: UseDoDReportParams): UseDoDReportResult {
  const [severityFilter, setSeverityFilter] = React.useState<string>('ALL');
  const [remediationFilter, setRemediationFilter] = React.useState<string>('ALL');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [isExporting, setIsExporting] = React.useState(false);
  const [showFullTable, setShowFullTable] = React.useState(false);

  const formattedRows: FormattedDoDRow[] = React.useMemo(() => {
    return deficiencies.map((d, index) => {
      const relatedControl = controls.find((c) => c.id === d.controlId || c.code === d.controlCode);
      const ws = d.dodWorksheet;
      const path: Record<number, boolean> = d.flowchartPath ?? {};

      const assertionsArr = toStringList(
        ws?.assertions ?? d.assertions ?? relatedControl?.assertions ?? [],
      );
      const hasAssertion = (code: string, altNames: string[]) => {
        return assertionsArr.some(
          (a) =>
            a.toUpperCase() === code.toUpperCase() ||
            altNames.some((alt) => a.toLowerCase().includes(alt.toLowerCase())),
        );
      };

      const c = hasAssertion('C', ['completeness', 'kelengkapan']);
      const a = hasAssertion('A', ['accuracy', 'akurasi']);
      const eo = hasAssertion('E/O', ['existence', 'occurrence', 'keberadaan', 'keterjadian']);
      const co = hasAssertion('CO', ['cut-off', 'cutoff', 'pisah']);
      const ro = hasAssertion('R&O', ['rights', 'obligations', 'hak', 'kewajiban']);
      const va = hasAssertion('V/A', ['valuation', 'allocation', 'penilaian', 'alokasi']);
      const pd = hasAssertion('PD', ['presentation', 'disclosure', 'penyajian', 'pengungkapan']);

      const getBoxAnswer = (boxNum: number): boolean => {
        const boxKey = `box${boxNum}` as keyof NonNullable<typeof ws>['boxes'];
        const direct = ws?.boxes?.[boxKey]?.answer;
        if (direct !== undefined) {
          return Boolean(direct);
        }
        if (path[boxNum] !== undefined) {
          return path[boxNum];
        }
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

  const counters: DoDCounters = React.useMemo(
    () => ({
      total: formattedRows.length,
      mw: formattedRows.filter((r) => r.severity === 'Material Weakness').length,
      sd: formattedRows.filter((r) => r.severity === 'Significant Deficiency').length,
      cd: formattedRows.filter((r) => r.severity === 'Control Deficiency').length,
      remediated: formattedRows.filter((r) => r.isRemediated).length,
    }),
    [formattedRows],
  );

  const handlePrint = React.useCallback(() => {
    const doc = generateLampiran10DoDPdf({
      rows: filteredRows,
      fiscalYear,
    });
    doc.save(`Lampiran_10_Kertas_Kerja_DoD_${fiscalYear}.pdf`);
  }, [filteredRows, fiscalYear]);

  const handleExportExcel = React.useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const yesLabel = t('common:yes', { defaultValue: 'Ya' });
      const noLabel = t('common:no', { defaultValue: 'Tidak' });
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
        c: checkMark(r.assertions.c),
        a: checkMark(r.assertions.a),
        eo: checkMark(r.assertions.eo),
        co: checkMark(r.assertions.co),
        ro: checkMark(r.assertions.ro),
        va: checkMark(r.assertions.va),
        pd: checkMark(r.assertions.pd),
        box1: yn(r.boxes.box1),
        box2: yn(r.boxes.box2),
        box3: yn(r.boxes.box3),
        box4: yn(r.boxes.box4),
        box5: yn(r.boxes.box5),
        box6: yn(r.boxes.box6),
        box7: yn(r.boxes.box7),
      }));

      const headers = DATA_KEYS.map((_, i) => t(`dodReport.table.col${i + 1}`));
      await exportRegulatoryTableToExcel(rows, {
        title: t('dodReport.title', { defaultValue: 'LAMPIRAN 10' }),
        subtitle: t('dodReport.subtitle', { defaultValue: '' }),
        identityLines: [
          MOCK_COMPANY,
          t('dodReport.period', { year: fiscalYear, defaultValue: `Periode ${fiscalYear}` }),
        ],
        groups: [
          { label: `${t('dodReport.table.groupFinding')} (i - vi)`, span: 6 },
          { label: `${t('dodReport.table.groupAggregation')} (vii - x)`, span: 4 },
          { label: `${t('dodReport.table.groupAssertions')} (xi - xvii)`, span: 7 },
          { label: `${t('dodReport.table.groupDecisionTree')} (xviii - xxiv)`, span: 7 },
        ],
        columns: DATA_KEYS.map((key, index) => ({ key, header: headers[index], numeric: key === 'exposure' })),
        filename: `Lampiran_10_Kertas_Kerja_DoD_${fiscalYear}.xlsx`,
        sheetName: t('dodReport.title', { defaultValue: 'LAMPIRAN 10' }),
        signoffs: [
          { roleTitle: 'Penilai Keparahan Defisiensi (Lini 1)', name: 'Koordinator Remediasi Defisiensi', title: 'Deficiency Assessor', date: new Date().toISOString().split('T')[0], isSigned: true },
          { roleTitle: 'Penelaah Agregasi (Lini 2)', name: 'Kepala Divisi Manajemen Risiko', title: 'Risk Division Head', date: new Date().toISOString().split('T')[0], isSigned: true },
        ],
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredRows, fiscalYear, isExporting, t]);

  return {
    filteredRows,
    counters,
    severityFilter,
    remediationFilter,
    searchQuery,
    showFullTable,
    isExporting,
    setSeverityFilter,
    setRemediationFilter,
    setSearchQuery,
    setShowFullTable,
    handlePrint,
    handleExportExcel,
  };
}
