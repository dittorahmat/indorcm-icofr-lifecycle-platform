import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import type { COSOPrinciple } from '@shared/types';

// Standard 17 COSO Principles mapping
const COSO_PRINCIPLES: Record<COSOPrinciple, { component: string, description: string }> = {
  1: { component: 'Control Environment', description: 'Demonstrates commitment to integrity and ethical values' },
  2: { component: 'Control Environment', description: 'Exercises oversight responsibility' },
  3: { component: 'Control Environment', description: 'Establishes structure, authority, and responsibility' },
  4: { component: 'Control Environment', description: 'Demonstrates commitment to competence' },
  5: { component: 'Control Environment', description: 'Enforces accountability' },
  6: { component: 'Risk Assessment', description: 'Specifies suitable objectives' },
  7: { component: 'Risk Assessment', description: 'Identifies and analyzes risk' },
  8: { component: 'Risk Assessment', description: 'Assesses fraud risk' },
  9: { component: 'Risk Assessment', description: 'Identifies and analyzes significant change' },
  10: { component: 'Control Activities', description: 'Selects and develops control activities' },
  11: { component: 'Control Activities', description: 'Selects and develops general controls over technology' },
  12: { component: 'Control Activities', description: 'Deploys through policies and procedures' },
  13: { component: 'Information & Communication', description: 'Uses relevant information' },
  14: { component: 'Information & Communication', description: 'Communicates internally' },
  15: { component: 'Information & Communication', description: 'Communicates externally' },
  16: { component: 'Monitoring Activities', description: 'Conducts ongoing and/or separate evaluations' },
  17: { component: 'Monitoring Activities', description: 'Evaluates and communicates deficiencies' }
};

interface COSOHeatmapProps {
  // Pass evaluated statuses for each principle. 'Effective' | 'Ineffective' | 'Not Tested'
  principleStatuses?: Record<number, 'Effective' | 'Ineffective' | 'Not Tested'>;
}

export function COSOHeatmap({ principleStatuses }: COSOHeatmapProps) {
  // Mock statuses if none provided
  const statuses = principleStatuses || {
    1: 'Effective', 2: 'Effective', 3: 'Effective', 4: 'Effective', 5: 'Effective',
    6: 'Effective', 7: 'Effective', 8: 'Effective', 9: 'Effective',
    10: 'Ineffective', 11: 'Effective', 12: 'Effective',
    13: 'Effective', 14: 'Ineffective', 15: 'Effective',
    16: 'Effective', 17: 'Effective'
  } as Record<number, 'Effective' | 'Ineffective' | 'Not Tested'>;

  const components = [
    { name: 'Control Environment', range: [1, 2, 3, 4, 5] },
    { name: 'Risk Assessment', range: [6, 7, 8, 9] },
    { name: 'Control Activities', range: [10, 11, 12] },
    { name: 'Information & Communication', range: [13, 14, 15] },
    { name: 'Monitoring Activities', range: [16, 17] }
  ];

  return (
    <Card className="col-span-full border-2 shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b">
        <CardTitle className="flex items-center gap-2 flex-wrap min-w-0">
          <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
          <span className="min-w-0 break-words">COSO 17 Principles Heatmap (Lampiran 1)</span>
        </CardTitle>
        <CardDescription>
          Status pemenuhan 17 Prinsip COSO berdasarkan hasil pengujian pengendalian ELC dan TLC.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {components.map((comp) => (
            <div key={comp.name} className="space-y-3">
              <h3 className="font-bold text-sm text-slate-700 border-b pb-2 uppercase tracking-wider">{comp.name}</h3>
              <div className="space-y-2">
                {comp.range.map((p) => {
                  const status = statuses[p] || 'Not Tested';
                  const isEffective = status === 'Effective';
                  const isIneffective = status === 'Ineffective';
                  return (
                    <div 
                      key={p} 
                      className={cn(
                        "p-3 rounded-md border text-xs relative overflow-hidden transition-all hover:shadow-md",
                        isEffective ? "bg-green-50 border-green-200" : 
                        isIneffective ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0 left-0 w-1 h-full",
                        isEffective ? "bg-green-500" : 
                        isIneffective ? "bg-red-500" : "bg-slate-300"
                      )} />
                      <div className="flex flex-col gap-1.5 ml-2">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <span className="font-bold text-slate-800">Prinsip {p}</span>
                          {isEffective && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                          {isIneffective && <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
                        </div>
                        <p className="text-slate-600 leading-tight line-clamp-3" title={COSO_PRINCIPLES[p as COSOPrinciple].description}>
                          {COSO_PRINCIPLES[p as COSOPrinciple].description}
                        </p>
                        <div className="mt-1">
                          <Badge variant="outline" className={cn(
                            "text-xs uppercase px-1.5 py-0",
                            isEffective ? "text-green-700 border-green-300" : 
                            isIneffective ? "text-red-700 border-red-300" : "text-slate-500"
                          )}>
                            {status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CheckCircle2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}