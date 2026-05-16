import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Activity, Database, ShieldCheck, AlertTriangle, FileText, 
  GitCommit, LayoutDashboard, Link as LinkIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from '@/components/ui/input';

// --- Tooltip Component ---

export const NodeTooltip = ({ children, data, type }: { children: React.ReactNode, data: any, type: string }) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">{children}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[250px] p-2 bg-slate-900 border-slate-700 shadow-2xl z-[100]">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center border-b border-slate-700 pb-1 mb-1">
              <p className="font-bold text-xs uppercase text-slate-400">
                {type} Preview
              </p>
              {(data.relatedElcNames && data.relatedElcNames.length > 0) && (
                <ShieldCheck className="h-3 w-3 text-indigo-400" />
              )}
            </div>
            <p className="text-xs font-bold leading-tight text-white">{data.label}</p>
            {data.description && <p className="text-xs text-slate-400 line-clamp-3 italic leading-relaxed">{data.description}</p>}
            
            {data.relatedElcNames && data.relatedElcNames.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-1">Payung Kebijakan (ELC):</p>
                <ul className="space-y-0.5">
                  {data.relatedElcNames.map((name: string, i: number) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-1">
                      <div className="h-1 w-1 rounded-full bg-indigo-500 mt-1 shrink-0" />
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-2 pt-1">
              {data.role && <p className="text-xs text-blue-400 font-bold uppercase">Role: {data.role}</p>}
              {data.code && <p className="text-xs text-green-400 font-mono font-bold">Code: {data.code}</p>}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// --- SHAPES ---

export const StartEndNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn(
      "px-6 py-2 shadow-md rounded-[50px] bg-white border-2 min-w-[120px] text-center transition-all",
      data.type === 'start' ? "border-green-600 ring-green-100" : "border-red-600 ring-red-100",
      selected && "ring-4 border-primary shadow-lg scale-105"
    )}>
      <Handle type={data.type === 'start' ? "source" : "target"} position={data.type === 'start' ? Position.Bottom : Position.Top} className="w-3 h-3 border-2 border-white bg-slate-400" />
      <span className={cn(
        "font-bold text-xs uppercase tracking-wider",
        data.type === 'start' ? "text-green-700" : "text-red-700"
      )}>{data.label}</span>
    </div>
  </NodeTooltip>
);

export const ActivityNode = ({ data, selected, type }: NodeProps) => {
  return (
    <NodeTooltip data={data} type={type}>
      <div className={cn(
        "px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 min-w-[160px] text-center transition-all relative",
        selected && "ring-4 ring-primary/20 border-primary shadow-lg scale-105"
      )}>
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <div className="font-bold text-xs mb-1.5 uppercase text-slate-500 border-b pb-1 flex items-center justify-center gap-1">
          <Activity className="h-2.5 w-2.5" /> {data.role || "Role"}
        </div>
        <div className="text-xs font-semibold text-slate-800 leading-tight">{data.label}</div>
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </div>
    </NodeTooltip>
  );
};

export const ManualInputNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn(
      "relative group transition-all min-w-[160px] h-14",
      selected && "scale-105 shadow-xl"
    )}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <svg width="100%" height="100%" viewBox="0 0 160 60" preserveAspectRatio="none">
        <path d="M0 20 L160 0 L160 60 L0 60 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
         <div className="text-xs font-black text-slate-400 uppercase leading-none mb-1">Manual Input</div>
         <div className="text-xs font-bold text-slate-800 px-4 text-center leading-tight line-clamp-2">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

export const ExternalProcessNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn(
      "px-4 py-3 shadow-md rounded-sm bg-white border-2 border-slate-800 min-w-[160px] text-center transition-all relative",
      selected && "ring-4 ring-primary/20 border-primary shadow-lg scale-105"
    )}>
      <div className="absolute inset-1 border border-slate-300 pointer-events-none" />
      <Handle type="target" position={Position.Top} className="w-2 h-2" />
      <div className="text-xs font-bold text-slate-800 leading-tight py-1">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
    </div>
  </NodeTooltip>
);

export const AutomatedActivityNode = ({ data, selected, type }: NodeProps) => {
  return (
    <NodeTooltip data={data} type={type}>
      <div className={cn(
        "px-4 py-3 shadow-md rounded-sm bg-blue-50 border-2 border-blue-800 min-w-[160px] text-center transition-all relative",
        selected && "ring-4 ring-primary/20 border-primary shadow-lg scale-105"
      )}>
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
        <div className="font-bold text-xs mb-1.5 uppercase text-blue-600 border-b border-blue-200 pb-1 flex items-center justify-center gap-1">
          <Database className="h-2.5 w-2.5" /> SYSTEM
        </div>
        <div className="text-xs font-semibold text-blue-900 leading-tight mb-2">{data.label}</div>
        <div className="absolute bottom-1 left-2 right-1 h-0.5 bg-blue-800/30 rounded-full" />
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      </div>
    </NodeTooltip>
  );
};

export const DecisionNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn("relative flex items-center justify-center w-[110px] h-[110px] transition-all", selected && "scale-105")}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <div className={cn(
        "absolute inset-0 border-2 rotate-45 transform shadow-md flex items-center justify-center bg-white",
        selected ? "border-primary ring-4 ring-primary/20 bg-primary/5" : "border-slate-800"
      )}>
         <div className="-rotate-45 text-center text-xs px-3 font-bold leading-tight uppercase text-slate-700">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Left} id="no" className="z-10" />
      <Handle type="source" position={Position.Right} id="yes" className="z-10" />
      <Handle type="source" position={Position.Bottom} className="z-10" />
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-xs font-black text-red-600 bg-white/80 px-1 rounded">NO</div>
      <div className="absolute -right-10 top-1/2 -translate-y-1/2 text-xs font-black text-green-600 bg-white/80 px-1 rounded">YES</div>
    </div>
  </NodeTooltip>
);

export const DocumentNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn(
      "relative group transition-all min-w-[130px] h-12",
      selected && "scale-105"
    )}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <svg width="100%" height="100%" viewBox="0 0 130 48" preserveAspectRatio="none">
        <path 
          d="M0 0 L130 0 L130 40 Q110 48 97.5 40 T65 40 T32.5 40 T0 40 Z" 
          fill="white" 
          stroke="#0f172a" 
          strokeWidth="2" 
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pb-2">
        <span className="text-xs font-bold uppercase tracking-tight text-slate-700 px-4 text-center">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

export const ArchiveNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn("w-16 h-16 relative flex items-center justify-center transition-all", selected && "scale-105")}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <svg width="64" height="64" viewBox="0 0 64 64">
        <path d="M0 0 L64 0 L32 64 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center pt-2">
        <GitCommit className="h-4 w-4 text-slate-600 opacity-50" />
        <span className="text-xs font-black text-slate-600 uppercase">ARSIP</span>
      </div>
      <div className={cn(
        "absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 text-center text-xs font-bold uppercase leading-none py-1 px-2 rounded-md transition-colors",
        selected ? "bg-slate-800 text-white" : "text-slate-700 bg-slate-50"
      )}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

export const DataMediaNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn("w-28 h-20 relative flex items-center justify-center transition-all", selected && "scale-105")}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <svg width="100" height="80" viewBox="0 0 100 80">
        <path d="M0 10 Q50 20 100 10 L100 70 Q50 80 0 70 Z" fill="#eff6ff" stroke="#1e40af" strokeWidth="2" />
        <ellipse cx="50" cy="10" rx="50" ry="10" fill="#dbeafe" stroke="#1e40af" strokeWidth="2" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
        <Database className="h-4 w-4 text-blue-600 opacity-50" />
        <div className="text-xs font-black text-blue-900 text-center px-2 uppercase leading-tight">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

export const OffPageRefNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn("w-14 h-14 relative flex items-center justify-center transition-all", selected && "scale-105")}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <svg width="56" height="56" viewBox="0 0 56 56">
        <path d="M0 0 L56 0 L56 30 L28 56 L0 30 Z" fill="white" stroke="#0f172a" strokeWidth="2" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pb-4">
        <span className="text-xs font-black text-slate-700">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

export const ReferenceNode = ({ data, selected, type }: NodeProps) => (
  <NodeTooltip data={data} type={type}>
    <div className={cn(
      "w-10 h-10 rounded-full border-2 bg-white flex items-center justify-center shadow-md transition-all",
      selected ? "border-primary ring-4 ring-primary/20" : "border-slate-800"
    )}>
      <Handle type="target" position={Position.Top} className="z-10" />
      <span className="text-xs font-black text-slate-700">{data.label}</span>
      <Handle type="source" position={Position.Bottom} className="z-10" />
    </div>
  </NodeTooltip>
);

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
  return (
    <div className={cn(
      "h-full w-full border-2 border-slate-300 bg-slate-50/20 relative group transition-all",
      selected && "border-indigo-500 bg-indigo-50/10 shadow-inner"
    )}>
      {/* Swimlane Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-sm border-b-2 border-slate-300 p-2 flex flex-col justify-center">
         <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Department</span>
            <Input 
              value={data.department || ''} 
              placeholder="e.g. Finance"
              onChange={(e) => data.onChangeDepartment?.(e.target.value)}
              className="h-5 text-xs font-bold uppercase bg-transparent border-none focus-visible:ring-0 p-0"
            />
         </div>
         <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Function</span>
            <Input 
              value={data.function || ''} 
              placeholder="e.g. AP Process"
              onChange={(e) => data.onChangeFunction?.(e.target.value)}
              className="h-5 text-xs italic bg-transparent border-none focus-visible:ring-0 p-0 text-slate-600"
            />
         </div>
      </div>
      
      {/* Background Grid Line for visual separation if needed */}
      <div className="absolute inset-0 pointer-events-none opacity-5 border-r border-slate-400" />
    </div>
  );
};
