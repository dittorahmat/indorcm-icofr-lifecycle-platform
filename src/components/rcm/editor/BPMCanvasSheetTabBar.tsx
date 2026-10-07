import * as React from 'react';
import { Plus, X, Edit2, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { BPMDiagramSheet } from '@shared/types';

export interface BPMCanvasSheetTabBarProps {
  sheets: BPMDiagramSheet[];
  activeSheetId: string;
  isLocked?: boolean;
  onSelectSheet: (sheetId: string) => void;
  onAddSheet: (name?: string) => void;
  onRenameSheet: (sheetId: string, newName: string) => void;
  onRemoveSheet: (sheetId: string) => void;
}

export const BPMCanvasSheetTabBar: React.FC<BPMCanvasSheetTabBarProps> = ({
  sheets,
  activeSheetId,
  isLocked = false,
  onSelectSheet,
  onAddSheet,
  onRenameSheet,
  onRemoveSheet,
}) => {
  const [editingSheetId, setEditingSheetId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');

  const handleStartRename = (e: React.MouseEvent, sheet: BPMDiagramSheet) => {
    e.stopPropagation();
    if (isLocked) return;
    setEditingSheetId(sheet.id);
    setEditingName(sheet.name);
  };

  const handleSaveRename = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingSheetId && editingName.trim()) {
      onRenameSheet(editingSheetId, editingName.trim());
    }
    setEditingSheetId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRename();
    if (e.key === 'Escape') setEditingSheetId(null);
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border-b border-border overflow-x-auto max-w-full touch-pan-x overscroll-x-contain min-w-0">
      <div className="flex items-center gap-1 shrink-0">
        {sheets.map((sheet, index) => {
          const isActive = sheet.id === activeSheetId;
          const isEditing = sheet.id === editingSheetId;

          if (isEditing) {
            return (
              <form
                key={sheet.id}
                onSubmit={handleSaveRename}
                className="flex items-center gap-1 px-2 py-1 bg-white border border-primary/50 rounded-md shadow-xs text-xs"
              >
                <Input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => handleSaveRename()}
                  className="h-6 w-32 px-1 text-xs"
                />
                <button
                  type="submit"
                  aria-label="Save sheet name"
                  className="text-emerald-600 hover:text-emerald-700 p-0.5"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </form>
            );
          }

          return (
            <div
              key={sheet.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectSheet(sheet.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSheet(sheet.id);
                }
              }}
              className={cn(
                'group flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer select-none transition-colors border',
                isActive
                  ? 'bg-white text-primary border-slate-300 shadow-xs'
                  : 'bg-transparent text-slate-600 hover:bg-slate-200/60 border-transparent hover:border-slate-200'
              )}
            >
              <FileText className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-slate-400')} />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{sheet.name}</span>

              {!isLocked && isActive && (
                <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    aria-label={`Rename ${sheet.name}`}
                    onClick={(e) => handleStartRename(e, sheet)}
                    className="p-0.5 text-slate-400 hover:text-slate-700 rounded-sm"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>

                  {sheets.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Delete ${sheet.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveSheet(sheet.id);
                      }}
                      className="p-0.5 text-slate-400 hover:text-destructive rounded-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {!isLocked && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onAddSheet()}
            className="h-8 px-2 text-xs font-semibold text-slate-600 hover:text-primary gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tambah Sheet</span>
          </Button>
        )}
      </div>
    </div>
  );
};
