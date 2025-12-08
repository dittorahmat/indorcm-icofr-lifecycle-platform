import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical } from 'lucide-react';
import type { Deficiency, ActionPlan } from '@shared/types';
import { cn } from '@/lib/utils';
interface DeficiencyCardProps {
  deficiency: Deficiency;
  actionPlan?: ActionPlan;
}
export function DeficiencyCard({ deficiency, actionPlan }: DeficiencyCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: actionPlan?.id || deficiency.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };
  const severityVariant = {
    'Material Weakness': 'destructive',
    'Significant Deficiency': 'secondary',
    'Control Deficiency': 'outline',
  } as const;
  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      animate={{ scale: isDragging ? 1.05 : 1 }}
      whileHover={{ y: -2, scale: 1.02 }}
      className="mb-4"
    >
      <Card className={cn("bg-background hover:shadow-md transition-shadow", isDragging && "shadow-xl ring-2 ring-primary")}>
        <CardHeader className="flex flex-row items-start justify-between p-4">
          <CardTitle className="text-base font-medium leading-tight">{deficiency.description}</CardTitle>
          <div {...attributes} {...listeners} className="cursor-grab p-2 -m-2 text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Badge variant={severityVariant[deficiency.severity]}>{deficiency.severity}</Badge>
            {actionPlan && (
              <span className="text-xs">
                Due: {new Date(actionPlan.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}