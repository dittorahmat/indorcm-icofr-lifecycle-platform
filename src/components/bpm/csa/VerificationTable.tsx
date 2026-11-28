import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { UseFormReturn } from 'react-hook-form';
import type { CSAFormValues } from '@/hooks/use-csa';
import { Check, Database, Eye, RefreshCw, UploadCloud } from 'lucide-react';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { SampleEntry } from './csa-form-types';

interface VerificationSummaryProps {
  watchSamples: SampleEntry[];
}

export function VerificationSummary({ watchSamples }: VerificationSummaryProps) {
  const { t } = useTranslation();

  const flatResults = watchSamples.flatMap((s) => Object.values(s.controlResults));
  const anyPassWithoutEvidence = flatResults.some((r) => r.implemented && !r.evidenceUrl);
  const nothingDone = flatResults.every((r) => !r.implemented && !r.evidenceUrl && !r.comment);

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-100 p-4 sm:p-5 rounded-lg border border-slate-200 shadow-inner flex-wrap gap-3">
      <div className="flex flex-wrap gap-6 sm:gap-10">
        <div className="text-center border-r pr-6 sm:pr-10 border-slate-300">
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('csa_hub:page.table.samples')}</p>
          <p className="text-2xl font-black text-slate-700">{watchSamples.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-black uppercase text-slate-400 tracking-widest">
            {t('csa_hub:form.mobile.progress', { defaultValue: 'Progress' })}
          </p>
          <p className="text-2xl font-black text-primary">
            {watchSamples.reduce((acc, s) => acc + Object.values(s.controlResults).filter((r) => r.implemented || r.comment || r.evidenceUrl).length, 0)} /{' '}
            {watchSamples.reduce((acc, s) => acc + Object.keys(s.controlResults).length, 0)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-black uppercase text-slate-400 tracking-widest">{t('csa_hub:form.documentationStatus')}</p>
        {nothingDone ? (
          <p className="text-xl font-bold uppercase text-slate-400">{t('csa_hub:form.notStarted')}</p>
        ) : anyPassWithoutEvidence ? (
          <p className="text-xl font-bold uppercase text-rose-600">{t('csa_hub:form.needEvidence')}</p>
        ) : (
          <p className="text-xl font-bold uppercase text-emerald-600">{t('csa_hub:form.readyToSign')}</p>
        )}
      </div>
    </div>
  );
}

interface VerificationTableProps {
  form: UseFormReturn<CSAFormValues>;
  isReadOnly: boolean;
  isPending: boolean;
  watchSamples: SampleEntry[];
  activeUploadRow: { sIdx: number; cId: string } | null;
  onFileUpload: (sIdx: number, cId: string) => void;
  getFileNameFromUrl: (url: string) => string;
}

export function VerificationTable({
  form,
  isReadOnly,
  isPending,
  watchSamples,
  activeUploadRow,
  onFileUpload,
  getFileNameFromUrl,
}: VerificationTableProps) {
  const { t } = useTranslation();

  return (
    <div className="hidden md:block">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
            <Database className="h-3.5 w-3.5" /> {t('csa_hub:form.verificationTitle')}
          </h4>
          <div className="flex gap-2">
            <Badge className="bg-emerald-600 text-xs font-black uppercase tracking-wider">
              {watchSamples.reduce((acc, s) => acc + Object.values(s.controlResults).filter((r) => r.implemented).length, 0)}{' '}
              {t('csa_hub:form.passed')}
            </Badge>
            <Badge className="bg-red-600 text-xs font-black uppercase tracking-wider">
              {watchSamples.reduce((acc, s) => acc + Object.values(s.controlResults).filter((r) => !r.implemented).length, 0)}{' '}
              {t('csa_hub:form.deficiency')}
            </Badge>
          </div>
        </div>

        <div className="border rounded-lg overflow-x-auto max-w-full touch-pan-x overscroll-x-contain shadow-md">
          <Table className="min-w-[880px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs py-2.5 px-3 min-w-[200px]">
                  {t('csa_hub:form.table.transactionDetail')}
                </TableHead>
                <TableHead className="text-xs py-2.5 px-3">{t('csa_hub:form.table.riskName')}</TableHead>
                <TableHead className="text-xs py-2.5 px-3">{t('csa_hub:form.table.controlName')}</TableHead>
                <TableHead className="text-xs py-2.5 px-3 text-center w-32">{t('csa_hub:form.table.evidence')}</TableHead>
                <TableHead className="text-xs py-2.5 px-3 min-w-[200px]">{t('csa_hub:form.table.notes')}</TableHead>
                <TableHead className="text-xs py-2.5 px-3 text-center w-24">{t('csa_hub:form.table.pass')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watchSamples.map((sample, sIdx) => (
                <React.Fragment key={`${sample.glRowId || 'manual'}-${sIdx}`}>
                  <TableRow className="bg-slate-100/50 hover:bg-slate-100 border-t-2 border-slate-200">
                    <TableCell colSpan={6} className="py-2 px-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-white text-slate-700 border-slate-300 font-black px-2 py-0.5">
                            {t('csa_hub:page.table.samples').toUpperCase()} #{sIdx + 1}
                          </Badge>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                              {sample.sampleRef || t('csa_hub:form.emptyReference')}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {t('csa_hub:form.mobile.idLabel', { defaultValue: 'ID' })}: {sample.glRowId || t('csa_hub:form.manualEntry')}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="flex -space-x-1 overflow-hidden">
                            {Object.values(sample.controlResults).map((res, idx) => (
                              <div
                                key={idx}
                                className={cn('inline-block h-3 w-3 rounded-full ring-2 ring-white', res.implemented ? 'bg-emerald-500' : 'bg-red-500')}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                            {Object.values(sample.controlResults).filter((r) => r.implemented).length} / {Object.values(sample.controlResults).length}{' '}
                            {t('csa_hub:form.passed')}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>

                  {Object.entries(sample.controlResults).map(([cId, res]) => (
                    <TableRow key={`${sample.glRowId || 'manual'}-${sIdx}-${cId}`} className={cn('divide-x border-b transition-colors', res.implemented ? 'bg-white' : 'bg-red-50/50')}>
                      <TableCell className="py-3 px-4 bg-slate-50/30 w-48">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', res.implemented ? 'bg-emerald-500' : 'bg-red-500')} />
                          <span className="font-bold text-xs text-slate-500 uppercase tracking-wider truncate">
                            {t('csa_hub:form.pointVerification')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-600">{res.riskName || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-xs text-slate-800">{res.controlName || 'N/A'}</span>
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
                                    variant={res.evidenceUrl ? 'secondary' : 'outline'}
                                    size="icon"
                                    className={cn(
                                      'h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-lg transition-all shrink-0',
                                      res.evidenceUrl
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                        : 'border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-primary',
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
                                  {isReadOnly
                                    ? t('csa_hub:form.mobile.readonlyNote', { defaultValue: 'Record sudah di-signoff (Read-only)' })
                                    : res.evidenceUrl
                                      ? t('csa_hub:form.mobile.replaceEvidence', { defaultValue: 'Ganti bukti (Re-upload)' })
                                      : t('csa_hub:form.mobile.uploadEvidence', { defaultValue: 'Unggah bukti' })}
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
                                      className="h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-lg bg-mancity-pattern hover:opacity-90 text-primary-foreground shadow-sm shrink-0"
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
                            <div className="max-w-[80px] truncate text-xs text-emerald-700 font-bold uppercase tracking-tighter" title={getFileNameFromUrl(res.evidenceUrl)}>
                              {getFileNameFromUrl(res.evidenceUrl) || 'Attached'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`samples.${sIdx}.controlResults.${cId}.comment`}
                          render={({ field: f }) => (
                            <Input
                              {...f}
                              value={(f.value as string) ?? ''}
                              disabled={isReadOnly}
                              className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 text-base sm:text-xs border-transparent hover:border-slate-200 focus:border-slate-400 bg-transparent transition-all"
                              placeholder={t('common:placeholders.notes') as string}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <FormField
                          control={form.control}
                          name={`samples.${sIdx}.controlResults.${cId}.implemented`}
                          render={({ field: f }) => (
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={f.value as boolean}
                                onCheckedChange={f.onChange}
                                disabled={isReadOnly}
                                className={cn('h-6 w-6', f.value ? 'text-green-600 border-green-600' : 'text-red-400 border-red-200')}
                              />
                            </div>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        <VerificationSummary watchSamples={watchSamples} />
      </div>
    </div>
  );
}

