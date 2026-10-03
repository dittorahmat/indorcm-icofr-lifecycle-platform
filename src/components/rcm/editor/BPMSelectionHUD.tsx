import React, { useEffect, useState } from 'react';
import { Panel } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Pencil, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export interface BPMSelectionHUDProps {
  selectedNode?: Node;
  selectedEdge?: Edge;
  isLocked: boolean;
  onToggleLock: (nodeId: string) => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  onUpdateEdgeLabel?: (edgeId: string, label: string) => void;
  onUpdateEdgeRouting?: (edgeId: string, mode: 'auto' | '1-corner' | '2-corner', resetOffset?: boolean) => void;
  onEditSelected?: () => void;
}

export const BPMSelectionHUD: React.FC<BPMSelectionHUDProps> = ({
  selectedNode,
  selectedEdge,
  isLocked,
  onToggleLock,
  onDeleteSelected,
  onClearSelection,
  onUpdateEdgeLabel,
  onUpdateEdgeRouting,
  onEditSelected,
}) => {
  const { t } = useTranslation(['bpm']);

  const [edgeLabelDraft, setEdgeLabelDraft] = useState<string>(
    (selectedEdge?.label as string) ?? ''
  );

  useEffect(() => {
    setEdgeLabelDraft((selectedEdge?.label as string) ?? '');
  }, [selectedEdge?.id, selectedEdge?.label]);

  if (!selectedNode && !selectedEdge) return null;

  const commitEdgeLabel = () => {
    if (!selectedEdge || !onUpdateEdgeLabel || isLocked) return;
    const current = (selectedEdge.label as string) ?? '';
    const next = edgeLabelDraft.trim().slice(0, 24);
    if (next !== current) {
      onUpdateEdgeLabel(selectedEdge.id, next);
    } else if (edgeLabelDraft !== current) {
      setEdgeLabelDraft(current);
    }
  };

  const edgeRoutingMode = (selectedEdge?.data?.routingMode as 'auto' | '1-corner' | '2-corner') || 'auto';
  const hasBendOffset = Boolean(selectedEdge?.data?.bendOffset);

  return (
    <Panel position="bottom-center" className="mb-4 pointer-events-auto">
      <div className="flex items-center gap-3 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t('bpm:editor.selectionHud.selected', { defaultValue: 'Selected' })}:
          </span>
          {selectedNode && (
            <>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded border",
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
                className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-amber-500/20 text-amber-300 border-amber-500/40"
              >
                {t('bpm:editor.selectionHud.edge', { defaultValue: 'Connection' })}
              </Badge>
              <span className="text-xs font-mono font-bold text-slate-100">
                {selectedEdge.source} ➔ {selectedEdge.target}
              </span>
              <input
                key={selectedEdge.id}
                value={edgeLabelDraft}
                disabled={isLocked || !onUpdateEdgeLabel}
                maxLength={24}
                onChange={(e) => setEdgeLabelDraft(e.target.value)}
                onBlur={commitEdgeLabel}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === 'Escape') {
                    setEdgeLabelDraft((selectedEdge.label as string) ?? '');
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder={t('bpm:editor.edge.labelPlaceholder', { defaultValue: 'Add label…' })}
                title={t('bpm:editor.edge.labelHint', { defaultValue: 'Click an arrow, then type Ya / Tidak' })}
                aria-label={t('bpm:editor.edge.labelAria', { defaultValue: 'Connection label' })}
                className="h-7 w-32 rounded-md border border-slate-700 bg-white px-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
              />

              {onUpdateEdgeRouting && !isLocked && (
                <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={edgeRoutingMode === '1-corner' ? 'secondary' : 'ghost'}
                    onClick={() => onUpdateEdgeRouting(selectedEdge.id, '1-corner')}
                    title={t('bpm:editor.edge.corner1', { defaultValue: '1-Corner (L)' })}
                    className={cn(
                      "h-7 px-2 text-xs font-bold rounded-md",
                      edgeRoutingMode === '1-corner'
                        ? "bg-amber-400 text-slate-900 hover:bg-amber-300"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    {t('bpm:editor.edge.corner1', { defaultValue: '1-Corner (L)' })}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={edgeRoutingMode === '2-corner' ? 'secondary' : 'ghost'}
                    onClick={() => onUpdateEdgeRouting(selectedEdge.id, '2-corner')}
                    title={t('bpm:editor.edge.corner2', { defaultValue: '2-Corner (Step)' })}
                    className={cn(
                      "h-7 px-2 text-xs font-bold rounded-md",
                      edgeRoutingMode === '2-corner'
                        ? "bg-amber-400 text-slate-900 hover:bg-amber-300"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    {t('bpm:editor.edge.corner2', { defaultValue: '2-Corner (Step)' })}
                  </Button>
                  {(hasBendOffset || edgeRoutingMode !== 'auto') && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => onUpdateEdgeRouting(selectedEdge.id, 'auto', true)}
                      title={t('bpm:editor.edge.resetWaypointHint', { defaultValue: 'Reset custom bend points (or double-click the waypoint handle)' })}
                      className="h-7 px-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-md"
                    >
                      {t('bpm:editor.edge.resetWaypoint', { defaultValue: 'Reset to Default Path' })}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <Separator orientation="vertical" className="h-4 bg-slate-700" />

        <div className="flex items-center gap-1.5">
          {selectedNode && selectedNode.type !== 'risk-control-badge' && onEditSelected && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onEditSelected}
              className="h-7 px-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg gap-1.5"
              title={t('bpm:editor.selectionHud.editHint', { defaultValue: 'Double-click a node to open properties' })}
            >
              <Pencil className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-bold uppercase">
                {t('bpm:editor.selectionHud.editProperties', { defaultValue: 'Edit' })}
              </span>
            </Button>
          )}
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
              <span className="text-xs font-bold uppercase">
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
              <span className="text-xs uppercase tracking-wider">
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
