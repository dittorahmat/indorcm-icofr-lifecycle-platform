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
            Validasi rancangan dan operasi pengendalian yang dialihkan kepada Pihak Ketiga (Bab III.4.3).
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
                desc="Pengendalian yang diuji oleh SO sesuai dengan hasil identifikasi kebutuhan perusahaan."
                checked={evaluation.scopeAlignment}
                onChecked={() => handleToggle('scopeAlignment')}
              />
              <CheckItem 
                id="period" 
                label="Period Alignment" 
                desc="Periode waktu dalam SOC Report sesuai dengan periode cakupan ICOFR perusahaan."
                checked={evaluation.periodAlignment}
                onChecked={() => handleToggle('periodAlignment')}
              />
              <CheckItem 
                id="method" 
                label="Methodology Alignment" 
                desc="Metode pengujian auditor independen sejalan dengan standar internal perusahaan."
                checked={evaluation.methodologyAlignment}
                onChecked={() => handleToggle('methodologyAlignment')}
              />
              <CheckItem 
                id="ineffective" 
                label="Ineffective Controls Found?" 
                desc="Apakah terdapat temuan kontrol yang tidak efektif dalam laporan SOC tersebut?"
                checked={evaluation.hasIneffectiveControls}
                onChecked={() => handleToggle('hasIneffectiveControls')}
              />
              {evaluation.hasIneffectiveControls && (
                <div className="ml-6 p-3 bg-amber-50 border border-amber-100 rounded-md animate-in slide-in-from-top-2">
                  <CheckItem 
                    id="comp" 
                    label="Compensating Controls Tested?" 
                    desc="Sudahkah dilakukan pengujian atas compensating control internal untuk memitigasi temuan SO?"
                    checked={evaluation.compensatingControlsTested}
                    onChecked={() => handleToggle('compensatingControlsTested')}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Kesimpulan & Opini Auditor (Lini 2)</Label>
            <Textarea 
              placeholder="Masukkan ringkasan hasil reviu dan dampaknya terhadap asesmen manajemen..."
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
