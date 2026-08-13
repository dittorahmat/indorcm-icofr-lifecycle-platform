import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Database, Search, Layers, Filter, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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
  const [fsliOpen, setFsliOpen] = useState(false);
  const [glOpen, setGlOpen] = useState(false);

  const selectedGl = glNumbers.find((g) => g.key === selectedAccountKey);

  return (
    <Card className="border-slate-200 shadow-md bg-white rounded-xl overflow-hidden">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          {/* FSLI Searchable Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="fsli-select" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-1">
              <Database className="h-3.5 w-3.5 text-indigo-500" /> 1. {t('bpm:fsliLabel')}
            </Label>
            <Popover open={fsliOpen} onOpenChange={setFsliOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="fsli-select"
                  variant="outline"
                  role="combobox"
                  aria-expanded={fsliOpen}
                  disabled={snapLoading || simLoading}
                  className="w-full bg-slate-50 border-slate-200 h-10 text-xs font-bold uppercase tracking-wider rounded-lg focus:bg-white transition-all shadow-sm justify-between px-3"
                >
                  <span className="truncate">
                    {snapLoading ? (
                      <span className="flex items-center">
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        {t('common:placeholders.choose')}
                      </span>
                    ) : selectedFsli ? (
                      selectedFsli
                    ) : (
                      t('common:placeholders.choose')
                    )}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[max(100%,320px)] min-w-[280px] p-0 rounded-lg border-slate-200 shadow-xl" align="start">
                <Command>
                  <CommandInput placeholder={t('bpm:searchFsli')} className="h-9 text-xs" />
                  <CommandList className="max-h-60 overflow-y-auto">
                    <CommandEmpty className="py-3 text-center text-xs text-slate-500">
                      {t('bpm:noSubProcesses')}
                    </CommandEmpty>
                    <CommandGroup>
                      {significantFsliNames.map((f) => (
                        <CommandItem
                          key={f}
                          value={f}
                          className="text-xs font-bold uppercase cursor-pointer"
                          onSelect={() => {
                            if (isAssertionDirty && !window.confirm(t('bpm:unsavedChanges.description'))) return;
                            setSelectedFsli(f);
                            setSelectedAccountKey('');
                            setSelectedBpmId(null);
                            setFsliOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-3.5 w-3.5 text-indigo-600 shrink-0',
                              selectedFsli === f ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span className="whitespace-normal leading-normal">{f}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* GL Account Searchable Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="account-select" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2 px-1">
              <Search className="h-3.5 w-3.5 text-indigo-500" /> 2. {t('common:glAccount')}
            </Label>
            <Popover open={glOpen} onOpenChange={setGlOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="account-select"
                  variant="outline"
                  role="combobox"
                  aria-expanded={glOpen}
                  disabled={!selectedFsli || snapLoading}
                  className="w-full bg-slate-50 border-slate-200 h-10 text-xs font-bold uppercase tracking-wider rounded-lg focus:bg-white transition-all shadow-sm justify-between px-3"
                >
                  <span className="truncate">
                    {snapLoading ? (
                      <span className="flex items-center">
                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        {t('common:placeholders.choose')}
                      </span>
                    ) : selectedGl ? (
                      `${selectedGl.noGL} • ${selectedGl.glDesc}`
                    ) : (
                      t('common:placeholders.choose')
                    )}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[max(100%,360px)] min-w-[300px] p-0 rounded-lg border-slate-200 shadow-xl" align="start">
                <Command>
                  <CommandInput placeholder={t('bpm:searchGl')} className="h-9 text-xs" />
                  <CommandList className="max-h-60 overflow-y-auto">
                    <CommandEmpty className="py-3 text-center text-xs text-slate-500">
                      {t('bpm:noSubProcesses')}
                    </CommandEmpty>
                    <CommandGroup>
                      {glNumbers.map((g) => (
                        <CommandItem
                          key={g.key}
                          value={`${g.noGL} ${g.glDesc}`}
                          className="text-xs font-bold uppercase cursor-pointer"
                          onSelect={() => {
                            if (isAssertionDirty && !window.confirm(t('bpm:unsavedChanges.description'))) return;
                            setSelectedAccountKey(g.key);
                            setGlOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-3.5 w-3.5 text-indigo-600 shrink-0',
                              selectedAccountKey === g.key ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <span className="whitespace-normal leading-normal">{g.noGL} • {g.glDesc}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* ICOFR Category */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1 flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-slate-400" /> {t('common:icofr.category')}
            </Label>
            <div className="h-10 px-3 flex items-center border border-slate-200 rounded-lg bg-slate-50 text-[10px] text-slate-600 font-bold uppercase tracking-widest overflow-hidden whitespace-nowrap">
              {selectedGLRow?.category || "-"}
            </div>
          </div>

          {/* ICOFR SubCategory */}
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
