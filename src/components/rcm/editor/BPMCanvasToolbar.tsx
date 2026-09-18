import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MultiSelect } from '@/components/ui/multi-select';
import { 
  Undo2, Redo2, Wand2, Layout, Link as LinkIcon, 
  Upload, ShieldCheck, RefreshCw, Save 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface BPMCanvasToolbarProps {
  subProcess: string;
  canUndo: boolean;
  canRedo: boolean;
  isLocked: boolean;
  isSaving: boolean;
  hasNodes: boolean;
  globalScale: number;
  currentGL?: string;
  selectedGLs: string[];
  glOptions: { label: string; value: string }[];
  onUndo: () => void;
  onRedo: () => void;
  onAutoArrange: () => void;
  onOpenDocumentView: () => void;
  onOpenOcrDialog: () => void;
  onScaleChange: (scale: number) => void;
  onSelectedGLsChange: (gls: string[]) => void;
  onSwitchGLContext: (glCode: string) => void;
  onSave: () => void;
}

export const BPMCanvasToolbar: React.FC<BPMCanvasToolbarProps> = ({
  subProcess,
  canUndo,
  canRedo,
  isLocked,
  isSaving,
  hasNodes,
  globalScale,
  currentGL,
  selectedGLs,
  glOptions,
  onUndo,
  onRedo,
  onAutoArrange,
  onOpenDocumentView,
  onOpenOcrDialog,
  onScaleChange,
  onSelectedGLsChange,
  onSwitchGLContext,
  onSave,
}) => {
  const { t } = useTranslation(['bpm']);

  return (
    <div className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 z-20 print:hidden">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('bpm:modal.title')}:</span>
        <span className="text-xs font-bold text-slate-800">{subProcess}</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
          <Button
            size="sm"
            variant="ghost"
            disabled={!canUndo || isLocked}
            onClick={onUndo}
            className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 gap-1 font-bold rounded-lg disabled:opacity-30"
            title={`${t('bpm:editor.actions.undo', { defaultValue: 'Undo' })} (Ctrl+Z)`}
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider">{t('bpm:editor.actions.undo', { defaultValue: 'Undo' })}</span>
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <Button
            size="sm"
            variant="ghost"
            disabled={!canRedo || isLocked}
            onClick={onRedo}
            className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 gap-1 font-bold rounded-lg disabled:opacity-30"
            title={`${t('bpm:editor.actions.redo', { defaultValue: 'Redo' })} (Ctrl+Y)`}
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider">{t('bpm:editor.actions.redo', { defaultValue: 'Redo' })}</span>
          </Button>
        </div>

        <Button 
          size="sm" 
          variant="outline" 
          disabled={!hasNodes || isLocked}
          className="h-9 gap-2 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest px-3 rounded-xl shadow-sm"
          onClick={onAutoArrange}
          title={t('bpm:editor.actions.autoArrange', { defaultValue: 'Auto Arrange' })}
        >
          <Wand2 className="h-3.5 w-3.5 text-indigo-500" />
          <span className="hidden sm:inline">{t('bpm:editor.actions.autoArrange', { defaultValue: 'Auto Arrange' })}</span>
        </Button>

        <Button 
          size="sm" 
          variant="outline" 
          className="h-9 gap-2 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest px-4 rounded-xl shadow-sm"
          onClick={onOpenDocumentView}
        >
          <Layout className="h-3.5 w-3.5 text-indigo-500" />
          {t('bpm:editor.actions.documentView')}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 gap-2 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest px-4 rounded-xl shadow-sm"
            >
              <LinkIcon className="h-3.5 w-3.5 text-indigo-500" />
              Linked GLs ({selectedGLs.length})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-4" align="end">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Link GL Codes</h4>
                <p className="text-[10px] text-slate-400">Pilih akun GL yang menggunakan diagram alur proses ini.</p>
              </div>

              {selectedGLs.length > 0 && (
                <div className="space-y-1.5 border-b border-slate-100 pb-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Switch Context</span>
                  <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                    {selectedGLs.map(glCode => {
                      const opt = glOptions.find(o => o.value === glCode);
                      const label = opt ? opt.label : glCode;
                      const isActive = glCode === currentGL;
                      return (
                        <button
                          key={glCode}
                          type="button"
                          onClick={() => onSwitchGLContext(glCode)}
                          className={cn(
                            "w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between font-medium",
                            isActive 
                              ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-100" 
                              : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                          )}
                        >
                          <span className="truncate flex-1 pr-2">{label}</span>
                          {isActive ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                          ) : (
                            <LinkIcon className="h-3 w-3 text-slate-400 hover:text-indigo-500 transition-colors shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Manage Link GLs</span>
                <MultiSelect
                  options={glOptions}
                  selected={selectedGLs}
                  onChange={onSelectedGLsChange}
                  placeholder="Search and select GLs..."
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 h-9 shadow-sm">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">Scale:</span>
          <Select value={String(globalScale)} onValueChange={(val) => onScaleChange(Number(val))}>
            <SelectTrigger className="h-7 w-[75px] text-xs font-bold border-none bg-transparent focus:ring-0 p-0 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="80" className="text-xs">80%</SelectItem>
              <SelectItem value="100" className="text-xs">100%</SelectItem>
              <SelectItem value="120" className="text-xs">120%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isLocked && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-9 gap-2 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-[10px] uppercase tracking-widest px-4 rounded-xl shadow-sm"
            onClick={onOpenOcrDialog}
          >
            <Upload className="h-3.5 w-3.5 text-emerald-500" />
            {t('bpm:ocr.importButton')}
          </Button>
        )}

        {isLocked && (
          <Badge variant="outline" className="h-9 bg-amber-50 text-amber-700 border-amber-200 gap-2 px-4 font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t('bpm:editor.actions.locked')}
          </Badge>
        )}
        <Button 
          size="sm" 
          className="h-9 gap-2 bg-mancity-pattern hover:opacity-90 text-primary-foreground shadow-sm transition-all font-bold text-[10px] uppercase tracking-widest px-6 rounded-xl" 
          onClick={onSave} 
          disabled={isSaving || isLocked}
        >
          {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {isSaving ? t('bpm:editor.actions.saving') : t('bpm:editor.actions.save')}
        </Button>
      </div>
    </div>
  );
};
