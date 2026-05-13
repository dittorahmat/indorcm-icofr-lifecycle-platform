import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface RCMGroupRowProps {
  title: string;
  colSpan: number;
  className?: string;
  depth?: number;
}

export function RCMGroupRow({ title, colSpan, className, depth = 0 }: RCMGroupRowProps) {
  return (
    <TableRow className={cn(
      "h-9 border-b border-slate-400 select-none sticky z-40",
      depth === 0 ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-900 shadow-inner",
      className
    )}>
      <TableCell colSpan={colSpan} className="p-0">
        <div className={cn(
          "flex items-center gap-2 font-black uppercase text-xs tracking-widest px-4 h-full",
          depth > 0 && "pl-10"
        )}>
          {depth === 0 ? (
             <div className="bg-indigo-500 h-4 w-1 rounded-full mr-1" />
          ) : (
             <ChevronRight className="h-3 w-3 text-slate-500" />
          )}
          {title}
        </div>
      </TableCell>
    </TableRow>
  );
}
