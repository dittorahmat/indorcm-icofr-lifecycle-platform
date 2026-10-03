import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Calendar, FileType, Hash, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Settings } from '@shared/types';

interface ReportHeaderProps {
  title: string;
  documentNo?: string;
  subProcess?: string;
  period?: string;
  date?: string;
  isDraft?: boolean;
}

export const ReportHeader = ({ 
  title, 
  documentNo = "APP-7A-ICOFR", 
  subProcess, 
  period, 
  date,
  isDraft 
}: ReportHeaderProps) => {
  const { t } = useTranslation(['csa_hub', 'common']);
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings')
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-white border-b-4 border-slate-900 p-4 sm:p-6 mb-4 sm:mb-6 flex flex-col gap-4 sm:gap-6">
      {/* Top row: Logo & Signatories placeholder */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 flex-wrap">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-lg border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
             {settings?.logoUrl ? (
               <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
             ) : (
               <div className="text-center px-1">
                 <ShieldCheck className="h-8 w-8 text-slate-200 mx-auto" />
                 <span className="text-xs font-black text-slate-300 uppercase leading-tight">COMPANY LOGO</span>
               </div>
             )}
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-xl font-black uppercase tracking-tighter text-slate-900 leading-tight truncate">
              {settings?.companyName || "PT. INDO GRC PRO"}
            </h1>
            <p className="text-xs sm:text-sm font-black text-indigo-700 uppercase tracking-widest mt-1">
              {title}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-bold uppercase">
               <MapPin className="h-3 w-3" /> Digital Governance Platform
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1 text-xs w-full sm:w-auto border-t-2 border-slate-100 pt-4 sm:border-t-0 sm:pt-0 sm:border-l-2 sm:pl-6 sm:border-slate-100">
           <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-slate-400 font-black uppercase">Doc No:</span>
              <span className="font-mono font-bold text-slate-700">{documentNo}</span>
           </div>
           <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-slate-400 font-black uppercase">Periode:</span>
              <span className="font-bold text-slate-700">{period || "-"}</span>
           </div>
           <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-slate-400 font-black uppercase">Tanggal:</span>
              <span className="font-bold text-slate-700">{date || "-"}</span>
           </div>
           <div className="flex items-center justify-between gap-4 flex-wrap">
              <span className="text-slate-400 font-black uppercase">Status:</span>
              <Badge className={cn("text-xs h-4 px-1.5 font-black uppercase", isDraft ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")}>
                {isDraft ? 'DRAFT' : 'FINAL'}
              </Badge>
           </div>
        </div>
      </div>

      {/* Meta Bar */}
      {subProcess && (
        <div className="bg-mancity-pattern text-primary-foreground p-3 sm:p-3 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center px-4 sm:px-6 shadow-md flex-wrap gap-2">
           <div className="flex items-center gap-3">
              <span className="text-xs font-black text-primary-foreground/40 uppercase tracking-widest">Sub-Proses:</span>
              <span className="text-sm font-black uppercase tracking-tight text-primary-foreground">{subProcess}</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="h-6 w-[1px] bg-primary-foreground/10" />
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-black uppercase tracking-widest text-primary-foreground">Regulatory Aligned SK-5/2024</span>
           </div>
        </div>
      )}
    </div>
  );
};

// Simplified Badge for the header since we don't want to import UI components if possible
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
    {children}
  </span>
);
