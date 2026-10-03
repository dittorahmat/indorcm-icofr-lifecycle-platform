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
           <span className="text-xs font-black uppercase text-slate-600 text-center leading-tight">
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
        <div className="col-span-3 grid grid-rows-4 text-xs uppercase font-bold">
           <div className="border-b border-slate-800 px-3 flex items-center justify-between flex-wrap gap-2">
              <span className="text-slate-400 font-black">Versi</span>
              <span className="text-slate-900">{version}</span>
           </div>
           <div className="border-b border-slate-800 px-3 flex items-center justify-between flex-wrap gap-2">
              <span className="text-slate-400 font-black">Revisi</span>
              <span className="text-slate-900">00</span>
           </div>
           <div className="border-b border-slate-800 px-3 flex items-center justify-between bg-slate-50 flex-wrap gap-2">
              <span className="text-slate-400 font-black">Tahun</span>
              <span className="text-slate-900">{year}</span>
           </div>
           <div className="px-3 flex items-center justify-between flex-wrap gap-2">
              <span className="text-slate-400 font-black">Halaman</span>
              <span className="text-slate-900">1 dari 1</span>
           </div>
        </div>
      </div>

      {/* Second Row: Lifecycle Detail */}
      <div className="grid grid-cols-12 bg-mancity-pattern text-primary-foreground py-2 px-4">
         <div className="col-span-4 flex items-center gap-3">
            <span className="text-xs font-black opacity-60 uppercase tracking-widest">Siklus:</span>
            <span className="text-xs font-bold truncate">ICOFR LIFECYCLE</span>
         </div>
         <div className="col-span-4 flex items-center gap-3 border-x border-white/20 px-4">
            <span className="text-xs font-black opacity-60 uppercase tracking-widest">FSLI:</span>
            <span className="text-xs font-bold">{fsliName || "TBD"}</span>
         </div>
         <div className="col-span-4 flex items-center justify-end gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-black tracking-tighter">APPENDIX 4 - SK-5/2024</span>
         </div>
      </div>
    </div>
  );
};

interface BPMCanvasFooterProps {
  signatures: {
    lini1Name: string;
    lini1Date: string;
    lini2Name: string;
    lini2Date: string;
    cfoName: string;
    cfoDate: string;
  };
  onChangeSignature?: (key: keyof BPMCanvasFooterProps['signatures'], val: string) => void;
  isLocked?: boolean;
}

export const BPMCanvasFooter = ({ signatures, onChangeSignature, isLocked = false }: BPMCanvasFooterProps) => {
  const { t } = useTranslation(['bpm', 'common']);

  const inputClass = "w-32 text-right border-b border-slate-200 hover:border-slate-400 focus:border-indigo-500 focus:outline-none bg-transparent transition-colors text-xs font-bold text-slate-800 print:border-none print:bg-transparent print:placeholder-transparent";

  const handleChange = (key: keyof BPMCanvasFooterProps['signatures'], value: string) => {
    if (onChangeSignature) {
      onChangeSignature(key, value);
    }
  };

  return (
    <div className="w-full mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-2 border-slate-800 bg-white">
       <div className="border-r-2 border-slate-800 p-4 min-h-[120px] flex flex-col">
          <span className="text-xs font-black uppercase text-slate-500 mb-4 border-b pb-1">Disusun Oleh (Lini 1)</span>
          <div className="flex-1" />
          <div className="space-y-1">
             <div className="flex justify-between items-center text-xs font-bold uppercase flex-wrap gap-2">
                <span className="text-slate-400">Nama:</span>
                <input
                   type="text"
                   value={signatures.lini1Name || ""}
                   onChange={(e) => handleChange('lini1Name', e.target.value)}
                   disabled={isLocked}
                   placeholder={t('bpm:editor.signatures.lini1NamePlaceholder')}
                   className={inputClass}
                />
             </div>
             <div className="flex justify-between items-center text-xs font-bold uppercase pt-1 flex-wrap gap-2">
                <span className="text-slate-400">Tgl:</span>
                <input
                   type="text"
                   value={signatures.lini1Date || ""}
                   onChange={(e) => handleChange('lini1Date', e.target.value)}
                   disabled={isLocked}
                   placeholder={t('bpm:editor.signatures.datePlaceholder')}
                   className={inputClass}
                />
             </div>
          </div>
       </div>
       <div className="border-r-2 border-slate-800 p-4 min-h-[120px] flex flex-col">
          <span className="text-xs font-black uppercase text-slate-500 mb-4 border-b pb-1">Direview Oleh (Lini 2)</span>
          <div className="flex-1" />
          <div className="space-y-1">
             <div className="flex justify-between items-center text-xs font-bold uppercase flex-wrap gap-2">
                <span className="text-slate-400">Nama:</span>
                <input
                   type="text"
                   value={signatures.lini2Name || ""}
                   onChange={(e) => handleChange('lini2Name', e.target.value)}
                   disabled={isLocked}
                   placeholder={t('bpm:editor.signatures.lini2NamePlaceholder')}
                   className={inputClass}
                />
             </div>
             <div className="flex justify-between items-center text-xs font-bold uppercase pt-1 flex-wrap gap-2">
                <span className="text-slate-400">Tgl:</span>
                <input
                   type="text"
                   value={signatures.lini2Date || ""}
                   onChange={(e) => handleChange('lini2Date', e.target.value)}
                   disabled={isLocked}
                   placeholder={t('bpm:editor.signatures.datePlaceholder')}
                   className={inputClass}
                />
             </div>
          </div>
       </div>
       <div className="p-4 min-h-[120px] flex flex-col bg-slate-50/30">
          <span className="text-xs font-black uppercase text-slate-500 mb-4 border-b pb-1">Disetujui Oleh (CFO)</span>
          <div className="flex-1 flex items-center justify-center opacity-10 rotate-[-12deg] select-none pointer-events-none">
             <ShieldCheck className="h-10 w-10 text-slate-900" />
          </div>
          <div className="space-y-1 mt-auto">
             <div className="flex justify-between items-center text-xs font-bold uppercase flex-wrap gap-2">
                <span className="text-slate-400">Nama:</span>
                <input
                   type="text"
                   value={signatures.cfoName || ""}
                   onChange={(e) => handleChange('cfoName', e.target.value)}
                   disabled={isLocked}
                   placeholder={t('bpm:editor.signatures.cfoNamePlaceholder')}
                   className={inputClass}
                />
             </div>
             <div className="flex justify-between items-center text-xs font-bold uppercase pt-1 flex-wrap gap-2">
                <span className="text-slate-400">Sign:</span>
                <input
                   type="text"
                   value={signatures.cfoDate || "DIGITALLY SIGNED"}
                   onChange={(e) => handleChange('cfoDate', e.target.value)}
                   disabled={isLocked}
                   placeholder={t('bpm:editor.signatures.datePlaceholder')}
                   className={inputClass}
                />
             </div>
          </div>
       </div>
    </div>
  );
};
