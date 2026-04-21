import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ChevronRight, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

type DoDStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'RESULT';

interface DoDWizardProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onComplete: (severity: "Control Deficiency" | "Significant Deficiency" | "Material Weakness", rationale?: string, metadata?: any) => void;
  isAggregate?: boolean;
  performanceMateriality?: number;
}

export function DoDWizard({ isOpen, setIsOpen, onComplete, isAggregate = false, performanceMateriality }: DoDWizardProps) {
  const { t } = useTranslation('deficiency');
  const [step, setStep] = React.useState<DoDStep>(0);
  const [answers, setStepAnswers] = React.useState<Record<number, boolean>>({});
  const [preAssessment, setPreAssessment] = React.useState({
    seniorManagementFraud: false,
    materialFraudImpact: false,
    restatement: false,
    auditorIdentifiedMisstatement: false,
    ineffectiveAuditCommittee: false,
  });
  const [exposureValue, setExposureValue] = React.useState<string>("");
  const [selectedAssertions, setSelectedAssertions] = React.useState<string[]>([]);
  const [rationale, setRationale] = React.useState("");

  const isAutomaticMW = Object.values(preAssessment).some(v => v);

  const handlePreAssessmentToggle = (key: keyof typeof preAssessment) => {
    setPreAssessment(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePreAssessmentNext = () => {
    if (isAutomaticMW) {
      setStep('RESULT');
      setRationale(t('wizard.result.autoRationale'));
    } else {
      setStep(1);
    }
  };

  const handleAnswer = (val: boolean) => {
    const newAnswers = { ...answers, [step as number]: val };
    setStepAnswers(newAnswers);

    // Logic based on Gambar 5 (Degree of Deficiency)
    if (step === 1) {
      if (val) setStep(2); // Yes -> Box 2
      else setStep(4); // No -> Box 4
    } else if (step === 2) {
      if (val) setStep(3); // Yes -> Box 3
      else setStep(4); // No -> Box 4
    } else if (step === 3) {
      if (val) setStep(5); // Yes -> Box 5
      else setStep(4); // No -> Box 4
    } else if (step === 5) {
      if (val) setStep(4); // Yes -> Box 4
      else setStep(6); // No -> Box 6
    } else if (step === 4) {
      if (val) setStep(6); // Yes -> Box 6
      else {
        if (isAggregate) setStep(7); // Check for aggregation loop in aggregate mode
        else setStep('RESULT'); 
      }
    } else if (step === 6) {
      if (isAggregate) setStep(7);
      else setStep('RESULT'); 
    } else if (step === 7) {
      if (val) {
        toast.info("Aggregation Loop: Returning to Box 2 to evaluate combined impact.", {
          description: "In accordance with Box 7 mandate in Figure 5 (Page 73)."
        });
        setStep(2); // Loop back to Box 2
      } else {
        setStep('RESULT');
      }
    }
  };

  const getResult = () => {
    if (step !== 'RESULT') return null;
    
    // Step 0: Automatic MW Indicators
    if (isAutomaticMW) return "Material Weakness";

    // Final Decision Logic
    if (answers[4] === false && !answers[7]) return "Control Deficiency";
    if (answers[6] === true || answers[7] === true) return "Material Weakness";
    return "Significant Deficiency";
  };

  const result = getResult();

  const isMaterialByPM = performanceMateriality && exposureValue && parseFloat(exposureValue) >= performanceMateriality;

  const reset = () => {
    setStep(0);
    setStepAnswers({});
    setPreAssessment({
      seniorManagementFraud: false,
      materialFraudImpact: false,
      restatement: false,
      auditorIdentifiedMisstatement: false,
      ineffectiveAuditCommittee: false,
    });
    setExposureValue("");
    setSelectedAssertions([]);
    setRationale("");
  };

  const handleFinish = () => {
    if (result) onComplete(result as any, rationale, { 
      preAssessment, 
      exposureValue: exposureValue ? parseFloat(exposureValue) : undefined,
      assertions: selectedAssertions 
    });
    setIsOpen(false);
    reset();
  };

  const ASSERTION_OPTIONS = [
    "Completeness", "Accuracy", "Existence/Occurrence", 
    "Cut-off", "Rights & Obligations", "Valuation/Allocation", 
    "Presentation & Disclosure"
  ];

  const toggleAssertion = (assertion: string) => {
    setSelectedAssertions(prev => 
      prev.includes(assertion) ? prev.filter(a => a !== assertion) : [...prev, assertion]
    );
  };

  React.useEffect(() => {
    if (step === 'RESULT' && !rationale) {
      let autoRationale = "";
      if (isAutomaticMW) {
        autoRationale = t('wizard.result.autoRationale');
      } else {
        if (exposureValue && performanceMateriality) {
          const exp = parseFloat(exposureValue);
          autoRationale = `Exposure value (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(exp)}) is ${exp >= performanceMateriality ? 'ABOVE' : 'BELOW'} Performance Materiality threshold (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(performanceMateriality)}). `;
        }
        autoRationale += t('wizard.result.flowchartRationale');
      }
      setRationale(autoRationale);
    }
  }, [step, isAutomaticMW, exposureValue, performanceMateriality, rationale, t]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if(!o) reset(); setIsOpen(o); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isAggregate ? t('wizard.aggregateTitle') : t('wizard.title')}
          </DialogTitle>
          <DialogDescription>
            {isAggregate 
              ? t('wizard.aggregateDescription')
              : t('wizard.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 min-h-[200px] flex flex-col justify-center">
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('wizard.step0.title')}
              </h3>
              <p className="text-xs text-muted-foreground italic mb-4">
                {t('wizard.step0.description')}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox id="sm-fraud" checked={preAssessment.seniorManagementFraud} onCheckedChange={() => handlePreAssessmentToggle('seniorManagementFraud')} />
                  <Label htmlFor="sm-fraud" className="text-xs leading-tight cursor-pointer">{t('wizard.step0.seniorManagementFraud')}</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="material-fraud" checked={preAssessment.materialFraudImpact} onCheckedChange={() => handlePreAssessmentToggle('materialFraudImpact')} />
                  <Label htmlFor="material-fraud" className="text-xs leading-tight cursor-pointer">{t('wizard.step0.materialFraudImpact')}</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="restatement" checked={preAssessment.restatement} onCheckedChange={() => handlePreAssessmentToggle('restatement')} />
                  <Label htmlFor="restatement" className="text-xs leading-tight cursor-pointer">{t('wizard.step0.restatement')}</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="auditor-identified" checked={preAssessment.auditorIdentifiedMisstatement} onCheckedChange={() => handlePreAssessmentToggle('auditorIdentifiedMisstatement')} />
                  <Label htmlFor="auditor-identified" className="text-xs leading-tight cursor-pointer">{t('wizard.step0.auditorIdentified')}</Label>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="audit-comm" checked={preAssessment.ineffectiveAuditCommittee} onCheckedChange={() => handlePreAssessmentToggle('ineffectiveAuditCommittee')} />
                  <Label htmlFor="audit-comm" className="text-xs leading-tight cursor-pointer">{t('wizard.step0.auditCommittee')}</Label>
                </div>
              </div>

              <Button className="w-full mt-4" onClick={handlePreAssessmentNext}>
                {isAutomaticMW ? t('wizard.step0.finalizeButton') : t('wizard.step0.continueButton')}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <Question 
              title={t('wizard.box1.title')}
              q={t('wizard.box1.question')}
              onAnswer={handleAnswer}
            />
          )}
          {step === 2 && (
            <Question 
              title={t('wizard.box2.title')}
              q={t('wizard.box2.question')}
              onAnswer={handleAnswer}
            />
          )}
          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <h3 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2">
                <Info className="h-4 w-4" />
                {t('wizard.box3.title')}
              </h3>
              <p className="text-base font-medium leading-relaxed">{t('wizard.box3.question')}</p>
              
              <div className="bg-muted/30 p-3 rounded-md space-y-2 border border-muted">
                <Label htmlFor="exposure" className="text-[10px] font-bold uppercase text-muted-foreground">{t('wizard.box3.exposureLabel')}</Label>
                <div className="flex gap-2">
                  <Input 
                    id="exposure" 
                    type="number" 
                    value={exposureValue} 
                    onChange={(e) => setExposureValue(e.target.value)} 
                    placeholder={t('wizard.box3.exposurePlaceholder')}
                    className="h-8 text-xs"
                  />
                  {performanceMateriality && (
                    <div className="text-[9px] flex flex-col justify-center">
                      <span className="text-muted-foreground">{t('wizard.box3.thresholdLabel')}</span>
                      <span className="font-mono font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(performanceMateriality)}</span>
                    </div>
                  )}
                </div>
                {isMaterialByPM && (
                  <div className="flex items-center gap-1.5 text-[10px] text-orange-600 font-bold bg-orange-50 p-1.5 rounded animate-in zoom-in duration-300">
                    <AlertTriangle className="h-3 w-3" />
                    {t('wizard.box3.materialWarning')}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <Button variant="outline" className="h-12 text-lg" onClick={() => handleAnswer(false)}>{t('wizard.common.no')}</Button>
                <Button variant={isMaterialByPM ? "default" : "outline"} className={`h-12 text-lg ${isMaterialByPM ? 'bg-green-600 hover:bg-green-700' : 'border-primary/30'}`} onClick={() => handleAnswer(true)}>{t('wizard.common.yes')}</Button>
              </div>
            </div>
          )}
          {step === 4 && (
            <Question 
              title={t('wizard.box4.title')}
              q={t('wizard.box4.question')}
              onAnswer={handleAnswer}
            />
          )}
          {step === 5 && (
            <Question 
              title={t('wizard.box5.title')}
              q={t('wizard.box5.question')}
              onAnswer={handleAnswer}
            />
          )}
          {step === 6 && (
            <Question 
              title={t('wizard.box6.title')}
              q={t('wizard.box6.question')}
              onAnswer={handleAnswer}
            />
          )}
          {step === 7 && (
            <Question 
              title={t('wizard.box7.title')}
              q={t('wizard.box7.question')}
              onAnswer={handleAnswer}
            />
          )}

          {step === 'RESULT' && (
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-center">
                {result === "Material Weakness" ? <AlertCircle className="h-12 w-12 text-destructive" /> : <CheckCircle2 className="h-12 w-12 text-primary" />}
              </div>
              <div>
                <h3 className="text-lg font-bold">{t('wizard.result.title')}</h3>
                <Badge className={`mt-2 text-lg px-4 py-1 ${result === 'Material Weakness' ? 'bg-red-600' : result === 'Significant Deficiency' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                  {result}
                </Badge>
              </div>

              {exposureValue && performanceMateriality && (
                <div className="text-left bg-muted/50 p-3 rounded-lg border border-muted text-[10px] space-y-1">
                  <p className="font-bold uppercase text-muted-foreground mb-1">{t('wizard.result.quantComparison')}</p>
                  <div className="flex justify-between">
                    <span>{t('wizard.result.exposureValue')}</span>
                    <span className="font-mono font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseFloat(exposureValue))}</span>
                  </div>
                  <div className="flex justify-between border-b border-muted pb-1 mb-1">
                    <span>{t('wizard.result.pmThreshold')}</span>
                    <span className="font-mono">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(performanceMateriality)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600 font-bold">
                    <span>{t('wizard.result.conclusion')}</span>
                    <span>{parseFloat(exposureValue) >= performanceMateriality ? t('wizard.result.material') : t('wizard.result.immaterial')}</span>
                  </div>
                </div>
              )}

              <div className="text-left space-y-3 mt-4 border-t pt-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">{t('wizard.result.assertionsLabel')}</label>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {ASSERTION_OPTIONS.map(assertion => (
                      <div key={assertion} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`assertion-${assertion}`} 
                          checked={selectedAssertions.includes(assertion)} 
                          onCheckedChange={() => toggleAssertion(assertion)}
                        />
                        <Label htmlFor={`assertion-${assertion}`} className="text-[10px] leading-none cursor-pointer">{assertion}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">{t('wizard.result.rationaleLabel')}</label>
                  <Textarea 
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder={t('wizard.result.rationalePlaceholder')}
                    className="text-xs h-20"
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground italic">
                {result === "Material Weakness" ? t('wizard.result.mwNote') : t('wizard.result.cdNote')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'RESULT' ? (
            <Button onClick={handleFinish} disabled={!rationale || selectedAssertions.length === 0} className="w-full">{t('wizard.result.applyButton')}</Button>
          ) : (
            <div className="w-full flex justify-between items-center">
               <span className="text-[10px] text-muted-foreground uppercase font-bold">
                 {step === 0 ? t('wizard.common.preliminaryStep') : t('wizard.common.boxProgress', { step })}
               </span>
               <Button variant="ghost" size="sm" onClick={reset}>{t('wizard.common.reset')}</Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Question({ title, q, onAnswer }: { title: string, q: string, onAnswer: (v: boolean) => void }) {
  const { t } = useTranslation('deficiency');
  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <h3 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2">
        <Info className="h-4 w-4" />
        {title}
      </h3>
      <p className="text-base font-medium leading-relaxed">{q}</p>
      <div className="grid grid-cols-2 gap-4 pt-4">
        <Button variant="outline" className="h-12 text-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200" onClick={() => onAnswer(false)}>{t('wizard.common.no')}</Button>
        <Button variant="outline" className="h-12 text-lg hover:bg-green-50 hover:text-green-700 hover:border-green-200" onClick={() => onAnswer(true)}>{t('wizard.common.yes')}</Button>
      </div>
    </div>
  );
}
