import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { FsliCandidate } from './smart-import-types';

interface BenchmarkSelectProps {
  selectedBasis: string;
  candidates: FsliCandidate[];
  popoverOpen: boolean;
  onBasisChange: (name: string) => void;
  onPopoverChange: (open: boolean) => void;
}

export function BenchmarkSelect({
  selectedBasis,
  candidates,
  popoverOpen,
  onBasisChange,
  onPopoverChange,
}: BenchmarkSelectProps) {
  const { t } = useTranslation(['rcm', 'common', 'scoping']);
  const selected = candidates.find((f) => f.name === selectedBasis);

  return (
    <div className="space-y-2">
      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">
        {t('scoping:form.benchmark')}
      </Label>
      <Popover open={popoverOpen} onOpenChange={onPopoverChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={popoverOpen}
            className="w-full h-12 justify-between rounded-xl border-slate-200 bg-slate-50/50 font-bold text-slate-700 hover:bg-slate-100 px-4"
          >
            {selectedBasis ? (
              <div className="flex items-center justify-between w-full pr-2 text-left truncate flex-wrap gap-2">
                <span className="truncate">{selectedBasis}</span>
                <span className="text-xs text-slate-400 font-mono ml-2 shrink-0">
                  Rp {(selected?.total || 0).toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 font-normal">{t('rcm:migration.materiality.selectBenchmark')}</span>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] max-w-[420px] p-0 rounded-lg border-slate-200 shadow-xl overflow-hidden" align="start">
          <Command>
            <CommandInput placeholder={t('rcm:migration.materiality.searchPlaceholder')} className="h-10 min-h-[44px] text-base md:text-sm" />
            <CommandList className="max-h-60 overflow-y-auto">
              <CommandEmpty className="py-4 text-center text-xs text-slate-400">
                {t('rcm:migration.materiality.emptyResult')}
              </CommandEmpty>
              <CommandGroup>
                {candidates.map((item) => (
                  <CommandItem
                    key={item.name}
                    value={item.name}
                    onSelect={() => {
                      onBasisChange(item.name);
                      onPopoverChange(false);
                    }}
                    className="flex items-center justify-between py-2.5 px-3 cursor-pointer text-xs font-bold text-slate-700 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-900 flex-wrap gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Check
                        className={cn(
                          'h-4 w-4 shrink-0 text-indigo-600',
                          selectedBasis === item.name ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono shrink-0 ml-4">Rp {item.total.toLocaleString()}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
