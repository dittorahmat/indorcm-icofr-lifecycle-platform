import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { Control, TestRecord, Deficiency, User } from '@shared/types';
import { AlertTriangle, UserCheck, ListFilter, History } from 'lucide-react';
import { ControlTestCard } from '@/components/testing/ControlTestCard';

export function TestWorkbench() {
  const { t } = useTranslation('testing');
  const [showOnlyValidated, setShowOnlyValidated] = React.useState(true);

  const { data: controlsData, isLoading: controlsLoading } = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  const { data: deficienciesData, isLoading: deficienciesLoading } = useQuery({
    queryKey: ['deficiencies'],
    queryFn: () => api<{ items: Deficiency[] }>('/api/deficiencies'),
  });

  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['tests'],
    queryFn: () => api<{ items: TestRecord[] }>('/api/tests'),
  });

  const { data: userData } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => api<User>('/api/user/me'),
  });

  const isCoolingOffViolation = (control: Control) => {
    if (!userData?.processOwnershipHistory) return false;
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
    return userData.processOwnershipHistory.some(h => 
      h.processId === control.rcmId &&
      (h.role === 'Line 1' || h.role === 'Line 2') &&
      h.endDate > oneYearAgo
    );
  };

  const isLoading = controlsLoading || deficienciesLoading || testsLoading;

  const filteredControls = controlsData?.items.filter(c => {
    if (showOnlyValidated) return c.line2Validation?.status === 'Validated';
    return true;
  }) || [];

  return (
    <AppLayout container>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border">
            <Switch 
              id="validated-filter" 
              checked={showOnlyValidated} 
              onCheckedChange={setShowOnlyValidated} 
            />
            <Label htmlFor="validated-filter" className="text-xs font-bold cursor-pointer flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-green-600" /> {t('filterReady')}
            </Label>
          </div>
        </div>
        
        <Accordion type="single" collapsible className="w-full space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : filteredControls.length > 0 ? (
            filteredControls.map(control => {
              const latestOpenDeficiency = deficienciesData?.items
                .filter(d => d.controlId === control.id && d.status === 'Open')
                .sort((a, b) => ((b.identifiedDate || 0) as number) - ((a.identifiedDate || 0) as number))[0];

              const violation = isCoolingOffViolation(control);
              const controlHistory = testsData?.items.filter(t => t.controlId === control.id) || [];

              return (
                <AccordionItem value={control.id} key={control.id} className="border-none">
                  <AccordionTrigger className={cn(
                    "bg-background p-4 rounded-lg hover:bg-accent transition-colors shadow-sm",
                    violation && "opacity-60 cursor-not-allowed grayscale"
                  )}>
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-semibold">{control.name}</span>
                      {latestOpenDeficiency && <Badge variant="destructive" className="text-[8px] h-4">{t('badges.openDeficiency')}</Badge>}
                      {violation && (
                        <Badge variant="outline" className="text-[8px] h-4 border-amber-500 text-amber-700 bg-amber-50 gap-1">
                          <AlertTriangle className="h-2 w-2" /> {t('coolingOff.violation')}
                        </Badge>
                      )}
                      {controlHistory.length > 0 && (
                        <Badge variant="secondary" className="text-[8px] h-4 gap-1">
                          <History className="h-2 w-2" /> {controlHistory.length} {t('badges.tests')}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    {violation ? (
                      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-center">
                        <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                        <h4 className="font-bold text-amber-800">{t('coolingOff.restricted')}</h4>
                        <p className="text-xs text-amber-700 max-w-md mx-auto mt-1 leading-relaxed">
                          {t('coolingOff.prohibited')}
                        </p>
                      </div>
                    ) : (
                      <ControlTestCard 
                        control={control} 
                        openDeficiencyDate={latestOpenDeficiency?.identifiedDate as number}
                        history={controlHistory}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })
          ) : (
            <div className="text-center py-20 bg-muted/10 rounded-xl border-2 border-dashed">
              <ListFilter className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">{t('noControls')}</h3>
              <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto mt-1">
                {t('noControlsDetail')}
              </p>
            </div>
          )}
        </Accordion>
      </div>
    </AppLayout>
  );
}
