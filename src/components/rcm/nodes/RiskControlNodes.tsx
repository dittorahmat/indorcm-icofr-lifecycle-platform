import { NodeProps, NodeResizer } from 'reactflow';
import { ShieldCheck, GripVertical, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

export const RiskControlBadge = ({ data, selected }: NodeProps) => (
  <div className="flex gap-1 animate-in zoom-in-50 duration-300">
    {data.riskIds && data.riskIds.length > 0 && (
      <div className={cn(
        "w-6 h-6 rotate-45 bg-red-600 border border-white flex items-center justify-center shadow-md",
        selected && "scale-125 ring-2 ring-red-200"
      )}>
        <div className="-rotate-45 text-xs text-white font-black">{data.riskIds.length}</div>
      </div>
    )}
    {data.controlIds && data.controlIds.length > 0 && (
      <div className={cn(
        "w-6 h-6 rounded-full bg-green-600 border border-white flex items-center justify-center shadow-md",
        selected && "scale-125 ring-2 ring-green-200"
      )}>
        <ShieldCheck className="h-3 w-3 text-white" />
      </div>
    )}
  </div>
);

export const SwimlaneNode = ({ data, selected }: NodeProps) => {
  const { t } = useTranslation(['bpm']);

  return (
    <div className={cn(
      "h-full w-full border-2 bg-slate-50/20 relative group transition-all",
      data.isLocked ? "border-amber-200/60 bg-slate-50/10" : "border-slate-300",
      selected && !data.isLocked && "border-indigo-600 ring-2 ring-indigo-400/40 bg-indigo-50/15 shadow-xl",
      selected && data.isLocked && "border-amber-500 ring-2 ring-amber-400/30 bg-amber-50/10 shadow-lg"
    )}>
      <NodeResizer
        isVisible={!!selected && !data.isLocked}
        minWidth={360}
        minHeight={300}
        keepAspectRatio={false}
        onResizeEnd={(_, params) => {
          data.onResizeEnd?.(params);
        }}
        handleStyle={{ width: 10, height: 10, backgroundColor: '#4f46e5', border: '2px solid white', borderRadius: 3 }}
        lineStyle={{ borderColor: '#4f46e5', borderWidth: 2 }}
      />
      {/* Swimlane Header */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-sm border-b-2 border-slate-300 p-2 pr-20 flex flex-col justify-center select-none",
        !data.isLocked && "swimlane-drag-handle cursor-grab active:cursor-grabbing hover:bg-slate-50/90"
      )}>
        <div className="flex items-center gap-2 mb-1 nodrag">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('bpm:editor.swimlane.labels.department')}</span>
          <Input 
            value={data.department || ''} 
            placeholder={t('bpm:editor.swimlane.placeholders.department')}
            onChange={(e) => data.onChangeDepartment?.(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            disabled={data.isLocked}
            className="h-6 text-xs font-bold uppercase bg-transparent border-none focus-visible:ring-0 p-0 hover:bg-slate-100/50 focus:bg-white focus:px-2 rounded transition-all"
          />
        </div>
        <div className="flex items-center gap-2 nodrag">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('bpm:editor.swimlane.labels.function')}</span>
          <Input 
            value={data.function || ''} 
            placeholder={t('bpm:editor.swimlane.placeholders.function')}
            onChange={(e) => data.onChangeFunction?.(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            disabled={data.isLocked}
            className="h-6 text-xs italic bg-transparent border-none focus-visible:ring-0 p-0 text-slate-600 hover:bg-slate-100/50 focus:bg-white focus:px-2 rounded transition-all"
          />
        </div>

        {/* Grip Handle and Lock Controls */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleLock?.();
            }}
            className={cn(
              "nodrag p-1.5 rounded-lg border-none bg-transparent transition-colors hover:bg-slate-100 text-slate-400",
              data.isLocked && "text-amber-600 hover:bg-amber-50"
            )}
            title={data.isLocked ? t('bpm:editor.unlockPosition') : t('bpm:editor.lockPosition')}
          >
            {data.isLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </button>

          {!data.isLocked && (
            <div 
              className="swimlane-drag-handle cursor-grab active:cursor-grabbing p-2 hover:bg-slate-200/80 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
              title={t('bpm:editor.dragHint')}
            >
              <GripVertical className="h-5 w-5 pointer-events-none" />
            </div>
          )}
        </div>
      </div>
      
      {/* Background Grid Line for visual separation if needed */}
      <div className="absolute inset-0 pointer-events-none opacity-5 border-r border-slate-400" />
    </div>
  );
};
