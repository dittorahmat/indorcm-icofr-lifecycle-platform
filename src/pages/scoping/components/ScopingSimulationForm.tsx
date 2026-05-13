import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getGroupMultiplier } from '../services/materiality-calc';
import type { GLSnapshot } from '@shared/types';

interface ScopingSimulationFormProps {
  activeSnap: GLSnapshot | null;
  onSubmit: (data: any) => void;
  isPending: boolean;
  yearOptions: string[];
}

export function ScopingSimulationForm({ activeSnap, onSubmit, isPending, yearOptions }: ScopingSimulationFormProps) {
  const { t } = useTranslation('scoping');
  const [name, setName] = React.useState("");
  const [year, setYear] = React.useState<string>(new Date().getFullYear().toString());
  const [basis, setBasis] = React.useState<string>("");
  const [locations, setLocations] = React.useState(1);

  React.useEffect(() => {
    if (activeSnap?.benchmarkFsliNames?.length && !basis) {
      setBasis(activeSnap.benchmarkFsliNames[0]);
    }
  }, [activeSnap, basis]);

  const defaultOm = 5; // Default to 5% for FSLI based

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-2">
          <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('form.name')}</Label>
          <Input placeholder={t('form.namePlaceholder')} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('form.year')}</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {yearOptions.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('form.benchmark')}</Label>
          {activeSnap?.benchmarkFsliNames?.length ? (
            <Select value={basis} onValueChange={setBasis}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {activeSnap.benchmarkFsliNames.map(fsli => (
                  <SelectItem key={fsli} value={fsli}>{fsli}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-2 border rounded-md bg-amber-50 text-xs text-amber-700 flex gap-1 items-start">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>No benchmarks defined in Master Data GL.</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('form.locations')}</Label>
          <Input type="number" min={1} value={locations} onChange={e => setLocations(parseInt(e.target.value) || 1)} />
        </div>
      </div>
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
        <p className="text-xs text-blue-700 leading-relaxed italic">
          Multiplier: <strong>{getGroupMultiplier(locations)}x</strong>.
          Default OM: <strong>{defaultOm}%</strong>.
        </p>
      </div>
      <Button 
        className="w-full mt-2" 
        disabled={!name || !basis || !year || isPending} 
        onClick={() => onSubmit({ 
          name, 
          year: parseInt(year), 
          basis, 
          omPercentage: defaultOm, 
          haircutPercentage: 25, 
          locationCount: locations 
        })}
      >
        {isPending ? "Creating..." : t('form.initialize')}
      </Button>
    </div>
  );
}
