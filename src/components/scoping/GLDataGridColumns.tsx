import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { GLRow, QualitativeLevel, Department, User, Application } from '@shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Lock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { MultiSelect, Option } from '@/components/ui/multi-select';
import { formatIDRPlain } from '@/components/reports/dod/dod-format';
import { TFunction } from 'i18next';
import { can } from '@shared/entity-authority';
import { isAccountInScope, isAccountQuantitativelySignificant } from '@shared/scoping-materiality';

export const QUALITATIVE_RULES = [
  { id: 1, key: "qualitativeRules.1" },
  { id: 2, key: "qualitativeRules.2" },
  { id: 3, key: "qualitativeRules.3" },
  { id: 4, key: "qualitativeRules.4" },
  { id: 5, key: "qualitativeRules.5" },
  { id: 6, key: "qualitativeRules.6" },
  { id: 7, key: "qualitativeRules.7" },
  { id: 8, key: "qualitativeRules.8" },
];

export interface ColumnBuilderParams {
  t: TFunction;
  pmValue: number;
  assessmentData: Record<string, Record<number, QualitativeLevel>>;
  isReadOnly: boolean;
  onAssessmentChange: (fsliName: string, ruleId: number, level: QualitativeLevel) => void;
  onOwnerAcceptanceChange?: (noGL: string, acceptance: "Accepted" | "Rejected") => void;
  currentUser?: User;
  onAssignDepartments?: (accountName: string, departmentIds: string[]) => void;
  applications: (Application & { linkedControlCount?: number })[];
  selectedApps: Record<string, string[]>;
  onAppsChange?: (accountCode: string, appIds: string[]) => void;
  onQuickAddApp?: (name: string, accountCode: string) => Promise<void>;
  deptOptions: Option[];
}

export function buildGLDataGridColumns({
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
}: ColumnBuilderParams): ColumnDef<GLRow>[] {
  return [
    {
      accessorKey: 'noUrut',
      header: '#',
      cell: info => <span className="text-xs text-slate-400">{info.getValue<number>()}</span>,
      aggregatedCell: info => <span className="text-xs text-slate-500 font-bold">{info.getValue<number>()}</span>,
      aggregationFn: 'min',
      size: 40,
    },
    {
      accessorKey: 'parentEntityCode',
      header: t('grid.parentEntityCode', 'Parent Entity'),
      cell: info => <span className="font-mono text-xs">{info.getValue<string>()}</span>,
      size: 80,
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
      cell: ({ row, getValue }) => {
        const isGrouped = row.getIsGrouped();
        if (isGrouped) {
          const groupCol = row.groupingColumnId;
          const groupVal = row.getValue(groupCol) as string;
          
          let displayVal = groupVal || '';
          if (groupCol === 'parentEntityCode') {
            displayVal = `${t('grid.parentEntity', 'Parent Entity')}: ${groupVal}`;
          } else if (groupCol === 'entityCode') {
            displayVal = `${t('grid.entity', 'Entity')}: ${groupVal}`;
          } else if (groupCol === 'fsliName') {
            displayVal = groupVal;
          }

          const depth = row.depth;
          const mlClass = depth === 1 ? 'ml-4' : depth === 2 ? 'ml-8' : '';

          return (
            <div className={cn("flex items-center gap-2 font-bold text-xs text-slate-700", mlClass)}>
              {row.getCanExpand() && (
                <button onClick={row.getToggleExpandedHandler()} className="cursor-pointer">
                  {row.getIsExpanded() ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
              )}
              <span className="truncate max-w-[250px]">{displayVal}</span>
            </div>
          );
        }

        const depth = row.depth;
        const mlClass = depth === 1 ? 'ml-4' : depth === 2 ? 'ml-8' : depth === 3 ? 'ml-12' : '';
        return (
          <div className={cn("flex items-center gap-2 font-medium text-xs text-slate-500", mlClass)}>
            <span className="truncate max-w-[150px]">{getValue<string>() || '-'}</span>
          </div>
        );
      },
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
        const assignedDeptIds = row.original.assignedDepartmentIds || [];
        
        const isInScope = isAccountInScope(row.original, pmValue);

        // Line 1 sees only its own department's accounts; every other role sees the consolidated view.
        const hasConsolidatedAccess = can(currentUser?.role, 'scoping:view-all-departments');
        const hasAccess =
          hasConsolidatedAccess ||
          assignedDeptIds.length === 0 ||
          assignedDeptIds.includes(currentUser?.departmentId || "");

        if (isInScope) {
          if (!hasAccess) {
            return (
              <div className="text-xs text-slate-400 flex items-center gap-1.5 font-normal">
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
      accessorKey: 'balance',
      header: () => <div className="text-right">{t('grid.balance')}</div>,
      aggregationFn: 'sum',
      cell: ({ row, getValue }) => {
        let val = getValue<number>() || 0;
        if (row.getIsGrouped() && row.groupingColumnId === 'fsliName') {
          const leafRows = row.getLeafRows();
          const groupExplicitTotal = leafRows[0]?.original.fsliBalance;
          if (groupExplicitTotal !== undefined && groupExplicitTotal !== null && groupExplicitTotal !== 0) {
            val = groupExplicitTotal;
          }
        }
        return (
          <div className={cn(
            "text-right font-mono text-xs",
            row.getIsGrouped() ? "font-bold text-slate-700" : (isAccountQuantitativelySignificant(row.original, pmValue) ? "text-red-600 font-bold" : "text-slate-500")
          )}>
            {formatIDRPlain(val)}
          </div>
        );
      },
    },
    {
      id: 'quantFlag',
      header: () => <div className="text-center bg-orange-50/50 -mx-2 py-1 text-xs">{t('grid.quantHeader')}</div>,
      aggregationFn: (_columnId, leafRows) =>
        leafRows.some((leaf) => isAccountQuantitativelySignificant(leaf.original, pmValue)),
      cell: ({ row, getValue }) => {
        const isSignificant = row.getIsGrouped()
          ? getValue<boolean>()
          : isAccountQuantitativelySignificant(row.original, pmValue);
        return (
          <div className="text-center">
            {isSignificant ? (
              <Badge className="bg-red-600 h-4 px-1.5 text-xs uppercase tracking-tighter">{t('grid.significant')}</Badge>
            ) : (
              <span className="text-slate-300 text-xs font-medium">{t('grid.notSignificant')}</span>
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
      cell: ({ row }: { row: any }) => {
        if (!row.getIsGrouped()) return <div className="text-center text-slate-200 text-xs">-</div>;
        
        const fsliName = row.getValue('fsliName') as string;
        const currentLevel = assessmentData?.[fsliName]?.[rule.id] || "Low";
        
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
              currentLevel === 'Low' ? "text-green-600 bg-green-50" : "text-slate-300 font-normal"
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
      aggregationFn: (columnId, leafRows) => {
        const groupExplicitTotal = leafRows[0]?.original.fsliBalance;
        const isGroupKuanSignificant = (groupExplicitTotal !== undefined && groupExplicitTotal !== null && groupExplicitTotal !== 0)
          ? Math.abs(groupExplicitTotal) >= pmValue
          : leafRows.some(row => Math.abs(row.original.balance) >= pmValue);
          
        const fsliName = leafRows[0]?.original.fsliName || "";
        const assessments = assessmentData?.[fsliName] || {};
        const isQualSignificant = Object.values(assessments).some(v => v === 'High');
        
        return isQualSignificant || isGroupKuanSignificant;
      },
      cell: ({ row, getValue }) => {
        const isInScope = row.getIsGrouped()
          ? getValue<boolean>()
          : (() => {
              const classification = row.original?.scopeClassification;
              return classification && classification !== 'out-of-scope';
            })();

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
    },
    {
      id: 'significantApp',
      header: t('table.significantApp'),
      size: 320,
      cell: ({ row }) => {
        if (row.getIsGrouped()) return null;
        const noGL = row.original.noGL || "";
        
        const isInScope = isAccountInScope(row.original, pmValue);

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
              onChange={(ids) => onAppsChange?.(noGL, ids)}
              onCreateNew={onQuickAddApp ? (name) => onQuickAddApp(name, noGL) : undefined}
              disabled={isReadOnly}
              className="min-h-7 py-1 text-xs"
            />
          </div>
        );
      }
    },
    {
      id: 'departmentOwner',
      header: t('grid.lini1Owner'),
      size: 200,
      cell: ({ row }) => {
        if (row.getIsGrouped()) return null;
        const currentDeptIds = row.original.assignedDepartmentIds || [];

        const canAssign = can(currentUser?.role, 'scoping:allocate-departments');
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

        const userRole = currentUser?.role;
        const userLevel = currentUser?.level?.trim();
        const canAccept = can(userRole, 'scoping:accept-ownership');
        const canAcceptAnyDepartment = can(userRole, 'scoping:accept-ownership-any-department');
        const ownsDepartment =
          userLevel === 'Manager' && assignedDeptIds.includes(currentUser?.departmentId || '');

        const canEdit = !isReadOnly && canAccept && (canAcceptAnyDepartment || ownsDepartment);

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
              "text-slate-300 font-normal"
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
    }
  ];
}
