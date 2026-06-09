import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  GroupingState,
  VisibilityState,
  SortingState,
} from '@tanstack/react-table';
import { GLRow, QualitativeLevel, Department, User, Application } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Filter, FileSpreadsheet, Info, ExternalLink, Lock, Building2, Monitor, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Link } from 'react-router-dom';
import { DepartmentPicker } from './DepartmentPicker';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { useTranslation } from 'react-i18next';
import { sortGLHierarchically } from '@/lib/compliance-utils';

interface GLDataGridProps {
  data: GLRow[];
  assessmentData: Record<string, Record<number, QualitativeLevel>>;
  omValue: number;
  pmValue: number;
  onAssessmentChange: (fsliName: string, ruleId: number, level: QualitativeLevel) => void;
  onOwnerAcceptanceChange?: (noGL: string, acceptance: "Accepted" | "Rejected") => void;
  isReadOnly?: boolean;
  departments?: Department[];
  onAssignDepartments?: (accountName: string, departmentIds: string[]) => void;
  
  // New props for applications
  applications?: (Application & { linkedControlCount?: number })[];
  selectedApps?: Record<string, string[]>; // accountCode -> appIds
  onAppsChange?: (accountCode: string, appIds: string[]) => void;
  onQuickAddApp?: (name: string, accountCode: string) => Promise<void>;
  onOpenWorkflow?: () => void;
}

const QUALITATIVE_RULES = [
  { id: 1, key: "qualitativeRules.1" },
  { id: 2, key: "qualitativeRules.2" },
  { id: 3, key: "qualitativeRules.3" },
  { id: 4, key: "qualitativeRules.4" },
  { id: 5, key: "qualitativeRules.5" },
  { id: 6, key: "qualitativeRules.6" },
  { id: 7, key: "qualitativeRules.7" },
  { id: 8, key: "qualitativeRules.8" },
];

export const GLDataGrid = React.memo(function GLDataGrid({
  data,
  assessmentData,
  pmValue,
  onAssessmentChange,
  onOwnerAcceptanceChange,
  isReadOnly = false,
  departments = [],
  onAssignDepartments,
  applications = [],
  selectedApps = {},
  onAppsChange,
  onQuickAddApp,
  onOpenWorkflow
}: GLDataGridProps) {
  const { t } = useTranslation('scoping');
  
  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  // Hierarchical sorting based on noUrut (Standard: SK-5/2024 Table 5)
  const sortedData = React.useMemo(() => sortGLHierarchically(data), [data]);

  const [grouping, setGrouping] = React.useState<GroupingState>(['fsliName']);
  const [expanded, setExpanded] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'noUrut', desc: false }
  ]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    noUrut: false
  });
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 15,
  });

  const deptOptions: Option[] = React.useMemo(() => 
    departments.map(d => ({ label: d.name, value: d.id })),
    [departments]
  );

  const columns = React.useMemo<ColumnDef<GLRow>[]>(
    () => [
      {
        accessorKey: 'noUrut',
        header: '#',
        cell: info => <span className="text-xs text-slate-400">{info.getValue<number>()}</span>,
        aggregatedCell: info => <span className="text-xs text-slate-500 font-bold">{info.getValue<number>()}</span>,
        aggregationFn: 'min',
        size: 40,
      },
      {
        accessorKey: 'entityCode',
        header: t('grid.entityCode'),
        cell: info => <span className="font-mono text-xs">{info.getValue<string>()}</span>,
        size: 80,
      },
      {
        accessorKey: 'fsliName',
        header: t('grid.fsli'),
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
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
        header: t('grid.accountCode'),
        cell: info => <span className="font-mono text-xs text-slate-500">{info.getValue<string>()}</span>,
        size: 100,
      },
      {
        accessorKey: 'glDesc',
        header: t('grid.accountDesc'),
        cell: ({ row, getValue }) => {
          const glDesc = getValue<string>();
          if (row.getIsGrouped()) return <span className="text-xs">{glDesc}</span>;

          const fsliName = row.original.fsliName || "";
          const noGL = row.original.noGL || "";
          const balance = Math.abs(row.original.balance);
          const assignedDeptIds = row.original.assignedDepartmentIds || [];
          
          const assessments = assessmentData?.[fsliName] || {};
          const isQualSignificant = Object.values(assessments).some(v => v === 'High');
          const isKuanSignificant = balance >= pmValue;
          const isInScope = isKuanSignificant || isQualSignificant;

          // Logic: Lini 1 can only access if they own the account or it's unassigned
          const userRole = currentUser?.role?.trim();
          const isLini1 = userRole === 'Line 1';
          const hasAccess = !isLini1 || assignedDeptIds.length === 0 || assignedDeptIds.includes(currentUser?.departmentId || "");

          if (isInScope) {
            if (!hasAccess) {
              return (
                <div className="text-xs text-slate-400 flex items-center gap-1.5 italic">
                  <Lock className="h-2.5 w-2.5" /> {glDesc}
                </div>
              );
            }

            const params = new URLSearchParams({
              fsli: fsliName,
              noGL: noGL,
              glDesc: glDesc
            });
            return (
              <Link 
                to={`/bpm?${params.toString()}`}
                target="_blank"
                className="text-xs text-blue-600 underline hover:text-blue-800 font-medium flex items-center gap-1 group truncate max-w-[180px]"
                title={`Open BPM Workflow for ${glDesc}`}
              >
                {glDesc}
                <ExternalLink className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          }

          return (
            <span className="text-xs truncate max-w-[180px]" title={glDesc}>
              {glDesc}
            </span>
          );
        },
      },
      {
        id: 'departmentOwner',
        header: t('grid.lini1Owner'),
        size: 200,
        cell: ({ row }) => {
          if (row.getIsGrouped()) return null;
          const currentDeptIds = row.original.assignedDepartmentIds || [];

          // Fix: Default to allowing assignment if user data is still loading
          // or if the user is explicitly Admin/Line 2
          const userRole = currentUser?.role?.trim();
          const canAssign = !currentUser || userRole === 'Line 2' || userRole === 'Admin';
          const isDisabled = isReadOnly || !canAssign;

          return (
            <div className="py-1">
              <MultiSelect
                options={deptOptions}
                selected={currentDeptIds}
                onChange={(ids) => onAssignDepartments?.(row.original.noGL, ids)}
                placeholder={t('grid.lini1Owner')}
                disabled={isDisabled}
                className="min-h-7 py-1 text-xs"
              />
            </div>
          );
        }
      },
      {
        id: 'ownerAcceptance',
        header: t('grid.ownerAcceptance'),
        size: 140,
        cell: ({ row }) => {
          if (row.getIsGrouped()) return null;
          
          const currentAcceptance = row.original.ownerAcceptance;
          const noGL = row.original.noGL;
          const assignedDeptIds = row.original.assignedDepartmentIds || [];

          // Check if user can edit owner acceptance:
          // 1. Lini 1 Manager with matching department
          // 2. Admin (any department)
          const userRole = currentUser?.role?.trim();
          const userLevel = currentUser?.level?.trim();
          const isLini1Manager = userRole === 'Line 1' && userLevel === 'Manager';
          const isAdmin = userRole === 'Admin';
          
          const canEdit = !isReadOnly && (
            (isLini1Manager && assignedDeptIds.includes(currentUser?.departmentId || "")) ||
            isAdmin
          );

          return (
            <Select
              disabled={!canEdit}
              value={currentAcceptance || ""}
              onValueChange={(val: "Accepted" | "Rejected") => onOwnerAcceptanceChange?.(noGL, val)}
            >
              <SelectTrigger className={cn(
                "h-7 w-full text-xs px-1 border-none bg-transparent hover:bg-slate-100 transition-colors",
                currentAcceptance === 'Accepted' ? "text-green-600 font-bold bg-green-50" :
                currentAcceptance === 'Rejected' ? "text-red-600 font-bold bg-red-50" :
                "text-slate-300 italic"
              )}>
                <SelectValue placeholder={t('grid.pending')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Accepted" className="text-xs text-green-600 font-bold">✓ Accepted</SelectItem>
                <SelectItem value="Rejected" className="text-xs text-red-600 font-bold">✗ Rejected</SelectItem>
              </SelectContent>
            </Select>
          );
        }
      },
      {
        accessorKey: 'balance',
        header: () => <div className="text-right">{t('grid.balance')}</div>,
        cell: info => {
          const val = info.getValue<number>();
          return (
            <div className={cn(
              "text-right font-mono text-xs",
              Math.abs(val) >= pmValue ? "text-red-600 font-bold" : "text-slate-500"
            )}>
              {val.toLocaleString('id-ID')}
            </div>
          );
        },
      },
      {
        id: 'quantFlag',
        header: () => <div className="text-center bg-orange-50/50 -mx-2 py-1 text-xs">{t('grid.quantHeader')}</div>,
        cell: ({ row }) => {
          const balance = row.getIsGrouped() 
            ? (row.getLeafRows()[0]?.original.fsliBalance || row.getLeafRows().reduce((sum, r) => sum + Math.abs(r.original.balance), 0))
            : Math.abs(row.original.balance);
          const isSignificant = balance >= pmValue;
          return (
            <div className="text-center">
              {isSignificant ? (
                <Badge className="bg-red-600 h-4 px-1.5 text-xs uppercase tracking-tighter">{t('grid.significant')}</Badge>
              ) : (
                <span className="text-slate-300 text-xs font-medium italic">{t('grid.notSignificant')}</span>
              )}
            </div>
          );
        }
      },
      ...QUALITATIVE_RULES.map(rule => ({
        id: `rule-${rule.id}`,
        header: () => (
          <div className="text-xs uppercase tracking-tighter text-slate-400 text-center leading-tight max-w-[60px] mx-auto whitespace-normal">
            {t(rule.key)}
          </div>
        ),
        cell: ({ row }) => {
          if (!row.getIsGrouped()) return <div className="text-center text-slate-200 text-xs">-</div>;
          
          const fsliName = row.getValue('fsliName') as string;
          const currentLevel = assessmentData?.[fsliName]?.[rule.id] || "";
          
          return (
            <Select 
              disabled={isReadOnly}
              value={currentLevel} 
              onValueChange={(val: QualitativeLevel) => onAssessmentChange(fsliName, rule.id, val)}
            >
              <SelectTrigger className={cn(
                "h-7 w-full text-xs px-1 border-none bg-transparent hover:bg-slate-100 transition-colors",
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
        header: t('grid.scope'),
        size: 130,
        cell: ({ row }) => {
          const isGrouped = row.getIsGrouped();
          const fsliName = isGrouped ? row.getValue('fsliName') as string : row.original.fsliName || "";

          const assessments = assessmentData?.[fsliName] || {};
          const isQualSignificant = Object.values(assessments).some(v => v === 'High');

          if (isGrouped) {
            const leaves = row.getLeafRows();
            const groupBalance = leaves[0]?.original.fsliBalance || leaves.reduce((sum, r) => sum + Math.abs(r.original.balance), 0);
            const isKuanSignificant = Math.abs(groupBalance) >= pmValue;
            const isInScope = isKuanSignificant || isQualSignificant;
            return isInScope ? (
              <Badge className="bg-indigo-600 text-xs h-5 px-3 uppercase font-extrabold shadow-sm border-2 border-indigo-200 whitespace-nowrap">
                {t('grid.inScope')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs h-4 px-1.5 opacity-40 whitespace-nowrap">
                {t('grid.outScope')}
              </Badge>
            );
          }

          const isKuanSignificant = Math.abs(row.original.balance) >= pmValue;
          const isInScope = isQualSignificant || isKuanSignificant;

          if (isInScope) {
            return <Badge className="text-xs h-5 px-2 font-bold bg-indigo-600 whitespace-nowrap uppercase">{t('grid.inScope')}</Badge>;
          }
          return <Badge variant="outline" className="text-xs h-4 px-1.5 opacity-40 text-slate-400 whitespace-nowrap uppercase">{t('grid.outScope')}</Badge>;
        }
      },
      {
        id: 'significantApp',
        header: t('table.significantApp'),
        size: 320,
        cell: ({ row }) => {
          if (row.getIsGrouped()) return null;
          const noGL = row.original.noGL || "";
          const fsliName = row.original.fsliName || "";
          
          const assessments = assessmentData?.[fsliName] || {};
          const isQualSignificant = Object.values(assessments).some(v => v === 'High');
          const isKuanSignificant = Math.abs(row.original.balance) >= pmValue;
          const isInScope = isKuanSignificant || isQualSignificant;

          if (!isInScope) return null;

          const currentSelected = selectedApps[noGL] || [];
          const options: Option[] = (applications || []).map(app => ({
            label: app.name,
            value: app.id,
            isWarning: (app.linkedControlCount || 0) === 0
          }));

          return (
            <div className="py-1 px-1">
              <MultiSelect
                placeholder={t('grid.selectApp')}
                options={options}
                selected={currentSelected}
                onChange={(ids) => onAppsChange(noGL, ids)}
                onCreateNew={(name) => onQuickAddApp(name, noGL)}
                disabled={isReadOnly}
                className="min-h-7 py-1 text-xs"
              />
            </div>
          );
        }
      }
    ],
    [t, pmValue, assessmentData, isReadOnly, onAssessmentChange, onOwnerAcceptanceChange, currentUser, onAssignDepartments, applications, selectedApps, onAppsChange, onQuickAddApp, deptOptions]
  );

  const table = useReactTable({
    data: sortedData,
    columns,
    state: {
      grouping,
      expanded,
      columnVisibility,
      sorting,
      pagination,
    },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetExpanded: false, // CRITICAL: Prevent collapse on update
    autoResetPageIndex: false, // CRITICAL: Prevent state update on unmounted component
    getRowId: (row) => row.id, // Stable UUID from database
  });

  const handleExportExcel = () => {
    const rows = table.getRowModel().rows;
    const exportData: any[] = [];

    rows.forEach(row => {
      // Header FSLI
      if (row.getIsGrouped()) {
        const fsliName = row.getValue('fsliName');
        const balance = row.getLeafRows().reduce((sum, r) => sum + r.original.balance, 0);

        // Add a separator row for FSLI
        exportData.push({
          [t('grid.entityCode')]: '',
          [t('grid.fsli')]: `[FSLI] ${fsliName}`,
          [t('grid.accountCode')]: '',
          [t('grid.accountDesc')]: '',
          [t('grid.balance')]: balance,
          [t('grid.quantHeader')]: Math.abs(balance) >= pmValue ? t('grid.significant') : t('grid.notSignificant'),
          [t('grid.lini1Owner')]: '',
          [t('grid.ownerAcceptance')]: '',
          [t('grid.scope')]: t('grid.inScope') // Summary scope
        });

        // Add accounts under this FSLI
        row.getLeafRows().forEach(leaf => {
          const assessments = assessmentData[String(fsliName) || ''] || {};
          const isQualSignificant = Object.values(assessments).some(v => v === 'High');
          const isKuanSignificant = Math.abs(leaf.original.balance) >= pmValue;
          const isInScope = isKuanSignificant || isQualSignificant;
          const assignedDeptIds = leaf.original.assignedDepartmentIds || [];
          const depts = assignedDeptIds.map(id => departments.find(d => d.id === id)?.name).filter(Boolean).join(", ");
          const acceptance = leaf.original.ownerAcceptance || t('grid.pending');

          exportData.push({
            [t('grid.entityCode')]: leaf.original.entityCode,
            [t('grid.fsli')]: leaf.original.fsliName,
            [t('grid.accountCode')]: leaf.original.noGL,
            [t('grid.accountDesc')]: leaf.original.glDesc,
            [t('grid.balance')]: leaf.original.balance,
            [t('grid.quantHeader')]: isKuanSignificant ? t('grid.significant') : t('grid.notSignificant'),
            [t('grid.lini1Owner')]: depts || 'Unassigned',
            [t('grid.ownerAcceptance')]: acceptance,
            [t('grid.scope')]: isInScope ? t('grid.inScope') : t('grid.outScope')
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Significant Accounts");
    
    // Save file
    XLSX.writeFile(workbook, `Significant_Account_Identification_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(t('intake.notifications.exported'));
  };

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-row items-center gap-4 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex-1 min-w-0 flex gap-2 items-center text-[10px] sm:text-xs text-muted-foreground font-medium bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200/50">
          <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="truncate leading-tight">{t('grid.fsliGuidance')}</span>
        </div>
        <div className="flex gap-2 items-center shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportExcel}
            className="h-8 gap-2 text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200 text-[10px] font-bold uppercase tracking-wider shadow-sm hidden sm:flex"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> {t('grid.exportExcel')}
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={onOpenWorkflow}
            className="h-8 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-lg shadow-indigo-100 uppercase tracking-widest font-black text-[10px] px-4"
          >
            <Send className="h-3.5 w-3.5" /> {t('grid.submitForReview')}
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <Table className="relative w-full">
            <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map(header => (
                    <TableHead
                      key={header.id}
                      className="border-r last:border-r-0 h-16 text-xs font-bold uppercase text-slate-500 whitespace-nowrap px-2"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex flex-col gap-1 h-full justify-center">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanFilter() ? (
                            <div className="relative mt-1" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
                              <Filter className="absolute left-1.5 top-1.5 h-2.5 w-2.5 text-slate-300" />
                              <input
                                className="w-full pl-5 pr-1 py-1 text-xs font-normal border rounded"
                                placeholder="Search..."
                                aria-label={`Filter by ${header.column.columnDef.header?.toString() || 'column'}`}
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
                          <span className="text-xs text-slate-400 font-normal">
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
        <div className="p-2 border-t bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm disabled:opacity-30"
              >
                {t('grid.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm disabled:opacity-30"
              >
                {t('grid.next')}
              </Button>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-200/50 px-2 py-1 rounded">
              {t('grid.pageOf', { 
                current: table.getState().pagination.pageIndex + 1, 
                total: table.getPageCount() 
              })}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-4 italic">
            <span>{t('grid.showingRows', { count: table.getRowModel().rows.length })}</span>
            <span className="h-3 w-px bg-slate-200" />
            <span>{t('grid.standardCompliance')}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
