import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DoDLampiran10Report } from '@/components/reports/DoDLampiran10Report';
import { api } from '@/lib/api-client';
import { useFiscalYearStore } from '@/store/useFiscalYearStore';
import type { Deficiency, Control } from '@shared/types';

export function Appendix10Page(): JSX.Element {
  const { t } = useTranslation('reports');
  const { workingYear } = useFiscalYearStore();
  const currentFiscalYear = workingYear ? parseInt(workingYear, 10) : new Date().getFullYear();

  const { data: deficienciesData, isLoading: isDeficienciesLoading } = useQuery({
    queryKey: ['deficiencies', currentFiscalYear],
    queryFn: () => api<{ items: Deficiency[] }>('/api/deficiencies'),
  });

  const { data: controlsData, isLoading: isControlsLoading } = useQuery({
    queryKey: ['controls', currentFiscalYear],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  const isLoading = isDeficienciesLoading || isControlsLoading;
  const deficiencies = deficienciesData?.items || [];
  const controls = controlsData?.items || [];

  return (
    <AppLayout container>
      <div className="space-y-4">
        <PageHeader
          title={t('dodReport.title', { defaultValue: 'LAMPIRAN 10' })}
          description={t('dodReport.subtitle', {
            defaultValue: 'ILUSTRASI DOKUMENTASI KERTAS KERJA PENENTUAN TINGKAT DEFISIENSI PENGENDALIAN (DEGREE OF DEFICIENCY - DoD)',
          })}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-medium text-muted-foreground">
              {t('dodReport.loading', { defaultValue: 'Memuat Kertas Kerja DoD Lampiran 10...' })}
            </p>
          </div>
        ) : (
          <DoDLampiran10Report
            deficiencies={deficiencies}
            controls={controls}
            fiscalYear={currentFiscalYear}
          />
        )}
      </div>
    </AppLayout>
  );
}
