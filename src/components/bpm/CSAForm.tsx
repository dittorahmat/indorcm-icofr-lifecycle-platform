import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  FileText, MapPin, LayoutDashboard, Plus, Database,
  UploadCloud, Check, Eye, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCsaReference } from '@/lib/csa-utils';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { CSAFormValues } from '@/hooks/use-csa';
import { useSampleStepper } from './csa/use-sample-stepper';
import { SampleEvidenceCard } from './csa/SampleEvidenceCard';
import { CSAFormFooter } from './csa/CSAFormFooter';

interface CSAFormProps {
  form: UseFormReturn<any>;
  onSubmit: (values: CSAFormValues) => void;
  onSaveDraft: () => void;
  onBackToList: () => void;
  onPrint: (layout: 'detailed' | 'summary') => void;
  onFileUpload: (sIdx: number, cId: string) => void;
  onCameraUpload?: (sIdx: number, cId: string) => void;
  failedUploadRow?: { sIdx: number; cId: string } | null;
  onRetryUpload?: () => void;
  isReadOnly: boolean;
  isAuthenticating: boolean;
  isPending: boolean;
  activeControls: any[];
  bpmRiskControlPairs: any[];
  watchSamples: any[];
  fields: any[];
  append: (data: any) => void;
  anyPointFailed: boolean;
  activeUploadRow: { sIdx: number; cId: string } | null;
  getFileNameFromUrl: (url: string) => string;
  bpmCode?: string;
  noGL?: string;
  bpmProcessId?: string;
  year?: string | number;
  hideLine2Actions?: boolean;
}

export function CSAForm({
  form, onSubmit, onSaveDraft, onBackToList, onPrint, onFileUpload,
  onCameraUpload, failedUploadRow, onRetryUpload,
  isReadOnly, isAuthenticating, isPending, activeControls, bpmRiskControlPairs,
  watchSamples, fields, append, anyPointFailed, activeUploadRow, getFileNameFromUrl,
  bpmCode, noGL, bpmProcessId, year, hideLine2Actions = false
}: CSAFormProps) {
  const { t } = useTranslation();

  // Mobile stepper state (UI-only; form state stays in useCSA).
  const stepCount = fields.length;
  const { mobileStep: safeStep, setMobileStep } = useSampleStepper(stepCount);
  const activeStepSample = watchSamples[safeStep];

  const handleAddSample = () => {
    const controlResults: Record<string, any> = {};
    activeControls.forEach(ctrl => {
      const pair = bpmRiskControlPairs.find(p => p.controlId === ctrl.id);
      controlResults[ctrl.id] = {
        implemented: false,
        riskId: pair?.riskId || '',
        riskName: pair?.riskName || ctrl.description || 'N/A',
        controlName: pair?.controlName || ctrl.name || 'N/A',
        evidenceUrl: '',
        comment: ''
      };
    });
    append({ sampleRef: '', controlResults });
    setMobileStep(stepCount);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-lg border border-slate-100 shadow-inner">
            <div className="flex flex-col justify-center space-y-1">
              <span className="text-xs font-black uppercase text-slate-400">
                {t('csa_hub:form.referenceCodeLabel')}
              </span>
              <div className="flex items-center h-9 px-3 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-indigo-700 shadow-xs truncate">
                {formatCsaReference({
                  bpmCode,
                  noGL,
                  bpmProcessId,
                  year,
                  period: form.watch('period')
                })}
              </div>
            </div>

            <FormField control={form.control} name="period" render={({ field: f }) => {
              const currentYear = year || new Date().getFullYear().toString();
              const q1Val = `${currentYear}-Q1`;
              const q2Val = `${currentYear}-Q2`;
              const q3Val = `${currentYear}-Q3`;
              const q4Val = `${currentYear}-Q4`;
              const standardVals = [q1Val, q2Val, q3Val, q4Val];
              const isCustomVal = f.value && !standardVals.includes(f.value);

              return (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-black uppercase text-slate-400">
                    {t('csa_hub:form.periodLabel')}
                  </FormLabel>
                  <Select 
                    value={f.value} 
                    onValueChange={f.onChange} 
                    disabled={isReadOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9 min-h-[44px] font-bold text-base md:text-xs bg-white">
                        <SelectValue placeholder={t('csa_hub:form.selectQuarter')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={q1Val} className="text-xs font-bold">{t('csa_hub:form.quarters.q1')}</SelectItem>
                      <SelectItem value={q2Val} className="text-xs font-bold">{t('csa_hub:form.quarters.q2')}</SelectItem>
                      <SelectItem value={q3Val} className="text-xs font-bold">{t('csa_hub:form.quarters.q3')}</SelectItem>
                      <SelectItem value={q4Val} className="text-xs font-bold">{t('csa_hub:form.quarters.q4')}</SelectItem>
                      {isCustomVal && (
                        <SelectItem value={f.value} className="text-xs font-bold">{f.value}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>
              );
            }} />

            <div className="col-span-1 md:col-span-2">
              <FormField control={form.control} name="result" render={({ field: f }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-black uppercase text-slate-400">{t('csa_hub:form.resultLabel')}</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={f.onChange} value={f.value} className="flex gap-4 pt-1" disabled={isReadOnly}>
                      {['Effective', 'Ineffective', 'No Transaction'].map(res => (
                        <div key={res} className="flex items-center space-x-2">
                          <RadioGroupItem value={res} id={res} disabled={res === 'Effective' && anyPointFailed} />
                          <label htmlFor={res} className={cn("text-xs font-bold", res === 'Effective' ? "text-green-700" : "text-red-700")}>
                            {t(`csa_hub:form.${res.toLowerCase().replace(' ', '')}` as any)}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )} />
            </div>
          </div>

          <FormField control={form.control} name="isBpmConfirmed" render={({ field: f }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <FormControl>
                <Checkbox checked={f.value} onCheckedChange={f.onChange} disabled={isReadOnly} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-xs font-bold text-slate-900 cursor-pointer">
                  {t('csa_hub:form.bpmConfirmTitle', { defaultValue: 'Konfirmasi Konsistensi BPM' })}
                </FormLabel>
                <p className="text-xs text-slate-700 leading-tight">
                  {t('csa_hub:form.bpmConfirmDesc', { defaultValue: 'Sesuai regulasi SK-5 Bab IV Bagian 2.2a, saya mengonfirmasi alur proses dan narasi kontrol masih sesuai dengan kondisi riil.' })}
                </p>
              </div>
            </FormItem>
          )} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 bg-slate-50/50 border border-slate-200 rounded-lg">
            <FormField control={form.control} name="testProcedure" render={({ field: f }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                   <FileText className="h-3 w-3" /> {t('csa_hub:appendix7a.testProcedure')}
                </FormLabel>
                <FormControl><Textarea {...f} disabled={isReadOnly} className="min-h-[100px] text-base md:text-xs bg-white" placeholder={t('csa_hub:appendix7a.procedurePlaceholder')} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="archiveLocation" render={({ field: f }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                   <MapPin className="h-3 w-3" /> {t('csa_hub:appendix7a.archiveLocation')}
                </FormLabel>
                <FormControl><Input {...f} disabled={isReadOnly} className="h-10 min-h-[44px] text-base md:text-xs bg-white" placeholder={t('csa_hub:appendix7a.locationPlaceholder')} /></FormControl>
                <FormMessage />
                <p className="text-xs text-slate-400 mt-2">{t('csa_hub:appendix7a.archiveNote')}</p>
              </FormItem>
            )} />
          </div>
        </div>

        {/* DESKTOP VIEW: Sample matrix */}
        <div className="hidden md:block">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-2">
            <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2 min-w-0">
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{t('csa_hub:form.summaryTitle')}</span>
            </h4>
            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
              {!isReadOnly && (
                <Button 
                type="button"
                onClick={handleAddSample}
                variant="outline"
                size="sm"
                className="h-11 sm:h-9 min-h-[44px] sm:min-h-0 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 w-full min-[420px]:w-auto justify-center"
                >
                <Plus className="h-3.5 w-3.5 mr-1 shrink-0" /> {t('csa_hub:form.addManualSample')}
                </Button>
                )}
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs font-bold">
                  {t('csa_hub:form.quickToggle')}
                </Badge>
                </div>
                </div>
                <div className="border rounded-lg overflow-x-auto max-w-full touch-pan-x overscroll-x-contain shadow-sm">
                <Table>
                <TableHeader className="bg-slate-50">
                <TableRow className="divide-x">
                <TableHead className="w-10 text-xs font-bold">#</TableHead>
                <TableHead className="text-xs font-bold min-w-[200px]">{t('csa_hub:form.sampleReference')}</TableHead>
                <TooltipProvider>
                  {activeControls.map(ctrl => (
                    <TableHead key={ctrl.id} className="text-xs font-black text-center uppercase tracking-tighter w-24">
                      <Tooltip>
                        <TooltipTrigger className="w-full h-full cursor-help line-clamp-2 text-left leading-tight">
                          {ctrl.name}
                        </TooltipTrigger>
                        <TooltipContent className="bg-mancity-pattern text-primary-foreground p-2 text-xs max-w-xs">
                          <p className="font-bold">[{ctrl.code}] {ctrl.name}</p>
                          <p className="opacity-80 mt-1">{ctrl.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                  ))}
                </TooltipProvider>
                </TableRow>
                </TableHeader>
                <TableBody>
                {fields.map((field, sIdx) => (
                <TableRow key={field.id} className="divide-x hover:bg-slate-50/50 transition-colors">
                  <TableCell className="text-xs font-bold text-slate-400 text-center">{sIdx + 1}</TableCell>
                  <TableCell className="text-xs font-medium py-1 px-3">
                    <FormField control={form.control} name={`samples.${sIdx}.sampleRef`} render={({ field: f }) => (
                      <Input 
                        {...f} 
                        disabled={isReadOnly} 
                        className="h-8 text-xs font-bold border-transparent hover:border-slate-200 focus:border-slate-400 bg-transparent transition-all"
                        placeholder={t('csa_hub:form.typeReference')}
                      />
                    )} />
                    <div className="text-xs text-slate-400 px-3">{t('csa_hub:form.mobile.idLabel', { defaultValue: 'ID' })}: {field.glRowId?.substring(0,8) || t('csa_hub:form.manualEntry')}</div>
                  </TableCell>
                  {activeControls.map(ctrl => (
                    <TableCell key={ctrl.id} className="text-center p-0">
                      <FormField control={form.control} name={`samples.${sIdx}.controlResults.${ctrl.id}.implemented`} render={({ field: f }) => (
                        <div className="flex items-center justify-center h-full min-h-[40px]">
                          <Checkbox 
                            checked={f.value} 
                            onCheckedChange={f.onChange} 
                            disabled={isReadOnly} 
                            className={cn("h-5 w-5", f.value ? "text-green-600 border-green-600" : "text-slate-300")}
                          />
                        </div>
                      )} />
                    </TableCell>
                  ))}
                </TableRow>
                ))}
                </TableBody>
                </Table>
                </div>
                </div>
                </div>

                {/* MOBILE VIEW: Sample stepper (one sample per screen) */}
                <div className="md:hidden space-y-4" data-testid="csa-sample-stepper">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                      <LayoutDashboard className="h-3.5 w-3.5" /> {t('csa_hub:form.summaryTitle')}
                    </h4>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs font-bold shrink-0">
                      {t('csa_hub:form.mobile.sampleOf', { current: stepCount === 0 ? 0 : safeStep + 1, total: stepCount, defaultValue: `Sample ${stepCount === 0 ? 0 : safeStep + 1} of ${stepCount}` })}
                    </Badge>
                  </div>

                  {stepCount === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-3">
                      <p className="text-xs font-medium text-slate-500">
                        {t('csa_hub:form.mobile.noSamples', { defaultValue: 'No samples yet. Add a sample to start field assessment.' })}
                      </p>
                      {!isReadOnly && (
                        <Button type="button" onClick={handleAddSample} className="min-h-[44px] text-xs font-bold gap-2">
                          <Plus className="h-4 w-4" /> {t('csa_hub:form.addManualSample')}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMobileStep(safeStep - 1)}
                          disabled={safeStep === 0}
                          aria-label={t('csa_hub:form.mobile.prev', { defaultValue: 'Back' })}
                          className="min-h-[44px] min-w-[44px] shrink-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Select value={String(safeStep)} onValueChange={(v) => setMobileStep(Number(v))} disabled={isReadOnly && false}>
                          <SelectTrigger className="flex-1 min-h-[44px] text-xs font-bold bg-white" aria-label={t('csa_hub:form.mobile.jumpTo', { defaultValue: 'Jump to sample' })}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fields.map((field, idx) => (
                              <SelectItem key={field.id} value={String(idx)} className="text-xs font-bold">
                                {watchSamples[idx]?.sampleRef || t('csa_hub:form.emptyReference')} ({idx + 1}/{stepCount})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setMobileStep(safeStep + 1)}
                          disabled={safeStep >= stepCount - 1}
                          aria-label={t('csa_hub:form.mobile.next', { defaultValue: 'Next' })}
                          className="min-h-[44px] min-w-[44px] shrink-0"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <FormField control={form.control} name={`samples.${safeStep}.sampleRef`} render={({ field: f }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-black uppercase text-slate-400">
                            {t('csa_hub:form.sampleReference')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...f}
                              disabled={isReadOnly}
                              className="min-h-[44px] text-xs font-bold bg-white"
                              placeholder={t('csa_hub:form.typeReference')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      {activeControls.map(ctrl => {
                        const res: any = activeStepSample?.controlResults?.[ctrl.id] ?? {};
                        const isUploading = isPending && activeUploadRow?.sIdx === safeStep && activeUploadRow?.cId === ctrl.id;
                        const isFailed = failedUploadRow?.sIdx === safeStep && failedUploadRow?.cId === ctrl.id;
                        return (
                          <SampleEvidenceCard
                            key={ctrl.id}
                            form={form}
                            safeStep={safeStep}
                            ctrl={ctrl}
                            res={res}
                            isReadOnly={isReadOnly}
                            isPending={isPending}
                            isUploading={isUploading}
                            isFailed={isFailed}
                            onCameraUpload={onCameraUpload}
                            onFileUpload={onFileUpload}
                            onRetryUpload={onRetryUpload}
                            getFileNameFromUrl={getFileNameFromUrl}
                          />
                        );
                      })}

                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-600 text-xs font-black uppercase tracking-wider">
                          {Object.values(activeStepSample?.controlResults ?? {}).filter((r: any) => r.implemented).length} {t('csa_hub:form.passed', { defaultValue: 'PASSED' })}
                        </Badge>
                        <Badge className="bg-red-600 text-xs font-black uppercase tracking-wider">
                          {Object.values(activeStepSample?.controlResults ?? {}).filter((r: any) => !r.implemented).length} {t('csa_hub:form.deficiency', { defaultValue: 'DEFICIENCY' })}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>

                {/* DESKTOP VIEW: Verification detail */}
                <div className="hidden md:block">
                <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                <Database className="h-3.5 w-3.5" /> {t('csa_hub:form.verificationTitle')}
                </h4>
                <div className="flex gap-2">
                <Badge className="bg-emerald-600 text-xs font-black uppercase tracking-wider">
                {watchSamples.reduce((acc, s) => acc + Object.values(s.controlResults).filter((r: any) => r.implemented).length, 0)} {t('csa_hub:form.passed')}
                </Badge>
                <Badge className="bg-red-600 text-xs font-black uppercase tracking-wider">
                {watchSamples.reduce((acc, s) => acc + Object.values(s.controlResults).filter((r: any) => !r.implemented).length, 0)} {t('csa_hub:form.deficiency')}
                </Badge>
                </div>
                </div>

                <div className="border rounded-lg overflow-hidden shadow-md">
                <Table>
                <TableHeader className="bg-mancity-pattern text-primary-foreground">
                <TableRow className="divide-x divide-white/10 hover:bg-transparent">
                <TableHead className="text-xs font-black text-primary-foreground py-4 px-4 min-w-[200px]">{t('csa_hub:form.table.transactionDetail')}</TableHead>
                <TableHead className="text-xs font-black text-primary-foreground">{t('csa_hub:form.table.riskName')}</TableHead>
                <TableHead className="text-xs font-black text-primary-foreground">{t('csa_hub:form.table.controlName')}</TableHead>
                <TableHead className="text-xs font-black text-primary-foreground text-center w-32">{t('csa_hub:form.table.evidence')}</TableHead>
                <TableHead className="text-xs font-black text-primary-foreground min-w-[200px]">{t('csa_hub:form.table.notes')}</TableHead>
                <TableHead className="text-xs font-black text-primary-foreground text-center w-24">{t('csa_hub:form.table.pass')}</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {watchSamples.map((sample, sIdx) => (
                <React.Fragment key={`${sample.glRowId || 'manual'}-${sIdx}`}>
                  <TableRow className="bg-slate-100/50 hover:bg-slate-100 border-t-2 border-slate-200">
                    <TableCell colSpan={6} className="py-2 px-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-white text-slate-700 border-slate-300 font-black px-2 py-0.5">{t('csa_hub:page.table.samples').toUpperCase()} #{sIdx + 1}</Badge>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                              {sample.sampleRef || t('csa_hub:form.emptyReference')}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">{t('csa_hub:form.mobile.idLabel', { defaultValue: 'ID' })}: {sample.glRowId || t('csa_hub:form.manualEntry')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="flex -space-x-1 overflow-hidden">
                            {Object.values(sample.controlResults).map((res: any, idx) => (
                              <div key={idx} className={cn(
                                "inline-block h-3 w-3 rounded-full ring-2 ring-white",
                                res.implemented ? "bg-emerald-500" : "bg-red-500"
                              )} />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                            {Object.values(sample.controlResults).filter((r: any) => r.implemented).length} / {Object.values(sample.controlResults).length} {t('csa_hub:form.passed')}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>

                  {Object.entries(sample.controlResults).map(([cId, res]: [string, any]) => (
                    <TableRow 
                      key={`${sample.glRowId || 'manual'}-${sIdx}-${cId}`} 
                      className={cn(
                        "divide-x border-b transition-colors",
                        res.implemented ? "bg-white" : "bg-red-50/50"
                      )}
                    >
                      <TableCell className="py-3 px-4 bg-slate-50/30 w-48">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            res.implemented ? "bg-emerald-500" : "bg-red-500"
                          )} />
                          <span className="font-bold text-xs text-slate-500 uppercase tracking-wider truncate">
                            {t('csa_hub:form.pointVerification')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-600">
                        {res.riskName || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-xs text-slate-800">{res.controlName || "N/A"}</span>
                          <Badge variant="outline" className="w-fit text-xs h-4 font-mono">{cId}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center justify-center gap-1.5">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      type="button"
                                      variant={res.evidenceUrl ? "secondary" : "outline"} 
                                      size="icon" 
                                      className={cn(
                                        "h-8 w-8 rounded-lg transition-all", 
                                        res.evidenceUrl ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" : "border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-primary"
                                      )}
                                      onClick={() => !isReadOnly && onFileUpload(sIdx, cId)}
                                      disabled={isReadOnly || isPending}
                                    >
                                      {isPending && activeUploadRow?.sIdx === sIdx && activeUploadRow?.cId === cId ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : res.evidenceUrl ? (
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <UploadCloud className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isReadOnly ? t('csa_hub:form.mobile.readonlyNote', { defaultValue: 'Record sudah di-signoff (Read-only)' }) : (res.evidenceUrl ? t('csa_hub:form.mobile.replaceEvidence', { defaultValue: 'Ganti bukti (Re-upload)' }) : t('csa_hub:form.mobile.uploadEvidence', { defaultValue: 'Unggah bukti' }))}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {res.evidenceUrl && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        type="button"
                                        variant="default" 
                                        size="icon" 
                                        className="h-8 w-8 rounded-lg bg-mancity-pattern hover:opacity-90 text-primary-foreground shadow-sm"
                                        onClick={() => window.open(res.evidenceUrl, '_blank')}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {t('csa_hub:form.mobile.viewEvidence', { defaultValue: 'Lihat Bukti (Preview)' })}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>

                            {res.evidenceUrl && (
                              <div 
                                className="max-w-[80px] truncate text-xs text-emerald-700 font-bold uppercase tracking-tighter" 
                                title={getFileNameFromUrl(res.evidenceUrl)}
                              >
                                {getFileNameFromUrl(res.evidenceUrl) || 'Attached'}
                              </div>
                            )}
                         </div>
                      </TableCell>
                      <TableCell>
                        <FormField control={form.control} name={`samples.${sIdx}.controlResults.${cId}.comment`} render={({ field: f }) => (
                          <Input 
                            {...f} 
                            disabled={isReadOnly} 
                            className="h-8 text-xs border-transparent hover:border-slate-200 focus:border-slate-400 bg-transparent transition-all"
                            placeholder={t('common:placeholders.notes')}
                          />
                        )} />
                      </TableCell>
                      <TableCell className="text-center">
                        <FormField control={form.control} name={`samples.${sIdx}.controlResults.${cId}.implemented`} render={({ field: f }) => (
                          <div className="flex items-center justify-center">
                            <Checkbox 
                              checked={f.value} 
                              onCheckedChange={f.onChange} 
                              disabled={isReadOnly} 
                              className={cn("h-6 w-6", f.value ? "text-green-600 border-green-600" : "text-red-400 border-red-200")}
                            />
                          </div>
                        )} />
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
                ))}
                </TableBody>
                </Table>
                </div>

                <div className="flex justify-between items-center bg-slate-100 p-5 rounded-lg border border-slate-200 shadow-inner flex-wrap gap-2">
                <div className="flex gap-10">
                <div className="text-center border-r pr-10 border-slate-300">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('csa_hub:page.table.samples')}</p>
                <p className="text-2xl font-black text-slate-700">{watchSamples.length}</p>
                </div>
                <div className="text-center">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('csa_hub:form.mobile.progress', { defaultValue: 'Progress' })}</p>
                <p className="text-2xl font-black text-primary">
                  {watchSamples.reduce((acc, s) => acc + Object.values(s.controlResults).filter((r: any) => r.implemented || r.comment || r.evidenceUrl).length, 0)} / {watchSamples.reduce((acc, s) => acc + Object.keys(s.controlResults).length, 0)}
                </p>
                </div>
                </div>
                <div className="text-right">
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('csa_hub:form.documentationStatus')}</p>
                {(() => {
                const flatResults = watchSamples.flatMap(s => Object.values(s.controlResults) as any[]);
                const anyPassWithoutEvidence = flatResults.some(r => r.implemented && !r.evidenceUrl);
                const nothingDone = flatResults.every(r => !r.implemented && !r.evidenceUrl && !r.comment);
                if (nothingDone) return <p className="text-xl font-bold uppercase text-slate-400">{t('csa_hub:form.notStarted')}</p>;
                if (anyPassWithoutEvidence) return <p className="text-xl font-bold uppercase text-rose-600">{t('csa_hub:form.needEvidence')}</p>;
                return <p className="text-xl font-bold uppercase text-emerald-600">{t('csa_hub:form.readyToSign')}</p>;
                })()}
                </div>
                </div>
                </div>
                </div>

                <div className="pt-8 border-t space-y-6">
                <FormField control={form.control} name="comments" render={({ field: f }) => (
                <FormItem>
                <FormLabel className="text-xs font-black uppercase text-slate-400">{t('csa_hub:form.managementRationale')}</FormLabel>
                <FormControl><Textarea {...f} disabled={isReadOnly} className="min-h-[120px] text-sm shadow-sm" placeholder={t('csa_hub:form.rationalePlaceholder')} /></FormControl>
                <FormMessage />
                </FormItem>
                )} />

                <CSAFormFooter
                  isReadOnly={isReadOnly}
                  isPending={isPending}
                  isAuthenticating={isAuthenticating}
                  hasSamples={watchSamples.length > 0}
                  hideLine2Actions={hideLine2Actions}
                  onBackToList={onBackToList}
                  onPrint={onPrint}
                  onSaveDraft={onSaveDraft}
                />
                </div>
                </form>
              </Form>
            );
          }
