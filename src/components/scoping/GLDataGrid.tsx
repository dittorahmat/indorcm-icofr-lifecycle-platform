import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  GroupingState,
  VisibilityState,
} from '@tanstack/react-table';
import { GLRow, QualitativeLevel, Department, User, Application } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Filter, FileSpreadsheet, Info, ExternalLink, Lock, Building2, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { Link } from 'react-router-dom';
import { DepartmentPicker } from './DepartmentPicker';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { useTranslation } from 'react-i18next';

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
}

const QUALITATIVE_RULES = [
  { id: 1, label: "Fraud Risk" },
  { id: 2, label: "Transaction Volume" },
  { id: 3, label: "Complexity" },
  { id: 4, label: "Account Characteristics" },
  { id: 5, label: "Estimation Complexity" },
  { id: 6, label: "Significant Contingent Liabilities" },
  { id: 7, label: "Related Party Transactions" },
  { id: 8, label: "Volatility" },
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
  onQuickAddApp
}: GLDataGridProps) {
  const { t } = useTranslation('scoping');
  
  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  // Pre-sort data: group by fsliName, find min noUrut per group, then sort
  const sortedData = React.useMemo(() => {
    // Group by fsliName
    const groups = new Map<string, GLRow[]>();
    data.forEach(row => {
      const fsliName = row.fsliName || '';
      if (!groups.has(fsliName)) {
        groups.set(fsliName, []);
      }
      groups.get(fsliName)!.push(row);
    });

    // Sort GL within each group by noUrut ascending
    groups.forEach(rows => {
      rows.sort((a, b) => a.noUrut - b.noUrut);
    });

    // Convert to array and sort groups by min noUrut, then by fsliName alphabetically
    const sortedGroups = Array.from(groups.entries())
      .map(([fsliName, rows]) => ({
        fsliName,
        minNoUrut: Math.min(...rows.map(r => r.noUrut)),
        rows
      }))
      .sort((a, b) => {
        if (a.minNoUrut !== b.minNoUrut) {
          return a.minNoUrut - b.minNoUrut;
        }
        // If min noUrut is the same, sort by fsliName alphabetically
        return a.fsliName.localeCompare(b.fsliName);
      });

    // Flatten back to single array
    return sortedGroups.flatMap(g => g.rows);
  }, [data]);

  const [grouping, setGrouping] = React.useState<GroupingState>(['fsliName']);
  const [expanded, setExpanded] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    noUrut: false
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
        cell: info => <span className="text-[9px] text-slate-400">{info.getValue<number>()}</span>,
        size: 40,
      },
      {
        accessorKey: 'entityCode',
        header: 'Entity Code',
        cell: info => <span className="font-mono text-[10px]">{info.getValue<string>()}</span>,
        size: 80,
      },
      {
        accessorKey: 'fsliName',
        header: 'FSLI',
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
        header: 'Account Code',
        cell: info => <span className="font-mono text-[9px] text-slate-500">{info.getValue<string>()}</span>,
        size: 100,
      },
      {
        accessorKey: 'glDesc',
        header: 'Account Description',
        cell: ({ row, getValue }) => {
          const glDesc = getValue<string>();
          if (row.getIsGrouped()) return <span className="text-[10px]">{glDesc}</span>;

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
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5 italic">
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
                className="text-[10px] text-blue-600 underline hover:text-blue-800 font-medium flex items-center gap-1 group truncate max-w-[180px]"
                title={`Open BPM Workflow for ${glDesc}`}
              >
                {glDesc}
                <ExternalLink className="h-2 w-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          }

          return (
            <span className="text-[10px] truncate max-w-[180px]" title={glDesc}>
              {glDesc}
            </span>
          );
        },
      },
      {
        id: 'departmentOwner',
        header: 'Lini 1 Owner',
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
                placeholder={t('table.assignDept', 'Assign Dept...')}
                disabled={isDisabled}
                className="min-h-7 py-1 text-[10px]"
              />
            </div>
          );
        }
      },
      {
        id: 'ownerAcceptance',
        header: 'Owner Acceptance',
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
                "h-7 w-full text-[9px] px-1 border-none bg-transparent hover:bg-slate-100 transition-colors",
                currentAcceptance === 'Accepted' ? "text-green-600 font-bold bg-green-50" :
                currentAcceptance === 'Rejected' ? "text-red-600 font-bold bg-red-50" :
                "text-slate-300 italic"
              )}>
                <SelectValue placeholder="Pending" />
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
        header: () => <div className="text-center bg-orange-50/50 -mx-2 py-1 text-[9px]">Quantitative</div>,
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
          const currentLevel = assessmentData?.[fsliName]?.[rule.id] || "";
          
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
        size: 130,
        cell: ({ row }) => {
          const isGrouped = row.getIsGrouped();
          const fsliName = isGrouped ? row.getValue('fsliName') as string : row.original.fsliName || "";

          const assessments = assessmentData?.[fsliName] || {};
          const isQualSignificant = Object.values(assessments).some(v => v === 'High');

          if (isGrouped) {
            const leaves = row.getLeafRows();
            const isKuanSignificant = leaves.some(lr => Math.abs(lr.original.balance) >= pmValue);
            const isInScope = isKuanSignificant || isQualSignificant;
            return isInScope ? (
              <Badge className="bg-indigo-600 text-[10px] h-5 px-3 uppercase font-extrabold shadow-sm border-2 border-indigo-200 whitespace-nowrap">
                In Scope
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 opacity-40 whitespace-nowrap">
                Out Scope
              </Badge>
            );
          }

          const isKuanSignificant = Math.abs(row.original.balance) >= pmValue;
          const isInScope = isQualSignificant || isKuanSignificant;

          if (isInScope) {
            return <Badge className="text-[9px] h-5 px-2 font-bold bg-indigo-600 whitespace-nowrap uppercase">In Scope</Badge>;
          }
          return <Badge variant="outline" className="text-[9px] h-4 px-1.5 opacity-40 text-slate-400 whitespace-nowrap uppercase">Out Scope</Badge>;
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
                placeholder={t('table.selectApp', 'Select application...')}
                options={options}
                selected={currentSelected}
                onChange={(ids) => onAppsChange(noGL, ids)}
                onCreateNew={(name) => onQuickAddApp(name, noGL)}
                disabled={isReadOnly}
                className="min-h-7 py-1 text-[10px]"
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
    },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    autoResetExpanded: false, // CRITICAL: Prevent collapse on update
    getRowId: (row) => row.noGL || `row-${row.noUrut}`, // Stable IDs
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
          'Entity Code': '',
          'FSLI': `[FSLI] ${fsliName}`,
          'Account Code': '',
          'Account Description': '',
          'Balance': balance,
          'Quantitative': Math.abs(balance) >= pmValue ? 'Significant' : 'Not Significant',
          'Department Owner': '',
          'Owner Acceptance': '',
          'Scope': 'In Scope' // Summary scope
        });

        // Add accounts under this FSLI
        row.getLeafRows().forEach(leaf => {
          const assessments = assessmentData[String(fsliName) || ''] || {};
          const isQualSignificant = Object.values(assessments).some(v => v === 'High');
          const isKuanSignificant = Math.abs(leaf.original.balance) >= pmValue;
          const isInScope = isKuanSignificant || isQualSignificant;
          const assignedDeptIds = leaf.original.assignedDepartmentIds || [];
          const depts = assignedDeptIds.map(id => departments.find(d => d.id === id)?.name).filter(Boolean).join(", ");
          const acceptance = leaf.original.ownerAcceptance || 'Pending';

          exportData.push({
            'Entity Code': leaf.original.entityCode,
            'FSLI': leaf.original.fsliName,
            'Account Code': leaf.original.noGL,
            'Account Description': leaf.original.glDesc,
            'Balance': leaf.original.balance,
            'Quantitative': isKuanSignificant ? 'Significant' : 'Not Significant',
            'Department Owner': depts || 'Unassigned',
            'Owner Acceptance': acceptance,
            'Scope': isInScope ? 'In Scope' : 'Out Scope'
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Significant Accounts");
    
    // Save file
    XLSX.writeFile(workbook, `Significant_Account_Identification_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Excel exported successfully");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2 items-center text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>FSLI level assessment affects all child accounts.</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExportExcel}
          className="gap-2 text-green-700 hover:text-green-800 hover:bg-green-50 border-green-200"
        >
          <FileSpreadsheet className="h-4 w-4" /> Export as Excel
        </Button>
      </div>

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
                        <div className="flex flex-col gap-1 h-full justify-center">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanFilter() ? (
                            <div className="relative mt-1" onClick={e => e.stopPropagation()}>
                              <Filter className="absolute left-1.5 top-1.5 h-2.5 w-2.5 text-slate-300" />
                              <input
                                className="w-full pl-5 pr-1 py-1 text-[9px] font-normal border rounded"
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
    </div>
  );
});
