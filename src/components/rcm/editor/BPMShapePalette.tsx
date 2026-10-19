import React, { useState } from 'react';
import { Panel } from 'reactflow';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Columns, GripVertical, Palette, PlayCircle, RefreshCw, StopCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { nodeLabelKeyOf } from '@shared/bpm-node-registry';
import type { BpmNodeType } from '@shared/bpm-node-types';

/**
 * The shapes the palette offers, in draw order. Each button's tooltip is the
 * node's own label from the node-type registry, so a tooltip can no longer name
 * a different shape than the button creates.
 */
const PALETTE_SHAPES: { type: BpmNodeType; icon: React.ReactNode; accent?: boolean }[] = [
  { type: 'activity', icon: <rect x="2" y="5" width="20" height="14" /> },
  { type: 'alternate-process', icon: <rect x="2" y="5" width="20" height="14" rx="4" ry="4" /> },
  { type: 'decision', icon: <path d="M12 2 L22 12 L12 22 L2 12 Z" /> },
  { type: 'data', icon: <path d="M5 5 L22 5 L19 19 L2 19 Z" /> },
  { type: 'predefined-process', icon: <><rect x="2" y="5" width="20" height="14" /><line x1="6" y1="5" x2="6" y2="19" /><line x1="18" y1="5" x2="18" y2="19" /></> },
  { type: 'internal-storage', icon: <><rect x="2" y="5" width="20" height="14" /><line x1="6" y1="5" x2="6" y2="19" /><line x1="2" y1="9" x2="22" y2="9" /></> },
  { type: 'document', icon: <path d="M2 4 L22 4 L22 16 Q18 20 15 16 T8 16 T2 16 Z" /> },
  { type: 'multi-document', icon: <><path d="M5 2 L21 2 L21 11 Q18 14 16 11 T11 11 T5 11 Z" stroke="#94a3b8" /><path d="M3 5 L19 5 L19 14 Q16 17 14 14 T9 14 T3 14 Z" stroke="#64748b" /><path d="M1 8 L17 8 L17 17 Q14 20 12 17 T7 17 T1 17 Z" /></> },
  { type: 'preparation', icon: <path d="M6 5 L18 5 L22 12 L18 19 L6 19 L2 12 Z" /> },
  { type: 'manual-input', icon: <path d="M2 8 L22 4 L22 19 L2 19 Z" /> },
  { type: 'manual-operation', icon: <path d="M2 5 L22 5 L18 19 L6 19 Z" /> },
  { type: 'reference', icon: <circle cx="12" cy="12" r="8" /> },
  { type: 'off-page-ref', icon: <path d="M2 4 L22 4 L22 13 L12 20 L2 13 Z" /> },
  { type: 'card', icon: <path d="M6 5 L22 5 L22 19 L2 19 L2 9 Z" /> },
  { type: 'punched-tape', icon: <path d="M2 7 Q7 4 12 7 T22 7 L22 17 Q17 20 12 17 T2 17 Z" /> },
  { type: 'summing-junction', icon: <><circle cx="12" cy="12" r="8" /><line x1="6.5" y1="6.5" x2="17.5" y2="17.5" /><line x1="6.5" y1="17.5" x2="17.5" y2="6.5" /></> },
  { type: 'or', icon: <><circle cx="12" cy="12" r="8" /><line x1="12" y1="4" x2="12" y2="20" /><line x1="4" y1="12" x2="20" y2="12" /></> },
  { type: 'collate', icon: <path d="M4 5 L20 5 L4 19 L20 19 Z" /> },
  { type: 'sort', icon: <><path d="M4 5 L20 5 L4 19 L20 19 Z" /><line x1="4" y1="12" x2="20" y2="12" /></> },
  { type: 'extract', icon: <path d="M12 4 L21 19 L3 19 Z" /> },
  { type: 'merge', icon: <path d="M3 5 L21 5 L12 20 Z" /> },
  { type: 'stored-data', icon: <><path d="M4 5 L17 5 A 3 7 0 0 1 17 19 L4 19 A 3 7 0 0 1 4 5 Z" /><path d="M4 5 A 3 7 0 0 0 4 19" /></> },
  { type: 'delay', icon: <path d="M3 5 L13 5 A 7 7 0 0 1 13 19 L3 19 Z" /> },
  { type: 'sequential-access', icon: <><circle cx="10" cy="11" r="6" /><line x1="10" y1="17" x2="20" y2="17" /></> },
  { type: 'direct-access', icon: <><path d="M2 5 L16 5 A 3 7 0 0 1 16 19 L2 19 A 3 7 0 0 1 2 5 Z" /><ellipse cx="16" cy="12" rx="3" ry="7" /></> },
  { type: 'display', icon: <path d="M18 5 L4 5 L2 12 L4 19 L18 19 Z" /> },
  { type: 'loop-limit', icon: <path d="M5 5 L19 5 L22 9 L22 19 L2 19 L2 9 Z" /> },
  { type: 'annotation', icon: <path d="M12 4 L4 4 L4 20 L12 20" strokeDasharray="2 2" /> },
  { type: 'automated-activity', icon: <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />, accent: true },
  { type: 'archive', icon: <path d="M2 5 L22 5 L12 20 Z" /> },
  { type: 'data-media', icon: <><ellipse cx="12" cy="7" rx="8" ry="3" /><path d="M4 7 L4 17 A 8 3 0 0 0 20 17 L20 7" /></>, accent: true },
];

const DEFAULT_SHAPE_CLASS = 'h-9 w-9 rounded-lg hover:bg-slate-50 border-slate-100 bg-white text-slate-600 hover:text-slate-800';
const ACCENT_SHAPE_CLASS = 'h-9 w-9 rounded-lg bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700';

export interface BPMShapePaletteProps {
  subProcess: string;
  isLocked: boolean;
  onCreateStartNode: () => void;
  onCreateEndNode: () => void;
  onCreateActivityNode: (type: string) => void;
  onCreateSwimlane: () => void;
  unmappedControls: any[];
}

export const BPMShapePalette: React.FC<BPMShapePaletteProps> = ({
  subProcess,
  isLocked,
  onCreateStartNode,
  onCreateEndNode,
  onCreateActivityNode,
  onCreateSwimlane,
  unmappedControls,
}) => {
  const { t } = useTranslation(['bpm', 'rcm']);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <Panel position="top-left" className="m-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="h-10 px-3 bg-white border border-slate-200 shadow-md rounded-lg gap-2 font-semibold text-xs text-slate-700 hover:bg-slate-50 transition-all"
          title={t('editor.actions.expandPalette')}
        >
          <Palette className="h-4 w-4 text-indigo-600" />
          <span className="hidden sm:inline">{t('modal.title')}</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        </Button>
      </Panel>
    );
  }

  return (
    <Panel position="top-left" className="bg-white p-5 rounded-lg border border-slate-200 shadow-lg flex flex-col gap-5 max-w-[280px] max-h-[85vh] overflow-y-auto scrollbar-thin transition-all">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
        <div className="flex flex-col pr-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('modal.title')}</span>
          <span className="text-sm font-display font-bold text-slate-900 leading-tight truncate max-w-[180px]">{subProcess}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
          title={t('editor.actions.collapsePalette')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {!isLocked && (
        <div className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              {t('editor.sections.flowControls')}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 rounded-xl transition-all shadow-sm"
                title={t('editor.nodes.start')}
                onClick={onCreateStartNode}
              >
                <PlayCircle className="h-5 w-5 text-emerald-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-rose-200 bg-rose-50/50 hover:bg-rose-100 rounded-lg transition-colors shadow-sm"
                title={t('editor.nodes.end')}
                onClick={onCreateEndNode}
              >
                <StopCircle className="h-5 w-5 text-rose-600" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              {t('editor.sections.processElements')}
            </p>
            <ScrollArea className="h-[200px] pr-2 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-2">
                {PALETTE_SHAPES.map(({ type, icon, accent }) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="icon"
                    className={cn(accent ? ACCENT_SHAPE_CLASS : DEFAULT_SHAPE_CLASS)}
                    title={t(nodeLabelKeyOf(type))}
                    onClick={() => onCreateActivityNode(type)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      {icon}
                    </svg>
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                  title={t('swimlane.add')}
                  onClick={onCreateSwimlane}
                >
                  <Columns className="h-4 w-4" />
                </Button>
              </div>
            </ScrollArea>
          </div>

          {/* Migration Backlog Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest px-1 flex items-center gap-2">
              <RefreshCw className="h-3 w-3" /> {t('rcm:migration.backlog.title')}
            </p>
            <ScrollArea className="h-[120px] pr-2">
              <div className="space-y-2">
                {unmappedControls.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">{t('rcm:migration.backlog.empty')}</p>
                ) : (
                  unmappedControls.map((ctrl) => (
                    <div
                      key={ctrl.mappingId}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow', JSON.stringify(ctrl));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className="p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs font-bold text-indigo-700 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-indigo-100 transition-colors group"
                      title={ctrl.mappedControlDescription || ctrl.riskDescription}
                    >
                      <GripVertical className="h-3 w-3 text-indigo-300 group-hover:text-indigo-500 shrink-0" />
                      <span className="truncate">
                        [{ctrl.controlCode || 'N/A'}] {ctrl.mappedControlName || ctrl.riskDescription}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
            <p className="text-xs text-slate-400">{t('rcm:migration.backlog.drag_hint')}</p>
          </div>
        </div>
      )}
    </Panel>
  );
};
