import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  GroupingState,
} from '@tanstack/react-table';
import { GLRow, QualitativeLevel } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Filter, SortAsc, SortDesc, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GLDataGridProps {
  data: GLRow[];
  assessmentData: Record<string, Record<number, QualitativeLevel>>;
  omValue: number;
  pmValue: number;
  onAssessmentChange: (noGL: string, ruleId: number, level: QualitativeLevel) => void;
  onApplyToFSLI: (fsliCode: string, ruleId: number, level: QualitativeLevel) => void;
  isReadOnly?: boolean;
}

const QUALITATIVE_RULES = [
  { id: 1, label: "R1: Fraud/Error Risk" },
  { id: 2, label: "R2: Transaction Volume" },
  { id: 3, label: "R3: Complexity" },
  { id: 4, label: "R4: Loss Exposure" },
  { id: 5, label: "R5: Acct Complexity" },
  { id: 6, label: "R6: Contingency" },
  { id: 7, label: "R7: Related Party" },
  { id: 8, label: "R8: Changes" },
];

export function GLDataGrid({ 
  data, 
  assessmentData, 
  omValue,
  pmValue, 
  onAssessmentChange, 
  onApplyToFSLI,
  isReadOnly = false 
}: GLDataGridProps) {
  const [grouping, setGrouping] = React.useState<GroupingState>(['fsliName']);
  const [expanded, setExpanded] = React.useState({});

  const columns = React.useMemo<ColumnDef<GLRow>[]>(
    () => [
      {
        accessorKey: 'noUrut',
        header: '#',
        cell: info => <span className="text-[9px] text-slate-400">{info.getValue<number>()}</span>,
        size: 40,
      },
      {
        accessorKey: 'fsliName',
        header: ({ column }) => (
          <div className="flex items-center gap-1">
            <span>FSLI</span>
            {column.getIsSorted() === 'asc' ? <SortAsc className="h-3 w-3" /> : column.getIsSorted() === 'desc' ? <SortDesc className="h-3 w-3" /> : null}
          </div>
        ),
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2 font-bold text-[11px] text-slate-700">
            {row.getCanExpand() && (
              <button onClick={row.getToggleExpandedHandler()} className="cursor-pointer">
                {row.getIsExpanded() ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            )}
            <span className="truncate max-w-[150px]">{getValue<string>()}</span>
          </div>
        ),
      },
      {
        accessorKey: 'noGL',
        header: 'Code',
        cell: info => <span className="font-mono text-[9px]">{info.getValue<string>()}</span>,
        size: 80,
      },
      {
        accessorKey: 'glDesc',
        header: 'Description',
        cell: info => <span className="text-[10px] truncate max-w-[180px]" title={info.getValue<string>()}>{info.getValue<string>()}</span>,
      },
      {
        accessorKey: 'balance',
        header: () => <div className="text-right">Balance</div>,
        cell: info => {
          const val = info.getValue<number>();
          return (
            <div className={cn(
              "text-right font-mono text-[10px]",
              Math.abs(val) >= pmValue ? "text-blue-600 font-bold" : "text-slate-500"
            )}>
              {val.toLocaleString('id-ID')}
            </div>
          );
        },
      },
      {
        id: 'omFlag',
        header: () => <div className="text-center bg-blue-50/50 -mx-2 py-1 text-[9px]">OM</div>,
        cell: ({ row }) => {
          const balance = row.getIsGrouped() 
            ? row.getLeafRows().reduce((sum, r) => sum + Math.abs(r.original.balance), 0)
            : Math.abs(row.original.balance);
          const isY = balance >= omValue;
          return <div className={cn("text-center font-bold text-[10px]", isY ? "text-blue-600" : "text-slate-300")}>{isY ? 'Y' : 'N'}</div>;
        }
      },
      {
        id: 'pmFlag',
        header: () => <div className="text-center bg-blue-50/50 -mx-2 py-1 text-[9px]">PM</div>,
        cell: ({ row }) => {
          const balance = row.getIsGrouped() 
            ? row.getLeafRows().reduce((sum, r) => sum + Math.abs(r.original.balance), 0)
            : Math.abs(row.original.balance);
          const isY = balance >= pmValue;
          return <div className={cn("text-center font-bold text-[10px]", isY ? "text-indigo-600" : "text-slate-300")}>{isY ? 'Y' : 'N'}</div>;
        }
      },
      {
        id: 'quantFlag',
        header: () => <div className="text-center bg-orange-50/50 -mx-2 py-1 text-[9px]">Kuan</div>,
        cell: ({ row }) => {
          const balance = row.getIsGrouped() 
            ? row.getLeafRows().reduce((sum, r) => sum + Math.abs(r.original.balance), 0)
            : Math.abs(row.original.balance);
          const isY = balance >= pmValue;
          return (
            <div className="text-center">
              {isY ? <Badge className="bg-orange-500 h-4 px-1 text-[8px]">Y</Badge> : <span className="text-slate-300 text-[10px]">N</span>}
            </div>
          );
        }
      },
      ...QUALITATIVE_RULES.map(rule => ({
        id: `rule-${rule.id}`,
        header: () => (
          <div className="flex flex-col items-center gap-1 group">
            <span className="text-[9px] uppercase tracking-tighter text-slate-400 group-hover:text-primary transition-colors">{rule.label.split(':')[0]}</span>
            {!isReadOnly && (
              <button 
                title={`Apply value to all accounts in current view for ${rule.label}`}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  // Logic for batch apply would go here or handled by parent
                }}
              >
                <Zap className="h-2 w-2 text-amber-500" />
              </button>
            )}
          </div>
        ),
        cell: ({ row }) => {
          if (row.getIsGrouped()) return null;
          const noGL = row.original.noGL;
          const currentLevel = assessmentData[noGL]?.[rule.id] || "";
          
          return (
            <Select 
              disabled={isReadOnly}
              value={currentLevel} 
              onValueChange={(val: QualitativeLevel) => onAssessmentChange(noGL, rule.id, val)}
            >
              <SelectTrigger className={cn(
                "h-7 w-full text-[9px] px-1 border-none bg-transparent hover:bg-slate-100 transition-colors",
                currentLevel === 'High' ? "text-red-600 font-bold bg-red-50" : 
                currentLevel === 'Medium' ? "text-amber-600 font-medium bg-amber-50" : 
                currentLevel === 'Low' ? "text-green-600 bg-green-50" : "text-slate-300 italic"
              )}>
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low" className="text-xs text-green-600">Low</SelectItem>
                <SelectItem value="Medium" className="text-xs text-amber-600">Medium</SelectItem>
                <SelectItem value="High" className="text-xs text-red-600 font-bold">High</SelectItem>
              </SelectContent>
            </Select>
          );
        }
      })),
      {
        id: 'finalStatus',
        header: 'Scope',
        cell: ({ row }) => {
          const isGrouped = row.getIsGrouped();
          const leaves = row.getLeafRows();
          const anySignificant = leaves.some(lr => {
            const assessments = assessmentData[lr.original.noGL] || {};
            const isQuant = Math.abs(lr.original.balance) >= pmValue;
            const isQual = Object.values(assessments).some(v => v === 'High');
            return isQuant || isQual;
          });

          if (isGrouped) {
            return anySignificant ? <Badge className="bg-primary text-[9px]">IN SCOPE</Badge> : <Badge variant="outline" className="text-[9px] opacity-40">OUT</Badge>;
          }
          
          const assessments = assessmentData[row.original.noGL] || {};
          const isQuant = Math.abs(row.original.balance) >= pmValue;
          const isQual = Object.values(assessments).some(v => v === 'High');
          
          if (isQuant || isQual) {
            return (
              <Badge className={cn(
                "text-[9px] font-bold",
                isQual ? "bg-red-600" : "bg-blue-600"
              )}>
                {isQual ? "IN (QUAL)" : "IN (QUAN)"}
              </Badge>
            );
          }
          return <Badge variant="outline" className="text-[9px] opacity-40 text-slate-400">OUT</Badge>;
        }
      }
    ],
    [omValue, pmValue, assessmentData, isReadOnly, onAssessmentChange]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      grouping,
      expanded,
    },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <Table className="relative">
          <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map(header => (
                  <TableHead 
                    key={header.id} 
                    className="border-r last:border-r-0 h-12 text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap px-2"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div 
                        className={cn(
                          "flex flex-col gap-1",
                          header.column.getCanSort() && "cursor-pointer select-none"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanFilter() ? (
                          <div className="relative mt-1" onClick={e => e.stopPropagation()}>
                            <Filter className="absolute left-1.5 top-1.5 h-2.5 w-2.5 text-slate-300" />
                            <input 
                              className="w-full pl-5 pr-1 py-1 text-[9px] border rounded bg-white font-normal"
                              placeholder="Search..."
                              onChange={e => header.column.setFilterValue(e.target.value)}
                            />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow 
                key={row.id} 
                className={cn(
                  "hover:bg-slate-50/50 transition-colors h-8",
                  row.getIsGrouped() ? "bg-slate-50/80 font-semibold" : "border-b"
                )}
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell 
                    key={cell.id} 
                    className="border-r last:border-r-0 py-0 px-2"
                  >
                    {cell.getIsGrouped() ? (
                      <div className="flex items-center gap-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({row.getLeafRows().length} accounts)
                        </span>
                        {!isReadOnly && (
                          <div className="flex gap-1 ml-auto">
                            {QUALITATIVE_RULES.map(rule => (
                              <Button 
                                key={rule.id}
                                variant="ghost" 
                                size="icon" 
                                className="h-5 w-5 text-slate-300 hover:text-primary"
                                title={`Batch apply ${rule.label.split(':')[0]} for this FSLI`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onApplyToFSLI(row.getValue('fsliCode'), rule.id, "High");
                                }}
                              >
                                <Zap className="h-2 w-2" />
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : cell.getIsPlaceholder() ? null : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="p-2 border-t bg-slate-50 text-[10px] text-slate-400 italic flex justify-between">
        <span>Showing {table.getRowModel().rows.length} rows</span>
        <span>Standard: SK-5/2024 Table 5 Compliance Engine</span>
      </div>
    </div>
  );
}
