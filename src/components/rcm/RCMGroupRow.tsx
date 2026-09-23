import React from 'react';
import { TableCell } from '@/components/ui/table';
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
    <tr className={cn(
      "h-8 select-none sticky top-[79px] z-40 border-none",
      depth === 0 ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-800",
      className
    )}>
      <TableCell colSpan={colSpan} className="p-0">
        <div className={cn(
          "flex items-center gap-2 font-semibold uppercase text-xs tracking-wider px-4 h-full",
          depth > 0 && "pl-8"
        )}>
          {depth === 0 ? (
             <div className="bg-indigo-400 h-3.5 w-1 rounded-full mr-1" />
          ) : (
             <ChevronRight className="h-3 w-3 text-slate-500" />
          )}
          {title}
        </div>
      </TableCell>
    </tr>
  );
}
