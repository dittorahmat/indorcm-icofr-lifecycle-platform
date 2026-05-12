import React from 'react';
import { FormField, FormItem, FormControl, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Control } from 'react-hook-form';
import { TestFormValues } from './test-schema';
import { cn } from '@/lib/utils';
import { ShieldCheck, Clock, UserCheck, Database, FileSearch, CheckCircle2 } from 'lucide-react';

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
      color: 'text-blue-600',
      commentKey: 'objective' 
    },
    { 
      name: 'todPilarTiming', 
      label: t('pillars.timing'), 
      icon: Clock, 
      color: 'text-amber-600',
      commentKey: 'timing' 
    },
    { 
      name: 'todPilarAuthority', 
      label: t('pillars.authority'), 
      icon: UserCheck, 
      color: 'text-purple-600',
      commentKey: 'authority' 
    },
    { 
      name: 'todPilarReliability', 
      label: t('pillars.reliability'), 
      icon: Database, 
      color: 'text-orange-600',
      commentKey: 'reliability' 
    },
    { 
      name: 'todPilarCoverage', 
      label: t('pillars.coverage'), 
      icon: FileSearch, 
      color: 'text-teal-600',
      commentKey: 'coverage' 
    },
    { 
      name: 'todPilarEvidence', 
      label: t('pillars.evidence'), 
      icon: CheckCircle2, 
      color: 'text-green-600',
      commentKey: 'evidence' 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-bold uppercase tracking-tight text-blue-900 flex items-center gap-2">
          Test of Design: 6-Pilar Verification
          <span className="text-[10px] font-normal lowercase text-muted-foreground">(Lampiran 8)</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pillars.map((pillar) => (
          <div key={pillar.name} className="p-4 bg-muted/20 border rounded-lg space-y-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-md bg-background shadow-sm border", pillar.color)}>
                  <pillar.icon className="h-4 w-4" />
                </div>
                <div>
                  <FormLabel className="text-[11px] font-bold uppercase tracking-tight block mb-1">
                    {pillar.label}
                  </FormLabel>
                  <p className="text-[10px] text-muted-foreground leading-tight">
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
                        className="h-5 w-5"
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
                <FormItem className="space-y-1">
                  <FormControl>
                    <Textarea 
                      {...field} 
                      disabled={isReadOnly}
                      className="text-[11px] min-h-[60px] bg-background resize-none"
                      placeholder={t('pillars.commentPlaceholder')}
                    />
                  </FormControl>
                  <FormMessage className="text-[9px]" />
                </FormItem>
              )}
            />
          </div>
        ))}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-[10px] text-blue-800 leading-relaxed italic">
        <strong>Regulatory Note (Lampiran 8):</strong> Evaluasi rancangan harus mempertimbangkan apakah kontrol secara individual atau kombinasi dengan kontrol lain cukup presisi untuk mencegah atau mendeteksi salah saji material secara tepat waktu.
      </div>
    </div>
  );
}
