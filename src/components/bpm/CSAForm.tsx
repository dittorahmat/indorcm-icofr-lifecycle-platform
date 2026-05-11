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
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { 
  FileText, MapPin, LayoutDashboard, Plus, Database, 
  UploadCloud, Check, Eye, RefreshCw, ChevronLeft, ChevronDown, 
  UserCheck, Printer
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { CSAFormValues } from '@/hooks/useCSA';

interface CSAFormProps {
  form: UseFormReturn<any>;
  onSubmit: (values: CSAFormValues) => void;
  onSaveDraft: () => void;
  onBackToList: () => void;
  onPrint: (layout: 'detailed' | 'summary') => void;
  onFileUpload: (sIdx: number, cId: string) => void;
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
}

export function CSAForm({
  form, onSubmit, onSaveDraft, onBackToList, onPrint, onFileUpload,
  isReadOnly, isAuthenticating, isPending, activeControls, bpmRiskControlPairs,
  watchSamples, fields, append, anyPointFailed, activeUploadRow, getFileNameFromUrl
}: CSAFormProps) {
  const { t } = useTranslation();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
            <FormField control={form.control} name="period" render={({ field: f }) => (
              <FormItem><FormLabel className="text-[10px] font-black uppercase text-slate-400">Periode</FormLabel><FormControl><Input {...f} disabled={isReadOnly} className="h-9 font-bold text-xs" /></FormControl></FormItem>
            )} />
            <div className="col-span-2">
              <FormField control={form.control} name="result" render={({ field: f }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-[10px] font-black uppercase text-slate-400">Hasil Akhir (SK-5)</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={f.onChange} value={f.value} className="flex gap-4" disabled={isReadOnly}>
                      {['Effective', 'Ineffective', 'No Transaction'].map(res => (
                        <div key={res} className="flex items-center space-x-2">
                          <RadioGroupItem value={res} id={res} disabled={res === 'Effective' && anyPointFailed} />
                          <label htmlFor={res} className={cn("text-xs font-bold", res === 'Effective' ? "text-green-700" : "text-red-700")}>{res}</label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )} />
            </div>
          </div>

          <FormField control={form.control} name="isBpmConfirmed" render={({ field: f }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <FormControl>
                <Checkbox checked={f.value} onCheckedChange={f.onChange} disabled={isReadOnly} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-xs font-bold text-indigo-900 cursor-pointer">
                  Konfirmasi Konsistensi BPM
                </FormLabel>
                <p className="text-[10px] text-indigo-700 leading-tight">
                  Sesuai regulasi SK-5 Bab IV Bagian 2.2a, saya mengonfirmasi alur proses dan narasi kontrol masih sesuai dengan kondisi riil.
                </p>
              </div>
            </FormItem>
          )} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 border border-slate-200 rounded-xl">
            <FormField control={form.control} name="testProcedure" render={({ field: f }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                   <FileText className="h-3 w-3" /> {t('csa_hub:appendix7a.testProcedure')}
                </FormLabel>
                <FormControl><Textarea {...f} disabled={isReadOnly} className="min-h-[100px] text-xs bg-white" placeholder={t('csa_hub:appendix7a.procedurePlaceholder')} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="archiveLocation" render={({ field: f }) => (
              <FormItem className="col-span-1">
                <FormLabel className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                   <MapPin className="h-3 w-3" /> {t('csa_hub:appendix7a.archiveLocation')}
                </FormLabel>
                <FormControl><Input {...f} disabled={isReadOnly} className="h-10 text-xs bg-white" placeholder={t('csa_hub:appendix7a.locationPlaceholder')} /></FormControl>
                <FormMessage />
                <p className="text-[9px] text-slate-400 mt-2 italic">{t('csa_hub:appendix7a.archiveNote')}</p>
              </FormItem>
            )} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
              <LayoutDashboard className="h-3.5 w-3.5" /> 1. Summary Status Matrix
            </h4>
            <div className="flex items-center gap-2">
              {!isReadOnly && (
                <Button 
                  type="button"
                  onClick={() => {
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
                  }}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> {t('csa_hub:form.addManualSample')}
                </Button>
              )}
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-bold">
                Quick Pass/Fail Toggle
              </Badge>
            </div>
          </div>
          <div className="border rounded-xl overflow-x-auto shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="divide-x">
                  <TableHead className="w-10 text-[9px] font-bold">#</TableHead>
                  <TableHead className="text-[9px] font-bold min-w-[200px]">{t('csa_hub:form.sampleReference')}</TableHead>
                  <TooltipProvider>
                    {activeControls.map(ctrl => (
                      <TableHead key={ctrl.id} className="text-[9px] font-black text-center uppercase tracking-tighter w-24">
                        <Tooltip>
                          <TooltipTrigger className="w-full h-full cursor-help line-clamp-2 text-left leading-tight">
                            {ctrl.name}
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 text-white p-2 text-[10px] max-w-xs">
                            <p className="font-bold">[{ctrl.code}] {ctrl.name}</p>
                            <p className="opacity-80 mt-1 italic">{ctrl.description}</p>
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
                    <TableCell className="text-[10px] font-bold text-slate-400 text-center">{sIdx + 1}</TableCell>
                    <TableCell className="text-[10px] font-medium py-1 px-3">
                      <FormField control={form.control} name={`samples.${sIdx}.sampleRef`} render={({ field: f }) => (
                        <Input 
                          {...f} 
                          disabled={isReadOnly} 
                          className="h-8 text-[10px] font-bold border-transparent hover:border-slate-200 focus:border-indigo-400 bg-transparent transition-all"
                          placeholder={t('csa_hub:form.typeReference')}
                        />
                      )} />
                      <div className="text-[9px] text-slate-400 px-3">ID: {field.glRowId?.substring(0,8) || 'Manual'}</div>
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
              <Database className="h-3.5 w-3.5" /> 2. Detailed Verification & Evidence
            </h4>
            <div className="flex gap-2">
               <Badge className="bg-emerald-600 text-[9px] font-black uppercase tracking-wider">
                  {watchSamples.reduce((acc, s) => acc + Object.values(s.controlResults).filter((r: any) => r.implemented).length, 0)} Passed
               </Badge>
               <Badge className="bg-red-600 text-[9px] font-black uppercase tracking-wider">
                  {watchSamples.reduce((acc, s) => acc + Object.values(s.controlResults).filter((r: any) => !r.implemented).length, 0)} Deficiency
               </Badge>
            </div>
          </div>
          
          <div className="border rounded-xl overflow-hidden shadow-md">
            <Table>
              <TableHeader className="bg-slate-900 text-white">
                <TableRow className="divide-x divide-white/10 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black text-white py-4 px-4 min-w-[200px]">Transaction Detail</TableHead>
                  <TableHead className="text-[10px] font-black text-white">Risk Name</TableHead>
                  <TableHead className="text-[10px] font-black text-white">Control Name</TableHead>
                  <TableHead className="text-[10px] font-black text-white text-center w-32">Evidence</TableHead>
                  <TableHead className="text-[10px] font-black text-white min-w-[200px]">Keterangan</TableHead>
                  <TableHead className="text-[10px] font-black text-white text-center w-24">Pass?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {watchSamples.map((sample, sIdx) => (
                  <React.Fragment key={`${sample.glRowId || 'manual'}-${sIdx}`}>
                    <TableRow className="bg-slate-100/50 hover:bg-slate-100 border-t-2 border-slate-200">
                      <TableCell colSpan={6} className="py-2 px-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-white text-slate-700 border-slate-300 font-black px-2 py-0.5">SAMPEL #{sIdx + 1}</Badge>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                                {sample.sampleRef || "Empty Reference"}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">ID: {sample.glRowId || 'MANUAL-ENTRY'}</span>
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
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                              {Object.values(sample.controlResults).filter((r: any) => r.implemented).length} / {Object.values(sample.controlResults).length} PASSED
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
                            <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wider truncate">
                              POINT VERIFICATION
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px] font-medium text-slate-600 italic">
                          {res.riskName || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-xs text-slate-800">{res.controlName || "N/A"}</span>
                            <Badge variant="outline" className="w-fit text-[9px] h-4 font-mono">{cId}</Badge>
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
                                          res.evidenceUrl ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100" : "border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600"
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
                                      {isReadOnly ? "Record sudah di-signoff (Read-only)" : (res.evidenceUrl ? "Ganti bukti (Re-upload)" : "Unggah bukti")}
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
                                          className="h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                                          onClick={() => window.open(res.evidenceUrl, '_blank')}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Lihat Bukti (Preview)
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                              
                              {res.evidenceUrl && (
                                <div 
                                  className="max-w-[80px] truncate text-[9px] text-emerald-700 font-bold uppercase tracking-tighter" 
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
                              className="h-8 text-xs border-transparent hover:border-slate-200 focus:border-indigo-400 bg-transparent transition-all"
                              placeholder="Tambahkan catatan..."
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

          <div className="flex justify-between items-center bg-slate-100 p-5 rounded-xl border border-slate-200 shadow-inner">
             <div className="flex gap-10">
               <div className="text-center border-r pr-10 border-slate-300">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Samples</p>
                 <p className="text-2xl font-black text-slate-700">{watchSamples.length}</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Progress</p>
                 <p className="text-2xl font-black text-indigo-600">
                    {watchSamples.reduce((acc, s) => acc + Object.values(s.controlResults).filter((r: any) => r.implemented || r.comment || r.evidenceUrl).length, 0)} / {watchSamples.reduce((acc, s) => acc + Object.keys(s.controlResults).length, 0)}
                 </p>
               </div>
             </div>
             <div className="text-right">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status Dokumentasi</p>
               {(() => {
                 const flatResults = watchSamples.flatMap(s => Object.values(s.controlResults) as any[]);
                 const anyPassWithoutEvidence = flatResults.some(r => r.implemented && !r.evidenceUrl);
                 const nothingDone = flatResults.every(r => !r.implemented && !r.evidenceUrl && !r.comment);
                 if (nothingDone) return <p className="text-xl font-black uppercase italic text-slate-400">Belum Dimulai</p>;
                 if (anyPassWithoutEvidence) return <p className="text-xl font-black uppercase italic text-rose-500 animate-pulse">Butuh Evidence</p>;
                 return <p className="text-xl font-black uppercase italic text-emerald-600">Siap Sign-off</p>;
               })()}
             </div>
          </div>
        </div>

        <div className="pt-8 border-t space-y-6">
            <FormField control={form.control} name="comments" render={({ field: f }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase text-slate-400">Management Rationale / Catatan Temuan</FormLabel>
                <FormControl><Textarea {...f} disabled={isReadOnly} className="min-h-[120px] text-sm shadow-sm" placeholder="Wajib diisi jika status INEFFECTIVE..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                type="button"
                onClick={onBackToList} 
                className="px-8 font-bold"
              >
                 {isReadOnly ? <ChevronLeft className="h-4 w-4 mr-2" /> : null}
                 {isReadOnly ? "Kembali ke Daftar" : "Batal"}
              </Button>

              {(isReadOnly || watchSamples.length > 0) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" className="bg-slate-800 hover:bg-slate-900 text-white font-black px-8 h-12 gap-2 shadow-xl uppercase tracking-widest">
                      <Printer className="h-5 w-5" /> {t('csa_hub:actions.exportApp7a')} <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem className="text-xs font-bold gap-2 py-3 cursor-pointer" onClick={() => onPrint('detailed')}>
                      <FileText className="h-4 w-4 text-indigo-600" /> {t('csa_hub:actions.layoutDetailed')}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs font-bold gap-2 py-3 cursor-pointer" onClick={() => onPrint('summary')}>
                      <LayoutDashboard className="h-4 w-4 text-indigo-600" /> {t('csa_hub:actions.layoutSummary')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {!isReadOnly && (
                <>
                  <Button 
                    type="button"
                    disabled={isPending || isAuthenticating} 
                    onClick={onSaveDraft}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-black px-8 h-12 gap-2 shadow-xl shadow-amber-100 uppercase tracking-widest"
                  >
                     {isPending ? <RefreshCw className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                     {t('csa_hub:actions.saveDraft')}
                  </Button>
                  <Button disabled={isPending || isAuthenticating} type="submit" className="bg-indigo-600 hover:bg-indigo-700 font-black px-12 h-12 gap-2 shadow-xl shadow-indigo-100 uppercase tracking-widest">
                     {isAuthenticating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5" />}
                     {t('csa_hub:actions.save')}
                  </Button>
                </>
              )}
            </div>
        </div>
      </form>
    </Form>
  );
}
