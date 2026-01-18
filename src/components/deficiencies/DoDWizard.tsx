import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ChevronRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

type DoDStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'RESULT';

interface DoDWizardProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onComplete: (severity: "Control Deficiency" | "Significant Deficiency" | "Material Weakness") => void;
  isAggregate?: boolean;
}

export function DoDWizard({ isOpen, setIsOpen, onComplete, isAggregate = false }: DoDWizardProps) {
  const [step, setStep] = React.useState<DoDStep>(1);
  const [answers, setStepAnswers] = React.useState<Record<number, boolean>>({});

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
      else setStep('RESULT'); // Result: Control Deficiency
    } else if (step === 6) {
      setStep('RESULT'); // Final decision
    }
  };

  const getResult = () => {
    if (step !== 'RESULT') return null;
    
    // Final Decision Logic
    if (answers[4] === false) return "Control Deficiency";
    if (answers[6] === true) return "Material Weakness";
    return "Significant Deficiency";
  };

  const result = getResult();

  const reset = () => {
    setStep(1);
    setStepAnswers({});
  };

  const handleFinish = () => {
    if (result) onComplete(result as any);
    setIsOpen(false);
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if(!o) reset(); setIsOpen(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isAggregate ? "Aggregate Deficiency Assessment (Lampiran 10)" : "Degree of Deficiency Wizard"}
          </DialogTitle>
          <DialogDescription>
            {isAggregate 
              ? "Mengevaluasi dampak kolektif dari beberapa defisiensi terpilih."
              : "Logika penentuan tingkat defisiensi berdasarkan Gambar 5 (SK-5/2024)."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 min-h-[200px] flex flex-col justify-center">
          {step === 1 && (
            <Question 
              title="Box 1: Hubungan Asersi"
              q="Apakah defisiensi berhubungan langsung dengan pencapaian satu atau lebih asersi atas laporan keuangan?"
              onAnswer={handleAnswer}
            />
          )}
          {step === 2 && (
            <Question 
              title="Box 2: Likelihood (Kemungkinan)"
              q="Apakah terdapat kemungkinan (likelihood) dari salah saji dihasilkan dari defisiensi (atau kombinasi defisiensi)?"
              onAnswer={handleAnswer}
            />
          )}
          {step === 3 && (
            <Question 
              title="Box 3: Magnitude (Besaran)"
              q="Apakah terdapat kemungkinan magnitude dari potensi salah saji (mempertimbangkan faktor material)?"
              onAnswer={handleAnswer}
            />
          )}
          {step === 4 && (
            <Question 
              title="Box 4: Penting/Perhatian"
              q="Apakah defisiensi cukup penting untuk mendapat perhatian dari pihak yang bertanggung jawab atas pengawasan (Komite Audit/Direksi)?"
              onAnswer={handleAnswer}
            />
          )}
          {step === 5 && (
            <Question 
              title="Box 5: Compensating Control"
              q="Apakah terdapat pengendalian yang dapat beroperasi secara efektif pada tingkat ketepatan yang cukup untuk mencegah/mendeteksi salah saji material?"
              onAnswer={handleAnswer}
            />
          )}
          {step === 6 && (
            <Question 
              title="Box 6: Prudent Official"
              q="Akankah individu yang berpengetahuan luas, kompeten dan objektif (prudent official) menyimpulkan defisiensi sebagai material weakness?"
              onAnswer={handleAnswer}
            />
          )}

          {step === 'RESULT' && (
            <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-center">
                {result === "Material Weakness" ? <AlertCircle className="h-12 w-12 text-destructive" /> : <CheckCircle2 className="h-12 w-12 text-primary" />}
              </div>
              <div>
                <h3 className="text-lg font-bold">Hasil Penilaian</h3>
                <Badge className={`mt-2 text-lg px-4 py-1 ${result === 'Material Weakness' ? 'bg-red-600' : result === 'Significant Deficiency' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                  {result}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground italic">
                {result === "Material Weakness" ? "Segera laporkan kepada Komite Audit dan buat rencana remediasi prioritas." : "Dokumentasikan temuan dan monitor rencana aksi."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'RESULT' ? (
            <Button onClick={handleFinish} className="w-full">Apply Severity</Button>
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
        <Button variant="outline" className="h-12 text-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200" onClick={() => onAnswer(false)}>TIDAK</Button>
        <Button variant="outline" className="h-12 text-lg hover:bg-green-50 hover:text-green-700 hover:border-green-200" onClick={() => onAnswer(true)}>YA</Button>
      </div>
    </div>
  );
}
