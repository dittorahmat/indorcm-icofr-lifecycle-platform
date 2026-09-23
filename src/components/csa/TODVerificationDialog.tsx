import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  ShieldCheck, 
  Info, 
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Target
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Control, TODEvaluation, RCM } from '@shared/types';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TODDesignContextFields } from './TODDesignContextFields';
import { TODEvaluationFormSection } from './TODEvaluationFormSection';

const combinedSchema = z.object({
  // RCM Fields (Editable for Design Sync/Verification)
  riskDescription: z.string().nullable().optional(),
  isFraudRelated: z.boolean(),
  riskRating: z.string().nullable().optional(),
  mappedControlName: z.string().min(1, "Nama kontrol wajib diisi"),
  mappedControlDescription: z.string().nullable().optional(),
  supportingDocs: z.string().nullable().optional(),
  isKeyControl: z.boolean(),
  controlType: z.string().nullable().optional(), // Preventif / Detektif
  controlNature: z.string().nullable().optional(),
  automatedSubNature: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  supportingApp: z.string().nullable().optional(),
  executingFunction: z.string().nullable().optional(),
  executorRole: z.string().nullable().optional(),
  affectedFsliItem: z.string().nullable().optional(),
  effectivePeriod: z.string().nullable().optional(),
  
  ipoC: z.boolean(),
  ipoA: z.boolean(),
  ipoV: z.boolean(),
  ipoRa: z.boolean(),
  assertionE: z.boolean(),
  assertionC: z.boolean(),
  assertionA: z.boolean(),
  assertionCo: z.boolean(),
  assertionVa: z.boolean(),
  assertionRo: z.boolean(),
  assertionPd: z.boolean(),

  // TOD Assessment Fields (Free-text justification)
  pilarObjective: z.string().min(1, "Justifikasi wajib diisi"),
  pilarTiming: z.string().min(1, "Justifikasi wajib diisi"),
  pilarAuthority: z.string().min(1, "Justifikasi wajib diisi"),
  pilarReliability: z.string().min(1, "Justifikasi wajib diisi"),
  pilarCoverage: z.string().min(1, "Justifikasi wajib diisi"),
  pilarEvidence: z.string().min(1, "Justifikasi wajib diisi"),
  kkReference: z.string().optional(),
  conclusion: z.enum(['Effective', 'Ineffective']),
  comment: z.string().optional(),
});

type CombinedFormValues = z.infer<typeof combinedSchema>;

interface TODVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  control: any | null; // Use any for mapping flexibility
  csaId: string;
  initialData?: TODEvaluation | null;
  onSave: (values: CombinedFormValues) => void;
  isPending?: boolean;
}

export function TODVerificationDialog({
  open,
  onOpenChange,
  control,
  csaId,
  initialData,
  onSave,
  isPending
}: TODVerificationDialogProps) {
  const { t } = useTranslation(['rcm', 'csa_hub', 'common']);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = React.useState(false);
  
  const form = useForm<CombinedFormValues>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      isFraudRelated: false,
      ipoC: false,
      ipoA: false,
      ipoV: false,
      ipoRa: false,
      assertionE: false,
      assertionC: false,
      assertionA: false,
      assertionCo: false,
      assertionVa: false,
      assertionRo: false,
      assertionPd: false,
      conclusion: 'Effective',
    }
  });

  const { formState: { isDirty, errors } } = form;

  // Fetch RCM context for this mapping
  const { data: rcmMapping } = useQuery({
    queryKey: ['rcm-mapping-context', control?.mappingId],
    queryFn: () => api<any>(`/api/rcm-matrix/tlc/mapping/${control?.mappingId}`),
    enabled: !!control?.mappingId && open
  });

  // Sync form when RCM or TOD data arrives
  React.useEffect(() => {
    if (open && rcmMapping) {
        form.reset({
          // From RCM Mapping
          riskDescription: rcmMapping.riskDescription ?? '',
          isFraudRelated: !!rcmMapping.isFraudRelated,
          riskRating: rcmMapping.riskRating ?? 'Medium',
          mappedControlName: rcmMapping.mappedControlName ?? rcmMapping.baseControlName ?? '',
          mappedControlDescription: rcmMapping.mappedControlDescription ?? rcmMapping.baseControlDescription ?? '',
          supportingDocs: rcmMapping.supportingDocs ?? '',
          isKeyControl: !!rcmMapping.isKeyControl,
          controlType: rcmMapping.controlType ?? '',
          controlNature: rcmMapping.controlNature ?? '',
          automatedSubNature: rcmMapping.automatedSubNature ?? '',
          frequency: rcmMapping.frequency ?? '',
          supportingApp: rcmMapping.supportingApp ?? '',
          executingFunction: rcmMapping.executingFunction ?? '',
          executorRole: rcmMapping.executorRole ?? '',
          affectedFsliItem: rcmMapping.affectedFsliItem ?? '',
          effectivePeriod: rcmMapping.effectivePeriod ?? '',

          ipoC: !!rcmMapping.ipoC,
          ipoA: !!rcmMapping.ipoA,
          ipoV: !!rcmMapping.ipoV,
          ipoRa: !!rcmMapping.ipoRa,
          assertionE: !!rcmMapping.assertionE,
          assertionC: !!rcmMapping.assertionC,
          assertionA: !!rcmMapping.assertionA,
          assertionCo: !!rcmMapping.assertionCo,
          assertionVa: !!rcmMapping.assertionVa,
          assertionRo: !!rcmMapping.assertionRo,
          assertionPd: !!rcmMapping.assertionPd,

          // From initial TOD evaluation data
          pilarObjective: initialData?.pilarObjective ?? '',
          pilarTiming: initialData?.pilarTiming ?? '',
          pilarAuthority: initialData?.pilarAuthority ?? '',
          pilarReliability: initialData?.pilarReliability ?? '',
          pilarCoverage: initialData?.pilarCoverage ?? '',
          pilarEvidence: initialData?.pilarEvidence ?? '',
          kkReference: initialData?.kkReference ?? '',
          conclusion: (initialData?.conclusion as any) ?? 'Effective',
          comment: initialData?.comment ?? '',
        });
    }
  }, [initialData, rcmMapping, open, form]);

  useUnsavedChanges(isDirty && open);

  const onSubmit: SubmitHandler<CombinedFormValues> = (values) => {
    onSave(values);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val && isDirty) {
       setIsConfirmDiscardOpen(true);
       return;
    }
    onOpenChange(val);
  };

  if (!control) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[1200px] max-h-[95vh] overflow-hidden p-0 flex flex-col border-none shadow-2xl">
          <DialogHeader className="p-6 bg-mancity-pattern text-primary-foreground shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-primary/20 rounded-lg shadow-sm border border-white/20">
                  <ShieldCheck className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight uppercase text-primary-foreground">
                    {t('csa_hub:tod.title')}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                     <Badge variant="outline" className="bg-white/90 border-transparent text-primary-foreground font-bold text-xs py-0">{t('csa_hub:tod.badgeSync')}</Badge>
                     <p className="text-primary-foreground/60 text-xs font-medium tracking-wide uppercase">{t('csa_hub:tod.subtitle')}</p>
                  </div>
                  </div>
                  </div>
                  <div className="text-right hidden md:block">
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('csa_hub:tod.controlReference')}</div>
                  <div className="text-xl font-black tracking-tighter text-primary">{rcmMapping?.controlCode || '-'}</div>
                  </div>
                  </div>
                  </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Column: Editable Design Context (RCM) */}
              <ScrollArea className="w-full md:w-1/2 border-r bg-slate-50/50">
                <TODDesignContextFields form={form} />
              </ScrollArea>

              {/* Right Column: Assessment (Interactive) */}
              <ScrollArea className="w-full md:w-1/2 bg-white shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.02)]">
                <TODEvaluationFormSection
                  form={form}
                  onCancel={() => handleOpenChange(false)}
                  isPending={isPending}
                />
              </ScrollArea>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDiscardOpen} onOpenChange={setIsConfirmDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:unsavedChanges.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common:unsavedChanges.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDiscardOpen(false)}>
              {t('common:unsavedChanges.stay')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setIsConfirmDiscardOpen(false);
                form.reset();
                onOpenChange(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {t('common:unsavedChanges.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
