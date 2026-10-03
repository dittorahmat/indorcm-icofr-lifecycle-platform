import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MultiSelect } from '@/components/ui/multi-select';
import { 
  Undo2, Redo2, Wand2, Layout, Link as LinkIcon, 
  Upload, ShieldCheck, RefreshCw, Save,
  Maximize2, Maximize, Minimize
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface BPMCanvasToolbarProps {
  subProcess?: string;
  canUndo: boolean;
  canRedo: boolean;
  isLocked: boolean;
  isSaving: boolean;
  hasNodes: boolean;
  globalScale: number;
  currentGL?: string;
  selectedGLs: string[];
  glOptions: { label: string; value: string }[];
  isFullscreen?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAutoArrange: () => void;
  onOpenDocumentView: () => void;
  onOpenOcrDialog: () => void;
  onScaleChange: (scale: number) => void;
  onFitView?: () => void;
  onToggleFullscreen?: () => void;
  onSelectedGLsChange: (gls: string[]) => void;
  onSwitchGLContext: (glCode: string) => void;
  onSave: () => void;
}

export const BPMCanvasToolbar: React.FC<BPMCanvasToolbarProps> = ({
  canUndo,
  canRedo,
  isLocked,
  isSaving,
  hasNodes,
  globalScale,
  currentGL,
  selectedGLs,
  glOptions,
  isFullscreen,
  onUndo,
  onRedo,
  onAutoArrange,
  onOpenDocumentView,
  onOpenOcrDialog,
  onScaleChange,
  onFitView,
  onToggleFullscreen,
  onSelectedGLsChange,
  onSwitchGLContext,
  onSave,
}) => {
  const { t } = useTranslation(['bpm']);

  return (
    <div className="h-14 border-b border-slate-200 bg-background px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-20 print:hidden flex-wrap">
      <div className="flex items-center gap-2 overflow-x-auto py-1 w-full justify-between flex-wrap">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm shrink-0">
            <Button
              size="sm"
              variant="ghost"
              disabled={!canUndo || isLocked}
              onClick={onUndo}
              className="h-8 px-2 text-xs text-slate-700 hover:text-slate-900 gap-1 font-bold rounded-lg disabled:opacity-30"
              title={`${t('bpm:editor.actions.undo', { defaultValue: 'Undo' })} (Ctrl+Z)`}
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="hidden xl:inline text-xs uppercase tracking-wider">{t('bpm:editor.actions.undo', { defaultValue: 'Undo' })}</span>
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Button
              size="sm"
              variant="ghost"
              disabled={!canRedo || isLocked}
              onClick={onRedo}
              className="h-8 px-2 text-xs text-slate-700 hover:text-slate-900 gap-1 font-bold rounded-lg disabled:opacity-30"
              title={`${t('bpm:editor.actions.redo', { defaultValue: 'Redo' })} (Ctrl+Y)`}
            >
              <Redo2 className="h-3.5 w-3.5" />
              <span className="hidden xl:inline text-xs uppercase tracking-wider">{t('bpm:editor.actions.redo', { defaultValue: 'Redo' })}</span>
            </Button>
          </div>

          <Button 
            size="sm" 
            variant="outline" 
            disabled={!hasNodes || isLocked}
            className="h-9 gap-1.5 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest px-3 rounded-xl shadow-sm shrink-0"
            onClick={onAutoArrange}
            title={t('bpm:editor.actions.autoArrange', { defaultValue: 'Auto Arrange' })}
          >
            <Wand2 className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden md:inline">{t('bpm:editor.actions.autoArrange', { defaultValue: 'Auto Arrange' })}</span>
          </Button>

          {onFitView && (
            <Button 
              size="sm" 
              variant="outline" 
              disabled={!hasNodes}
              className="h-9 gap-1.5 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest px-3 rounded-xl shadow-sm shrink-0"
              onClick={onFitView}
              title={t('bpm:editor.actions.fitView', { defaultValue: 'Fit to Screen' })}
            >
              <Maximize2 className="h-3.5 w-3.5 text-sky-500" />
              <span className="hidden md:inline">{t('bpm:editor.actions.fitView', { defaultValue: 'Fit to Screen' })}</span>
            </Button>
          )}

          <Button 
            size="sm" 
            variant="outline" 
            className="h-9 gap-1.5 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest px-3 rounded-xl shadow-sm shrink-0"
            onClick={onOpenDocumentView}
            title={t('bpm:editor.actions.documentView')}
          >
            <Layout className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden md:inline">{t('bpm:editor.actions.documentView')}</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 shrink-0">

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 gap-1.5 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest px-2.5 rounded-xl shadow-sm shrink-0"
              title="Linked GLs"
            >
              <LinkIcon className="h-3.5 w-3.5 text-indigo-500" />
              <span className="hidden lg:inline">Linked GLs</span>
              <span className="text-xs font-black bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full">
                {selectedGLs.length}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] p-4" align="end">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">Link GL Codes</h4>
                <p className="text-xs text-slate-400">Pilih akun GL yang menggunakan diagram alur proses ini.</p>
              </div>

              {selectedGLs.length > 0 && (
                <div className="space-y-1.5 border-b border-slate-100 pb-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Switch Context</span>
                  <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                    {selectedGLs.map(glCode => {
                      const opt = glOptions.find(o => o.value === glCode);
                      const isCurrent = glCode === currentGL;
                      return (
                        <button
                          key={glCode}
                          onClick={() => onSwitchGLContext(glCode)}
                          className={cn(
                            "flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs transition-colors",
                            isCurrent ? "bg-indigo-50 text-indigo-700 font-bold" : "hover:bg-slate-50 text-slate-600"
                          )}
                        >
                          <span className="truncate">{opt?.label || glCode}</span>
                          {isCurrent && <span className="text-xs font-black uppercase text-indigo-600">Active</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Select Accounts</span>
                <MultiSelect
                  options={glOptions}
                  selected={selectedGLs}
                  onChange={onSelectedGLsChange}
                  placeholder="Select GL accounts..."
                  className="w-full text-xs"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2 h-9 shadow-sm shrink-0">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest pl-0.5 hidden sm:inline">{t('bpm:editor.actions.zoom', { defaultValue: 'Scale' })}:</span>
          <Select value={String(globalScale)} onValueChange={(val) => onScaleChange(Number(val))}>
            <SelectTrigger className="h-7 w-[68px] text-xs font-bold border-none bg-transparent focus:ring-0 p-0 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60" className="text-xs">60%</SelectItem>
              <SelectItem value="80" className="text-xs">80%</SelectItem>
              <SelectItem value="100" className="text-xs">100%</SelectItem>
              <SelectItem value="120" className="text-xs">120%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {onToggleFullscreen && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-9 w-9 p-0 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold rounded-xl shadow-sm shrink-0"
            onClick={onToggleFullscreen}
            title={isFullscreen ? t('bpm:editor.actions.exitFullscreen', { defaultValue: 'Exit Fullscreen' }) : t('bpm:editor.actions.enterFullscreen', { defaultValue: 'Fullscreen' })}
          >
            {isFullscreen ? <Minimize className="h-3.5 w-3.5 text-slate-700" /> : <Maximize className="h-3.5 w-3.5 text-slate-700" />}
          </Button>
        )}

        {!isLocked && (
          <Button 
            size="sm" 
            variant="outline" 
            className="h-9 gap-1.5 bg-white border-slate-200 hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-widest px-2.5 rounded-xl shadow-sm shrink-0"
            onClick={onOpenOcrDialog}
            title={t('bpm:ocr.importButton')}
          >
            <Upload className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden md:inline">{t('bpm:ocr.importButton')}</span>
          </Button>
        )}

        {isLocked && (
          <Badge variant="outline" className="h-9 bg-amber-50 text-amber-700 border-amber-200 gap-1.5 px-3 font-bold text-xs uppercase tracking-widest rounded-xl shadow-sm shrink-0">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('bpm:editor.actions.locked')}</span>
          </Badge>
        )}
        <Button 
          size="sm" 
          className="h-9 gap-2 bg-mancity-pattern hover:opacity-90 text-primary-foreground shadow-sm transition-all font-bold text-xs uppercase tracking-widest px-4 sm:px-5 rounded-xl shrink-0" 
          onClick={onSave} 
          disabled={isSaving || isLocked}
          title={t('bpm:editor.actions.save')}
        >
          {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          <span>{isSaving ? t('bpm:editor.actions.saving') : t('bpm:editor.actions.save')}</span>
        </Button>
        </div>
      </div>
    </div>
  );
};
