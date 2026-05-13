import React from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface QualitativeRiskWizardProps {
  onApply: (rating: "High" | "Medium" | "Low") => void;
}

export function QualitativeRiskWizard({ onApply }: QualitativeRiskWizardProps) {
  const [factors, setFactors] = React.useState({
    inherentRisk: false,
    volumeChanges: false,
    errorHistory: false,
    elcWeakness: false,
    complexity: false,
    dependence: false,
    personnelIssue: false,
    manualNature: false,
    highJudgement: false,
  });

  const count = Object.values(factors).filter(Boolean).length;
  const suggestedRating: "High" | "Medium" | "Low" = count >= 6 ? "High" : count >= 3 ? "Medium" : "Low";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Wand2 className="h-3 w-3" /> Wizard (Table 11)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <DialogHeader>
            <DialogTitle>Qualitative Risk Assessment Wizard</DialogTitle>
            <DialogDescription>
              Determine qualitative risk rating based on 9 mandatory criteria from Table 11 (Page 27).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {[
              { id: 'inherentRisk', label: 'a) High inherent risk in the account and related assertions.' },
              { id: 'volumeChanges', label: 'b) Significant changes in transaction volume or nature occurred.' },
              { id: 'errorHistory', label: 'c) History of errors/misstatements found in this control.' },
              { id: 'elcWeakness', label: 'd) Monitoring entity-level controls (ELC) are less effective.' },
              { id: 'complexity', label: 'e) Control has complex characteristics or low frequency.' },
              { id: 'dependence', label: 'f) Highly reliant on the effectiveness of other controls (ITGC/ELC).' },
              { id: 'personnelIssue', label: 'g) Competency issues or changes in executing personnel.' },
              { id: 'manualNature', label: 'h) Control is manual (reliant on individual performance).' },
              { id: 'highJudgement', label: 'i) Requires significant professional judgement/estimation.' },
            ].map((item) => (
              <div key={item.id} className="flex items-start space-x-3 space-y-0 rounded-md border p-2 hover:bg-muted/50 transition-colors">
                <Checkbox 
                  id={item.id} 
                  checked={(factors as any)[item.id]} 
                  onCheckedChange={(checked) => setFactors({ ...factors, [item.id]: !!checked })} 
                />
                <Label htmlFor={item.id} className="text-xs font-normal leading-tight cursor-pointer">
                  {item.label}
                </Label>
              </div>
            ))}

            <div className={`mt-4 p-4 rounded-lg border flex items-center justify-between ${suggestedRating === 'Low' ? 'bg-green-50 border-green-200' : suggestedRating === 'Medium' ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
               <div className="flex items-center gap-3">
                  <Info className={`h-5 w-5 ${suggestedRating === 'Low' ? 'text-green-600' : suggestedRating === 'Medium' ? 'text-amber-600' : 'text-red-600'}`} />
                  <div>
                     <p className="text-xs uppercase font-bold text-muted-foreground">Suggested Qualitative Rating</p>
                     <p className="text-2xl font-black tracking-tight uppercase">{suggestedRating}</p>
                  </div>
               </div>
               <Badge variant="outline" className="text-xs">Criteria met: {count}/9</Badge>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onApply(suggestedRating)} className="w-full">Apply Rating</Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
