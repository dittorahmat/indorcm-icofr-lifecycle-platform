import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, BookOpen } from 'lucide-react';
import type { Deficiency, DeficiencySeverity, DoDBoxEvaluation, DoDWorksheetData } from '@shared/types';
import { useDoDEvidenceContext } from '@/hooks/use-dod-evidence-context';
import { DoDHeaderSummary } from './DoDHeaderSummary';
import { DoDEvidenceContextCard } from './DoDEvidenceContextCard';
import { DoDLogicMatrix } from './DoDLogicMatrix';
import { DoDConclusionFooter } from './DoDConclusionFooter';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface DoDWorksheetDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  deficiency: Deficiency | null;
  onComplete: (severity: DeficiencySeverity, rationale: string, metadata: {
    dodWorksheet: DoDWorksheetData;
    exposureValue: number;
    assertions: string[];
    flowchartPath: Record<number, boolean>;
  }) => void;
  isAggregate?: boolean;
  performanceMateriality?: number;
  overallMateriality?: number;
}

export function DoDWorksheetDialog({
  isOpen,
  setIsOpen,
  deficiency,
  onComplete,
  isAggregate = false,
  performanceMateriality,
  overallMateriality,
}: DoDWorksheetDialogProps) {
  const { t } = useTranslation('deficiency');

  // Active form state initialized from existing deficiency data
  const [exposureValue, setExposureValue] = React.useState<number>(deficiency?.exposureValue || 500_000_000);
  const [ineffectivePeriod, setIneffectivePeriod] = React.useState<string>('Q2 - Q4 (9 Bulan)');
  const [isRemediated, setIsRemediated] = React.useState<boolean>(deficiency?.status === 'Remediated');
  const [selectedAssertions, setSelectedAssertions] = React.useState<string[]>(
    deficiency?.assertions || ['Accuracy', 'Completeness']
  );
  const [cosoComponent] = React.useState<string>('Control Activities');
  const [selectedCompensatingId, setSelectedCompensatingId] = React.useState<string | undefined>(
    deficiency?.compensatingControlIds?.[0]
  );

  // Sync state when deficiency changes
  React.useEffect(() => {
    if (deficiency) {
      setExposureValue(deficiency.exposureValue || 500_000_000);
      setIsRemediated(deficiency.status === 'Remediated');
      if (deficiency.assertions?.length) {
        setSelectedAssertions(deficiency.assertions);
      }
      if (deficiency.compensatingControlIds?.length) {
        setSelectedCompensatingId(deficiency.compensatingControlIds[0]);
      }
    }
  }, [deficiency]);

  // Box 1 through 7 evaluations
  const [evaluations, setEvaluations] = React.useState<Record<number, DoDBoxEvaluation>>({
    1: {
      answer: true,
      justification: 'Defisiensi pengendalian ini berhubungan langsung dengan asersi Akurasi dan Kelengkapan saldo akun.',
    },
    2: {
      answer: true,
      justification: 'Terdapat kemungkinan terjadinya salah saji berdasarkan hasil pengujian sampel TOE yang menunjukkan 3 eksepsi.',
    },
    3: {
      answer: exposureValue >= (performanceMateriality || 5_000_000_000),
      justification: exposureValue >= (performanceMateriality || 5_000_000_000)
        ? 'Nilai eksposur melampaui ambang batas Performance Materiality (PM).'
        : 'Nilai eksposur berada di bawah ambang batas toleransi materialitas.',
    },
    4: {
      answer: true,
      justification: 'Cukup penting untuk mendapatkan perhatian dari Komite Audit dan Dewan Direksi.',
    },
    5: {
      answer: false,
      justification: 'Tidak ditemukan pengendalian kompensasi yang beroperasi pada presisi yang memadai untuk memitigasi risiko.',
    },
    6: {
      answer: false,
      justification: 'Berdasarkan pertimbangan prudent official, defisiensi ini belum memenuhi kriteria kelemahan material mandiri.',
    },
    7: {
      answer: false,
      justification: 'Tidak teridentifikasi beberapa defisiensi lain yang mempengaruhi akun atau pengungkapan laporan keuangan yang sama.',
    },
  });

  // Query evidence context from testing & scoping
  const { evidenceContext, pmThreshold } = useDoDEvidenceContext({
    deficiency,
    performanceMateriality,
    overallMateriality,
  });

  const toggleAssertion = (assertion: string) => {
    setSelectedAssertions((prev) =>
      prev.includes(assertion) ? prev.filter((a) => a !== assertion) : [...prev, assertion]
    );
  };

  const handleEvaluationChange = (boxId: number, update: Partial<DoDBoxEvaluation>) => {
    setEvaluations((prev) => ({
      ...prev,
      [boxId]: {
        ...(prev[boxId] || { answer: false, justification: '' }),
        ...update,
      },
    }));
  };

  // Determine active path following Gambar 5 SK-5/2024
  const activeBoxes = React.useMemo(() => {
    const active: number[] = [1];
    const b1 = evaluations[1]?.answer;
    if (b1) {
      active.push(2);
      const b2 = evaluations[2]?.answer;
      if (b2) {
        active.push(3);
        const b3 = evaluations[3]?.answer;
        if (b3) {
          active.push(5);
          const b5 = evaluations[5]?.answer;
          if (b5) {
            active.push(4);
            const b4 = evaluations[4]?.answer;
            if (b4) active.push(6);
            if (isAggregate) active.push(7);
          }
        } else {
          active.push(4);
          const b4 = evaluations[4]?.answer;
          if (b4) active.push(6);
          if (isAggregate) active.push(7);
        }
      } else {
        active.push(4);
        const b4 = evaluations[4]?.answer;
        if (b4) active.push(6);
        if (isAggregate) active.push(7);
      }
    } else {
      active.push(4);
      const b4 = evaluations[4]?.answer;
      if (b4) active.push(6);
      if (isAggregate) active.push(7);
    }
    return active;
  }, [evaluations, isAggregate]);

  // Derived severity from Gambar 5 Terminal Logic
  const computedSeverity = React.useMemo<DeficiencySeverity>(() => {
    // Hard Red-flags override
    if (
      deficiency?.preAssessment?.seniorManagementFraud ||
      deficiency?.preAssessment?.materialFraudImpact ||
      deficiency?.preAssessment?.restatement
    ) {
      return 'Material Weakness';
    }

    // Box 5 "No" -> Material Weakness
    if (activeBoxes.includes(5) && evaluations[5]?.answer === false) {
      return 'Material Weakness';
    }

    // Box 4 "No" -> Control Deficiency
    if (activeBoxes.includes(4) && evaluations[4]?.answer === false) {
      return 'Control Deficiency';
    }

    // Box 6 "Yes" -> Material Weakness, "No" -> Significant Deficiency
    if (activeBoxes.includes(6)) {
      return evaluations[6]?.answer === true ? 'Material Weakness' : 'Significant Deficiency';
    }

    return 'Control Deficiency';
  }, [evaluations, activeBoxes, deficiency?.preAssessment]);

  // Governance Routing (Table 24 SK-5/2024 Page 65)
  const governanceRouting = React.useMemo<string[]>(() => {
    switch (computedSeverity) {
      case 'Material Weakness':
      case 'Significant Deficiency':
        return [
          t('worksheet.conclusion.recipients.ceo'),
          t('worksheet.conclusion.recipients.organ'),
          t('worksheet.conclusion.recipients.komisaris'),
          t('worksheet.conclusion.recipients.komiteAudit'),
        ];
      default:
        return [
          t('worksheet.conclusion.recipients.ceo'),
          t('worksheet.conclusion.recipients.organ'),
        ];
    }
  }, [computedSeverity, t]);

  // Verification that all active boxes have a justification
  const isSubmittable = React.useMemo(() => {
    return activeBoxes.every((boxId) => {
      const evaluation = evaluations[boxId];
      return Boolean(evaluation && evaluation.justification?.trim());
    });
  }, [activeBoxes, evaluations]);

  const handleSave = () => {
    if (!isSubmittable) {
      toast.error('Mohon lengkapi justifikasi untuk seluruh langkah aktif sebelum menyimpan.');
      return;
    }

    const flowchartPath: Record<number, boolean> = {};
    activeBoxes.forEach((boxId) => {
      flowchartPath[boxId] = Boolean(evaluations[boxId]?.answer);
    });

    const combinedRationale = activeBoxes
      .map((boxId) => `[Kotak ${boxId} - ${evaluations[boxId]?.answer ? 'Ya' : 'Tidak'}]: ${evaluations[boxId]?.justification}`)
      .join('\n');

    const worksheetData: DoDWorksheetData = {
      deficiencyId: deficiency.id,
      evaluatedAt: Date.now(),
      exposureValue,
      ineffectivePeriod,
      isRemediated,
      assertions: selectedAssertions,
      cosoComponent,
      boxes: {
        box1: evaluations[1],
        box2: evaluations[2],
        box3: evaluations[3],
        box4: evaluations[4],
        box5: evaluations[5],
        box6: evaluations[6],
        box7: evaluations[7],
      },
      finalSeverity: computedSeverity,
      governanceRouting,
    };

    onComplete(computedSeverity, combinedRationale, {
      dodWorksheet: worksheetData,
      exposureValue,
      assertions: selectedAssertions,
      flowchartPath,
    });

    toast.success('Kertas Kerja Penentuan DoD (Lampiran 10) berhasil disimpan.');
    setIsOpen(false);
  };

  if (!deficiency) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border border-border rounded-lg shadow-xl">
        <DialogHeader className="p-5 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-md text-primary">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {t('worksheet.title')}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t('worksheet.description')}
                </DialogDescription>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold uppercase bg-muted/40 border border-border px-2.5 py-1 rounded-md text-muted-foreground">
              {t('worksheet.regulatoryRef')}
            </span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <Tabs defaultValue="matrix" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 bg-muted/50 p-1 rounded-md">
              <TabsTrigger value="matrix" className="text-xs font-semibold rounded">
                1. {t('worksheet.tabs.evaluation')}
              </TabsTrigger>
              <TabsTrigger value="evidence" className="text-xs font-semibold rounded">
                2. {t('worksheet.tabs.evidence')}
              </TabsTrigger>
              <TabsTrigger value="summary" className="text-xs font-semibold rounded">
                3. {t('worksheet.tabs.summary')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="matrix" className="space-y-4 m-0">
              <DoDHeaderSummary
                deficiency={deficiency}
                exposureValue={exposureValue}
                ineffectivePeriod={ineffectivePeriod}
                isRemediated={isRemediated}
                selectedAssertions={selectedAssertions}
                cosoComponent={cosoComponent}
                onToggleAssertion={toggleAssertion}
                onPeriodChange={setIneffectivePeriod}
                onRemediatedChange={setIsRemediated}
              />

              <DoDLogicMatrix
                evaluations={evaluations}
                onEvaluationChange={handleEvaluationChange}
                activeBoxes={activeBoxes}
              />
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4 m-0">
              <DoDEvidenceContextCard
                evidenceContext={evidenceContext}
                exposureValue={exposureValue}
                selectedCompensatingId={selectedCompensatingId}
                onSelectCompensatingControl={(id) => {
                  setSelectedCompensatingId(id);
                  handleEvaluationChange(5, {
                    answer: true,
                    justification: `Pengendalian kompensasi #${id} dipilih sebagai kontrol penyeimbang yang beroperasi efektif.`,
                  });
                }}
              />
            </TabsContent>

            <TabsContent value="summary" className="space-y-4 m-0">
              <DoDHeaderSummary
                deficiency={deficiency}
                exposureValue={exposureValue}
                ineffectivePeriod={ineffectivePeriod}
                isRemediated={isRemediated}
                selectedAssertions={selectedAssertions}
                cosoComponent={cosoComponent}
                onToggleAssertion={toggleAssertion}
                onPeriodChange={setIneffectivePeriod}
                onRemediatedChange={setIsRemediated}
              />
            </TabsContent>
          </Tabs>

          <DoDConclusionFooter
            computedSeverity={computedSeverity}
            governanceRouting={governanceRouting}
            isSubmittable={isSubmittable}
            onSave={handleSave}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
