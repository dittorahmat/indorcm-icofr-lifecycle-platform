import React from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface InlineEditRowProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  className?: string;
}

export function InlineEditRow({ isEditing, onEdit, onSave, onCancel, isSaving, className }: InlineEditRowProps) {
  const { t } = useTranslation('rcm');

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button 
          variant="ghost" 
          size="xs" 
          className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          onClick={onSave}
          disabled={isSaving}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="xs" 
          className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      variant="ghost" 
      size="xs" 
      className={cn("h-7 w-7 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50", className)}
      onClick={onEdit}
    >
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  );
}
