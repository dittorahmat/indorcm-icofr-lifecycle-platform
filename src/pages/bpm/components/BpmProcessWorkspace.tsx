import { useQueryClient } from '@tanstack/react-query';
import { X as XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { BPMDiagramList } from '@/components/bpm/BPMDiagramList';
import { WorkflowPanel } from '@/components/workflow/WorkflowPanel';
import type { BPMWorkflowStatus } from '@shared/types';
import type { useBpmProcessHierarchy } from '../hooks/useBpmProcessHierarchy';
import type { useBpmScopingSelection } from '../hooks/useBpmScopingSelection';

interface BpmProcessWorkspaceProps {
  isMobile: boolean;
  hierarchy: ReturnType<typeof useBpmProcessHierarchy>;
  settings: ReturnType<typeof useBpmScopingSelection>['settings'];
  selectedGLRow: ReturnType<typeof useBpmScopingSelection>['selectedGLRow'];
  onOpenDiagram: (diagramId: string, subProcess: string, bpmProcessId?: string) => void;
  onCreateDiagram: (name: string) => void;
  onOpenWorksheet: (id: string, name: string) => void;
  onDeleteProcess: (id: string, name: string) => void;
}

/** The process tree, its diagram list, and the workflow panel for the selected
 *  process. All state comes from `useBpmProcessHierarchy`. */
export function BpmProcessWorkspace({
  isMobile,
  hierarchy,
  settings,
  selectedGLRow,
  onOpenDiagram,
  onCreateDiagram,
  onOpenWorksheet,
  onDeleteProcess,
}: BpmProcessWorkspaceProps) {
  const { t } = useTranslation(['bpm', 'common']);
  const queryClient = useQueryClient();
  const { selectedProcess, setSelectedProcess } = hierarchy;

  return (
    <ResizablePanelGroup
      direction={isMobile ? 'vertical' : 'horizontal'}
      className="min-h-[320px] md:min-h-[600px] border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xl shadow-slate-100 max-w-full"
    >
      <ResizablePanel defaultSize={selectedProcess ? 70 : 100} minSize={30}>
        <BPMDiagramList
          bpmLoading={hierarchy.bpmLoading}
          hierarchicalProcesses={hierarchy.hierarchicalProcesses}
          diagrams={hierarchy.diagrams}
          settings={settings}
          selectedGLRow={selectedGLRow}
          selectedProcessId={selectedProcess?.id}
          onSelectProcess={setSelectedProcess}
          onOpenDiagram={onOpenDiagram}
          onCreateDiagram={onCreateDiagram}
          onOpenWorksheet={onOpenWorksheet}
          onDeleteProcess={onDeleteProcess}
          searchTerm={hierarchy.searchTerm}
          selectedProcessIds={hierarchy.selectedProcessIds}
          onToggleSelect={hierarchy.toggleSelectProcess}
          onToggleSelectAll={hierarchy.toggleSelectAll}
          expandedProcessIds={hierarchy.expandedProcessIds}
          onToggleExpand={hierarchy.toggleExpandProcess}
          onExpandAll={hierarchy.expandAll}
          onCollapseAll={hierarchy.collapseAll}
          onOpenMigrationModal={() => hierarchy.setIsMigrationModalOpen(true)}
        />
      </ResizablePanel>

      {selectedProcess && (
        <>
          <ResizableHandle withHandle className="hidden md:flex" />
          <ResizablePanel defaultSize={30} minSize={20} className="bg-slate-50/30">
            <div className="h-full flex flex-col min-h-0 overflow-y-auto">
              <div className="p-4 border-b bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-wrap">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('selectedProcess')}</span>
                  <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-full">{selectedProcess.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('selectedProcessClose')}
                  className="h-10 w-10 min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0 rounded-md shrink-0"
                  onClick={() => setSelectedProcess(null)}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              <WorkflowPanel
                entityType="BPM"
                entityId={selectedProcess.id}
                currentStatus={selectedProcess.workflowStatus || 'Draft'}
                history={selectedProcess.workflowHistory || []}
                className="flex-1 border-none shadow-none rounded-none"
                onStatusChange={(newStatus) => {
                  queryClient.invalidateQueries({ queryKey: ['bpm-processes'] });
                  setSelectedProcess((prev) =>
                    prev ? { ...prev, workflowStatus: newStatus as BPMWorkflowStatus } : null,
                  );
                }}
              />
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
