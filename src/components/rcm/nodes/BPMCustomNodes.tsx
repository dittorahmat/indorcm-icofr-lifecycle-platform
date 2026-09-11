import React from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { 
  Activity, Database, ShieldCheck, AlertTriangle, FileText, 
  GitCommit, LayoutDashboard, Link as LinkIcon, GripVertical, Lock, Unlock 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

// --- Tooltip Component ---

// Utility helper to calculate custom nodes width and font classes dynamically
// eslint-disable-next-line react-refresh/only-export-components
export const getNodeStyles = (data: any, baseWidth: number = 160) => {
  const nodeScale = data?.nodeScaleOverride || 'md';
  const fontScale = data?.fontScaleOverride || 'md';

  // Calculate width override
  let nodeWidth = baseWidth;
  if (nodeScale === 'sm') nodeWidth = Math.round(baseWidth * 0.8);
  else if (nodeScale === 'lg') nodeWidth = Math.round(baseWidth * 1.25);

  // Font size styles
  let baseFontSize = 12;
  if (fontScale === 'sm') baseFontSize = 10;
  else if (fontScale === 'lg') baseFontSize = 14;

  return {
    style: {
      width: `calc(${nodeWidth}px * var(--bpm-global-width-scale, 1))`,
      fontSize: `calc(${baseFontSize}px * var(--bpm-global-font-scale, 1))`,
    },
    fontClass: ""
  };
};


export const NodeTooltip = ({ children, data, type }: { children: React.ReactNode, data: any, type: string }) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">{children}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[250px] p-2 bg-mancity-pattern text-primary-foreground border-none shadow-2xl z-[100]">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center border-b border-white/20 pb-1 mb-1">
              <p className="font-bold text-xs uppercase text-primary-foreground/70">
                {type} Preview
              </p>
              {(data.relatedElcNames && data.relatedElcNames.length > 0) && (
                <ShieldCheck className="h-3 w-3 text-primary-foreground" />
              )}
            </div>
            <p className="text-xs font-bold leading-tight text-primary-foreground">{data.label}</p>
            {data.description && <p className="text-xs text-primary-foreground/80 line-clamp-3 italic leading-relaxed">{data.description}</p>}
            
            {data.relatedElcNames && data.relatedElcNames.length > 0 && (
              <div className="mt-2 pt-2 border-t border-white/20">
                <p className="text-xs font-black text-primary-foreground uppercase tracking-wider mb-1">Payung Kebijakan (ELC):</p>
                <ul className="space-y-0.5">
                  {data.relatedElcNames.map((name: string, i: number) => (
                    <li key={i} className="text-xs text-primary-foreground flex items-start gap-1">
                      <div className="h-1 w-1 rounded-full bg-primary-foreground mt-1 shrink-0" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-2 pt-1">
              {data.role && <p className="text-xs text-primary-foreground font-bold uppercase">Role: {data.role}</p>}
              {data.code && <p className="text-xs text-primary-foreground font-mono font-bold">Code: {data.code}</p>}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};


// --- Universal 8-Point Connection Handles (Visio-Like) ---
export const EightConnectionHandles = ({ isLocked, selected }: { isLocked?: boolean, selected?: boolean }) => {
  if (isLocked) return null;
  const handleBase = "w-2.5 h-2.5 bg-white border border-slate-700 rounded-full shadow-sm transition-all z-30";
  const hoverStyle = selected ? "opacity-100 scale-110 border-primary bg-primary/20" : "opacity-75 hover:opacity-100 hover:scale-125 hover:border-primary";

  return (
    <>
      {/* 1. Top Left */}
      <Handle type="target" position={Position.Top} id="t-l" style={{ left: "0%" }} className={cn(handleBase, hoverStyle, "!translate-x-0")} />
      <Handle type="source" position={Position.Top} id="t-l-src" style={{ left: "0%" }} className={cn(handleBase, hoverStyle, "!translate-x-0")} />

      {/* 2. Top Center (fallback id top) */}
      <Handle type="target" position={Position.Top} id="top" style={{ left: "50%" }} className={cn(handleBase, hoverStyle)} />
      <Handle type="source" position={Position.Top} id="t-c-src" style={{ left: "50%" }} className={cn(handleBase, hoverStyle)} />

      {/* 3. Top Right */}
      <Handle type="target" position={Position.Top} id="t-r" style={{ left: "100%" }} className={cn(handleBase, hoverStyle, "!-translate-x-full")} />
      <Handle type="source" position={Position.Top} id="t-r-src" style={{ left: "100%" }} className={cn(handleBase, hoverStyle, "!-translate-x-full")} />

      {/* 4. Middle Left */}
      <Handle type="target" position={Position.Left} id="left" style={{ top: "50%" }} className={cn(handleBase, hoverStyle)} />
      <Handle type="source" position={Position.Left} id="m-l-src" style={{ top: "50%" }} className={cn(handleBase, hoverStyle)} />

      {/* 5. Middle Right */}
      <Handle type="target" position={Position.Right} id="right" style={{ top: "50%" }} className={cn(handleBase, hoverStyle)} />
      <Handle type="source" position={Position.Right} id="m-r-src" style={{ top: "50%" }} className={cn(handleBase, hoverStyle)} />

      {/* 6. Bottom Left */}
      <Handle type="target" position={Position.Bottom} id="b-l" style={{ left: "0%" }} className={cn(handleBase, hoverStyle, "!translate-x-0")} />
      <Handle type="source" position={Position.Bottom} id="b-l-src" style={{ left: "0%" }} className={cn(handleBase, hoverStyle, "!translate-x-0")} />

      {/* 7. Bottom Center (fallback id bottom) */}
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ left: "50%" }} className={cn(handleBase, hoverStyle)} />
      <Handle type="target" position={Position.Bottom} id="b-c-tgt" style={{ left: "50%" }} className={cn(handleBase, hoverStyle)} />

      {/* 8. Bottom Right */}
      <Handle type="target" position={Position.Bottom} id="b-r" style={{ left: "100%" }} className={cn(handleBase, hoverStyle, "!-translate-x-full")} />
      <Handle type="source" position={Position.Bottom} id="b-r-src" style={{ left: "100%" }} className={cn(handleBase, hoverStyle, "!-translate-x-full")} />

      {/* Visio-like Quick Connect Directional Arrows */}
      <div className="pointer-events-none absolute inset-0 z-40 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Quick Connect Up */}
        <div className="pointer-events-auto absolute -top-5 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <Handle
            type="source"
            position={Position.Top}
            id="qc-top"
            className="!h-4 !w-4 !rounded-full !border !border-blue-500 !bg-blue-50 !shadow-md hover:!bg-blue-500 hover:!scale-125 transition-all flex items-center justify-center cursor-crosshair"
          >
            <span className="text-[9px] font-black text-blue-600 hover:text-white leading-none">▲</span>
          </Handle>
        </div>

        {/* Quick Connect Right */}
        <div className="pointer-events-auto absolute top-1/2 -right-5 -translate-y-1/2 flex items-center justify-center">
          <Handle
            type="source"
            position={Position.Right}
            id="qc-right"
            className="!h-4 !w-4 !rounded-full !border !border-blue-500 !bg-blue-50 !shadow-md hover:!bg-blue-500 hover:!scale-125 transition-all flex items-center justify-center cursor-crosshair"
          >
            <span className="text-[9px] font-black text-blue-600 hover:text-white leading-none">▶</span>
          </Handle>
        </div>

        {/* Quick Connect Down */}
        <div className="pointer-events-auto absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <Handle
            type="source"
            position={Position.Bottom}
            id="qc-bottom"
            className="!h-4 !w-4 !rounded-full !border !border-blue-500 !bg-blue-50 !shadow-md hover:!bg-blue-500 hover:!scale-125 transition-all flex items-center justify-center cursor-crosshair"
          >
            <span className="text-[9px] font-black text-blue-600 hover:text-white leading-none">▼</span>
          </Handle>
        </div>

        {/* Quick Connect Left */}
        <div className="pointer-events-auto absolute top-1/2 -left-5 -translate-y-1/2 flex items-center justify-center">
          <Handle
            type="source"
            position={Position.Left}
            id="qc-left"
            className="!h-4 !w-4 !rounded-full !border !border-blue-500 !bg-blue-50 !shadow-md hover:!bg-blue-500 hover:!scale-125 transition-all flex items-center justify-center cursor-crosshair"
          >
            <span className="text-[9px] font-black text-blue-600 hover:text-white leading-none">◀</span>
          </Handle>
        </div>
      </div>
    </>
  );
};

// --- SHAPES ---

export const StartEndNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 120);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "px-4 py-2 shadow-md rounded-[50px] bg-white border-2 text-center transition-all",
          data.type === 'start' ? "border-green-600 ring-green-100" : "border-red-600 ring-red-100",
          selected && "ring-4 border-primary shadow-lg scale-105"
        )}
      >
        <Handle type={data.type === 'start' ? "source" : "target"} position={data.type === 'start' ? Position.Bottom : Position.Top} className="w-3 h-3 border-2 border-white bg-slate-400" />
        <span className={cn(
          "font-bold uppercase tracking-wider block whitespace-pre-wrap break-words",
          fontClass,
          data.type === 'start' ? "text-green-700" : "text-red-700"
        )}>{data.label}</span>
      </div>
    </NodeTooltip>
  );
};

export const ActivityNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 text-center transition-all relative flex flex-col justify-between min-h-[56px]",
          selected && "ring-4 ring-primary/20 border-primary shadow-lg scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <div className="font-bold text-[9px] mb-1.5 uppercase text-slate-500 border-b pb-1 flex items-center justify-center gap-1">
          <Activity className="h-2.5 w-2.5" /> {data.role || "Role"}
        </div>
        <div className={cn("font-semibold text-slate-800 leading-tight whitespace-pre-wrap break-words", fontClass)}>{data.label}</div>
        {data.isLocked && (
          <div className="absolute -top-2.5 -right-2.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-full p-0.5 shadow-sm z-20">
            <Lock className="h-3 w-3" />
          </div>
        )}
      </div>
    </NodeTooltip>
  );
};

export const ManualInputNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 60" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M0 20 L160 0 L160 60 L0 60 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 px-3 z-10">
           <div className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Manual Input</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const ExternalProcessNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 text-center transition-all relative flex flex-col justify-between min-h-[56px]",
          selected && "ring-4 ring-primary/20 border-primary shadow-lg scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <div className="absolute inset-1 border border-slate-300 pointer-events-none" />
        <div className={cn("font-bold text-slate-800 leading-tight py-1 whitespace-pre-wrap break-words", fontClass)}>{data.label}</div>
        </div>
    </NodeTooltip>
  );
};

export const AutomatedActivityNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "px-4 py-3 shadow-md rounded-sm bg-blue-50 border-2 border-blue-800 text-center transition-all relative flex flex-col justify-between min-h-[64px]",
          selected && "ring-4 ring-primary/20 border-primary shadow-lg scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <div className="font-bold text-[9px] mb-1.5 uppercase text-blue-600 border-b border-blue-200 pb-1 flex items-center justify-center gap-1">
          <Database className="h-2.5 w-2.5" /> SYSTEM
        </div>
        <div className={cn("font-semibold text-blue-900 leading-tight mb-2 whitespace-pre-wrap break-words", fontClass)}>{data.label}</div>
        <div className="absolute bottom-1 left-2 right-1 h-0.5 bg-blue-800/30 rounded-full" />
        {data.isLocked && (
          <div className="absolute -top-2.5 -right-2.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-full p-0.5 shadow-sm z-20">
            <Lock className="h-3 w-3" />
          </div>
        )}
      </div>
    </NodeTooltip>
  );
};

export const DecisionNode = ({ data, selected, type }: NodeProps) => {
  const nodeScale = data?.nodeScaleOverride || 'md';
  const fontScale = data?.fontScaleOverride || 'md';

  let boxSize = 110;
  if (nodeScale === 'sm') boxSize = 90;
  else if (nodeScale === 'lg') boxSize = 135;

  let fontClass = 'text-xs';
  if (fontScale === 'sm') fontClass = 'text-[10px]';
  else if (fontScale === 'lg') fontClass = 'text-sm';

  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={{ width: `${boxSize}px`, height: `${boxSize}px` }}
        className={cn("relative flex items-center justify-center transition-all", selected && "scale-105")}
      >
        <Handle type="target" position={Position.Top} className="z-10" />
        <div className={cn(
          "absolute inset-0 border-2 rotate-45 transform shadow-md flex items-center justify-center bg-white",
          selected ? "border-primary ring-4 ring-primary/20 bg-primary/5" : "border-slate-800"
        )}>
           <div className={cn("-rotate-45 text-center px-2 font-bold leading-tight uppercase text-slate-700 whitespace-pre-wrap break-words max-w-[85%]", fontClass)}>{data.label}</div>
        </div>
        <Handle type="source" position={Position.Left} id="no" className="z-10" />
        <Handle type="source" position={Position.Right} id="yes" className="z-10" />
        <Handle type="source" position={Position.Bottom} className="z-10" />
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-xs font-black text-red-600 bg-white/80 px-1 rounded">NO</div>
        <div className="absolute -right-10 top-1/2 -translate-y-1/2 text-xs font-black text-green-600 bg-white/80 px-1 rounded">YES</div>
        {data.isLocked && (
          <div className="absolute top-0 right-0 bg-amber-50 border border-amber-200 text-amber-600 rounded-full p-0.5 shadow-sm z-20">
            <Lock className="h-3 w-3" />
          </div>
        )}
      </div>
    </NodeTooltip>
  );
};

export const DocumentNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 130);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-12",
          selected && "scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 130 48" preserveAspectRatio="none" className="absolute inset-0">
          <path 
            d="M0 0 L130 0 L130 40 Q110 48 97.5 40 T65 40 T32.5 40 T0 40 Z" 
            fill="white" 
            stroke="#0f172a" 
            strokeWidth="2" 
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pb-2 px-3 z-10">
          <span className={cn("font-bold uppercase tracking-tight text-slate-700 text-center whitespace-pre-wrap break-words max-h-[30px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</span>
        </div>
        {data.isLocked && (
          <div className="absolute -top-2 -right-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-full p-0.5 shadow-sm z-20">
            <Lock className="h-3 w-3" />
          </div>
        )}
      </div>
    </NodeTooltip>
  );
};

export const ArchiveNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 64);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn("h-16 relative flex items-center justify-center transition-all", selected && "scale-105")}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 64 64" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M0 0 L64 0 L32 64 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center pt-2 z-10">
          <GitCommit className="h-4 w-4 text-slate-600 opacity-50" />
          <span className="text-[10px] font-black text-slate-600 uppercase">ARSIP</span>
        </div>
        <div className={cn(
          "absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 text-center font-bold uppercase leading-none py-1 px-2 rounded-md transition-colors whitespace-pre-wrap break-words",
          fontClass,
          selected ? "bg-slate-800 text-white" : "text-slate-700 bg-slate-50"
        )}>{data.label}</div>
        </div>
    </NodeTooltip>
  );
};

export const DataMediaNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 100);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn("h-20 relative flex items-center justify-center transition-all", selected && "scale-105")}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 100 80" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M0 10 Q50 20 100 10 L100 70 Q50 80 0 70 Z" fill="#eff6ff" stroke="#1e40af" strokeWidth="2" />
          <ellipse cx="50" cy="10" rx="50" ry="10" fill="#dbeafe" stroke="#1e40af" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4 px-2 z-10">
          <Database className="h-4 w-4 text-blue-600 opacity-50" />
          <div className={cn("font-black text-blue-900 text-center uppercase leading-tight whitespace-pre-wrap break-words max-h-[36px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const OffPageRefNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 56);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn("h-14 relative flex items-center justify-center transition-all", selected && "scale-105")}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 56 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M0 0 L56 0 L56 30 L28 56 L0 30 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pb-4 px-1 z-10">
          <span className={cn("font-black text-slate-700 text-center whitespace-pre-wrap break-words", fontClass)}>{data.label}</span>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const ReferenceNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 40);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={{ ...style, height: style.width }}
        className={cn(
          "rounded-full border-2 bg-white flex items-center justify-center shadow-md transition-all",
          selected ? "border-primary ring-4 ring-primary/20" : "border-slate-800"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <span className={cn("font-black text-slate-700 text-center whitespace-pre-wrap break-words px-1", fontClass)}>{data.label}</span>
        </div>
    </NodeTooltip>
  );
};

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
      selected && !data.isLocked && "border-indigo-500 bg-indigo-50/10 shadow-inner",
      selected && data.isLocked && "border-amber-500 bg-amber-50/5 shadow-inner"
    )}>
      <NodeResizer
        isVisible={!!selected && !data.isLocked}
        minWidth={400}
        minHeight={400}
        handleStyle={{ width: 8, height: 8, backgroundColor: '#6366f1', border: '1px solid white', borderRadius: 2 }}
        lineStyle={{ borderColor: '#6366f1', borderWidth: 1 }}
      />
      {/* Swimlane Header */}
      <div className={cn(
        "h-16 bg-white/90 backdrop-blur-sm border-b-2 border-slate-300 p-2 pr-20 flex flex-col justify-center relative select-none",
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
                className="swimlane-drag-handle cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
                title={t('bpm:editor.dragHint')}
              >
                <GripVertical className="h-4 w-4" />
              </div>
            )}
         </div>
      </div>
      
      {/* Background Grid Line for visual separation if needed */}
      <div className="absolute inset-0 pointer-events-none opacity-5 border-r border-slate-400" />
    </div>
  );
};

export const AlternateProcessNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <rect x="2" y="2" width="156" height="52" rx="12" ry="12" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Alt Process</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const DataNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M20 2 L158 2 L138 54 L2 54 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Data</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const PredefinedProcessNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <rect x="2" y="2" width="156" height="52" fill="white" stroke="#0f172a" strokeWidth="2" />
          <line x1="16" y1="2" x2="16" y2="54" stroke="#0f172a" strokeWidth="2" />
          <line x1="144" y1="2" x2="144" y2="54" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Predefined</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const InternalStorageNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <rect x="2" y="2" width="156" height="52" fill="white" stroke="#0f172a" strokeWidth="2" />
          <line x1="16" y1="2" x2="16" y2="54" stroke="#0f172a" strokeWidth="2" />
          <line x1="2" y1="14" x2="158" y2="14" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 px-6 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Internal Storage</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const MultiDocumentNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 140);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 140 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M12 2 L138 2 L138 38 Q118 46 105.5 38 T73 38 T40.5 38 T12 38 Z" fill="white" stroke="#94a3b8" strokeWidth="2" />
          <path d="M6 7 L132 7 L132 43 Q112 51 99.5 43 T67 43 T34.5 43 T6 43 Z" fill="white" stroke="#64748b" strokeWidth="2" />
          <path d="M0 12 L126 12 L126 48 Q106 56 93.5 48 T61 48 T28.5 48 T0 48 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-3 pb-1 px-4 z-10">
          <span className={cn("font-bold uppercase tracking-tight text-slate-700 text-center leading-tight whitespace-pre-wrap break-words max-h-[30px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</span>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const PreparationNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M15 2 L145 2 L158 28 L145 54 L15 54 L2 28 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Preparation</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const ManualOperationNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M2 2 L158 2 L138 54 L22 54 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Manual Op</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const CardNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M20 2 L158 2 L158 54 L2 54 L2 20 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 px-6 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Card</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const PunchedTapeNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M2 10 Q40 0 80 10 T158 10 L158 46 Q120 56 80 46 T2 46 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Punched Tape</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const SummingJunctionNode = ({ data, selected, type }: NodeProps) => {
  const nodeScale = data?.nodeScaleOverride || 'md';
  const fontScale = data?.fontScaleOverride || 'md';

  let boxSize = 48;
  if (nodeScale === 'sm') boxSize = 38;
  else if (nodeScale === 'lg') boxSize = 60;

  let fontClass = 'text-[10px]';
  if (fontScale === 'sm') fontClass = 'text-[9px]';
  else if (fontScale === 'lg') fontClass = 'text-xs';

  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={{ width: `${boxSize}px`, height: `${boxSize}px` }}
        className={cn(
          "relative group transition-all flex items-center justify-center",
          selected && "scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 48 48" className="absolute inset-0">
          <circle cx="24" cy="24" r="21" fill="white" stroke="#0f172a" strokeWidth="2" />
          <line x1="9" y1="9" x2="39" y2="39" stroke="#0f172a" strokeWidth="2" />
          <line x1="9" y1="39" x2="39" y2="9" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className={cn(
          "absolute -bottom-6 left-1/2 -translate-x-1/2 w-28 text-center font-bold uppercase py-0.5 px-1 rounded transition-colors whitespace-pre-wrap break-words",
          fontClass,
          selected ? "bg-slate-800 text-white" : "text-slate-700"
        )}>{data.label}</div>
        </div>
    </NodeTooltip>
  );
};

export const OrNode = ({ data, selected, type }: NodeProps) => {
  const nodeScale = data?.nodeScaleOverride || 'md';
  const fontScale = data?.fontScaleOverride || 'md';

  let boxSize = 48;
  if (nodeScale === 'sm') boxSize = 38;
  else if (nodeScale === 'lg') boxSize = 60;

  let fontClass = 'text-[10px]';
  if (fontScale === 'sm') fontClass = 'text-[9px]';
  else if (fontScale === 'lg') fontClass = 'text-xs';

  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={{ width: `${boxSize}px`, height: `${boxSize}px` }}
        className={cn(
          "relative group transition-all flex items-center justify-center",
          selected && "scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 48 48" className="absolute inset-0">
          <circle cx="24" cy="24" r="21" fill="white" stroke="#0f172a" strokeWidth="2" />
          <line x1="24" y1="3" x2="24" y2="45" stroke="#0f172a" strokeWidth="2" />
          <line x1="3" y1="24" x2="45" y2="24" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className={cn(
          "absolute -bottom-6 left-1/2 -translate-x-1/2 w-28 text-center font-bold uppercase py-0.5 px-1 rounded transition-colors whitespace-pre-wrap break-words",
          fontClass,
          selected ? "bg-slate-800 text-white" : "text-slate-700"
        )}>{data.label}</div>
        </div>
    </NodeTooltip>
  );
};

export const CollateNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 120);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 120 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M2 2 L118 2 L2 54 L118 54 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1.5 px-4 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Collate</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const SortNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 120);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 120 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M2 2 L118 2 L2 54 L118 54 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
          <line x1="2" y1="28" x2="118" y2="28" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 px-4 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Sort</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const ExtractNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 120);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 120 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M60 2 L118 54 L2 54 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2 px-4 z-10">
           <div className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">Extract</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[28px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const MergeNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 120);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 120 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M2 2 L118 2 L60 54 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-start pt-2 px-4 z-10">
           <div className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">Merge</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[28px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const StoredDataNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M12 2 L148 2 A 12 26 0 0 1 148 54 L12 54 A 12 26 0 0 1 12 2" fill="white" stroke="#0f172a" strokeWidth="2" />
          <path d="M12 2 A 12 26 0 0 0 12 54" fill="none" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Stored Data</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const DelayNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M2 2 L134 2 A 26 26 0 0 1 134 54 L2 54 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Delay</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const SequentialAccessNode = ({ data, selected, type }: NodeProps) => {
  const nodeScale = data?.nodeScaleOverride || 'md';
  const fontScale = data?.fontScaleOverride || 'md';

  let boxSize = 56;
  if (nodeScale === 'sm') boxSize = 44;
  else if (nodeScale === 'lg') boxSize = 70;

  let fontClass = 'text-[10px]';
  if (fontScale === 'sm') fontClass = 'text-[9px]';
  else if (fontScale === 'lg') fontClass = 'text-xs';

  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={{ width: `${boxSize}px`, height: `${boxSize}px` }}
        className={cn(
          "relative group transition-all flex items-center justify-center",
          selected && "scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 56 56" className="absolute inset-0">
          <circle cx="28" cy="24" r="20" fill="white" stroke="#0f172a" strokeWidth="2" />
          <line x1="28" y1="44" x2="52" y2="44" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className={cn(
          "absolute -bottom-6 left-1/2 -translate-x-1/2 w-28 text-center font-bold uppercase py-0.5 px-1 rounded transition-colors whitespace-pre-wrap break-words",
          fontClass,
          selected ? "bg-slate-800 text-white" : "text-slate-700"
        )}>{data.label}</div>
        </div>
    </NodeTooltip>
  );
};

export const DirectAccessNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M2 2 L146 2 A 12 26 0 0 1 146 54 L2 54 A 12 26 0 0 1 2 2 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="146" cy="28" rx="12" ry="26" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pr-4 pl-2 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Direct Access</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const DisplayNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M20 2 L158 2 L158 54 L20 54 L2 28 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pl-4 pr-2 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Display</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const LoopLimitNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105 shadow-xl"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 160 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M20 2 L140 2 L158 15 L158 54 L2 54 L2 15 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 px-6 z-10">
           <div className="text-[9px] font-black text-slate-400 uppercase leading-none mb-0.5">Loop Limit</div>
           <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};

export const AnnotationNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 140);
  return (
    <NodeTooltip data={data} type={type}>
      <div 
        style={style}
        className={cn(
          "relative group transition-all h-14",
          selected && "scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 140 56" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M40 2 L2 2 L2 54 L40 54" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-start justify-center pl-4 pr-2 z-10">
           <div className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">Annotation</div>
           <div className={cn("italic text-slate-600 leading-tight text-left whitespace-pre-wrap break-words max-h-[36px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
        </div>
    </NodeTooltip>
  );
};
