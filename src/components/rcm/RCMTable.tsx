import React from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface RCMColumn {
  id: string;
  header: string;
  accessorKey?: string;
  width: string;
  sticky?: 'left' | 'right';
  stickyOffset?: string;
  className?: string;
  headerClassName?: string;
  tooltip?: string;
  render?: (row: any, index: number) => React.ReactNode;
}

export interface RCMColumnGroup {
  title: string;
  columns: RCMColumn[];
  className?: string;
}

interface RCMTableProps {
  groups: RCMColumnGroup[];
  data: any[];
  isLoading?: boolean;
  onEdit?: (row: any) => void;
  renderGroupRow?: (row: any, index: number, prevRow?: any) => React.ReactNode;
  rowClassName?: (row: any, index: number) => string;
  minWidth?: string;
}

export function RCMTable({ 
  groups, 
  data, 
  isLoading, 
  onEdit, 
  renderGroupRow,
  rowClassName,
  minWidth = "2000px" 
}: RCMTableProps) {
  const { t } = useTranslation('rcm');

  const allColumns = groups.flatMap(g => g.columns);

  return (
    <TooltipProvider>
      <div className="w-full border-t border-b bg-white border-slate-300 overflow-auto flex-1 custom-scrollbar">
        <table 
          className="table-fixed border-separate border-spacing-0 mb-10 w-full"
          style={{ minWidth }}
        >
          <thead className="sticky top-0 z-50">
            {/* Level 1 Header: Groups */}
            <tr className="h-10 bg-slate-800 text-white shadow-md">
              {groups.map((group, gIdx) => (
                <th 
                  key={`group-${gIdx}`}
                  colSpan={group.columns.length}
                  className={cn(
                    "text-center font-black uppercase text-xs tracking-widest border-r border-slate-700/50 py-2 px-2",
                    group.className,
                    group.columns[0]?.sticky === 'left' && "sticky left-0 z-[70] bg-slate-900 shadow-[2px_0_5px_rgba(0,0,0,0.2)]"
                  )}
                  style={group.columns[0]?.sticky === 'left' ? { left: group.columns[0].stickyOffset || '0px' } : undefined}
                >
                  {group.title}
                </th>
              ))}
            </tr>

            {/* Level 2 Header: Columns */}
            <tr className="h-12 bg-slate-100/95 backdrop-blur-md border-b-2 border-slate-300">
              {allColumns.map((col, cIdx) => (
                <th 
                  key={`col-${col.id}-${cIdx}`}
                  className={cn(
                    "font-black uppercase text-xs px-3 border-r border-slate-300 text-slate-600 align-middle",
                    col.sticky === 'left' && "sticky z-[70] bg-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                    col.sticky === 'right' && "sticky right-0 z-[70] bg-slate-100",
                    col.headerClassName
                  )}
                  style={{ 
                    width: col.width,
                    left: col.sticky === 'left' ? col.stickyOffset || '0px' : undefined 
                  }}
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    {col.tooltip ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help flex items-center justify-center hover:text-indigo-600 transition-colors">
                            {col.header}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[300px] bg-slate-900 text-white p-3 border-none shadow-2xl rounded-xl z-[100]">
                           <div className="text-xs leading-relaxed font-medium">
                              {col.tooltip}
                           </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : col.header}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {isLoading ? (
              <tr><td colSpan={allColumns.length} className="h-64 text-center font-black uppercase text-xs text-slate-400 tracking-widest">Loading matrix data...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={allColumns.length} className="h-64 text-center italic text-slate-400">No RCM data found.</td></tr>
            ) : data.map((row, idx) => {
              const groupRow = renderGroupRow?.(row, idx, data[idx - 1]);
              const isEven = idx % 2 === 1;
              const rowBg = isEven ? "bg-slate-50/80" : "bg-white";

              return (
                <React.Fragment key={`${row.mappingId || row.id || 'row'}-${idx}`}>
                  {groupRow}
                  <tr className={cn(
                    "group transition-all border-b border-slate-200 h-14 relative hover:z-10",
                    rowBg,
                    rowClassName?.(row, idx)
                  )}>
                    {allColumns.map((col, cIdx) => {
                      return (
                        <td 
                          key={`cell-${col.id}-${cIdx}`}
                          className={cn(
                            "px-3 border-r border-slate-100 py-2 text-xs transition-colors duration-200",
                            "group-hover:bg-indigo-50/70 group-hover:border-indigo-100/50",
                            col.sticky === 'left' && cn("sticky z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]", rowBg),
                            col.sticky === 'right' && cn("sticky right-0 z-30 border-l shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]", rowBg),
                            col.className
                          )}
                          style={{ 
                            left: col.sticky === 'left' ? col.stickyOffset || '0px' : undefined 
                          }}
                        >
                          {col.render ? col.render(row, idx) : (row[col.accessorKey as string] || '-')}
                          {/* Row Indicator Accent */}
                          {cIdx === 0 && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
}

function classNameForMinWidth(width: string) {
  if (width === "2000px") return "min-w-[2000px]";
  if (width === "3800px") return "min-w-[3800px]";
  if (width === "4800px") return "min-w-[4800px]";
  return `min-w-[${width}]`;
}
