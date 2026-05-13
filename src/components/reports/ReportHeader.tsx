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
    <div className="w-full bg-white border-b-4 border-slate-900 p-6 mb-6 flex flex-col gap-6">
      {/* Top row: Logo & Signatories placeholder */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-50 rounded-xl border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
             {settings?.logoUrl ? (
               <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
             ) : (
               <div className="text-center">
                 <ShieldCheck className="h-8 w-8 text-slate-200 mx-auto" />
                 <span className="text-[7px] font-black text-slate-300 uppercase">COMPANY LOGO</span>
               </div>
             )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900 leading-tight">
              {settings?.companyName || "PT. INDO GRC PRO"}
            </h1>
            <p className="text-sm font-black text-indigo-700 uppercase tracking-widest mt-1">
              {title}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 font-bold uppercase">
               <MapPin className="h-3 w-3" /> Digital Governance Platform
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1 text-xs border-l-2 pl-6 border-slate-100">
           <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-black uppercase">Doc No:</span>
              <span className="font-mono font-bold text-slate-700">{documentNo}</span>
           </div>
           <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-black uppercase">Periode:</span>
              <span className="font-bold text-slate-700">{period || "-"}</span>
           </div>
           <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-black uppercase">Tanggal:</span>
              <span className="font-bold text-slate-700">{date || "-"}</span>
           </div>
           <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400 font-black uppercase">Status:</span>
              <Badge className={cn("text-xs h-4 px-1.5 font-black uppercase", isDraft ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")}>
                {isDraft ? 'DRAFT' : 'FINAL'}
              </Badge>
           </div>
        </div>
      </div>

      {/* Meta Bar */}
      {subProcess && (
        <div className="bg-slate-900 text-white p-3 rounded-lg flex justify-between items-center px-6 shadow-md">
           <div className="flex items-center gap-3">
              <span className="text-xs font-black text-white/40 uppercase tracking-widest">Sub-Proses:</span>
              <span className="text-sm font-black uppercase tracking-tight">{subProcess}</span>
           </div>
           <div className="flex items-center gap-3">
              <div className="h-6 w-[1px] bg-white/10" />
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-widest">Regulatory Aligned SK-5/2024</span>
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
