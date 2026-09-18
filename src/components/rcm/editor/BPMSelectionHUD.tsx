import React from 'react';
import { Panel } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface BPMSelectionHUDProps {
  selectedNode?: Node;
  selectedEdge?: Edge;
  isLocked: boolean;
  onToggleLock: (nodeId: string) => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

export const BPMSelectionHUD: React.FC<BPMSelectionHUDProps> = ({
  selectedNode,
  selectedEdge,
  isLocked,
  onToggleLock,
  onDeleteSelected,
  onClearSelection,
}) => {
  const { t } = useTranslation(['bpm']);

  if (!selectedNode && !selectedEdge) return null;

  return (
    <Panel position="bottom-center" className="mb-4 pointer-events-auto">
      <div className="flex items-center gap-3 bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {t('bpm:editor.selectionHud.selected', { defaultValue: 'Selected' })}:
          </span>
          {selectedNode && (
            <>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border",
                  selectedNode.type === 'swimlane'
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                )}
              >
                {selectedNode.type === 'swimlane'
                  ? t('bpm:editor.selectionHud.swimlane', { defaultValue: 'Swimlane' })
                  : `${t('bpm:editor.selectionHud.node', { defaultValue: 'Node' })}: ${selectedNode.type}`}
              </Badge>
              <span className="text-xs font-bold max-w-[200px] truncate text-slate-100">
                {selectedNode.type === 'swimlane'
                  ? (selectedNode.data?.department || selectedNode.data?.label || selectedNode.id)
                  : (selectedNode.data?.label || selectedNode.id)}
              </span>
            </>
          )}
          {selectedEdge && (
            <>
              <Badge
                variant="outline"
                className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-amber-500/20 text-amber-300 border-amber-500/40"
              >
                {t('bpm:editor.selectionHud.edge', { defaultValue: 'Connection' })}
              </Badge>
              <span className="text-xs font-mono font-bold text-slate-100">
                {selectedEdge.source} ➔ {selectedEdge.target}
              </span>
            </>
          )}
        </div>

        <Separator orientation="vertical" className="h-4 bg-slate-700" />

        <div className="flex items-center gap-1.5">
          {selectedNode && !isLocked && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleLock(selectedNode.id)}
              className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg gap-1.5"
              title={selectedNode.data?.isLocked ? t('bpm:editor.selectionHud.unlock', { defaultValue: 'Unlock' }) : t('bpm:editor.selectionHud.lock', { defaultValue: 'Lock' })}
            >
              {selectedNode.data?.isLocked ? (
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span className="text-[10px] font-bold uppercase">
                {selectedNode.data?.isLocked ? t('bpm:editor.selectionHud.unlock', { defaultValue: 'Unlock' }) : t('bpm:editor.selectionHud.lock', { defaultValue: 'Lock' })}
              </span>
            </Button>
          )}

          {!isLocked && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onDeleteSelected}
              className="h-7 px-2.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg gap-1.5 font-bold shadow-sm"
              title={`${t('bpm:editor.selectionHud.delete', { defaultValue: 'Delete' })} (${t('bpm:editor.selectionHud.delKey', { defaultValue: 'Del' })})`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase tracking-wider">
                {t('bpm:editor.selectionHud.delete', { defaultValue: 'Delete' })}
              </span>
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            onClick={onClearSelection}
            className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg ml-1"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Panel>
  );
};
