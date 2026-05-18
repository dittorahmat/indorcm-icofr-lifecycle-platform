import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Save, Loader2, Printer } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface RCMPageHeaderProps {
  title: string;
  subtitle: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSave?: () => void;
  isSaving?: boolean;
  onRefresh?: () => void;
  onPrint?: () => void;
  metadata?: { label: string; value: string }[];
}

export function RCMPageHeader({ 
  title, 
  subtitle, 
  searchTerm, 
  onSearchChange, 
  onSave, 
  isSaving, 
  onRefresh,
  onPrint,
  metadata 
}: RCMPageHeaderProps) {
  return (
    <div className="p-4 pb-2 space-y-3 shrink-0 bg-white/80 backdrop-blur-md border-b z-10 print:hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-8 w-8 text-slate-700" />
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">{title}</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 opacity-70">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onPrint && (
            <Button variant="outline" size="xs" onClick={onPrint} className="bg-white h-7 text-xs font-bold text-slate-600 border-slate-200">
              <Printer className="h-3 w-3 mr-1.5" /> Print
            </Button>
          )}
          {onRefresh && (
            <Button variant="outline" size="xs" onClick={onRefresh} className="bg-white h-7 text-xs font-bold">
              <Filter className="h-3 w-3 mr-1.5" /> Refresh
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave} disabled={isSaving} size="xs" className="bg-indigo-600 hover:bg-indigo-700 shadow-md h-7 text-xs font-bold px-4">
              {isSaving ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Save className="h-3 w-3 mr-1.5" />}
              Save
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search matrix..." 
            className="pl-8 bg-white border-slate-200 h-8 text-xs font-medium" 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
          />
        </div>
        {metadata && (
          <div className="flex gap-4 items-center bg-slate-100/50 px-3 py-1 rounded-lg border border-slate-200">
            {metadata.map((item, idx) => (
              <React.Fragment key={idx}>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-black uppercase tracking-wider leading-none">{item.label}</p>
                  <p className="text-xs font-bold text-slate-700">{item.value}</p>
                </div>
                {idx < metadata.length - 1 && <div className="w-px h-4 bg-slate-300" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
