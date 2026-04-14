import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ChevronRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type DoDStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'RESULT';

interface DoDWizardProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onComplete: (severity: "Control Deficiency" | "Significant Deficiency" | "Material Weakness", rationale?: string) => void;
  isAggregate?: boolean;
}

export function DoDWizard({ isOpen, setIsOpen, onComplete, isAggregate = false }: DoDWizardProps) {
  const [step, setStep] = React.useState<DoDStep>(1);
  const [answers, setStepAnswers] = React.useState<Record<number, boolean>>({});
  const [rationale, setRationale] = React.useState("");

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
    
    // Final Decision Logic
    if (answers[4] === false && !answers[7]) return "Control Deficiency";
    if (answers[6] === true || answers[7] === true) return "Material Weakness";
    return "Significant Deficiency";
  };

  const result = getResult();

  const reset = () => {
    setStep(1);
    setStepAnswers({});
    setRationale("");
  };

  const handleFinish = () => {
    if (result) onComplete(result as any, rationale);
    setIsOpen(false);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if(!o) reset(); setIsOpen(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isAggregate ? "Aggregate Deficiency Assessment (Appendix 10)" : "Degree of Deficiency Wizard"}
          </DialogTitle>
          <DialogDescription>
            {isAggregate 
              ? "Evaluate collective impact from multiple selected deficiencies."
              : "Deficiency level determination logic based on Figure 5 (SK-5/2024)."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 min-h-[200px] flex flex-col justify-center">
          {step === 1 && (
            <Question 
              title="Box 1: Assertion Relationship"
              q="Is the deficiency directly related to the achievement of one or more financial statement assertions?"
              onAnswer={handleAnswer}
            />
          )}
          {step === 2 && (
            <Question 
              title="Box 2: Likelihood"
              q="Is there a likelihood that a misstatement will result from the deficiency (or combination of deficiencies)?"
              onAnswer={handleAnswer}
            />
          )}
          {step === 3 && (
            <Question 
              title="Box 3: Magnitude"
              q="Is there a possibility that the magnitude of potential misstatement is material?"
              onAnswer={handleAnswer}
            />
          )}
          {step === 4 && (
            <Question 
              title="Box 4: Importance/Attention"
              q="Is the deficiency important enough to merit attention from those responsible for oversight (Audit Committee/Board of Directors)?"
              onAnswer={handleAnswer}
            />
          )}
          {step === 5 && (
            <Question 
              title="Box 5: Compensating Control"
              q="Are there controls that can operate effectively at a level of precision sufficient to prevent/detect material misstatements?"
              onAnswer={handleAnswer}
            />
          )}
          {step === 6 && (
            <Question 
              title="Box 6: Prudent Official"
              q="Would a well-informed, competent, and objective individual (prudent official) conclude the deficiency is a material weakness?"
              onAnswer={handleAnswer}
            />
          )}
          {step === 7 && (
            <Question 
              title="Box 7: Similar Account Aggregation"
              q="Are there multiple control deficiencies affecting the same financial statement account balance or disclosure?"
              onAnswer={handleAnswer}
            />
          )}

          {step === 'RESULT' && (
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-center">
                {result === "Material Weakness" ? <AlertCircle className="h-12 w-12 text-destructive" /> : <CheckCircle2 className="h-12 w-12 text-primary" />}
              </div>
              <div>
                <h3 className="text-lg font-bold">Assessment Result</h3>
                <Badge className={`mt-2 text-lg px-4 py-1 ${result === 'Material Weakness' ? 'bg-red-600' : result === 'Significant Deficiency' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                  {result}
                </Badge>
              </div>

              <div className="text-left space-y-2 mt-4">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Rationale / Justification (Mandatory)</label>
                <Textarea 
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain the basis for determining this severity level..."
                  className="text-xs h-20"
                />
              </div>

              <p className="text-sm text-muted-foreground italic">
                {result === "Material Weakness" ? "Immediately report to the Audit Committee and create a priority remediation plan." : "Document findings and monitor the action plan."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'RESULT' ? (
            <Button onClick={handleFinish} disabled={!rationale} className="w-full">Apply Severity</Button>
          ) : (
            <div className="w-full flex justify-between items-center">
               <span className="text-[10px] text-muted-foreground uppercase font-bold">Box {step} of 6</span>
               <Button variant="ghost" size="sm" onClick={reset}>Reset</Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Question({ title, q, onAnswer }: { title: string, q: string, onAnswer: (v: boolean) => void }) {
  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      <h3 className="font-bold text-sm text-primary uppercase tracking-wider flex items-center gap-2">
        <Info className="h-4 w-4" />
        {title}
      </h3>
      <p className="text-base font-medium leading-relaxed">{q}</p>
      <div className="grid grid-cols-2 gap-4 pt-4">
        <Button variant="outline" className="h-12 text-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200" onClick={() => onAnswer(false)}>NO</Button>
        <Button variant="outline" className="h-12 text-lg hover:bg-green-50 hover:text-green-700 hover:border-green-200" onClick={() => onAnswer(true)}>YES</Button>
      </div>
    </div>
  );
}