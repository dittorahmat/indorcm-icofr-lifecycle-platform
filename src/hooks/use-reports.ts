import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Settings, Control, TestRecord } from '@shared/types';

export function useReportSummary() {
  return useQuery({
    queryKey: ['reportSummary'],
    queryFn: () => api<any>('/api/reports/summary'),
  });
}

export function useAggregateDeficiencies() {
  return useQuery({
    queryKey: ['aggregatedeficiencies'],
    queryFn: () => api<{ items: any[] }>('/api/aggregatedeficiencies'),
  });
}

export function useSignOffReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api<Settings>('/api/reports/sign-off', { method: 'POST' }),
    onSuccess: (updatedSettings) => {
      toast.success('Report signed and locked by CEO & CFO.', {
        description: `Verification Hash: ${updatedSettings.verificationHash}`,
        // Use a simple emoji if Lucide icon is hard to pass through toast context reliably without re-importing
        icon: '✅' 
      });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err: any) => toast.error(`Sign-off failed: ${err.message}`)
  });
}

export function useExportReport() {
  return async (format: 'csv' | 'excel') => {
    const toastId = toast.loading(`Exporting to ${format.toUpperCase()}...`);
    try {
      const response = await fetch(`/api/reports/export`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Mock-Role': localStorage.getItem('mockRole') || 'Line 2' 
        },
        body: JSON.stringify({ format })
      });
      if (!response.ok) throw new Error('Export failed');
      const apiResponse = await response.json();
      const data = apiResponse.data;

      if (format === 'csv') {
        const { unparse } = await import('papaparse');
        const csv = unparse(data.deficiencies || []);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `icofr_deficiencies_${new Date().toISOString().split('T')[0]}.csv`);
      } else {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();
        if (data.rcms) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.rcms), 'RCM');
        if (data.controls) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.controls), 'Controls');
        if (data.deficiencies) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.deficiencies), 'Deficiencies');
        if (data.tests) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.tests), 'Test Results');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        saveAs(blob, `icofr_full_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
      toast.success('Export successful!', { id: toastId });
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`, { id: toastId });
    }
  };
}

export function useReportData() {
  const rcmQuery = useQuery({
    queryKey: ['rcm'],
    queryFn: () => api<{ items: any[] }>('/api/rcm'),
  });

  const controlsQuery = useQuery({
    queryKey: ['controls'],
    queryFn: () => api<{ items: Control[] }>('/api/controls'),
  });

  const testsQuery = useQuery({
    queryKey: ['tests'],
    queryFn: () => api<{ items: TestRecord[] }>('/api/tests'),
  });

  return {
    rcmData: rcmQuery.data?.items || [],
    controlsData: controlsQuery.data?.items || [],
    testsData: testsQuery.data?.items || [],
    isLoading: rcmQuery.isLoading || controlsQuery.isLoading || testsQuery.isLoading
  };
}
