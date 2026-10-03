import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EntityNode, getAllDescendantCodes } from '../utils/hierarchy-utils';
import { useTranslation } from 'react-i18next';

interface EntityTreeFilterProps {
  hierarchy: EntityNode[];
  selectedCodes: string[];
  onSelectionChange: (codes: string[]) => void;
}

export const EntityTreeFilter: React.FC<EntityTreeFilterProps> = ({
  hierarchy,
  selectedCodes,
  onSelectionChange,
}) => {
  const { t } = useTranslation(['scoping', 'common']);
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleEntity = (node: EntityNode, checked: boolean) => {
    const descendantCodes = getAllDescendantCodes(node);
    let newSelection = [...selectedCodes];

    if (checked) {
      // Add node and all descendants
      descendantCodes.forEach(code => {
        if (!newSelection.includes(code)) newSelection.push(code);
      });
    } else {
      // Remove node and all descendants
      newSelection = newSelection.filter(code => !descendantCodes.includes(code));
    }

    onSelectionChange(newSelection);
  };

  const getSelectionState = (node: EntityNode): 'checked' | 'unchecked' | 'indeterminate' => {
    const descendantCodes = getAllDescendantCodes(node);
    const selectedDescendants = descendantCodes.filter(c => selectedCodes.includes(c));
    
    if (selectedDescendants.length === 0) return 'unchecked';
    if (selectedDescendants.length === descendantCodes.length) return 'checked';
    return 'indeterminate';
  };

  const renderNode = (node: EntityNode, level: number = 0) => {
    const state = getSelectionState(node);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.code} className="space-y-1">
        <div 
          className={cn(
            "flex items-center gap-2 py-1 px-2 rounded-md hover:bg-slate-100 transition-colors cursor-pointer",
            level > 0 && "ml-4"
          )}
        >
          <Checkbox 
            id={`filter-${node.code}`}
            checked={state === 'checked' ? true : state === 'indeterminate' ? 'indeterminate' : false}
            onCheckedChange={(checked) => toggleEntity(node, !!checked)}
          />
          <label 
            htmlFor={`filter-${node.code}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
          >
            {node.name} <span className="text-xs text-muted-foreground">({node.code})</span>
          </label>
        </div>
        {hasChildren && (
          <div className="border-l border-slate-200 ml-4 pl-2">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 h-9">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">{t('scoping:filter.entityLabel', 'Entity Filter')}</span>
          {selectedCodes.length > 0 && (
            <div className="ml-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-black">
              {selectedCodes.length}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-2" align="end">
        <div className="mb-2 px-2 pb-2 border-b flex justify-between items-center flex-wrap gap-2">
          <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">{t('scoping:filter.selectTitle', 'Select Entities')}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs font-bold uppercase tracking-wider hover:bg-slate-100"
            onClick={() => onSelectionChange([])}
          >
            {t('common:actions.clearAll', 'Clear All')}
          </Button>
        </div>
        <ScrollArea className="h-[300px]">
          <div className="p-1 space-y-1">
            {hierarchy.length > 0 ? (
              hierarchy.map(node => renderNode(node))
            ) : (
              <p className="text-center py-8 text-xs text-muted-foreground font-medium">No entities found</p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
