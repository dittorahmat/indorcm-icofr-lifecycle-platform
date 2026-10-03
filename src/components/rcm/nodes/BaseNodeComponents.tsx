import React from 'react';
import { Handle, Position } from 'reactflow';
import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { getNodeStyles } from './node-style-utils';

export const NodeTooltip = ({ children, data, type, selected }: { children: React.ReactNode, data: any, type: string, selected?: boolean }) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("relative transition-all", selected && "ring-2 ring-primary ring-offset-2 rounded-md")}>{children}</div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[250px] p-2 bg-mancity-pattern text-primary-foreground border-none shadow-2xl z-[100]">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center border-b border-white/20 pb-1 mb-1 flex-wrap gap-2">
              <p className="font-bold text-xs uppercase text-primary-foreground/70">
                {type} Preview
              </p>
              {(data.relatedElcNames && data.relatedElcNames.length > 0) && (
                <ShieldCheck className="h-3 w-3 text-primary-foreground" />
              )}
            </div>
            <p className="text-xs font-bold leading-tight text-primary-foreground">{data.label}</p>
            {data.description && <p className="text-xs text-primary-foreground/80 line-clamp-3 leading-relaxed">{data.description}</p>}
            
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
  const handleBase = "w-2 h-2 bg-white border border-slate-600 rounded-full shadow-sm transition-all z-20 pointer-events-auto";
  const hoverStyle = selected 
    ? "opacity-90 scale-110 border-primary bg-primary/20" 
    : "opacity-0 group-hover:opacity-70 hover:!opacity-100 hover:scale-125 hover:border-primary";

  return (
    <>
      {/* 1. Top Left */}
      <Handle type="target" position={Position.Top} id="t-l" style={{ left: "0%" }} className={cn(handleBase, hoverStyle, "!translate-x-0")} />
      <Handle type="source" position={Position.Top} id="t-l-src" style={{ left: "0%" }} className={cn(handleBase, hoverStyle, "!translate-x-0")} />

      {/* 2. Top Center */}
      <Handle type="target" position={Position.Top} id="top" style={{ left: "50%" }} className={cn(handleBase, hoverStyle)} />
      <Handle type="source" position={Position.Top} id="top-src" style={{ left: "50%" }} className={cn(handleBase, hoverStyle)} />

      {/* 3. Top Right */}
      <Handle type="target" position={Position.Top} id="t-r" style={{ left: "100%" }} className={cn(handleBase, hoverStyle, "!-translate-x-full")} />
      <Handle type="source" position={Position.Top} id="t-r-src" style={{ left: "100%" }} className={cn(handleBase, hoverStyle, "!-translate-x-full")} />

      {/* 4. Middle Left */}
      <Handle type="target" position={Position.Left} id="left" style={{ top: "50%" }} className={cn(handleBase, hoverStyle)} />
      <Handle type="source" position={Position.Left} id="left-src" style={{ top: "50%" }} className={cn(handleBase, hoverStyle)} />

      {/* 5. Middle Right */}
      <Handle type="target" position={Position.Right} id="right-tgt" style={{ top: "50%" }} className={cn(handleBase, hoverStyle)} />
      <Handle type="source" position={Position.Right} id="right" style={{ top: "50%" }} className={cn(handleBase, hoverStyle)} />

      {/* 6. Bottom Left */}
      <Handle type="target" position={Position.Bottom} id="b-l" style={{ left: "0%" }} className={cn(handleBase, hoverStyle, "!translate-x-0")} />
      <Handle type="source" position={Position.Bottom} id="b-l-src" style={{ left: "0%" }} className={cn(handleBase, hoverStyle, "!translate-x-0")} />

      {/* 7. Bottom Center */}
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ left: "50%" }} className={cn(handleBase, hoverStyle)} />
      <Handle type="target" position={Position.Bottom} id="bottom-tgt" style={{ left: "50%" }} className={cn(handleBase, hoverStyle)} />

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
            <span className="text-xs font-black text-blue-600 hover:text-white leading-none">▲</span>
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
            <span className="text-xs font-black text-blue-600 hover:text-white leading-none">▶</span>
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
            <span className="text-xs font-black text-blue-600 hover:text-white leading-none">▼</span>
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
            <span className="text-xs font-black text-blue-600 hover:text-white leading-none">◀</span>
          </Handle>
        </div>
      </div>
    </>
  );
};
