import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  FileCheck, 
  Clock, 
  UserCheck, 
  Database, 
  FileText, 
  CheckCircle2, 
  Info, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TestFormValues } from './test-schema';

interface TODSixPillarFormProps {
  form: UseFormReturn<TestFormValues>;
  t: any;
  isReadOnly?: boolean;
}

interface PillarConfig {
  name: 'todPilarObjective' | 'todPilarTiming' | 'todPilarAuthority' | 'todPilarReliability' | 'todPilarCoverage' | 'todPilarEvidence';
  label: string;
  subLabel: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  commentKey: string;
}

export function TODSixPillarForm({ form, t, isReadOnly }: TODSixPillarFormProps) {
  const pillars: PillarConfig[] = [
    { 
      name: 'todPilarObjective', 
      label: t('pillars.objective', { defaultValue: 'Kejelasan & Presisi Objektif (Clarity)' }),
      subLabel: t('pillars.subLabels.objective', { defaultValue: 'Pilar 1: Presisi mitigasi salah saji material' }),
      icon: FileCheck, 
      color: 'text-primary',
      bg: 'bg-primary-container/10',
      border: 'border-primary-container/20',
      commentKey: 'objective' 
    },
    { 
      name: 'todPilarTiming', 
      label: t('pillars.timing', { defaultValue: 'Ketepatan Waktu Pelaksanaan (Timeliness)' }),
      subLabel: t('pillars.subLabels.timing', { defaultValue: 'Pilar 2: Frekuensi dan konsistensi pelaksanaan' }),
      icon: Clock, 
      color: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      commentKey: 'timing' 
    },
    { 
      name: 'todPilarAuthority', 
      label: t('pillars.authority', { defaultValue: 'Pemisahan Tugas & Otoritas (SoD)' }),
      subLabel: t('pillars.subLabels.authority', { defaultValue: 'Pilar 3: Segregation of duties & kompetensi' }),
      icon: UserCheck, 
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      border: 'border-secondary/20',
      commentKey: 'authority' 
    },
    { 
      name: 'todPilarReliability', 
      label: t('pillars.reliability', { defaultValue: 'Logika & Integritas Sistem (Logic)' }),
      subLabel: t('pillars.subLabels.reliability', { defaultValue: 'Pilar 4: Keandalan IPE/EUC & integritas data' }),
      icon: Database, 
      color: 'text-sky-800',
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      commentKey: 'reliability' 
    },
    { 
      name: 'todPilarCoverage', 
      label: t('pillars.coverage', { defaultValue: 'Kelengkapan Cakupan Periode (Completeness)' }),
      subLabel: t('pillars.subLabels.coverage', { defaultValue: 'Pilar 5: Kelengkapan transaksi & akun LK' }),
      icon: FileText, 
      color: 'text-indigo-800',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      commentKey: 'coverage' 
    },
    { 
      name: 'todPilarEvidence', 
      label: t('pillars.evidence', { defaultValue: 'Jejak Audit & Bukti Memadai (Audit Trail)' }),
      subLabel: t('pillars.subLabels.evidence', { defaultValue: 'Pilar 6: Ketertelusuran bukti pengujian' }),
      icon: CheckCircle2, 
      color: 'text-emerald-800',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      commentKey: 'evidence' 
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with Regulation Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-secondary shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
            {t('tod.sixPillarsTitle', { defaultValue: 'Evaluasi Rancangan Kontrol: 6-Pilar Walkthrough TOD' })}
          </h3>
        </div>
        <Badge variant="outline" className="text-xs font-bold border-secondary/30 text-secondary bg-secondary/10 px-2.5 py-0.5">
          {t('tod.regulationBadge', { defaultValue: 'LAMPIRAN 8 SK-5' })}
        </Badge>
      </div>

      {/* 6-Pillar Evaluation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {pillars.map((pillar) => (
          <div 
            key={pillar.name} 
            className="group flex flex-col p-4 sm:p-5 border border-slate-200 rounded-xl bg-white hover:border-secondary/40 hover:shadow-xs transition-all relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 mb-3.5 relative z-10 flex-wrap">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={cn("p-2 sm:p-2.5 rounded-lg border shrink-0 transition-all", pillar.bg, pillar.border, pillar.color)}>
                  <pillar.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider block mb-0.5 text-primary whitespace-normal leading-snug">
                    {pillar.label}
                  </FormLabel>
                  <p className="text-xs font-medium text-secondary mb-1">
                    {pillar.subLabel}
                  </p>
                  <p className="text-xs text-on-surface-variant font-normal leading-relaxed">
                    {t(`pillars.descriptions.${pillar.commentKey}`)}
                  </p>
                </div>
              </div>
              <FormField
                control={form.control}
                name={pillar.name}
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0 shrink-0 pt-0.5">
                    <FormControl>
                      <Checkbox 
                        checked={Boolean(field.value)} 
                        onCheckedChange={field.onChange} 
                        disabled={isReadOnly}
                        className="h-5 w-5 rounded data-[state=checked]:bg-secondary data-[state=checked]:border-secondary transition-all"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name={`todPilarComments.${pillar.commentKey}`}
              render={({ field }) => (
                <FormItem className="space-y-1 relative z-10">
                  <FormControl>
                    <Textarea 
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      disabled={isReadOnly}
                      className="text-base sm:text-xs font-normal min-h-[64px] bg-slate-50 border-slate-200 focus:bg-white rounded-lg resize-none transition-all placeholder:text-slate-400 p-2.5 sm:p-3"
                      placeholder={t('pillars.commentPlaceholder')}
                    />
                  </FormControl>
                  <FormMessage className="text-xs font-semibold" />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>

      {/* Sovereign Governance Compliance Banner */}
      <div className="p-4 sm:p-5 bg-surface-container rounded-xl border border-secondary/20 shadow-xs relative overflow-hidden group">
        <div className="flex gap-3 sm:gap-4 relative z-10">
           <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-secondary text-on-primary flex items-center justify-center shrink-0">
              <Info className="h-4 w-4 sm:h-5 sm:w-5" />
           </div>
           <div className="space-y-1 min-w-0">
              <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                {t('tod.complianceNoteTitle', { defaultValue: 'Catatan Kepatuhan Regulasi (Lampiran 8 SK-5)' })}
                <ChevronRight className="h-3 w-3 shrink-0 text-secondary" />
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed font-normal">
                {t('tod.complianceNoteBody', {
                  defaultValue:
                    'Evaluasi rancangan 6 pilar wajib memastikan bahwa kontrol dirancang secara memadai dan presisi untuk mencegah atau mendeteksi salah saji material pada asersi laporan keuangan secara tepat waktu.',
                })}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
