import { NodeProps } from 'reactflow';
import { GitCommit, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  EightConnectionHandles, 
  NodeTooltip 
} from './BaseNodeComponents';
import { getNodeStyles } from './node-style-utils';

export const DocumentNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 130);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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

export const MultiDocumentNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 140);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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

export const ArchiveNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 64);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
      <div 
        style={style}
        className={cn("h-16 relative flex items-center justify-center transition-all group", selected && "scale-105")}
      >
        <EightConnectionHandles isLocked={data.isLocked} selected={selected} />
        <svg width="100%" height="100%" viewBox="0 0 64 64" preserveAspectRatio="none" className="absolute inset-0">
          <path d="M0 0 L64 0 L32 64 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center pt-2 z-10">
          <GitCommit className="h-4 w-4 text-slate-600 opacity-50" />
          <span className="text-xs font-black text-slate-600 uppercase">ARSIP</span>
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

export const PreparationNode = ({ data, selected, type }: NodeProps) => {
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
          <path d="M15 2 L145 2 L158 28 L145 54 L15 54 L2 28 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Preparation</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const ManualOperationNode = ({ data, selected, type }: NodeProps) => {
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
          <path d="M2 2 L158 2 L138 54 L22 54 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 z-10">
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Manual Op</div>
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
    <NodeTooltip data={data} type={type} selected={selected}>
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
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Collate</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const SortNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 120);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Sort</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[32px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const ExtractNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 120);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Extract</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[28px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const MergeNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 120);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Merge</div>
          <div className={cn("font-bold text-slate-800 text-center leading-tight whitespace-pre-wrap break-words max-h-[28px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};

export const AnnotationNode = ({ data, selected, type }: NodeProps) => {
  const { style, fontClass } = getNodeStyles(data, 140);
  return (
    <NodeTooltip data={data} type={type} selected={selected}>
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
          <div className="text-xs font-black text-slate-400 uppercase leading-none mb-0.5">Annotation</div>
          <div className={cn("not-italic text-slate-600 leading-tight text-left whitespace-pre-wrap break-words max-h-[36px] overflow-y-auto scrollbar-none", fontClass)}>{data.label}</div>
        </div>
      </div>
    </NodeTooltip>
  );
};
