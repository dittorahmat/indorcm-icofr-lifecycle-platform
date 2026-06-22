import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Database, Search, Layers, Filter, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BPMScopingFiltersProps {
  selectedFsli: string;
  setSelectedFsli: (val: string) => void;
  selectedAccountKey: string;
  setSelectedAccountKey: (val: string) => void;
  setSelectedBpmId: (id: string | null) => void;
  snapLoading: boolean;
  simLoading: boolean;
  significantFsliNames: string[];
  glNumbers: { key: string; noGL: string; glDesc: string }[];
  selectedGLRow: { category?: string; subKategori?: string } | null;
  isAssertionDirty: boolean;
}

export function BPMScopingFilters({
  selectedFsli,
  setSelectedFsli,
  selectedAccountKey,
  setSelectedAccountKey,
  setSelectedBpmId,
  snapLoading,
  simLoading,
  significantFsliNames,
  glNumbers,
  selectedGLRow,
  isAssertionDirty,
}: BPMScopingFiltersProps) {
  const { t } = useTranslation(['bpm', 'common']);

  return (
    <Card className="border-slate-200 shadow-md bg-white rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="fsli-select" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-1">
              <Database className="h-3.5 w-3.5 text-indigo-500" /> 1. {t('bpm:fsliLabel')}
            </Label>
            <Select 
              value={selectedFsli} 
              onValueChange={(v) => { 
                if (isAssertionDirty && !window.confirm(t('bpm:unsavedChanges.description'))) return;
                setSelectedFsli(v); 
                setSelectedAccountKey(""); 
                setSelectedBpmId(null); 
              }}
              disabled={snapLoading || simLoading}
            >
              <SelectTrigger id="fsli-select" className="bg-slate-50 border-slate-200 h-10 text-xs font-bold uppercase tracking-wider rounded-lg focus:bg-white transition-all shadow-sm">
                {snapLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                <SelectValue placeholder={t('common:placeholders.choose')} />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-slate-200">
                {significantFsliNames.map(f => (
                  <SelectItem key={f} value={f} className="text-xs font-bold uppercase">{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-select" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-1">
              <Search className="h-3.5 w-3.5 text-indigo-500" /> 2. {t('common:glAccount')}
            </Label>
            <Select 
              value={selectedAccountKey} 
              onValueChange={(v) => {
                if (isAssertionDirty && !window.confirm(t('bpm:unsavedChanges.description'))) return;
                setSelectedAccountKey(v);
              }} 
              disabled={!selectedFsli || snapLoading}
            >
              <SelectTrigger id="account-select" className="bg-slate-50 border-slate-200 h-10 text-xs font-bold uppercase tracking-wider rounded-lg focus:bg-white transition-all shadow-sm">
                {snapLoading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                <SelectValue placeholder={t('common:placeholders.choose')} />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-slate-200">
                {glNumbers.map(g => (
                  <SelectItem key={g.key} value={g.key} className="text-xs font-bold uppercase">{g.noGL} • {g.glDesc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-slate-400" /> {t('common:icofr.category')}
            </Label>
            <div className="h-10 px-3 flex items-center border border-slate-200 rounded-lg bg-slate-50 text-[10px] text-slate-600 font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap">
              {selectedGLRow?.category || "-"}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" /> {t('common:icofr.subCategory')}
            </Label>
            <div className="h-10 px-3 flex items-center border border-slate-200 rounded-lg bg-slate-50 text-[10px] text-slate-600 font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap">
              {selectedGLRow?.subKategori || "-"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
