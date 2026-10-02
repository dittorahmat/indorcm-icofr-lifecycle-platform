import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, Lightbulb, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ALL_COSO, ALL_ASSERTIONS, ALL_IPOS, ITGC_AREAS } from '@/lib/constants';
import { calculateRiskRating, getSuggestedControl, COBIT_ITGC_MAPPING } from '@/lib/compliance-utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const RiskAssessmentSection = ({ form, wizard }: { form: any; wizard?: React.ReactNode }) => {
  const { t } = useTranslation(['rcm', 'common']);
  const quant = form.watch('riskQuantitative');
  const qual = form.watch('riskQualitative');
  const calculatedRating = calculateRiskRating(quant, qual);

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-md border p-4 bg-primary/5 border-primary/10">
        <Label className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
          <Calculator className="h-3 w-3" /> {t('matrix.groups.risk')}
        </Label>
        <Badge 
          variant="secondary" 
          className={`${calculatedRating === 'High' ? 'bg-red-100 text-red-700' : calculatedRating === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'} text-xs px-3 w-full justify-center`}
        >
          {calculatedRating} Risk
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField control={form.control} name="riskQuantitative" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase">{t('matrix.properties.risk_rating_label')} (Table 10)</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="High">High (at least OM)</SelectItem>
                <SelectItem value="Medium">Medium (PM to OM)</SelectItem>
                <SelectItem value="Low">Low (Below PM)</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <FormField control={form.control} name="riskQualitative" render={({ field }) => (
          <FormItem>
            <div className="flex justify-between items-center mb-1">
              <FormLabel className="text-xs uppercase">Kualitatif (Table 11)</FormLabel>
              {wizard}
            </div>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="High">High (Frequent)</SelectItem>
                <SelectItem value="Medium">Medium (Possible)</SelectItem>
                <SelectItem value="Low">Low (Rare)</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
      </div>
    </div>
  );
};

export const RegulatoryMappingSection = ({ form }: { form: any }) => {
  const { t } = useTranslation(['rcm', 'common']);
  return (
    <div className="space-y-4 rounded-md border p-4 bg-white shadow-sm">
      <Label className="text-xs font-bold uppercase tracking-wider text-primary">{t('matrix.properties.coso_section')}</Label>
      
      <FormField control={form.control} name="cosoPrinciples" render={() => (
        <FormItem>
          <div className="flex justify-between items-center mb-1">
            <FormLabel className="text-xs">COSO Principles (1-17)</FormLabel>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs gap-1 text-primary"
              onClick={() => {
                const firstP = form.watch('cosoPrinciples')?.[0];
                if (firstP) {
                  const suggestion = getSuggestedControl(firstP);
                  form.setValue('name', suggestion.name);
                  form.setValue('description', suggestion.description);
                  toast.info(`Template diterapkan berdasarkan Prinsip ${firstP}`);
                } else {
                  toast.error("Pilih minimal satu Prinsip COSO untuk mendapatkan saran template.");
                }
              }}
            >
              <Lightbulb className="h-3 w-3" /> Suggest Template
            </Button>
          </div>
          <div className="grid grid-cols-6 gap-1 pt-2">
            {ALL_COSO.map((p) => (
              <FormField key={p} control={form.control} name="cosoPrinciples" render={({ field }) => (
                <FormItem key={p} className="flex flex-col items-center space-y-1">
                  <FormControl>
                    <Checkbox checked={field.value?.includes(p)} onCheckedChange={(checked) => {
                      return checked ? field.onChange([...(field.value || []), p]) : field.onChange(field.value?.filter((v: any) => v !== p));
                    }} />
                  </FormControl>
                  <span className="text-xs font-bold">{p}</span>
                </FormItem>
              )} />
            ))}
          </div>
        </FormItem>
      )} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
        <FormField control={form.control} name="assertions" render={() => (
          <FormItem>
            <FormLabel className="text-xs">{t('matrix.assertions')}</FormLabel>
            <div className="space-y-1 pt-1">
              {ALL_ASSERTIONS.map((item) => (
                <FormField key={item} control={form.control} name="assertions" render={({ field }) => (
                  <FormItem key={item} className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                        return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((v: any) => v !== item));
                      }} />
                    </FormControl>
                    <FormLabel className="font-normal text-xs">{item}</FormLabel>
                  </FormItem>
                )} />
              ))}
            </div>
          </FormItem>
        )} />

        <FormField control={form.control} name="ipos" render={() => (
          <FormItem>
            <FormLabel className="text-xs">{t('matrix.ipo')}</FormLabel>
            <div className="space-y-1 pt-1">
              {ALL_IPOS.map((item) => (
                <FormField key={item} control={form.control} name="ipos" render={({ field }) => (
                  <FormItem key={item} className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                        return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((v: any) => v !== item));
                      }} />
                    </FormControl>
                    <FormLabel className="font-normal text-xs">{item}</FormLabel>
                  </FormItem>
                )} />
              ))}
            </div>
          </FormItem>
        )} />
      </div>
    </div>
  );
};

export const ITGCMetadataSection = ({ form }: { form: any }) => {
  const { t } = useTranslation(['rcm', 'common']);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField control={form.control} name="itgcDomain" render={({ field }) => (
        <FormItem>
          <FormLabel>{t('matrix.itgc_section')}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value as string}>
            <FormControl>
              <SelectTrigger><SelectValue placeholder="Select ITGC Area" /></SelectTrigger>
            </FormControl>
            <SelectContent>
              {ITGC_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormItem>
      )} />
      <FormField control={form.control} name="cobitId" render={({ field }) => (
        <FormItem>
          <FormLabel>COBIT 2019 ID ({t('common:status.draft')})</FormLabel>
          <FormControl>
            <Input placeholder="e.g. APO09" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} />
          </FormControl>
          {field.value && COBIT_ITGC_MAPPING[field.value] && form.watch('itgcDomain') && !COBIT_ITGC_MAPPING[field.value].includes(form.watch('itgcDomain') as string) && (
            <p className="text-xs text-amber-600 font-bold mt-1">
              Peringatan: Berdasarkan Tabel 1, {field.value} biasanya tidak dipetakan ke area {form.watch('itgcDomain')}.
            </p>
          )}
        </FormItem>
      )} />
    </div>
  );
};

export const MRCParametersSection = ({ form }: { form: any }) => {
  const { t } = useTranslation(['rcm', 'common']);
  return (
    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-4">
      <p className="text-xs font-bold text-orange-800 uppercase tracking-widest flex items-center gap-2">
        <ShieldAlert className="h-3 w-3" /> Management Review Control Parameters (Table 21)
      </p>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Management Expectation (Kewajaran Ekspektasi)</Label>
          <Input className="h-8 text-xs" placeholder="e.g. Varians biaya operasional < 5% per bulan" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Investigation Threshold (Ambang Batas)</Label>
          <Input className="h-8 text-xs" placeholder="e.g. Selisih absolut > Rp 50.000.000" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Investigation Procedures (Prosedur Tindak Lanjut)</Label>
          <Textarea className="text-xs" placeholder="Langkah-langkah jika threshold terlampaui..." />
        </div>
      </div>
    </div>
  );
};
