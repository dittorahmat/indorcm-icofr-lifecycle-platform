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
import { ChevronDown, ChevronRight, Filter, SortAsc, SortDesc } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GLDataGridProps {
  data: GLRow[];
  assessmentData: Record<string, Record<number, QualitativeLevel>>;
  pmValue: number;
  onAssessmentChange: (fsliName: string, ruleId: number, level: QualitativeLevel) => void;
  isReadOnly?: boolean;
}

const QUALITATIVE_RULES = [
  { id: 1, label: "Kecurangan" },
  { id: 2, label: "Volume" },
  { id: 3, label: "Kompleksitas" },
  { id: 4, label: "Karakteristik" },
  { id: 5, label: "Kerumitan" },
  { id: 6, label: "Kewajiban Kontingensi Signifikan" },
  { id: 7, label: "Ada transaksi pihak berelasi" },
  { id: 8, label: "Volalitas" },
];

export function GLDataGrid({ 
  data, 
  assessmentData, 
  pmValue, 
  onAssessmentChange, 
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
              Math.abs(val) >= pmValue ? "text-red-600 font-bold" : "text-slate-500"
            )}>
              {val.toLocaleString('id-ID')}
            </div>
          );
        },
      },
      {
        id: 'quantFlag',
        header: () => <div className="text-center bg-orange-50/50 -mx-2 py-1 text-[9px]">Kuan</div>,
        cell: ({ row }) => {
          const balance = row.getIsGrouped() 
            ? row.getLeafRows().reduce((sum, r) => sum + Math.abs(r.original.balance), 0)
            : Math.abs(row.original.balance);
          const isSignificant = balance >= pmValue;
          return (
            <div className="text-center">
              {isSignificant ? (
                <Badge className="bg-red-600 h-4 px-1.5 text-[8px] uppercase tracking-tighter">Significant</Badge>
              ) : (
                <span className="text-slate-300 text-[9px] font-medium italic">Not Significant</span>
              )}
            </div>
          );
        }
      },
      ...QUALITATIVE_RULES.map(rule => ({
        id: `rule-${rule.id}`,
        header: () => (
          <div className="text-[9px] uppercase tracking-tighter text-slate-400 text-center leading-tight max-w-[60px] mx-auto whitespace-normal">
            {rule.label}
          </div>
        ),
        cell: ({ row }) => {
          if (!row.getIsGrouped()) return <div className="text-center text-slate-200 text-[8px]">-</div>;
          
          const fsliName = row.getValue('fsliName') as string;
          const currentLevel = assessmentData[fsliName]?.[rule.id] || "";
          
          return (
            <Select 
              disabled={isReadOnly}
              value={currentLevel} 
              onValueChange={(val: QualitativeLevel) => onAssessmentChange(fsliName, rule.id, val)}
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
                <SelectItem value="Low" className="text-xs text-green-600 font-medium">Low</SelectItem>
                <SelectItem value="Medium" className="text-xs text-amber-600 font-medium">Medium</SelectItem>
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
          const fsliName = isGrouped ? row.getValue('fsliName') as string : row.original.fsliName || "";
          
          const assessments = assessmentData[fsliName] || {};
          const isQualSignificant = Object.values(assessments).some(v => v === 'High');
          
          if (isGrouped) {
            const leaves = row.getLeafRows();
            const isKuanSignificant = leaves.some(lr => Math.abs(lr.original.balance) >= pmValue);
            const isInScope = isKuanSignificant || isQualSignificant;
            return isInScope ? <Badge className="bg-indigo-600 text-[9px] h-4 px-1.5 uppercase font-bold">IN SCOPE</Badge> : <Badge variant="outline" className="text-[9px] h-4 px-1.5 opacity-40">OUT</Badge>;
          }
          
          const isKuanSignificant = Math.abs(row.original.balance) >= pmValue;
          
          if (isQualSignificant) {
            return <Badge className="text-[9px] h-4 px-1.5 font-bold bg-red-600">IN (QUAL)</Badge>;
          }
          if (isKuanSignificant) {
            return <Badge className="text-[9px] h-4 px-1.5 font-bold bg-blue-600">IN (QUAN)</Badge>;
          }
          return <Badge variant="outline" className="text-[9px] h-4 px-1.5 opacity-40 text-slate-400">OUT</Badge>;
        }
      }
    ],
    [pmValue, assessmentData, isReadOnly, onAssessmentChange]
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
                    className="border-r last:border-r-0 h-16 text-[10px] font-bold uppercase text-slate-500 whitespace-nowrap px-2"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div 
                        className={cn(
                          "flex flex-col gap-1 h-full justify-center",
                          header.column.getCanSort() && "cursor-pointer select-none"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanFilter() ? (
                          <div className="relative mt-1" onClick={e => e.stopPropagation()}>
                            <Filter className="absolute left-1.5 top-1.5 h-2.5 w-2.5 text-slate-300" />
                            <input 
                              className="w-full pl-5 pr-1 py-1 text-[9px] font-normal"
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
                  row.getIsGrouped() ? "bg-slate-100/50 font-bold" : "border-b"
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
                        <span className="text-[9px] text-slate-400 font-normal">
                          ({row.getLeafRows().length})
                        </span>
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
