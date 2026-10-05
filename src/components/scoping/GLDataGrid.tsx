import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  flexRender,
  GroupingState,
  VisibilityState,
  SortingState,
} from '@tanstack/react-table';
import { GLRow, QualitativeLevel, Department, User, Application } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Option } from '@/components/ui/multi-select';
import { useTranslation } from 'react-i18next';
import { sortGLHierarchically } from '@/lib/compliance-utils';
import { buildGLDataGridColumns } from './GLDataGridColumns';
import { GLDataGridToolbar } from './GLDataGridToolbar';
import { MobileDesktopBanner } from '@/components/layout/MobileDesktopBanner';

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
  const { t } = useTranslation(['scoping', 'common']);
  const [showFullTable, setShowFullTable] = React.useState(false);
  
  const { data: currentUser } = useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api<User>('/api/user/me'),
  });

  // Hierarchical sorting based on noUrut (Standard: SK-5/2024 Table 5)
  const sortedData = React.useMemo(() => sortGLHierarchically(data), [data]);

  const uniqueEntities = React.useMemo(() => {
    return Array.from(new Set(data.map(r => r.entityCode).filter(Boolean)));
  }, [data]);

  const hasParentChild = React.useMemo(() => {
    return data.some(r => r.parentEntityCode && r.parentEntityCode !== r.entityCode);
  }, [data]);

  const defaultGrouping = React.useMemo<GroupingState>(() => {
    if (uniqueEntities.length <= 1) {
      return ['fsliName'];
    }
    if (hasParentChild) {
      return ['fsliName', 'parentEntityCode', 'entityCode'];
    }
    return ['fsliName', 'entityCode'];
  }, [uniqueEntities, hasParentChild]);

  const [grouping, setGrouping] = React.useState<GroupingState>(defaultGrouping);

  React.useEffect(() => {
    setGrouping(defaultGrouping);
  }, [defaultGrouping]);
  const [expanded, setExpanded] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'noUrut', desc: false }
  ]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    noUrut: false,
    parentEntityCode: false
  });

  const deptOptions: Option[] = React.useMemo(() => 
    departments.map(d => ({ label: d.name, value: d.id })),
    [departments]
  );

  const columns = React.useMemo(
    () => buildGLDataGridColumns({
      t,
      pmValue,
      assessmentData,
      isReadOnly,
      onAssessmentChange,
      onOwnerAcceptanceChange,
      currentUser,
      onAssignDepartments,
      applications,
      selectedApps,
      onAppsChange,
      onQuickAddApp,
      deptOptions,
    }),
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
    },
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    autoResetExpanded: false, // CRITICAL: Prevent collapse on update
    getRowId: (row) => row.id, // Stable UUID from database
  });

  const handleExportExcel = () => {
    const rows = table.getRowModel().rows;
    const exportData: any[] = [];

    rows.forEach(row => {
      // Header FSLI
      if (row.getIsGrouped()) {
        const fsliName = row.getValue('fsliName');
        const leafRows = row.getLeafRows();
        const groupExplicitTotal = leafRows[0]?.original.fsliBalance;
        const balance = (groupExplicitTotal !== undefined && groupExplicitTotal !== null && groupExplicitTotal !== 0)
          ? groupExplicitTotal
          : leafRows.reduce((sum, r) => sum + r.original.balance, 0);

        const assessments = assessmentData[String(fsliName) || ''] || {};
        const isQualSignificant = Object.values(assessments).some(v => v === 'High');
        const isKuanSignificant = Math.abs(balance) >= pmValue;
        const isFSLIInScope = isQualSignificant || isKuanSignificant;

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
          [t('grid.scope')]: isFSLIInScope ? t('grid.inScope') : t('grid.outScope')
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
    <div className="flex flex-col flex-1 min-h-0 min-w-0 space-y-4">
      <GLDataGridToolbar
        onExportExcel={handleExportExcel}
        onOpenWorkflow={onOpenWorkflow}
      />
      <MobileDesktopBanner recordCount={data.length} />

      <div className="md:hidden space-y-3" data-testid="gl-grid-mobile-cards">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {t('common:mobile.summary', { defaultValue: 'Ringkasan' })} · {sortedData.length}
        </p>
        {sortedData.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-slate-50/50 p-4 text-center text-xs font-medium text-slate-500">
            {t('grid.empty', { defaultValue: 'Belum ada data GL.' })}
          </p>
        ) : (
          <>
            {sortedData.slice(0, 10).map((row) => {
              const isSignificant = Math.abs(row.balance ?? 0) >= pmValue;
              return (
                <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                      {row.noGL || '-'}
                    </span>
                    <span className={cn(
                      "text-xs font-bold px-2 py-0.5 rounded border",
                      isSignificant ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
                    )}>
                      {isSignificant ? t('grid.significant', { defaultValue: 'Signifikan' }) : t('grid.notSignificant', { defaultValue: 'Tidak Signifikan' })}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{row.glDesc || row.fsliName || '-'}</p>
                  <p className="text-xs font-mono font-bold text-primary">
                    {(row.balance ?? 0).toLocaleString('id-ID')}
                  </p>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFullTable((v) => !v)}
              aria-expanded={showFullTable}
              className="w-full min-h-[44px] text-xs font-bold gap-2 bg-white"
            >
              {showFullTable ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showFullTable
                ? t('common:mobile.hideFullTable', { defaultValue: 'Sembunyikan Tabel Penuh' })
                : t('common:mobile.showFullTable', { defaultValue: 'Lihat Tabel Penuh' })}
            </Button>
          </>
        )}
      </div>

      <div className={`rounded-md border bg-white shadow-sm overflow-hidden flex-1 min-h-0 flex-col w-full max-w-full ${showFullTable ? 'flex' : 'hidden'} md:flex`}>
        <div className="overflow-auto overflow-x-auto overscroll-x-contain touch-pan-x max-w-full flex-1 min-h-0 w-full table-scroll-hint">
          <Table noWrapper className="relative w-full min-w-[880px]">
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
                                className="w-full pl-5 pr-1 py-2 sm:py-1 min-h-[44px] sm:min-h-0 text-base sm:text-xs font-normal border rounded"
                                placeholder={t('grid.searchPlaceholder', { defaultValue: 'Search...' })}
                                aria-label={t('grid.filterByColumn', { defaultValue: `Filter by ${header.column.columnDef.header?.toString() || 'column'}` })}
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
              {table.getRowModel().rows.map(row => {
                const classification = !row.getIsGrouped() && row.original?.scopeClassification;
                const rowBgClass = classification === 'above-pm'
                  ? "bg-emerald-50/70 text-emerald-950 dark:bg-emerald-950/20 hover:bg-emerald-100/50"
                  : classification === 'two-thirds'
                  ? "bg-amber-50/70 text-amber-950 dark:bg-amber-950/20 hover:bg-amber-100/50"
                  : classification === 'qualitative'
                  ? "bg-yellow-50/70 text-yellow-950 dark:bg-yellow-950/20 hover:bg-yellow-100/50"
                  : "";

                return (
                  <TableRow 
                    key={row.id} 
                    className={cn(
                      "hover:bg-slate-50/50 transition-colors h-8",
                      row.getIsGrouped() ? "bg-slate-100/50 font-bold" : "border-b",
                      rowBgClass
                    )}
                  >
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell 
                        key={cell.id} 
                        className={cn(
                          "border-r last:border-r-0 py-0 px-2",
                          index === 0 && classification === 'above-pm' && "border-l-4 border-l-emerald-500",
                          index === 0 && classification === 'two-thirds' && "border-l-4 border-l-amber-500",
                          index === 0 && classification === 'qualitative' && "border-l-4 border-l-yellow-500"
                        )}
                      >
                        {cell.column.id === 'fsliName' && row.getIsGrouped() ? (
                          <div className="flex items-center gap-2">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            <span className="text-xs text-slate-400 font-normal">
                              ({row.getLeafRows().length})
                            </span>
                          </div>
                        ) : cell.getIsPlaceholder() || (cell.getIsGrouped() && cell.column.id !== 'fsliName') ? null : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
});
