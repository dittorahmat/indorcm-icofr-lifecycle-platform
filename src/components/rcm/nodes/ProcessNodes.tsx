import { Handle, Position, NodeProps } from 'reactflow';
import { Activity, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  EightConnectionHandles, 
  NodeTooltip 
} from './BaseNodeComponents';
import { getNodeStyles } from './node-style-utils';

export const StartEndNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 120);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
      <div 
        style={style}
        className={cn(
          "px-4 py-2 shadow-md rounded-[50px] bg-white border-2 text-center transition-all",
          data.type === 'start' ? "border-green-600 ring-green-100" : "border-red-600 ring-red-100",
          selected && "ring-4 border-primary shadow-lg scale-105"
        )}
      >
        <Handle
          type={data.type === 'start' ? "source" : "target"}
          position={data.type === 'start' ? Position.Bottom : Position.Top}
          id={data.type === 'start' ? "bottom" : "top"}
          className="w-3 h-3 border-2 border-white bg-slate-400"
        />
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
    <NodeTooltip data={data} type={type} selected={selected}>
      <div 
        style={style}
        className={cn(
          "px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 text-center transition-all relative flex flex-col justify-between min-h-[56px] group",
          selected && "ring-4 ring-primary/20 border-primary shadow-lg scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <div className="font-bold text-xs mb-1.5 uppercase text-slate-500 border-b pb-1 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 truncate">
            <Activity className="h-2.5 w-2.5 shrink-0" /> <span className="truncate">{data.role || "Role"}</span>
          </div>
          {data.stepRef && (
            <span className="font-mono text-[10px] font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              {data.stepRef}
            </span>
          )}
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

export const ExternalProcessNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
      <div 
        style={style}
        className={cn(
          "px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 text-center transition-all relative flex flex-col justify-between min-h-[56px] group",
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

export const DecisionNode = ({ data, selected, type }: NodeProps) => {
  const nodeScale = data?.nodeScaleOverride || 'md';
  const fontScale = data?.fontScaleOverride || 'md';

  let boxSize = 110;
  if (nodeScale === 'sm') boxSize = 90;
  else if (nodeScale === 'lg') boxSize = 135;

  let fontClass = 'text-xs';
  if (fontScale === 'sm') fontClass = 'text-xs';
  else if (fontScale === 'lg') fontClass = 'text-sm';

  return (
    <NodeTooltip data={data} type={type} selected={selected}>
      <div 
        style={{ width: `${boxSize}px`, height: `${boxSize}px` }}
        className={cn("relative flex items-center justify-center transition-all group", selected && "scale-105")}
      >
        {/* Canonical side pairs so every stored handle id exists in the DOM.
            Corners are omitted (sidesOnly): they would float outside the diamond.
            Legacy decision aliases no/yes are kept for stored-edge compat. */}
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} sidesOnly />
        <div className={cn(
          "absolute inset-0 border-2 rotate-45 transform shadow-md flex items-center justify-center bg-white",
          selected ? "border-primary ring-4 ring-primary/20 bg-primary/5" : "border-slate-800"
        )}>
          <div className={cn("-rotate-45 text-center px-2 font-bold leading-tight uppercase text-slate-700 whitespace-pre-wrap break-words max-w-[85%]", fontClass)}>{data.label}</div>
        </div>
        <Handle type="source" position={Position.Left} id="no" className="z-10" />
        <Handle type="source" position={Position.Right} id="yes" className="z-10" />
        {data.isLocked && (
          <div className="absolute top-0 right-0 bg-amber-50 border border-amber-200 text-amber-600 rounded-full p-0.5 shadow-sm z-20">
            <Lock className="h-3 w-3" />
          </div>
        )}
      </div>
    </NodeTooltip>
  );
};

export const AlternateProcessNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Alt Process</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const PredefinedProcessNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Predefined</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const OffPageRefNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 56);
  const hasTargetSheet = !!data.targetSheetId;

  const handleClick = (e: React.MouseEvent) => {
    if (data.targetSheetId && typeof data.onJumpToSheet === 'function') {
      e.stopPropagation();
      data.onJumpToSheet(data.targetSheetId, data.targetNodeId);
    }
  };

  return (
    <NodeTooltip data={data} type={type} selected={selected}>
      <div 
        style={style}
        onClick={hasTargetSheet ? handleClick : undefined}
        role={hasTargetSheet ? "button" : undefined}
        tabIndex={hasTargetSheet ? 0 : undefined}
        title={hasTargetSheet ? `Lompat ke sheet: ${data.targetSheetName || data.targetSheetId}` : undefined}
        className={cn(
          "h-14 relative flex items-center justify-center transition-all",
          selected && "scale-105",
          hasTargetSheet && "cursor-pointer group"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 56 56" preserveAspectRatio="none" className="absolute inset-0">
          <path
            d="M0 0 L56 0 L56 30 L28 56 L0 30 Z"
            fill={hasTargetSheet ? "#f0fdf4" : "white"}
            stroke={hasTargetSheet ? "#16a34a" : "#0f172a"}
            strokeWidth={hasTargetSheet ? "2.5" : "2"}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pb-4 px-1 z-10 pointer-events-none">
          <span className={cn("font-black text-slate-800 text-center whitespace-pre-wrap break-words leading-tight text-xs", fontClass)}>
            {data.label || (data.direction === 'in' ? 'Dari hal X' : 'Ke hal X')}
          </span>
          {data.targetSheetName && (
            <span className="text-xs font-bold text-emerald-700 truncate max-w-[50px] leading-none">
              {data.targetSheetName}
            </span>
          )}
        </div>
      </div>
    </NodeTooltip>
  );
};


export const ReferenceNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 40);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
      <div 
        style={{ ...style, height: style.width }}
        className={cn(
          "rounded-full border-2 bg-white flex items-center justify-center shadow-md transition-all group relative",
          selected ? "border-primary ring-4 ring-primary/20" : "border-slate-800"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <span className={cn("font-black text-slate-700 text-center whitespace-pre-wrap break-words px-1", fontClass)}>{data.label}</span>
      </div>
    </NodeTooltip>
  );
};

export const DelayNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Delay</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const LoopLimitNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Loop Limit</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};
