import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, FileSearch, CheckCircle2 } from 'lucide-react';
import type { SOCReport, SOCReportEvaluation } from '@shared/types';

interface SOCReviewDialogProps {
  report: SOCReport;
  isOpen: boolean;
  onClose: () => void;
  onSave: (evaluation: SOCReportEvaluation) => void;
}

export function SOCReviewDialog({ report, isOpen, onClose, onSave }: SOCReviewDialogProps) {
  const [evaluation, setEvaluation] = React.useState<SOCReportEvaluation>(
    report.evaluation || {
      scopeAlignment: false,
      periodAlignment: false,
      methodologyAlignment: false,
      hasIneffectiveControls: false,
      compensatingControlsTested: false,
      auditorOpinion: ""
    }
  );

  const handleToggle = (key: keyof SOCReportEvaluation) => {
    setEvaluation(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            Review SOC Report: {report.vendorName}
          </DialogTitle>
          <DialogDescription>
            Validation of control design and operations outsourced to Third Parties (Chapter III.4.3).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border">
             <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Vendor</Label>
                <p className="text-sm font-semibold">{report.vendorName}</p>
             </div>
             <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Type</Label>
                <p className="text-sm font-semibold">{report.reportType}</p>
             </div>
             <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Period</Label>
                <p className="text-xs">{new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}</p>
             </div>
             <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Issuer</Label>
                <p className="text-xs font-mono">{report.issuer}</p>
             </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold border-b pb-1">Compliance Checklist</h4>
            
            <div className="space-y-3">
              <CheckItem 
                id="scope" 
                label="Scope Alignment" 
                desc="Controls tested by the SO align with the company's identified needs."
                checked={evaluation.scopeAlignment}
                onChecked={() => handleToggle('scopeAlignment')}
              />
              <CheckItem 
                id="period" 
                label="Period Alignment" 
                desc="Time period in the SOC Report aligns with the company's ICOFR coverage period."
                checked={evaluation.periodAlignment}
                onChecked={() => handleToggle('periodAlignment')}
              />
              <CheckItem 
                id="method" 
                label="Methodology Alignment" 
                desc="Independent auditor's testing methods align with company internal standards."
                checked={evaluation.methodologyAlignment}
                onChecked={() => handleToggle('methodologyAlignment')}
              />
              <CheckItem 
                id="ineffective" 
                label="Ineffective Controls Found?" 
                desc="Are there ineffective control findings within the SOC report?"
                checked={evaluation.hasIneffectiveControls}
                onChecked={() => handleToggle('hasIneffectiveControls')}
              />
              {evaluation.hasIneffectiveControls && (
                <div className="ml-6 p-3 bg-amber-50 border border-amber-100 rounded-md animate-in slide-in-from-top-2">
                  <CheckItem 
                    id="comp" 
                    label="Compensating Controls Tested?" 
                    desc="Has internal compensating control testing been performed to mitigate SO findings?"
                    checked={evaluation.compensatingControlsTested}
                    onChecked={() => handleToggle('compensatingControlsTested')}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Conclusion & Auditor Opinion (Line 2)</Label>
            <Textarea 
              placeholder="Enter review summary and its impact on management assessment..."
              value={evaluation.auditorOpinion}
              onChange={(e) => setEvaluation(prev => ({ ...prev, auditorOpinion: e.target.value }))}
              className="min-h-[100px] text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(evaluation)} className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> Save Evaluation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckItem({ id, label, desc, checked, onChecked }: { id: string, label: string, desc: string, checked: boolean, onChecked: () => void }) {
  return (
    <div className="flex items-start space-x-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onChecked} className="mt-1" />
      <div className="grid gap-1 leading-none">
        <Label htmlFor={id} className="text-sm font-medium leading-none cursor-pointer">
          {label}
        </Label>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
}
