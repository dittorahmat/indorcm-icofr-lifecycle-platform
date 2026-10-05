import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { MOCK_HEATMAP_DATA } from './mock-regulatory-data';
import { Info, ExternalLink } from 'lucide-react';
import { useOrganizationBranding } from '@/hooks/use-organization-branding';

type RiskLevel = 'High' | 'Medium' | 'Low';

interface CellProps {
  qn: RiskLevel;
  ql: RiskLevel;
}

const getOutcome = (qn: RiskLevel, ql: RiskLevel): { label: string, color: string, textColor: string } => {
  if (qn === 'High') {
    if (ql === 'High' || ql === 'Medium') return { label: 'TINGGI', color: 'bg-red-500 hover:bg-red-600', textColor: 'text-white' };
    return { label: 'MEDIUM', color: 'bg-amber-400 hover:bg-amber-500', textColor: 'text-amber-950' };
  }
  if (qn === 'Medium') {
    if (ql === 'High') return { label: 'TINGGI', color: 'bg-red-500 hover:bg-red-600', textColor: 'text-white' };
    if (ql === 'Medium') return { label: 'MEDIUM', color: 'bg-amber-400 hover:bg-amber-500', textColor: 'text-amber-950' };
    return { label: 'RENDAH', color: 'bg-green-500 hover:bg-green-600', textColor: 'text-white' };
  }
  // Low Qn
  if (ql === 'High') return { label: 'MEDIUM', color: 'bg-amber-400 hover:bg-amber-500', textColor: 'text-amber-950' };
  return { label: 'RENDAH', color: 'bg-green-500 hover:bg-green-600', textColor: 'text-white' };
};

function CellDetail({ outcome, risks, qn, ql }: {
  outcome: { label: string; color: string };
  risks: Array<{ id: React.Key; title: React.ReactNode; process: React.ReactNode }>;
  qn: RiskLevel;
  ql: RiskLevel;
}) {
  return (
    <>
      <div className={cn("p-3 text-white text-xs font-bold flex flex-wrap justify-between items-center gap-2", outcome.color.replace('hover:', ''))}>
        <span className="min-w-0 truncate">RISIKO: {qn} Qn / {ql} Ql</span>
        <Badge variant="outline" className="bg-white/20 border-white/30 text-white text-xs shrink-0">{outcome.label}</Badge>
      </div>
      <div className="p-4 space-y-3">
        {risks.length > 0 ? (
          risks.map(r => (
            <div key={r.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <p className="text-xs font-bold text-slate-800">{r.title}</p>
              </div>
              <p className="text-xs text-slate-500 ml-3.5 uppercase font-medium">Process: {r.process}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 text-center py-2">Tidak ada data risiko di kategori ini.</p>
        )}
        <div className="pt-2 border-t mt-2">
          <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <ExternalLink className="h-3 w-3" /> Lihat Detail di RCM Matrix
          </button>
        </div>
      </div>
    </>
  );
}

export function RiskHeatmap() {
  const levels: RiskLevel[] = ['High', 'Medium', 'Low'];
  const { companyName } = useOrganizationBranding();

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50/50 border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
          <div className="space-y-1 min-w-0">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2 min-w-0">
              Heatmap Risiko (SK-5/2024)
            </CardTitle>
            <CardDescription>Kombinasi Faktor Kuantitatif vs Kualitatif - {companyName}</CardDescription>
          </div>
          <Badge variant="outline" className="bg-white gap-1 text-xs font-bold self-start sm:self-auto shrink-0">
            <Info className="h-3 w-3" /> Tabel 12 Juknis
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pt-6 sm:pt-8">
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-[28px_1fr] sm:grid-cols-[40px_1fr] gap-2 sm:gap-4 w-full max-w-[600px] min-w-0">
            {/* Y-Axis Label */}
            <div className="flex flex-col justify-between py-10">
              <span className="text-xs font-black text-slate-400 uppercase vertical-text -rotate-180 h-full flex items-center justify-center">Kuantitatif</span>
            </div>

            <div className="space-y-4 min-w-0 max-w-full">
              <div className="hidden sm:block overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint -mx-1 px-1">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 min-w-0 w-full">
                {levels.map((qn) => (
                  levels.slice().reverse().map((ql) => {
                    const outcome = getOutcome(qn, ql);
                    const key = `${qn}-${ql}`;
                    const risks = MOCK_HEATMAP_DATA[key as keyof typeof MOCK_HEATMAP_DATA] || [];
                    
                    return (
                      <Popover key={key}>
                        <PopoverTrigger asChild>
                          <button className={cn(
                            "aspect-square rounded-md flex flex-col items-center justify-center p-1.5 sm:p-2 transition-colors shadow-sm relative group min-h-[56px] min-w-0 w-full overflow-hidden",
                            outcome.color,
                            outcome.textColor
                          )}>
                            <span className="text-xs font-bold opacity-70 uppercase tracking-tight truncate max-w-full" title={`${qn}-${ql}`}>{qn}-{ql}</span>
                            <span className="text-xs font-bold mt-0.5 truncate max-w-full" title={outcome.label}>{outcome.label}</span>
                            {risks.length > 0 && (
                              <Badge className="absolute top-0.5 right-0.5 bg-mancity-pattern text-primary-foreground border-white border h-5 min-w-[20px] flex items-center justify-center px-1 text-xs font-bold">
                                {risks.length}
                              </Badge>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] max-w-80 sm:w-80 p-0 overflow-hidden shadow-2xl border-indigo-100">
                          <CellDetail outcome={outcome} risks={risks} qn={qn} ql={ql} />
                        </PopoverContent>
                      </Popover>
                    );
                  })
                ))}
              </div>

              </div>

              {/* Mobile compact list: dot + label + count, tap for detail */}
              <div className="sm:hidden space-y-2">
                {levels.map((qn) => (
                  levels.slice().reverse().map((ql) => {
                    const outcome = getOutcome(qn, ql);
                    const cellKey = `${qn}-${ql}`;
                    const risks = MOCK_HEATMAP_DATA[cellKey as keyof typeof MOCK_HEATMAP_DATA] || [];
                    return (
                      <Popover key={`m-${cellKey}`}>
                        <PopoverTrigger asChild>
                          <button className="w-full min-h-[44px] flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-left shadow-sm">
                            <span className={cn("h-3 w-3 rounded-full shrink-0", outcome.color.split(' ')[0])} aria-hidden="true" />
                            <span className="text-xs font-bold text-slate-700 min-w-0 flex-1 truncate">{qn} / {ql}</span>
                            <span className={cn("text-xs font-bold uppercase shrink-0", outcome.textColor === 'text-white' ? 'text-slate-500' : outcome.textColor)}>{outcome.label}</span>
                            {risks.length > 0 && (
                              <Badge className="bg-mancity-pattern text-primary-foreground h-5 min-w-[20px] flex items-center justify-center px-1 text-xs font-bold shrink-0">
                                {risks.length}
                              </Badge>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] max-w-80 p-0 overflow-hidden shadow-2xl border-indigo-100">
                          <CellDetail outcome={outcome} risks={risks} qn={qn} ql={ql} />
                        </PopoverContent>
                      </Popover>
                    );
                  })
                ))}
              </div>

              {/* X-Axis Labels */}
              <div className="hidden sm:block overflow-x-auto max-w-full touch-pan-x overscroll-x-contain table-scroll-hint -mx-1 px-1">
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-center min-w-0 w-full">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate" title="Rendah">Rendah</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate" title="Medium">Medium</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate" title="Tinggi">Tinggi</span>
              </div>
              </div>
              <div className="text-center">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Kualitatif</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
        }
      `}</style>
    </Card>
  );
}
