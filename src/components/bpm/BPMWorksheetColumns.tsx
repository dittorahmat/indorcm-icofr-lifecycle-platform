import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Control, ControlType, ControlNature, Application } from '@shared/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Trash2, Network, Shield, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConfirmFunction } from '@/components/providers/ConfirmProvider';
import type { WorksheetRowCommit } from './worksheet-row';

type WorksheetTranslate = (key: string, options?: Record<string, unknown>) => string;

interface CreateWorksheetColumnsProps {
  t: WorksheetTranslate;
  confirm: ConfirmFunction;
  diagrams?: { items: { id: string; subProcess?: string | null }[] };
  apps?: { items: Application[] };
  elcControls: Control[];
  commit: WorksheetRowCommit;
  setIsAddingApp: (val: boolean) => void;
}

export function createWorksheetColumns({
  t,
  confirm,
  diagrams,
  apps,
  elcControls,
  commit,
  setIsAddingApp,
}: CreateWorksheetColumnsProps): ColumnDef<Control>[] {
  return [
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 sm:h-7 sm:w-7 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-slate-300 hover:text-red-600 transition-colors shrink-0"
          onClick={async () => {
            const ok = await confirm({
              title: t('common:actions.deletePermanently'),
              description: t('worksheet.deleteRowConfirm'),
              variant: 'destructive'
            });
            if (ok) {
              commit.remove(row.original.id);
            }
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
      size: 40
    },
    {
      id: 'no',
      header: t('worksheet.columns.no'),
      cell: info => <span className="text-xs text-slate-400 px-2">{info.row.index + 1}</span>,
      size: 40
    },
    {
      accessorKey: 'code',
      header: t('worksheet.columns.bpmCode'),
      cell: ({ row, getValue }) => (
        <Input 
          className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 focus:border-slate-400 bg-white px-2 font-mono uppercase w-[100px]"
          placeholder="BPM-001"
          defaultValue={getValue<string>()}
          onBlur={(e) => commit.saveField(row.original.id, 'code', e.target.value)}
        />
      ),
      size: 110
    },
    {
      id: 'workflow',
      header: t('worksheet.columns.bpmWorkflow'),
      cell: ({ row }) => {
        const subProcess = row.original.subProcess;
        const diagram = diagrams?.items.find(d => d.subProcess === subProcess);
        
        return (
          <Button 
            variant={diagram ? "default" : "outline"} 
            size="sm" 
            className={cn(
              "h-11 sm:h-7 min-h-[44px] sm:min-h-0 text-xs gap-1.5 uppercase font-bold mx-2",
              diagram ? "bg-mancity-pattern hover:opacity-90 text-primary-foreground shadow-sm" : "text-slate-400 border-slate-200"
            )}
            onClick={() => commit.openDiagramFor(subProcess || "")}
          >
            <Network className="h-3 w-3" />
            {diagram ? t('worksheet.viewFlow') : t('worksheet.createFlow')}
          </Button>
        );
      },
      size: 100
    },
    {
      accessorKey: 'businessProcess',
      header: t('worksheet.columns.businessProcess'),
      cell: ({ row, getValue }) => (
        <Input 
          className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 focus:border-slate-400 bg-white px-2 min-w-[150px]"
          placeholder={t('worksheet.placeholders.businessProcess')}
          defaultValue={getValue<string>()}
          onBlur={(e) => commit.saveField(row.original.id, 'businessProcess', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'subProcess',
      header: t('worksheet.columns.subProcess'),
      cell: ({ row, getValue }) => (
        <Input 
          className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 focus:border-slate-400 bg-white px-2 font-bold min-w-[180px]"
          placeholder={t('worksheet.placeholders.subProcess')}
          defaultValue={getValue<string>()}
          onBlur={(e) => commit.saveField(row.original.id, 'subProcess', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'name',
      header: t('worksheet.columns.controlName'),
      cell: ({ row, getValue }) => (
        <Input 
          className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 focus:border-slate-400 bg-white px-2 font-medium text-slate-900 min-w-[200px]"
          defaultValue={getValue<string>()}
          onBlur={(e) => commit.saveField(row.original.id, 'name', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'location',
      header: t('worksheet.columns.location'),
      cell: ({ row, getValue }) => (
        <Input 
          className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 focus:border-slate-400 bg-white px-2 min-w-[100px]"
          placeholder={t('worksheet.placeholders.location')}
          defaultValue={getValue<string>()}
          onBlur={(e) => commit.saveField(row.original.id, 'location', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'description',
      header: t('worksheet.columns.description'),
      cell: ({ row, getValue }) => (
        <textarea 
          className="w-full min-h-[60px] text-base md:text-xs border border-slate-200 focus:ring-1 focus:ring-slate-400 bg-white p-2 resize-none min-w-[250px] rounded-md"
          placeholder={t('worksheet.placeholders.description')}
          defaultValue={getValue<string>()}
          onBlur={(e) => commit.saveField(row.original.id, 'description', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'isFraudRelated',
      header: t('worksheet.columns.fraudRisk'),
      cell: ({ row, getValue }) => (
        <Select 
          value={getValue<boolean>() ? 'Y' : 'T'} 
          onValueChange={(v) => commit.patch(row.original.id, { isFraudRelated: v === 'Y' })}
        >
          <SelectTrigger className="h-11 md:h-7 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 bg-white w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Y">Y</SelectItem>
            <SelectItem value="T">T</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      accessorKey: 'reference',
      header: t('worksheet.columns.reference'),
      cell: ({ row, getValue }) => (
        <Input 
          className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 focus:border-indigo-300 bg-white px-2 min-w-[120px]"
          defaultValue={getValue<string>()}
          onBlur={(e) => commit.saveField(row.original.id, 'reference', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'relatedControlIds',
      header: t('worksheet.columns.elcUmbrella'),
      cell: ({ row, getValue }) => {
        const selectedIds = getValue<string[]>() || [];
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-11 md:h-8 min-h-[44px] md:min-h-0 w-full justify-start font-normal px-2 text-base md:text-xs gap-2 border-slate-200 bg-white">
                <Shield className={cn("h-3.5 w-3.5", selectedIds.length > 0 ? "text-indigo-600" : "text-slate-300")} />
                {selectedIds.length > 0 ? t('worksheet.elc.linked', { n: selectedIds.length }) : t('worksheet.elc.select')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] max-w-[300px] sm:w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder={t('worksheet.elc.search')} className="h-8 text-xs" />
                <CommandList>
                  <CommandEmpty>{t('worksheet.elc.empty')}</CommandEmpty>
                  <CommandGroup>
                    {elcControls.map((elc) => (
                      <CommandItem
                        key={elc.id}
                        onSelect={() => {
                          const nextIds = selectedIds.includes(elc.id)
                            ? selectedIds.filter(id => id !== elc.id)
                            : [...selectedIds, elc.id];
                          commit.patch(row.original.id, { relatedControlIds: nextIds });
                        }}
                        className="text-xs flex items-center justify-between flex-wrap gap-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-bold">{elc.code}</span>
                          <span className="text-xs text-slate-500 line-clamp-1">{elc.name}</span>
                        </div>
                        {selectedIds.includes(elc.id) && <Check className="h-3 w-3 text-indigo-600" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        );
      },
      size: 150
    },
    {
      accessorKey: 'supportingDocs',
      header: t('worksheet.columns.supportingDocs'),
      cell: ({ row, getValue }) => (
        <Input 
          className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 focus:border-indigo-300 bg-white px-2 min-w-[150px]"
          defaultValue={getValue<string>()}
          onBlur={(e) => commit.saveField(row.original.id, 'supportingDocs', e.target.value)}
        />
      )
    },
    {
      accessorKey: 'isKeyControl',
      header: t('worksheet.columns.keyControl'),
      cell: ({ row, getValue }) => (
        <Select 
          value={getValue<boolean>() ? 'Y' : 'T'} 
          onValueChange={(v) => commit.patch(row.original.id, { isKeyControl: v === 'Y' })}
        >
          <SelectTrigger className="h-11 md:h-7 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 bg-white w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Y">Y</SelectItem>
            <SelectItem value="T">T</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      accessorKey: 'ipos',
      header: t('worksheet.columns.ipos'),
      cell: ({ row, getValue }) => (
        <Input 
          className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 focus:border-indigo-300 bg-white px-2 min-w-[100px]"
          defaultValue={(getValue<string[]>() || []).join(', ')}
          onBlur={(e) => commit.saveField(row.original.id, 'ipos', e.target.value.split(',').map(s => s.trim()))}
        />
      )
    },
    {
      accessorKey: 'assertions',
      header: t('worksheet.columns.assertions'),
      cell: ({ row, getValue }) => (
        <Input 
          className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 focus:border-indigo-300 bg-white px-2 min-w-[100px]"
          defaultValue={(getValue<string[]>() || []).join(', ')}
          onBlur={(e) => commit.saveField(row.original.id, 'assertions', e.target.value.split(',').map(s => s.trim()))}
        />
      )
    },
    {
      accessorKey: 'type',
      header: t('worksheet.columns.type'),
      cell: ({ row, getValue }) => (
        <Select 
          value={getValue<string>()} 
          onValueChange={(v: ControlType) => commit.patch(row.original.id, { type: v })}
        >
          <SelectTrigger className="h-11 md:h-7 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 bg-white w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Preventive">{t('worksheet.options.preventive')}</SelectItem>
            <SelectItem value="Detective">{t('worksheet.options.detective')}</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      accessorKey: 'nature',
      header: t('worksheet.columns.nature'),
      cell: ({ row, getValue }) => (
        <Select 
          value={getValue<string>()} 
          onValueChange={(v: ControlNature) => commit.patch(row.original.id, { nature: v })}
        >
          <SelectTrigger className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 bg-white min-w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Manual">{t('worksheet.options.manual')}</SelectItem>
            <SelectItem value="Automated">{t('worksheet.options.automated')}</SelectItem>
            <SelectItem value="ITDM - IPE">{t('worksheet.options.itdmIpe')}</SelectItem>
            <SelectItem value="ITDM - EUC">{t('worksheet.options.itdmEuc')}</SelectItem>
            <SelectItem value="MRC">{t('worksheet.options.mrc')}</SelectItem>
          </SelectContent>
        </Select>
      )
    },
    {
      accessorKey: 'applicationId',
      header: t('worksheet.columns.application'),
      cell: ({ row, getValue }) => (
        <Select 
          value={getValue<string>() || "none"} 
          onValueChange={(v) => {
            if (v === 'add-new') {
              setIsAddingApp(true);
            } else {
              commit.patch(row.original.id, { applicationId: v === 'none' ? undefined : v });
            }
          }}
        >
          <SelectTrigger className="h-11 md:h-9 min-h-[44px] md:min-h-0 text-base md:text-xs border-slate-200 bg-white min-w-[120px]">
            <SelectValue placeholder={t('worksheet.placeholders.application')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('worksheet.options.none')}</SelectItem>
            {apps?.items.map(app => (
              <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
            ))}
            <SelectItem value="add-new" className="text-primary font-bold border-t mt-1">{t('worksheet.options.addNewApplication')}</SelectItem>
          </SelectContent>
        </Select>
      )
    }
  ];
}
