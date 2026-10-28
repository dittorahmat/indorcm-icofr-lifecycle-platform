import { NodeProps } from 'reactflow';
import { Database, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  EightConnectionHandles, 
  NodeTooltip 
} from './BaseNodeComponents';
import { getNodeStyles } from './node-style-utils';

export const ManualInputNode = ({ data, selected, type }: NodeProps) => {
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
        <svg width="100%" height="100%" viewBox="0 0 160 60" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M0 20 L160 0 L160 60 L0 60 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 px-3 z-10">
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-1">Manual Input</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const AutomatedActivityNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 160);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
      <div 
        style={style}
        className={cn(
          "px-4 py-3 shadow-md rounded-sm bg-blue-50 border-2 border-blue-800 text-center transition-all relative flex flex-col justify-between min-h-[64px] group",
          selected && "ring-4 ring-primary/20 border-primary shadow-lg scale-105"
        )}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <div className="font-bold text-xs mb-1.5 uppercase text-blue-600 border-b border-blue-200 pb-1 flex items-center justify-center gap-1">
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

export const DataMediaNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 100);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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

export const DataNode = ({ data, selected, type }: NodeProps) => {
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
          <path d="M20 2 L158 2 L138 54 L2 54 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Data</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const InternalStorageNode = ({ data, selected, type }: NodeProps) => {
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
          <line x1="2" y1="14" x2="158" y2="14" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 px-6 z-10">
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Internal Storage</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const CardNode = ({ data, selected, type }: NodeProps) => {
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
          <path d="M20 2 L158 2 L158 54 L2 54 L2 20 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 px-6 z-10">
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Card</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const PunchedTapeNode = ({ data, selected, type }: NodeProps) => {
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
          <path d="M2 10 Q40 0 80 10 T158 10 L158 46 Q120 56 80 46 T2 46 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Punched Tape</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const StoredDataNode = ({ data, selected, type }: NodeProps) => {
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
          <path d="M12 2 L148 2 A 12 26 0 0 1 148 54 L12 54 A 12 26 0 0 1 12 2" fill="white" stroke="#0f172a" strokeWidth="2" />
          <path d="M12 2 A 12 26 0 0 0 12 54" fill="none" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Stored Data</div>
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

  let fontClass = 'text-xs';
  if (fontScale === 'sm') fontClass = 'text-xs';
  else if (fontScale === 'lg') fontClass = 'text-xs';

  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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
          <path d="M2 2 L146 2 A 12 26 0 0 1 146 54 L2 54 A 12 26 0 0 1 2 2 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
          <ellipse cx="146" cy="28" rx="12" ry="26" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pr-4 pl-2 z-10">
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Direct Access</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const DisplayNode = ({ data, selected, type }: NodeProps) => {
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
          <path d="M20 2 L158 2 L158 54 L20 54 L2 28 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pl-4 pr-2 z-10">
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Display</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};
