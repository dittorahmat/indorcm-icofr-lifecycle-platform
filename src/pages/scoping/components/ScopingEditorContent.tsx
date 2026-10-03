import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, ShieldCheck, Loader2 } from 'lucide-react';
import { GLDataGrid } from '@/components/scoping/GLDataGrid';
import { ApprovalHistoryTimeline } from '@/components/scoping/ApprovalHistoryTimeline';
import { ScopingHealthDashboard } from '@/components/scoping/ScopingHealthDashboard';
import { useTranslation } from 'react-i18next';
import { EntityTreeFilter } from './EntityTreeFilter';
import type { EntityNode } from '../utils/hierarchy-utils';
import type { GLRow, MaterialitySimulation, QualitativeLevel, Department, Application } from '@shared/types';

interface ScopingEditorContentProps {
  simState: MaterialitySimulation;
  mergedGlData: GLRow[];
  entityHierarchy: EntityNode[];
  selectedEntityCodes: string[];
  onEntitySelectionChange: (codes: string[]) => void;
  omValue: number;
  pmValue: number;
  isLocked: boolean;
  departments: Department[];
  applications: Application[];
  selectedApps: Record<string, string[]>;
  onAssessmentChange: (fsliName: string, ruleId: number, level: QualitativeLevel) => void;
  onOwnerAcceptanceChange: (noGL: string, acceptance: "Accepted" | "Rejected") => void;
  onAssignDepartments: (accountName: string, departmentIds: string[]) => void;
  onAppsChange: (accountCode: string, appIds: string[]) => void;
  onQuickAddApp: (name: string, accountCode: string) => Promise<void>;
  onOpenWorkflow?: () => void;
  scopingCompliance?: any;
  isRecalculating?: boolean;
}

export function ScopingEditorContent({
  simState,
  mergedGlData,
  entityHierarchy,
  selectedEntityCodes,
  onEntitySelectionChange,
  omValue,
  pmValue,
  isLocked,
  departments,
  applications,
  selectedApps,
  onAssessmentChange,
  onOwnerAcceptanceChange,
  onAssignDepartments,
  onAppsChange,
  onQuickAddApp,
  onOpenWorkflow,
  scopingCompliance,
  isRecalculating = false
}: ScopingEditorContentProps) {
  const { t } = useTranslation('scoping');

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 space-y-4 relative">
      {isRecalculating && (
        <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center gap-3 rounded-lg transition-all duration-200">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            {t('params.recalculating', 'Recalculating scoping compliance...')}
          </p>
        </div>
      )}
      <Tabs defaultValue="worksheet" className="flex flex-col flex-1 min-h-0 w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4 shrink-0 min-w-0">
          <TabsList className="grid w-full max-w-[550px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-slate-100/50 p-1 border border-slate-200 rounded-lg min-w-0 min-h-[44px]">
            <TabsTrigger value="worksheet" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest min-w-0 truncate">{t('approval.tabWorksheet')}</TabsTrigger>
            <TabsTrigger value="history" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest min-w-0">
              <History className="h-3 w-3 shrink-0" /> <span className="truncate">{t('approval.tabHistory')}</span>
              {simState.history && simState.history.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs font-black shrink-0">
                  {simState.history.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="integrity" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest min-w-0">
              <ShieldCheck className="h-3 w-3 shrink-0" /> <span className="truncate">{t('approval.tabIntegrity')}</span>
            </TabsTrigger>
          </TabsList>

          <EntityTreeFilter 
            hierarchy={entityHierarchy}
            selectedCodes={selectedEntityCodes}
            onSelectionChange={onEntitySelectionChange}
          />
        </div>


        <TabsContent value="worksheet" className="flex-grow min-h-0 min-w-0 flex flex-col space-y-4 mt-0">
          <GLDataGrid
            data={mergedGlData}
            assessmentData={simState.assessmentData || {}}
            omValue={omValue}
            pmValue={pmValue}
            onAssessmentChange={onAssessmentChange}
            onOwnerAcceptanceChange={onOwnerAcceptanceChange}
            isReadOnly={isLocked}
            departments={departments}
            onAssignDepartments={onAssignDepartments}
            applications={applications}
            selectedApps={selectedApps}
            onAppsChange={onAppsChange}
            onQuickAddApp={onQuickAddApp}
            onOpenWorkflow={onOpenWorkflow}
          />
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" /> {t('approval.tabHistory')} & Feedback
              </CardTitle>
              <CardDescription>Track all actions and comments for this materiality baseline.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ApprovalHistoryTimeline history={simState.history} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrity" className="space-y-6">
          <ScopingHealthDashboard glData={mergedGlData} scopingCompliance={scopingCompliance} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
