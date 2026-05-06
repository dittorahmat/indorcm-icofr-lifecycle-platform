import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Calendar, FileType, MapPin, Hash, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Settings } from '@shared/types';

interface LayoutProps {
  subProcess: string;
  year: string;
  version?: string;
  isDraft?: boolean;
  noGL?: string;
  fsliName?: string;
}

export const BPMCanvasHeader = ({ subProcess, year, version = '1.0', isDraft, noGL, fsliName }: LayoutProps) => {
  const { t } = useTranslation(['bpm', 'common']);
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<Settings>('/api/settings')
  });

  return (
    <div className="w-full bg-white border-2 border-slate-800 mb-6 overflow-hidden">
      {/* Table Header Style like Appendix 4 */}
      <div className="grid grid-cols-12 border-b-2 border-slate-800">
        {/* Logo Section */}
        <div className="col-span-3 border-r-2 border-slate-800 p-4 flex flex-col items-center justify-center gap-2 bg-slate-50/50">
           <div className="w-20 h-20 bg-white rounded border shadow-sm flex items-center justify-center overflow-hidden p-1">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="h-10 w-10 text-slate-200" />
              )}
           </div>
           <span className="text-[10px] font-black uppercase text-slate-600 text-center leading-tight">
             {settings?.companyName || "PT. INDO GRC PRO"}
           </span>
        </div>

        {/* Title Section */}
        <div className="col-span-6 border-r-2 border-slate-800 p-6 flex flex-col items-center justify-center text-center">
           <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
             Business Process Mapping (BPM)
           </h1>
           <div className="mt-2 h-0.5 w-16 bg-indigo-600" />
           <p className="mt-3 text-sm font-bold text-indigo-700 uppercase tracking-widest">
             {subProcess}
           </p>
        </div>

        {/* Metadata Section */}
        <div className="col-span-3 grid grid-rows-4 text-[10px] uppercase font-bold">
           <div className="border-b border-slate-800 px-3 flex items-center justify-between">
              <span className="text-slate-400 font-black">Versi</span>
              <span className="text-slate-900">{version}</span>
           </div>
           <div className="border-b border-slate-800 px-3 flex items-center justify-between">
              <span className="text-slate-400 font-black">Revisi</span>
              <span className="text-slate-900">00</span>
           </div>
           <div className="border-b border-slate-800 px-3 flex items-center justify-between bg-slate-50">
              <span className="text-slate-400 font-black">Tahun</span>
              <span className="text-slate-900">{year}</span>
           </div>
           <div className="px-3 flex items-center justify-between">
              <span className="text-slate-400 font-black">Halaman</span>
              <span className="text-slate-900">1 dari 1</span>
           </div>
        </div>
      </div>

      {/* Second Row: Lifecycle Detail */}
      <div className="grid grid-cols-12 bg-slate-900 text-white py-2 px-4">
         <div className="col-span-4 flex items-center gap-3">
            <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">Siklus:</span>
            <span className="text-[10px] font-bold truncate">ICOFR LIFECYCLE</span>
         </div>
         <div className="col-span-4 flex items-center gap-3 border-x border-white/20 px-4">
            <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">FSLI:</span>
            <span className="text-[10px] font-bold">{fsliName || "TBD"}</span>
         </div>
         <div className="col-span-4 flex items-center justify-end gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] font-black tracking-tighter">APPENDIX 4 - SK-5/2024</span>
         </div>
      </div>
    </div>
  );
};

export const BPMCanvasFooter = () => {
  return (
    <div className="w-full mt-8 grid grid-cols-3 border-2 border-slate-800 bg-white">
       <div className="border-r-2 border-slate-800 p-4 min-h-[120px] flex flex-col">
          <span className="text-[9px] font-black uppercase text-slate-500 mb-4 border-b pb-1">Disusun Oleh (Lini 1)</span>
          <div className="flex-1" />
          <div className="space-y-1">
             <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-slate-400">Nama:</span>
                <span className="w-32 border-b border-slate-200" />
             </div>
             <div className="flex justify-between text-[10px] font-bold uppercase pt-1">
                <span className="text-slate-400">Tgl:</span>
                <span className="w-32 border-b border-slate-200" />
             </div>
          </div>
       </div>
       <div className="border-r-2 border-slate-800 p-4 min-h-[120px] flex flex-col">
          <span className="text-[9px] font-black uppercase text-slate-500 mb-4 border-b pb-1">Direview Oleh (Lini 2)</span>
          <div className="flex-1" />
          <div className="space-y-1">
             <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-slate-400">Nama:</span>
                <span className="w-32 border-b border-slate-200" />
             </div>
             <div className="flex justify-between text-[10px] font-bold uppercase pt-1">
                <span className="text-slate-400">Tgl:</span>
                <span className="w-32 border-b border-slate-200" />
             </div>
          </div>
       </div>
       <div className="p-4 min-h-[120px] flex flex-col bg-slate-50/30">
          <span className="text-[9px] font-black uppercase text-slate-500 mb-4 border-b pb-1">Disetujui Oleh (CFO)</span>
          <div className="flex-1 flex items-center justify-center opacity-10 rotate-[-12deg] select-none pointer-events-none">
             <ShieldCheck className="h-10 w-10 text-slate-900" />
          </div>
          <div className="space-y-1 mt-auto">
             <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-slate-400">Nama:</span>
                <span className="w-32 border-b border-slate-200" />
             </div>
             <div className="flex justify-between text-[10px] font-bold uppercase pt-1">
                <span className="text-slate-400">Sign:</span>
                <span className="w-32 border-b border-slate-200 font-mono italic text-[8px] flex items-center justify-center">DIGITALLY SIGNED</span>
             </div>
          </div>
       </div>
    </div>
  );
};
