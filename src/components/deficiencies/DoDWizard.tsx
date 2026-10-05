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
  const [step, setStep] = React.useState<DoDStep>(1);
  const [answers, setStepAnswers] = React.useState<Record<number, boolean>>({});
  const [exposureValue, setExposureValue] = React.useState<string>("");
  const [selectedAssertions, setSelectedAssertions] = React.useState<string[]>([]);
  const [rationale, setRationale] = React.useState("");

  const handleAnswer = (val: boolean) => {
    const newAnswers = { ...answers, [step as number]: val };
    setStepAnswers(newAnswers);

    // Official Logic based on Gambar 5 (SK-5/2024 Page 73)
    if (step === 1) {
      // Box a
      if (val) setStep(2); // Yes -> Box b
      else setStep(4); // No -> Box d
    } else if (step === 2) {
      // Box b
      if (val) setStep(3); // Yes -> Box c
      else setStep(4); // No -> Box d
    } else if (step === 3) {
      // Box c
      if (val) setStep(5); // Yes -> Box e
      else setStep(4); // No -> Box d
    } else if (step === 5) {
      // Box e
      if (val) setStep(4); // Yes -> Box d
      else setStep('RESULT'); // No -> TERMINAL: Material Weakness
    } else if (step === 4) {
      // Box d
      if (val) setStep(6); // Yes -> Box f
      else {
        if (isAggregate) setStep(7); // Go to Box g
        else setStep('RESULT'); // TERMINAL: Control Deficiency
      }
    } else if (step === 6) {
      // Box f
      if (isAggregate) setStep(7); // Go to Box g
      else setStep('RESULT'); // TERMINAL: MW or SD
    } else if (step === 7) {
      // Box g
      if (val) {
        toast.info("Aggregation Loop: Returning to Box b to evaluate combined impact.", {
          description: "In accordance with Box g mandate in Figure 5 (Page 73)."
        });
        setStep(2); // Loop back to Box b
      } else {
        setStep('RESULT');
      }
    }
  };

  const getResult = () => {
    if (step !== 'RESULT') return null;
    
    // Regulatory Terminal Logic (Gambar 5)
    
    // Box e: "No" -> Direct Terminal to Material Weakness
    if (answers[5] === false) return "Material Weakness";

    // Box d: "No" -> Terminal to Control Deficiency
    if (answers[4] === false) return "Control Deficiency";

    // Box f: "Yes" -> Material Weakness, "No" -> Significant Deficiency
    if (answers[6] === true) return "Material Weakness";
    if (answers[6] === false) return "Significant Deficiency";

    return null;
  };

  const result = getResult();

  const isMaterialByPM = performanceMateriality && exposureValue && parseFloat(exposureValue) >= performanceMateriality;

  const reset = () => {
    setStep(1);
    setStepAnswers({});
    setExposureValue("");
    setSelectedAssertions([]);
    setRationale("");
  };

  const handleFinish = () => {
    if (result) onComplete(result as any, rationale, { 
      exposureValue: exposureValue ? parseFloat(exposureValue) : undefined,
      assertions: selectedAssertions,
      flowchartPath: answers
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
      if (exposureValue && performanceMateriality) {
        const exp = parseFloat(exposureValue);
        autoRationale = `Exposure value (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(exp)}) is ${exp >= performanceMateriality ? 'ABOVE' : 'BELOW'} Performance Materiality threshold (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(performanceMateriality)}). `;
      }
      autoRationale += t('wizard.result.flowchartRationale');
      setRationale(autoRationale);
    }
  }, [step, exposureValue, performanceMateriality, rationale, t]);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if(!o) reset(); setIsOpen(o); }}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-lg p-4 sm:p-6">
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
                <Label htmlFor="exposure" className="text-xs font-bold uppercase text-muted-foreground">{t('wizard.box3.exposureLabel')}</Label>
                <div className="flex gap-2">
                  <Input 
                    id="exposure" 
                    type="number" 
                    value={exposureValue} 
                    onChange={(e) => setExposureValue(e.target.value)} 
                    placeholder={t('wizard.box3.exposurePlaceholder')}
                    className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                  {performanceMateriality && (
                    <div className="text-xs flex flex-col justify-center">
                      <span className="text-muted-foreground">{t('wizard.box3.thresholdLabel')}</span>
                      <span className="font-mono font-bold">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(performanceMateriality)}</span>
                    </div>
                  )}
                </div>
                {isMaterialByPM && (
                  <div className="flex items-center gap-1.5 text-xs text-orange-600 font-bold bg-orange-50 p-1.5 rounded animate-in zoom-in duration-300">
                    <AlertTriangle className="h-3 w-3" />
                    {t('wizard.box3.materialWarning')}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                <Button variant="outline" className="h-11 sm:h-12 min-h-[44px] text-base sm:text-lg" onClick={() => handleAnswer(false)}>{t('wizard.common.no')}</Button>
                <Button variant={isMaterialByPM ? "default" : "outline"} className={`h-11 sm:h-12 min-h-[44px] text-base sm:text-lg ${isMaterialByPM ? 'bg-green-600 hover:bg-green-700' : 'border-primary/30'}`} onClick={() => handleAnswer(true)}>{t('wizard.common.yes')}</Button>
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
                <div className="text-left bg-muted/50 p-3 rounded-lg border border-muted text-xs space-y-1">
                  <p className="font-bold uppercase text-muted-foreground mb-1">{t('wizard.result.quantComparison')}</p>
                  <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between flex-wrap gap-1 min-[420px]:gap-2 min-w-0">
                    <span className="min-w-0">{t('wizard.result.exposureValue')}</span>
                    <span className="font-mono font-bold break-words">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseFloat(exposureValue))}</span>
                  </div>
                  <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between border-b border-muted pb-1 mb-1 flex-wrap gap-1 min-[420px]:gap-2 min-w-0">
                    <span className="min-w-0">{t('wizard.result.pmThreshold')}</span>
                    <span className="font-mono break-words">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(performanceMateriality)}</span>
                  </div>
                  <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between text-orange-600 font-bold flex-wrap gap-1 min-[420px]:gap-2 min-w-0">
                    <span>{t('wizard.result.conclusion')}</span>
                    <span>{parseFloat(exposureValue) >= performanceMateriality ? t('wizard.result.material') : t('wizard.result.immaterial')}</span>
                  </div>
                </div>
              )}

              <div className="text-left space-y-3 mt-4 border-t pt-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1.5">{t('wizard.result.assertionsLabel')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {ASSERTION_OPTIONS.map(assertion => (
                      <div key={assertion} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`assertion-${assertion}`} 
                          checked={selectedAssertions.includes(assertion)} 
                          onCheckedChange={() => toggleAssertion(assertion)}
                        />
                        <Label htmlFor={`assertion-${assertion}`} className="text-xs leading-none cursor-pointer">{assertion}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">{t('wizard.result.rationaleLabel')}</label>
                  <Textarea 
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder={t('wizard.result.rationalePlaceholder')}
                    className="text-base sm:text-sm h-20"
                  />
                </div>
              </div>

              <p className="text-sm font-medium text-muted-foreground">
                {result === "Material Weakness" ? t('wizard.result.mwNote') : t('wizard.result.cdNote')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          {step === 'RESULT' ? (
            <div className="w-full space-y-2">
              <Button onClick={handleFinish} disabled={!rationale || selectedAssertions.length === 0} className="w-full sm:w-auto min-h-[44px] h-11 sm:h-10 justify-center">{t('wizard.result.applyButton')}</Button>
              <p className="text-xs text-center text-muted-foreground uppercase font-bold tracking-tight">Ref: Gambar 5 SK-5/DKU.MBU/11/2024 (Hal. 73)</p>
            </div>
          ) : (
            <div className="w-full flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2">
               <div className="flex flex-col">
                 <span className="text-xs text-muted-foreground uppercase font-bold">
                   {t('wizard.common.boxProgress', { step: String.fromCharCode(96 + (step as number)) })}
                 </span>
                 <span className="text-xs text-muted-foreground/60 font-medium">Ref: Gambar 5 SK-5/2024</span>
               </div>
                <Button variant="ghost" size="sm" onClick={reset} className="w-full sm:w-auto min-h-[44px]">{t('wizard.common.reset')}</Button>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4">
        <Button variant="outline" className="h-11 sm:h-12 min-h-[44px] text-base sm:text-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200" onClick={() => onAnswer(false)}>{t('wizard.common.no')}</Button>
        <Button variant="outline" className="h-11 sm:h-12 min-h-[44px] text-base sm:text-lg hover:bg-green-50 hover:text-green-700 hover:border-green-200" onClick={() => onAnswer(true)}>{t('wizard.common.yes')}</Button>
      </div>
    </div>
  );
}
