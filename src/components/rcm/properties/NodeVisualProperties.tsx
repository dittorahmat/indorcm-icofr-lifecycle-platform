import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Lock, Unlock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Node } from 'reactflow';

interface NodeVisualPropertiesProps {
  selectedNode: Node;
  isLocked: boolean;
  canHaveRcm: boolean;
  onUpdateNodeData: (id: string, data: any) => void;
}

export function NodeVisualProperties({
  selectedNode,
  isLocked,
  canHaveRcm,
  onUpdateNodeData
}: NodeVisualPropertiesProps) {
  const { t } = useTranslation(['bpm', 'rcm']);

  return (
    <section className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
      <Label className="text-xs font-semibold uppercase text-slate-600 tracking-wide mb-3 block">
        {t('rcm:matrix.properties.visual_diagram_info')}
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-700 uppercase">{t('rcm:matrix.properties.label')}</Label>
          <Input 
            disabled={isLocked} 
            value={selectedNode.data.label} 
            onChange={(e) => onUpdateNodeData(selectedNode.id, { label: e.target.value })} 
            className="h-10 text-sm bg-white" 
          />
        </div>
        {canHaveRcm && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700 uppercase">{t('rcm:matrix.properties.pelaksana')}</Label>
            <Input 
              disabled={isLocked} 
              value={selectedNode.data.role || ''} 
              onChange={(e) => onUpdateNodeData(selectedNode.id, { role: e.target.value })} 
              className="h-10 text-sm bg-white" 
            />
          </div>
        )}
        {selectedNode.type === 'off-page-ref' && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700 uppercase">Target Sheet (Halaman Tujuan)</Label>
            <Input
              disabled={isLocked}
              placeholder="Contoh: Sheet 2 / Fase Gudang"
              value={selectedNode.data.targetSheetName || selectedNode.data.targetSheetId || ''}
              onChange={(e) =>
                onUpdateNodeData(selectedNode.id, {
                  targetSheetName: e.target.value,
                  targetSheetId: e.target.value,
                })
              }
              className="h-10 text-sm bg-white"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-700 uppercase">Node Scale Override</Label>
          <Select 
            disabled={isLocked} 
            value={selectedNode.data.nodeScaleOverride || 'md'} 
            onValueChange={(v) => onUpdateNodeData(selectedNode.id, { nodeScaleOverride: v })}
          >
            <SelectTrigger className="h-10 text-sm bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small (Kecil)</SelectItem>
              <SelectItem value="md">Standard (Biasa)</SelectItem>
              <SelectItem value="lg">Large (Besar)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-700 uppercase">Font Scale Override</Label>
          <Select 
            disabled={isLocked} 
            value={selectedNode.data.fontScaleOverride || 'md'} 
            onValueChange={(v) => onUpdateNodeData(selectedNode.id, { fontScaleOverride: v })}
          >
            <SelectTrigger className="h-10 text-sm bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small (Kecil)</SelectItem>
              <SelectItem value="md">Standard (Biasa)</SelectItem>
              <SelectItem value="lg">Large (Besar)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-col gap-0.5">
          <Label className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1.5">
            {selectedNode.data.isLocked ? (
              <Lock className="h-3.5 w-3.5 text-amber-600" />
            ) : (
              <Unlock className="h-3.5 w-3.5 text-slate-400" />
            )}
            {t('bpm:editor.lockPosition')}
          </Label>
          <span className="text-xs text-slate-400">
            {selectedNode.data.isLocked 
              ? t('bpm:editor.positionLocked') 
              : t('bpm:editor.lockPositionDesc')}
          </span>
        </div>
        <Switch 
          disabled={isLocked}
          checked={!!selectedNode.data.isLocked} 
          onCheckedChange={(checked) => onUpdateNodeData(selectedNode.id, { isLocked: checked })} 
        />
      </div>
    </section>
  );
}
