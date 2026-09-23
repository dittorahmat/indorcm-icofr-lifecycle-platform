import React from 'react';
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ShieldCheck, Clock, UserCheck, Database, FileSearch, CheckCircle2, Info, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TODSixPillarFormProps {
  form: any;
  t: any;
  isReadOnly?: boolean;
}

export function TODSixPillarForm({ form, t, isReadOnly }: TODSixPillarFormProps) {
  const pillars = [
    { 
      name: 'todPilarObjective', 
      label: t('pillars.objective'), 
      icon: ShieldCheck, 
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      commentKey: 'objective' 
    },
    { 
      name: 'todPilarTiming', 
      label: t('pillars.timing'), 
      icon: Clock, 
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      commentKey: 'timing' 
    },
    { 
      name: 'todPilarAuthority', 
      label: t('pillars.authority'), 
      icon: UserCheck, 
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      commentKey: 'authority' 
    },
    { 
      name: 'todPilarReliability', 
      label: t('pillars.reliability'), 
      icon: Database, 
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      commentKey: 'reliability' 
    },
    { 
      name: 'todPilarCoverage', 
      label: t('pillars.coverage'), 
      icon: FileSearch, 
      color: 'text-teal-600',
      bg: 'bg-teal-50',
      border: 'border-teal-100',
      commentKey: 'coverage' 
    },
    { 
      name: 'todPilarEvidence', 
      label: t('pillars.evidence'), 
      icon: CheckCircle2, 
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      commentKey: 'evidence' 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Test of Design: 6-Pilar Verification
          </h3>
        </div>
        <Badge variant="outline" className="text-xs font-semibold border-indigo-200 text-indigo-700 bg-indigo-50 px-2 py-0.5">LAMPIRAN 8</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pillars.map((pillar) => (
          <div key={pillar.name} className="group flex flex-col p-5 border border-slate-200 rounded-lg bg-white hover:border-indigo-300 hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex items-start justify-between gap-4 mb-4 relative z-10">
              <div className="flex items-start gap-3">
                <div className={cn("p-2.5 rounded-md border transition-all", pillar.bg, pillar.border, pillar.color)}>
                  <pillar.icon className="h-5 w-5" />
                </div>
                <div>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider block mb-1 text-slate-900">
                    {pillar.label}
                  </FormLabel>
                  <p className="text-xs text-slate-600 font-normal leading-relaxed">
                    {t(`pillars.descriptions.${pillar.commentKey}`)}
                  </p>
                </div>
              </div>
              <FormField
                control={form.control}
                name={pillar.name}
                render={({ field }) => (
                  <FormItem className="flex items-center space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                        disabled={isReadOnly}
                        className="h-5 w-5 rounded data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-all"
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
                      {...field} 
                      disabled={isReadOnly}
                      className="text-xs font-normal min-h-[70px] bg-slate-50 border-slate-200 focus:bg-white rounded-md resize-none transition-all placeholder:text-slate-400 p-3"
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

      <div className="p-5 bg-mancity-pattern rounded-lg shadow-sm relative overflow-hidden group">
        <div className="flex gap-4 relative z-10">
           <div className="h-10 w-10 rounded-md bg-primary/20 text-primary-foreground flex items-center justify-center shrink-0 border border-white/20">
              <Info className="h-5 w-5" />
           </div>
           <div className="space-y-1">
              <p className="text-xs font-semibold text-primary-foreground uppercase tracking-wider flex items-center gap-2">
                Regulatory Compliance Note
                <ChevronRight className="h-3 w-3" />
              </p>
              <p className="text-xs text-primary-foreground/90 leading-relaxed font-medium">
                Evaluasi rancangan harus mempertimbangkan apakah kontrol secara individual atau kombinasi cukup presisi untuk mencegah atau mendeteksi salah saji material secara tepat waktu.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
