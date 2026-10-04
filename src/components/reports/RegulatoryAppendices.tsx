import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, ClipboardCheck, LayoutGrid, ShieldCheck, History, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Deficiency, Control, TestRecord } from '@shared/types';
import { MOCK_COMPANY } from './mock-regulatory-data';

// Assuming these components exist in the same file or can be imported
// Placeholder imports for demonstration
import { ELCReport, TLCReport, ITGCReport, FindingsReport, DoDReport, ChangeLogReport, CSADocReport, Lampiran11Report } from './RegulatoryReportComponents';

interface RegulatoryAppendicesProps {
  rcmData: any[];
  controlsData: Control[];
  testsData: TestRecord[];
  summaryData: any;
}

export function RegulatoryAppendices({ rcmData, controlsData, testsData, summaryData }: RegulatoryAppendicesProps) {
  const { data: deficienciesData } = useQuery({
    queryKey: ['deficiencies'],
    queryFn: () => api<{ items: Deficiency[] }>('/api/deficiencies'),
  });

  const allControls = controlsData;
  const allDeficiencies = deficienciesData?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print flex-wrap gap-2">
        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex-1">
          <Info className="h-4 w-4" />
          <p className="font-medium">COMPLIANCE ENGINE: Aggregating real-time data for <strong>{MOCK_COMPANY}</strong> as per SK-5/2024 Appendices.</p>
        </div>
      </div>

      <Tabs defaultValue="rcm-tlc" className="flex flex-col md:flex-row gap-4 sm:gap-6">
        <TabsList className="flex flex-row md:flex-col h-auto bg-transparent md:border-r border-b md:border-b-0 rounded-none p-0 items-start md:min-w-[200px] overflow-x-auto max-w-full touch-pan-x overscroll-x-contain no-scrollbar w-full md:w-auto">
          <div className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap shrink-0">Risk Control Matrix</div>
          <TabsTrigger value="rcm-elc" className="w-auto md:w-full shrink-0 justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2 min-h-[44px] text-xs font-semibold whitespace-nowrap">
            <ShieldCheck className="h-4 w-4 mr-2" /> ELC (Lampiran 5a)
          </TabsTrigger>
          <TabsTrigger value="rcm-tlc" className="w-auto md:w-full shrink-0 justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2 min-h-[44px] text-xs font-semibold whitespace-nowrap">
            <LayoutGrid className="h-4 w-4 mr-2" /> TLC (Lampiran 5b)
          </TabsTrigger>
          <TabsTrigger value="rcm-itgc" className="w-auto md:w-full shrink-0 justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2 min-h-[44px] text-xs font-semibold whitespace-nowrap">
            <Info className="h-4 w-4 mr-2" /> ITGC (Lampiran 5c)
          </TabsTrigger>
          
          <div className="px-4 py-2 mt-0 md:mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap shrink-0">Findings & DoD</div>
          <TabsTrigger value="findings" className="w-auto md:w-full shrink-0 justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2 min-h-[44px] text-xs font-semibold whitespace-nowrap">
            <AlertCircle className="h-4 w-4 mr-2" /> Temuan (Lampiran 9)
          </TabsTrigger>
          <TabsTrigger value="dod" className="w-auto md:w-full shrink-0 justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2 min-h-[44px] text-xs font-semibold whitespace-nowrap">
            <LayoutGrid className="h-4 w-4 mr-2" /> DoD (Lampiran 10)
          </TabsTrigger>

          <div className="px-4 py-2 mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap shrink-0">Governance</div>
          <TabsTrigger value="changelog" className="w-auto md:w-full shrink-0 justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2 min-h-[44px] text-xs font-semibold whitespace-nowrap">
            <History className="h-4 w-4 mr-2 shrink-0" /> Log Perubahan (Lmp 6)
          </TabsTrigger>
          <TabsTrigger value="csa-doc" className="w-auto md:w-full shrink-0 justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2 min-h-[44px] text-xs font-semibold whitespace-nowrap">
            <ClipboardCheck className="h-4 w-4 mr-2 shrink-0" /> Dok. CSA (Lampiran 7)
          </TabsTrigger>

          <div className="px-4 py-2 mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap shrink-0">Final Conclusion</div>
          <TabsTrigger value="rcm-lamp11" className="w-auto md:w-full shrink-0 justify-start rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-primary data-[state=active]:bg-muted/50 px-4 py-2 min-h-[44px] text-xs font-semibold whitespace-nowrap">
            <ShieldCheck className="h-4 w-4 mr-2 shrink-0" /> Asesmen Manajemen (Lmp 11)
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden min-w-0">
          <TabsContent value="rcm-elc" className="m-0"><ELCReport /></TabsContent>
          <TabsContent value="rcm-tlc" className="m-0"><TLCReport /></TabsContent>
          <TabsContent value="rcm-itgc" className="m-0"><ITGCReport /></TabsContent>
          <TabsContent value="findings" className="m-0"><FindingsReport deficiencies={allDeficiencies} controls={allControls} /></TabsContent>
          <TabsContent value="dod" className="m-0"><DoDReport deficiencies={allDeficiencies} controls={allControls} /></TabsContent>
          <TabsContent value="changelog" className="m-0"><ChangeLogReport /></TabsContent>
          <TabsContent value="csa-doc" className="m-0"><CSADocReport /></TabsContent>
          <TabsContent value="rcm-lamp11" className="m-0"><Lampiran11Report deficiencies={allDeficiencies} controls={allControls} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
