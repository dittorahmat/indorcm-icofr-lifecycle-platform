import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Calendar, FileType, MapPin, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Settings } from '@shared/types';

interface LayoutProps {
  subProcess: string;
  year: string;
  version?: string;
  isDraft?: boolean;
}

export const BPMCanvasHeader = ({ subProcess, year, version = '1.0', isDraft }: LayoutProps) => {
  const { t } = useTranslation(['bpm', 'common']);
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings')
  });

  return (
    <div className="w-full bg-white border-b-2 border-slate-800 p-4 mb-4 flex flex-col gap-4 shadow-sm">
      {/* Top row: Logo & Signatories placeholder */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
             {settings?.logoUrl ? (
               <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
             ) : (
               <span className="text-[8px] font-black text-slate-300 uppercase text-center">LOGO<br/>BUMN</span>
             )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black uppercase tracking-tighter text-slate-800 leading-none">
              {settings?.companyName || "PT. INDO GRC PRO"}
            </h1>
            <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-widest">
              Standard Operating Procedure / BPM Flow
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[9px] border-l pl-8 border-slate-200">
           <div className="flex items-center gap-2">
              <Hash className="h-3 w-3 text-slate-400" />
              <span className="text-slate-500 font-bold uppercase">Version:</span>
              <span className="font-mono">{version}</span>
           </div>
           <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span className="text-slate-500 font-bold uppercase">Year:</span>
              <span>{year}</span>
           </div>
           <div className="flex items-center gap-2">
              <FileType className="h-3 w-3 text-slate-400" />
              <span className="text-slate-500 font-bold uppercase">Status:</span>
              <span className={cn("px-1 rounded", isDraft ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800")}>
                {isDraft ? 'DRAFT' : 'CONTROLLED'}
              </span>
           </div>
        </div>
      </div>

      {/* Process Meta */}
      <div className="bg-slate-800 text-white p-2 rounded flex justify-between items-center px-4">
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-black opacity-50 uppercase">Sub Process:</span>
            <span className="text-xs font-bold uppercase tracking-tight">{subProcess}</span>
         </div>
         <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-[9px] font-bold">ALIGNED WITH REGULATION SK-5/2024</span>
         </div>
      </div>
    </div>
  );
};

export const BPMCanvasFooter = () => {
  const { t } = useTranslation(['bpm', 'common']);
  
  return (
    <div className="w-full mt-8 grid grid-cols-3 border-2 border-slate-800 bg-white">
       <div className="border-r-2 border-slate-800 p-2 min-h-[100px] flex flex-col">
          <span className="text-[8px] font-black uppercase text-slate-400 mb-auto">Disusun Oleh (Lini 1)</span>
          <div className="h-10 border-b border-slate-100 mb-2" />
          <div className="flex justify-between text-[9px] font-bold uppercase">
             <span>Nama:</span>
             <span>Tanggal:</span>
          </div>
       </div>
       <div className="border-r-2 border-slate-800 p-2 min-h-[100px] flex flex-col">
          <span className="text-[8px] font-black uppercase text-slate-400 mb-auto">Direview Oleh (Lini 2)</span>
          <div className="h-10 border-b border-slate-100 mb-2" />
          <div className="flex justify-between text-[9px] font-bold uppercase">
             <span>Nama:</span>
             <span>Tanggal:</span>
          </div>
       </div>
       <div className="p-2 min-h-[100px] flex flex-col bg-slate-50/50">
          <span className="text-[8px] font-black uppercase text-slate-400 mb-auto">Disetujui Oleh (CFO)</span>
          <div className="h-10 flex items-center justify-center opacity-20 rotate-[-15deg] select-none pointer-events-none">
             <ShieldCheck className="h-8 w-8 text-slate-300" />
          </div>
          <div className="flex justify-between text-[9px] font-bold uppercase mt-auto">
             <span>Nama:</span>
             <span>Sign-off:</span>
          </div>
       </div>
    </div>
  );
};
