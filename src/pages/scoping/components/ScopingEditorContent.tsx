import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, ShieldCheck } from 'lucide-react';
import { GLDataGrid } from '@/components/scoping/GLDataGrid';
import { ApprovalHistoryTimeline } from '@/components/scoping/ApprovalHistoryTimeline';
import { ScopingHealthDashboard } from '@/components/scoping/ScopingHealthDashboard';
import { useTranslation } from 'react-i18next';
import type { GLRow, MaterialitySimulation, QualitativeLevel, Department, Application } from '@shared/types';

interface ScopingEditorContentProps {
  simState: MaterialitySimulation;
  mergedGlData: GLRow[];
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
}

export function ScopingEditorContent({
  simState,
  mergedGlData,
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
  onOpenWorkflow
}: ScopingEditorContentProps) {
  const { t } = useTranslation('scoping');

  return (
    <div className="flex-1 min-w-0 space-y-6">
      <Tabs defaultValue="worksheet" className="w-full">
        <TabsList className="grid w-full max-w-[550px] grid-cols-3 mb-4">
          <TabsTrigger value="worksheet">{t('approval.tabWorksheet')}</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-3 w-3" /> {t('approval.tabHistory')}
            {simState.history && simState.history.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                {simState.history.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="integrity" className="flex items-center gap-2">
            <ShieldCheck className="h-3 w-3" /> {t('approval.tabIntegrity')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="worksheet" className="space-y-6">
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
          <ScopingHealthDashboard glData={mergedGlData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
