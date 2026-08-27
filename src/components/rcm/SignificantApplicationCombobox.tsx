import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown, Plus, Server, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Application } from '@shared/types';

interface SignificantApplicationComboboxProps {
  value?: string | null;
  appName?: string | null;
  onChange: (appId: string | null, appName?: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function SignificantApplicationCombobox({
  value,
  appName,
  onChange,
  disabled = false,
  className,
  placeholder,
}: SignificantApplicationComboboxProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppDescription, setNewAppDescription] = useState('');

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api<{ items: Application[] }>('/api/applications'),
  });

  const applications = appsData?.items || [];

  // Find selected application by ID or by Name fallback
  const selectedApp = applications.find(
    (app) => app.id === value || (appName && app.name.toLowerCase() === appName.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api<{ id: string; name: string }>('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name.trim(),
          description: data.description?.trim() || null,
          isSignificant: true,
          criticality: 'Medium',
          itgcAreas: ['Access to Program and Data', 'Program Changes'],
        }),
      }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(t('rcm:applications.createdSuccess', { name: variables.name, defaultValue: `Application "${variables.name}" created` }));
      onChange(res.id, variables.name);
      setIsQuickAddOpen(false);
      setOpen(false);
      setNewAppName('');
      setNewAppDescription('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create application');
    },
  });

  const handleOpenQuickAdd = (nameToSuggest?: string) => {
    setNewAppName(nameToSuggest || searchQuery);
    setIsQuickAddOpen(true);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    createMutation.mutate({
      name: newAppName,
      description: newAppDescription,
    });
  };

  const displayLabel = selectedApp
    ? selectedApp.name
    : appName
    ? appName
    : placeholder || t('rcm:matrix.select_application', { defaultValue: 'Select Application (Optional)' });

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between font-normal text-left h-9 bg-white',
              !selectedApp && !appName && 'text-muted-foreground',
              className
            )}
          >
            <span className="flex items-center gap-2 truncate">
              <Server className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="truncate">{displayLabel}</span>
            </span>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {(selectedApp || appName) && !disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  className="rounded-full p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(null, '');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onChange(null, '');
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </span>
              )}
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0 shadow-lg" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('rcm:applications.searchPlaceholder', { defaultValue: 'Search application...' })}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[260px]">
              {isLoading && (
                <div className="p-3 text-xs text-center text-slate-400">Loading applications...</div>
              )}

              <CommandGroup heading={t('rcm:applications.library', { defaultValue: 'Application Library' })}>
                {/* Clear / None option */}
                <CommandItem
                  value="__none__"
                  onSelect={() => {
                    onChange(null, '');
                    setOpen(false);
                  }}
                  className="text-xs text-slate-500 italic flex items-center justify-between"
                >
                  <span>{t('rcm:applications.none', { defaultValue: 'None (Pure Manual Control)' })}</span>
                  {!selectedApp && !appName && <Check className="h-3.5 w-3.5 text-emerald-600" />}
                </CommandItem>

                {applications
                  .filter((app) =>
                    !searchQuery || app.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((app) => {
                    const isSelected = app.id === value || (appName && app.name.toLowerCase() === appName.toLowerCase());
                    return (
                      <CommandItem
                        key={app.id}
                        value={app.id}
                        onSelect={() => {
                          onChange(app.id, app.name);
                          setOpen(false);
                        }}
                        className="text-xs flex items-center justify-between py-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Server className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          <span className="font-medium text-slate-800 truncate">{app.name}</span>
                          {app.isSignificant && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 border-indigo-200 text-indigo-600 bg-indigo-50/50">
                              Significant
                            </Badge>
                          )}
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                      </CommandItem>
                    );
                  })}
              </CommandGroup>

              {/* Show inline create action if searched query has no exact match */}
              {searchQuery.trim().length > 0 &&
                !applications.some(
                  (a) => a.name.toLowerCase() === searchQuery.trim().toLowerCase()
                ) && (
                  <div className="p-1 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium gap-1.5 h-8"
                      onClick={() => handleOpenQuickAdd(searchQuery.trim())}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>
                        {t('rcm:applications.addNewApp', {
                          name: searchQuery.trim(),
                          defaultValue: `+ Add "${searchQuery.trim()}"`,
                        })}
                      </span>
                    </Button>
                  </div>
                )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick Add Dialog */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-indigo-600" />
              {t('rcm:applications.quickAddTitle', { defaultValue: 'Add Significant Application' })}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {t('rcm:applications.quickAddDesc', {
                defaultValue: 'Register a new IT asset to link with this control and track ITGC compliance.',
              })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickAddSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                {t('rcm:applications.nameLabel', { defaultValue: 'Application Name' })} <span className="text-red-500">*</span>
              </Label>
              <Input
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                placeholder="e.g. SAP S/4HANA, Core Banking, Oracle Financials"
                required
                className="text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-700">
                {t('rcm:applications.descLabel', { defaultValue: 'Description / Scope' })}
              </Label>
              <Input
                value={newAppDescription}
                onChange={(e) => setNewAppDescription(e.target.value)}
                placeholder="e.g. Enterprise ERP for General Ledger and Purchasing"
                className="text-sm"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsQuickAddOpen(false)}
                disabled={createMutation.isPending}
              >
                {t('common:cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!newAppName.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? 'Saving...' : t('common:save', { defaultValue: 'Save & Select' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
