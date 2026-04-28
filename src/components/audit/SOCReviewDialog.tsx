import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileSearch, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { SOCReport, SOCEvaluation } from '@shared/types';

interface SOCReviewDialogProps {
  report: SOCReport;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function SOCReviewDialog({ report, isOpen, onClose, onSave }: SOCReviewDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState<Partial<SOCEvaluation>>(
    report.evaluation || {
      attrA: false,
      attrB: false,
      attrC: false,
      attrD: false,
      attrE: false,
      attrF: false,
      attrG: false,
      auditorOpinion: ""
    }
  );

  const mutation = useMutation({
    mutationFn: (data: Partial<SOCEvaluation>) => api(`/api/soc-reports/${report.id}/evaluate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soc-reports'] });
      toast.success('Evaluation saved successfully');
      onSave();
    },
  });

  const handleToggle = (key: keyof SOCEvaluation) => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            Review SOC Report: {report.vendorName}
          </DialogTitle>
          <DialogDescription>
            7 Mandatory Compliance Criteria as per Regulation SK-5/2024 (Page 40).
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
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Period End</Label>
                <p className="text-xs">{new Date(report.periodEnd).toLocaleDateString()}</p>
             </div>
             <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Status</Label>
                <p className="text-xs font-bold uppercase">{report.status}</p>
             </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold border-b pb-1">Lampiran 3.2.c.5 Checklist</h4>
            
            <div className="grid gap-4">
              <CheckItem 
                id="a" 
                label="a. SO Obligation for Internal Control" 
                desc="Apakah SO berkewajiban memiliki pengendalian memadai sesuai kontrak?"
                checked={!!formData.attrA}
                onChecked={() => handleToggle('attrA')}
              />
              <CheckItem 
                id="b" 
                label="b. Design Evaluation Capability" 
                desc="Dapatkah perusahaan mengevaluasi desain pengendalian SO?"
                checked={!!formData.attrB}
                onChecked={() => handleToggle('attrB')}
              />
              <CheckItem 
                id="c" 
                label="c. Compensating Controls Availability" 
                desc="Apakah terdapat compensating control jika kontrol SO tidak efektif?"
                checked={!!formData.attrC}
                onChecked={() => handleToggle('attrC')}
              />
              <CheckItem 
                id="d" 
                label="d. Remediation Obligation" 
                desc="Apakah ada kewajiban SO melakukan remediasi atas temuan audit?"
                checked={!!formData.attrD}
                onChecked={() => handleToggle('attrD')}
              />
              <CheckItem 
                id="e" 
                label="e. Notification Lead Time" 
                desc="SO wajib menginformasikan kegagalan kontrol dalam durasi tertentu."
                checked={!!formData.attrE}
                onChecked={() => handleToggle('attrE')}
              />
              <CheckItem 
                id="f" 
                label="f. Testing Rights" 
                desc="Dapatkah perusahaan menguji efektivitas kontrol utama pada SO?"
                checked={!!formData.attrF}
                onChecked={() => handleToggle('attrF')}
              />
              <CheckItem 
                id="g" 
                label="g. External Auditor Testing" 
                desc="Apakah SO mengizinkan pengujian oleh Auditor Eksternal perusahaan?"
                checked={!!formData.attrG}
                onChecked={() => handleToggle('attrG')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-bold">Conclusion & Auditor Opinion (Line 2)</Label>
            <Textarea 
              placeholder="Enter review summary and its impact on management assessment..."
              value={formData.auditorOpinion}
              onChange={(e) => setFormData(prev => ({ ...prev, auditorOpinion: e.target.value }))}
              className="min-h-[100px] text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => mutation.mutate(formData)} 
            className="gap-2"
            disabled={mutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4" /> {mutation.isPending ? "Saving..." : "Save Evaluation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CheckItem({ id, label, desc, checked, onChecked }: { id: string, label: string, desc: string, checked: boolean, onChecked: () => void }) {
  return (
    <div className="flex items-start space-x-3 border-l-4 border-slate-100 pl-3 py-1 hover:border-indigo-400 transition-colors">
      <Checkbox id={id} checked={checked} onCheckedChange={onChecked} className="mt-1" />
      <div className="grid gap-1 leading-none">
        <Label htmlFor={id} className="text-sm font-bold leading-none cursor-pointer">
          {label}
        </Label>
        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
          {desc}
        </p>
      </div>
    </div>
  );
}
